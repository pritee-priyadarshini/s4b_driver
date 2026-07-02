import { create } from 'zustand';
import * as Location from 'expo-location';
import { AppState, type AppStateStatus } from 'react-native';

import { driverService } from '../services/driverService';
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
  resumeLiveIfNeeded: (siteId: number, vehicleType?: string) => Promise<boolean>;
  goLive: (siteId: number, vehicleType?: string) => Promise<boolean>;
  goOffline: (siteId: number) => Promise<void>;
  toggleLive: (siteId: number, vehicleType?: string) => Promise<void>;
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
    set({
      hydrated: true,
      liveStatus: wasLive ? 'connecting' : 'offline',
    });
  },

  resumeLiveIfNeeded: async (siteId: number, vehicleType?: string) => {
    const wasLive = await readShiftLive();
    if (!wasLive) return false;
    if (get().liveStatus === 'live') return true;
    return get().goLive(siteId, vehicleType);
  },

  goLive: async (siteId, vehicleType) => {
    set({ liveStatus: 'connecting' });

    const result = await startDriverLocationTracking((coords) => {
      set({ driverLocation: coords });
    });

    if (!result.ok || !result.initial) {
      await persistShiftLive(false);
      set({ liveStatus: 'offline', driverLocation: null, shiftStartLabel: null });
      return false;
    }

    try {
      const liveRes = await driverService.goLive({
        siteId,
        lat: result.initial.latitude,
        lng: result.initial.longitude,
        vehicleType,
      });

      if (!liveRes.data?.driver) {
        throw new Error('Server did not confirm live status');
      }
    } catch {
      await stopDriverLocationTracking();
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

  goOffline: async (siteId) => {
    try {
      await driverService.goOffline({ siteId });
    } catch {
      // Still stop local tracking if the network call fails.
    }

    await stopDriverLocationTracking();
    await persistShiftLive(false);
    set({
      liveStatus: 'offline',
      driverLocation: null,
      shiftStartLabel: null,
    });
  },

  toggleLive: async (siteId, vehicleType) => {
    const { liveStatus } = get();
    if (liveStatus === 'connecting') return;

    if (liveStatus === 'live') {
      await get().goOffline(siteId);
      return;
    }

    await get().goLive(siteId, vehicleType);
  },
}));

export async function isBackgroundLocationRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  } catch {
    return false;
  }
}
