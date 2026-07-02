import * as Location from 'expo-location';
import { Linking } from 'react-native';

import { showAppSettingsPrompt } from './appAlert';

let settingsAlertShown = false;

function getSettingsMessage(kind: 'foreground' | 'background'): string {
  if (kind === 'background') {
    return 'To keep sharing your location while you are live and the app is in the background, open Settings and set Location to "Always" on iOS or "Allow all the time" on Android.';
  }

  return 'Location is required to go live and route you to pickups. Open Settings and allow location access — preferably "Always" / "Allow all the time" for background tracking.';
}

export function showLocationSettingsAlert(kind: 'foreground' | 'background' = 'foreground'): void {
  if (settingsAlertShown) return;
  settingsAlertShown = true;

  showAppSettingsPrompt(
    'Turn on location in Settings',
    getSettingsMessage(kind),
    {
      cancelText: 'Not now',
      confirmText: 'Open Settings',
    },
  );

  setTimeout(() => {
    settingsAlertShown = false;
  }, 500);
}

export type DriverLocationPermissionResult = {
  ok: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  needsSettings: boolean;
};

export async function requestDriverLocationPermissions(): Promise<DriverLocationPermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  const foregroundGranted = foreground.status === 'granted';

  if (!foregroundGranted) {
    if (!foreground.canAskAgain) {
      showLocationSettingsAlert('foreground');
    }
    return {
      ok: false,
      foregroundGranted: false,
      backgroundGranted: false,
      needsSettings: !foreground.canAskAgain,
    };
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  const backgroundGranted = background.status === 'granted';

  if (!backgroundGranted && !background.canAskAgain) {
    showLocationSettingsAlert('background');
  }

  return {
    ok: foregroundGranted,
    foregroundGranted,
    backgroundGranted,
    needsSettings: !backgroundGranted && !background.canAskAgain,
  };
}

export function openLocationSettings(): void {
  void Linking.openSettings();
}
