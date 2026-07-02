import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import {
  requestDriverLocationPermissions,
  showLocationSettingsAlert,
} from '../utils/locationPermissions';

export const DRIVER_LOCATION_TASK = 'driver-background-location';
const LIVE_SHIFT_KEY = 'driver_shift_live';

export type DriverCoord = {
  latitude: number;
  longitude: number;
};

type LocationUpdateHandler = (coords: DriverCoord) => void;

let onLocationUpdate: LocationUpdateHandler | null = null;
let foregroundWatch: Location.LocationSubscription | null = null;

export function setDriverLocationHandler(handler: LocationUpdateHandler | null) {
  onLocationUpdate = handler;
}

TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[DriverLocation] background task error', error.message);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  const latest = locations?.[locations.length - 1];
  if (latest && onLocationUpdate) {
    onLocationUpdate({
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
    });
  }
});

export async function persistShiftLive(isLive: boolean): Promise<void> {
  await SecureStore.setItemAsync(LIVE_SHIFT_KEY, isLive ? '1' : '0');
}

export async function readShiftLive(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(LIVE_SHIFT_KEY);
  return value === '1';
}

export async function requestLocationPermissions(): Promise<boolean> {
  const result = await requestDriverLocationPermissions();
  return result.foregroundGranted;
}

export async function requestLocationPermissionsDetailed() {
  return requestDriverLocationPermissions();
}

async function stopForegroundWatch() {
  foregroundWatch?.remove();
  foregroundWatch = null;
}

async function stopBackgroundTask() {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (started) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    }
  } catch {
    // Task may not be registered in Expo Go
  }
}

export async function stopDriverLocationTracking(clearHandler = true): Promise<void> {
  if (clearHandler) {
    setDriverLocationHandler(null);
  }
  await stopForegroundWatch();
  await stopBackgroundTask();
}

async function startBackgroundUpdates(): Promise<boolean> {
  if ((await Location.getBackgroundPermissionsAsync()).status !== 'granted') {
    return false;
  }

  try {
    const already = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (already) return true;

    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 12_000,
      distanceInterval: 20,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      ...(Platform.OS === 'android'
        ? {
            foregroundService: {
              notificationTitle: 'Saveful Driver is live',
              notificationBody: 'Sharing your location for pickup routing',
            },
          }
        : {}),
    });
    return true;
  } catch (error) {
    console.warn('[DriverLocation] background updates unavailable', error);
    return false;
  }
}

async function startForegroundWatch(onUpdate: LocationUpdateHandler): Promise<void> {
  await stopForegroundWatch();
  foregroundWatch = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 12_000,
      distanceInterval: 20,
      mayShowUserSettingsDialog: true,
    },
    (pos) => {
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    },
  );
}

export async function startDriverLocationTracking(
  onUpdate: LocationUpdateHandler,
): Promise<{ ok: boolean; initial?: DriverCoord }> {
  setDriverLocationHandler(onUpdate);

  const permission = await requestDriverLocationPermissions();
  if (!permission.foregroundGranted) {
    if (permission.needsSettings) {
      showLocationSettingsAlert('foreground');
    }
    return { ok: false };
  }

  if (!permission.backgroundGranted) {
    showLocationSettingsAlert('background');
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const initial: DriverCoord = {
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
  };
  onUpdate(initial);

  await stopForegroundWatch();
  await stopBackgroundTask();

  const bgStarted = await startBackgroundUpdates();
  if (!bgStarted) {
    await startForegroundWatch(onUpdate);
  }

  return { ok: true, initial };
}

export async function ensureDriverLocationTracking(
  onUpdate: LocationUpdateHandler,
): Promise<void> {
  setDriverLocationHandler(onUpdate);

  try {
    const bgRunning = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (bgRunning) return;
  } catch {
    // fall through to foreground watch
  }

  if (!foregroundWatch) {
    await startForegroundWatch(onUpdate);
  }
}
