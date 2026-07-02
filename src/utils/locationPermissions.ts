import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import { showAppConfirm, showAppSettingsPrompt } from './appAlert';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

let settingsAlertShown = false;

function getAndroidApiLevel(): number {
  if (Platform.OS !== 'android') return 0;
  return typeof Platform.Version === 'number' ? Platform.Version : 0;
}

function getSettingsMessage(kind: 'foreground' | 'background'): string {
  if (kind === 'background') {
    if (Platform.OS === 'android') {
      return 'Open Settings → Permissions → Location and choose "Allow all the time" so we can keep tracking your route while you are live, even when the app is in the background.';
    }

    return 'Open Settings → Location and choose "Always" so we can keep tracking your route while you are live, even when the app is in the background.';
  }

  return 'Location is required to go live and route you to pickups. Open Settings and allow location access.';
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

function confirmBackgroundLocationRationale(): Promise<boolean> {
  const androidApi = getAndroidApiLevel();
  const android11Plus = Platform.OS === 'android' && androidApi >= 30;

  let message =
    'To track your route while you are live — even when the app is in the background — we need background location access.';

  if (android11Plus) {
    message +=
      '\n\nOn your Android version, "Allow all the time" does not appear in the first popup. After you tap Continue, Android will open Settings — choose Permissions → Location → Allow all the time.';
  } else if (Platform.OS === 'android') {
    message +=
      '\n\nOn the next screen, choose "Allow all the time" if you see it. Otherwise open Settings and set Location to Allow all the time.';
  } else {
    message +=
      '\n\nOn the next screen, choose "Change to Always Allow" or open Settings and set Location to Always.';
  }

  if (IS_EXPO_GO) {
    message +=
      '\n\nNote: You are running in Expo Go. Background location works best in a development or production build of Saveful Driver.';
  }

  return new Promise((resolve) => {
    showAppConfirm('Background location needed', message, {
      confirmText: 'Continue',
      cancelText: 'While using app only',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

export type DriverLocationPermissionResult = {
  ok: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  needsSettings: boolean;
  backgroundSkipped: boolean;
};

type RequestDriverLocationOptions = {
  /** When false, only foreground permission is requested. Default true for go-live. */
  requestBackground?: boolean;
};

export async function requestDriverLocationPermissions(
  options: RequestDriverLocationOptions = {},
): Promise<DriverLocationPermissionResult> {
  const { requestBackground = true } = options;

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
      backgroundSkipped: false,
    };
  }

  if (!requestBackground) {
    return {
      ok: true,
      foregroundGranted: true,
      backgroundGranted: false,
      needsSettings: false,
      backgroundSkipped: true,
    };
  }

  const existingBackground = await Location.getBackgroundPermissionsAsync();
  if (existingBackground.status === 'granted') {
    return {
      ok: true,
      foregroundGranted: true,
      backgroundGranted: true,
      needsSettings: false,
      backgroundSkipped: false,
    };
  }

  const wantsBackground = await confirmBackgroundLocationRationale();
  if (!wantsBackground) {
    return {
      ok: true,
      foregroundGranted: true,
      backgroundGranted: false,
      needsSettings: false,
      backgroundSkipped: true,
    };
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  const backgroundGranted = background.status === 'granted';

  if (!backgroundGranted && !background.canAskAgain) {
    showLocationSettingsAlert('background');
  }

  return {
    ok: true,
    foregroundGranted: true,
    backgroundGranted,
    needsSettings: !backgroundGranted && !background.canAskAgain,
    backgroundSkipped: false,
  };
}

export function openLocationSettings(): void {
  void Linking.openSettings();
}
