import { createContext, useContext, useState, ReactNode } from "react";

interface TripContextType {
  activeTrip: any | null;
  startTrip: (route: any) => void;
  endTrip: () => void;
  updateTripProgress: (progress: any) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  const startTrip = (route: any) => {
    // TODO: Initialize trip tracking
    setActiveTrip({ route, startTime: new Date(), progress: 0 });
  };

  const endTrip = () => {
    // TODO: Save trip data
    setActiveTrip(null);
  };

  const updateTripProgress = (progress: any) => {
    if (activeTrip) {
      setActiveTrip({ ...activeTrip, progress });
    }
  };

  return (
    <TripContext.Provider
      value={{
        activeTrip,
        startTrip,
        endTrip,
        updateTripProgress,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
};
