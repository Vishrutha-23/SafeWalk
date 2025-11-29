export function makeLocationUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export async function tryShareText(text: string, url?: string) {
  try {
    if ((navigator as any).share) {
      // @ts-ignore
      await navigator.share({ text, url, title: "SafeWalk" });
      return { ok: true, method: "native" };
    }
  } catch (e) {
    // fall through to fallback
  }

  try {
    await navigator.clipboard.writeText(text + (url ? `\n${url}` : ""));
  } catch (e) {
    // ignore clipboard errors
  }

  // open WhatsApp web prefilled as a convenient fallback
  const wa = `https://wa.me/?text=${encodeURIComponent(text + (url ? ` ${url}` : ""))}`;
  window.open(wa, "_blank");
  return { ok: false, method: "fallback" };
}

export function callEmergencyNumber(number = "112") {
  // deep link to call
  window.location.href = `tel:${number}`;
}

export function makeShareMessageLive(lat: number, lon: number) {
  const url = makeLocationUrl(lat, lon);
  return `My live location: ${lat.toFixed(5)}, ${lon.toFixed(5)} - ${url}`;
}

export function makeShareMessageSafe(lat: number, lon: number) {
  const url = makeLocationUrl(lat, lon);
  return `I'm safe. I arrived at my destination: ${url}`;
}
