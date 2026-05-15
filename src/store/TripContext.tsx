import React, {
  createContext,
  useContext,
  useState,
} from "react";

type TripContextType = {
  selectedPickup: any;
  setSelectedPickup: (pickup: any) => void;

  progress: number;
  setProgress: (v: number) => void;

  live: boolean;
  setLive: (v: boolean) => void;

  onStartTrip: () => void;
  onAdvanceStatus: () => void;
};

const TripContext =
  createContext<TripContextType>(
    {} as TripContextType
  );

export function TripProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [selectedPickup, setSelectedPickup] =
    useState<any>(null);

  const [progress, setProgress] =
    useState(0.08);

  const [live, setLive] =
    useState(false);

  function onStartTrip() {
    setLive(true);
  }

  function onAdvanceStatus() {

    setProgress((prev) => {

      const next = prev + 0.25;

      if (next >= 1) {
        setLive(false);
        return 1;
      }

      return next;
    });
  }

  return (
    <TripContext.Provider
      value={{
        selectedPickup,
        setSelectedPickup,

        progress,
        setProgress,

        live,
        setLive,

        onStartTrip,
        onAdvanceStatus,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  return useContext(TripContext);
}