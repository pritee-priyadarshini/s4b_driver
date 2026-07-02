import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

let settingsAlertShown = false;

function getSettingsMessage(kind: 'foreground' | 'background'): string {
  if (kind === 'background') {
    return Platform.OS === 'ios'
      ? 'To keep sharing your location while you are live and the app is in the background, open Settings → Saveful Driver → Location and choose "Always".'
      : 'To keep sharing your location while you are live and the app is in the background, open Settings → Apps → Saveful Driver → Permissions → Location and choose "Allow all the time".';
  }

  return Platform.OS === 'ios'
    ? 'Location is required to go live and route you to pickups. Open Settings → Saveful Driver → Location and allow access — choose "Always" so tracking works in the background.'
    : 'Location is required to go live and route you to pickups. Open Settings → Apps → Saveful Driver → Permissions → Location and choose "Allow all the time" so tracking works in the background.';
}

export function showLocationSettingsAlert(kind: 'foreground' | 'background' = 'foreground'): void {
  if (settingsAlertShown) return;
  settingsAlertShown = true;

  Alert.alert('Turn on location in Settings', getSettingsMessage(kind), [
    {
      text: 'Not now',
      style: 'cancel',
      onPress: () => {
        settingsAlertShown = false;
      },
    },
    {
      text: 'Open Settings',
      onPress: () => {
        settingsAlertShown = false;
        void Linking.openSettings();
      },
    },
  ]);
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
