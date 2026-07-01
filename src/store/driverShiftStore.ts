import { create } from 'zustand';
import * as Location from 'expo-location';
import { AppState, type AppStateStatus } from 'react-native';

import {
  DRIVER_LOCATION_TASK,
  ensureDriverLocationTracking,
  persistShiftLive,
  readShiftLive,
  startDriverLocationTracking,
  stopDriverLocationTracking,
  type DriverCoord,
} from '../services/driverLocationTask';

export type LiveStatus = 'offline' | 'connecting' | 'live';

async function formatShiftLocation(coords: DriverCoord): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    const place = results[0];
    if (!place) return 'Shift started here';

    const parts = [
      place.name || place.street,
      place.district || place.subregion,
      place.city,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Shift started here';
  } catch {
    return `Near ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }
}

type DriverShiftState = {
  liveStatus: LiveStatus;
  driverLocation: DriverCoord | null;
  shiftStartLabel: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  goLive: () => Promise<boolean>;
  goOffline: () => Promise<void>;
  toggleLive: () => Promise<void>;
};

let appStateListenerAttached = false;

function attachAppStateListener() {
  if (appStateListenerAttached) return;
  appStateListenerAttached = true;

  AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next !== 'active') return;

    const { liveStatus, driverLocation } = useDriverShiftStore.getState();
    if (liveStatus !== 'live') return;

    void ensureDriverLocationTracking((coords) => {
      useDriverShiftStore.setState({ driverLocation: coords });
    }).catch(() => {
      if (!driverLocation) {
        useDriverShiftStore.setState({ liveStatus: 'connecting' });
        void useDriverShiftStore.getState().goLive();
      }
    });
  });
}

export const useDriverShiftStore = create<DriverShiftState>((set, get) => ({
  liveStatus: 'offline',
  driverLocation: null,
  shiftStartLabel: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    attachAppStateListener();

    const wasLive = await readShiftLive();
    set({ hydrated: true });

    if (wasLive) {
      await get().goLive();
    }
  },

  goLive: async () => {
    set({ liveStatus: 'connecting' });

    const result = await startDriverLocationTracking((coords) => {
      set({ driverLocation: coords });
    });

    if (!result.ok || !result.initial) {
      await persistShiftLive(false);
      set({ liveStatus: 'offline', driverLocation: null, shiftStartLabel: null });
      return false;
    }

    const label = await formatShiftLocation(result.initial);
    await persistShiftLive(true);
    set({
      liveStatus: 'live',
      driverLocation: result.initial,
      shiftStartLabel: label,
    });
    return true;
  },

  goOffline: async () => {
    await stopDriverLocationTracking();
    await persistShiftLive(false);
    set({
      liveStatus: 'offline',
      driverLocation: null,
      shiftStartLabel: null,
    });
  },

  toggleLive: async () => {
    const { liveStatus } = get();
    if (liveStatus === 'connecting') return;

    if (liveStatus === 'live') {
      await get().goOffline();
      return;
    }

    await get().goLive();
  },
}));

export async function isBackgroundLocationRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  } catch {
    return false;
  }
}
