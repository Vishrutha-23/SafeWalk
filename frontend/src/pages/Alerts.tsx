// frontend/src/pages/Alerts.tsx
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Filter, Search } from "lucide-react";
import MapContainer from "@/components/Map/MapContainer";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { tryShareText, makeLocationUrl } from "../lib/share";

type FilterType = "all" | "traffic" | "crime" | "hazards" | "police";

interface TrafficIncident {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  severity?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface CrimeZone {
  id: string;
  name: string;
  risk: string;
  geojson: any;
}

interface HazardHotspot {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
}

interface PoliceStation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

const BACKEND_BASE =
  (import.meta as any).env.VITE_BACKEND_URL || "http://localhost:3000";

const Alerts = () => {
  const { isGuest } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [crimeZones, setCrimeZones] = useState<CrimeZone[]>([]);
  const [hazards, setHazards] = useState<HazardHotspot[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5); // fetch radius for incidents

  // Keep last known location so we can recenter map if needed
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // ------------------------------------------------
  // 1) Get user location
  // ------------------------------------------------
  const getLocation = () =>
    new Promise<GeolocationCoordinates>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err)
      );
    });

  // ------------------------------------------------
  // 2) Fetch incidents + crime from backend
  // ------------------------------------------------
  const fetchIncidentsFromBackend = async (lat: number, lon: number, rKm?: number) => {
    const q = rKm ? `&radiusKm=${encodeURIComponent(rKm)}` : "";
    const url = `${BACKEND_BASE}/incidents?lat=${lat}&lon=${lon}${q}`;
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || "Failed to load incidents");
    }
    const json = await res.json();
    return json;
  };

  // ------------------------------------------------
  // 3) Load data on mount
  // ------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) User location
        let coords: GeolocationCoordinates | null = null;
        try {
          coords = await getLocation();
        } catch (e) {
          console.warn("Geolocation failed, falling back to Bengaluru center", e);
        }

        const lat = coords?.latitude ?? 12.9716;
        const lng = coords?.longitude ?? 77.5946;
        const lon = lng; // backend expects `lon` param name

        setUserLocation({ lat, lng });
        lastLocationRef.current = { lat, lng };

        // 2) Incidents from backend (respect radius selection)
        const data = await fetchIncidentsFromBackend(lat, lon, radiusKm);

        // Normalize traffic incidents: only keep ones with numeric coords and ensure unique ids
        const traffic: TrafficIncident[] = (data.traffic || [])
          .map((inc: any) => {
            const lat = inc.latitude;
            const lon = inc.longitude;
            if (typeof lat !== "number" || typeof lon !== "number") return null;

            const baseId = inc.id || inc.incidentId || `${lat},${lon}`;
            const uniqueId = `${baseId}-${Math.random().toString(36).slice(2,8)}`;

            return {
              id: uniqueId,
              latitude: lat,
              longitude: lon,
              type: inc.type || inc.properties?.iconCategory || "Incident",
              description: inc.description || "No description",
              severity: inc.severity ?? null,
              startTime: inc.startTime ?? null,
              endTime: inc.endTime ?? null,
            };
          })
          .filter(Boolean) as TrafficIncident[];

        const crime: CrimeZone[] = (data.crime || []).map((c: any, idx: number) => ({
          id: c.id || `crime-${idx}`,
          name: c.name || "Crime Zone",
          risk: c.risk || "high",
          geojson: c.geojson,
        }));

        setTrafficIncidents(traffic);
        setCrimeZones(crime);

        // 3) Derive hazard hotspots from higher‑severity incidents (simple model)
        const hazardCandidates = traffic
          .filter((t) => (t.severity ?? 0) >= 2)
          .slice(0, 5);

        const derivedHazards: HazardHotspot[] = hazardCandidates.map((t, idx) => ({
          id: `hazard-${t.id}-${idx}`,
          latitude: t.latitude,
          longitude: t.longitude,
          label: "Potential hazard",
        }));

        setHazards(derivedHazards);

        // 4) For now: no real police API → keep array, so UI + map can handle it
        const derivedPolice: PoliceStation[] = []; // TODO: connect TomTom Search/Places
        setPoliceStations(derivedPolice);
      } catch (err: any) {
        console.error("Alerts load error:", err);
        setError(err?.message || "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [radiusKm]);

  // ------------------------------------------------
  // 4) Build list items for left panel
  // ------------------------------------------------
  type AlertListItem = {
    id: string;
    category: FilterType;
    title: string;
    subtitle: string;
    time?: string;
    severity?: number | null;
  };

  const listItems: AlertListItem[] = [
    // Traffic incidents
    ...trafficIncidents.map((t) => ({
      id: t.id,
      category: "traffic" as FilterType,
      title: t.type || "Traffic incident",
      subtitle: t.description,
      time: t.startTime || "",
      severity: t.severity ?? null,
    })),
    // Crime zones
    ...crimeZones.map((c) => ({
      id: c.id,
      category: "crime" as FilterType,
      title: c.name || "Crime zone",
      subtitle: `Risk: ${c.risk || "unknown"}`,
    })),
    // Hazards
    ...hazards.map((h) => ({
      id: h.id,
      category: "hazards" as FilterType,
      title: "Hazard hotspot",
      subtitle: h.label,
    })),
    // Police stations (empty for now but wired)
    ...policeStations.map((p) => ({
      id: p.id,
      category: "police" as FilterType,
      title: p.name || "Police Station",
      subtitle: "Law enforcement nearby",
    })),
  ];

  const filteredItems = listItems.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q)
    );
  });

  // Friendly label
  const filterLabel = (f: FilterType) => {
    switch (f) {
      case "all":
        return "All";
      case "traffic":
        return "Traffic";
      case "crime":
        return "Crime";
      case "hazards":
        return "Hazards";
      case "police":
        return "Police";
    }
  };

  // ------------------------------------------------
  // 5) Render
  // ------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Alerts Center</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Alerts list + filters */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Nearby Alerts ({filteredItems.length})
                </h2>
              </div>
              {/* Helpful note when no traffic incidents were returned */}
              {!loading && !error && trafficIncidents.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">No traffic incidents nearby at the moment.</div>
              )}

              {/* Search + filter row */}
              <div className="flex flex-col gap-3 mb-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search alerts..."
                    className="w-full border rounded px-8 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-1 flex-wrap">
                  {(["all", "traffic", "crime", "hazards", "police"] as FilterType[]).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${
                          filter === f
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700"
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                        {filterLabel(f)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Radius control for incident fetch */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground">Area:</span>
                <div className="flex gap-2">
                  {[1, 5, 25].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusKm(r)}
                      className={`text-xs px-2 py-1 rounded border ${
                        radiusKm === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground ml-2">Showing incidents within {radiusKm} km</div>
              </div>

              {/* List area */}
              <div className="max-h-[520px] overflow-y-auto space-y-2">
                {loading && (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading alerts…
                  </div>
                )}

                {error && (
                  <div className="p-4 text-sm text-red-600">
                    Error: Incidents fetch failed: {JSON.stringify(error)}
                  </div>
                )}

                {!loading && !error && filteredItems.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">
                    No alerts match the current filter.
                  </div>
                )}

                {!loading &&
                  !error &&
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                        selectedId === item.id
                          ? "bg-blue-50 border-blue-400"
                          : "bg-muted hover:bg-muted/80 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">
                          {item.title}
                        </span>
                        {item.category !== "all" && (
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {filterLabel(item.category)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.subtitle}
                      </p>
                      {item.time && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.time}
                        </p>
                      )}
                    </button>
                  ))}
              </div>
            </Card>
          </div>

          {/* RIGHT: Map */}
          <div className="relative h-[70vh]">
            <MapContainer
              enableTracking={true}
              autoCenter={false}
              routeData={null}
              incidents={trafficIncidents}
              crimeZones={crimeZones}
              hazards={hazards}
              policeStations={policeStations}
              highlightedIncidentId={selectedId}
            />

            {/* Emergency button (single) */}
            <div className="absolute left-4 bottom-6 z-50">
              {isGuest ? (
                <div className="px-4 py-2 rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Sign in to enable emergency sharing
                </div>
              ) : (
                <button
                  onClick={async () => {
                  try {
                    // get best known location
                    const loc = lastLocationRef.current;
                    let lat = loc?.lat;
                    let lon = loc?.lng;
                    if (!lat || !lon) {
                      // try geolocation
                      try {
                        const p = await new Promise((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
                        });
                        // @ts-ignore
                        lat = p.coords.latitude;
                        // @ts-ignore
                        lon = p.coords.longitude;
                      } catch (e) {
                        alert("Unable to determine your location. Please enable location services.");
                        return;
                      }
                    }

                    // Read contacts from localStorage (optional). Format: [{name, phone?, email?}]
                    // If the user is a guest, do NOT load private contacts.
                    let contacts: any[] = [];
                    try {
                      if (!isGuest) {
                        const raw = localStorage.getItem("safewalk.contacts");
                        if (raw) contacts = JSON.parse(raw || "[]");
                      } else {
                        // guests cannot access stored contacts
                        contacts = [];
                      }
                    } catch (e) {
                      contacts = [];
                    }

                    // Start emergency session on backend
                    const startRes = await fetch(`${BACKEND_BASE}/emergency/start`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ origin: { lat, lon }, contacts }),
                    });
                    if (!startRes.ok) {
                      const txt = await startRes.text().catch(() => "");
                      throw new Error(txt || "Failed to start emergency session");
                    }
                    const j = await startRes.json();
                    const trackingUrl = j.trackingUrl || j.trackingURL || j.url;
                    const sessionId = j.sessionId;

                    const msg = `EMERGENCY — please check my live location: ${trackingUrl}`;

                    // Try to share to contacts / native share. If guest, do not auto-share to saved contacts.
                    if (!isGuest && contacts.length > 0) {
                      // could implement direct share-to-contacts logic here; for now use native share
                      await tryShareText(msg, trackingUrl);
                    } else {
                      // guest or no saved contacts — use generic native share / clipboard fallback
                      await tryShareText(msg, trackingUrl);
                    }

                    // Start call to 112 (after sharing)
                    window.location.href = "tel:112";

                    // Poll for acknowledgement (in background) for up to 60s
                    if (sessionId) {
                      let attempts = 0;
                      const iv = setInterval(async () => {
                        attempts++;
                        try {
                          const sres = await fetch(`${BACKEND_BASE}/emergency/status/${sessionId}`);
                          if (!sres.ok) return;
                          const st = await sres.json();
                          if (st.ackCount && st.ackCount > 0) {
                            alert("One of your contacts viewed the shared location. Help is aware.");
                            clearInterval(iv);
                          }
                        } catch (e) {
                          // ignore
                        }
                        if (attempts > 20) clearInterval(iv); // stop after ~60s
                      }, 3000);
                    }
                  } catch (err: any) {
                    console.error("Emergency button error", err);
                    alert("Emergency action failed: " + (err?.message || err));
                  }
                }}
                  className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
                >
                  Need Help?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
