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
    return Platform.OS === 'android'
      ? 'Location permission was blocked. Open Settings, tap Location, and select "Allow all the time" so Saveful Driver can keep sharing your position while your shift is live.'
      : 'Location permission was blocked. Open Settings, tap Location, and select "Always" so Saveful Driver can keep sharing your position while your shift is live.';
  }

  return 'Location permission was blocked. Open Settings and allow location access so you can go live and navigate to pickups.';
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

/**
 * Short pre-prompt before the OS permission UI.
 * The user should pick Always / Allow all the time on the next system screen —
 * we do not ask them to dig through Settings manually first.
 */
function confirmBackgroundLocationRationale(): Promise<boolean> {
  const androidApi = getAndroidApiLevel();
  const android11Plus = Platform.OS === 'android' && androidApi >= 30;

  let message =
    'Saveful Driver uses continuous location while your shift is live to keep your route updated and share your position with your charity - even when the app is in the background. Tracking stops when you end your shift.';

  if (Platform.OS === 'ios') {
    message +=
      '\n\nOn the next screen, choose “Change to Always Allow”.';
  } else if (android11Plus) {
    // Android 11+ cannot put "Allow all the time" in the first popup.
    // requestBackgroundPermissionsAsync opens the system location screen
    // where the user selects that option directly.
    message +=
      '\n\nOn the next screen, select “Allow all the time”.';
  } else {
    message +=
      '\n\nOn the next screen, choose “Allow all the time”.';
  }

  if (IS_EXPO_GO) {
    message +=
      '\n\nNote: You are in Expo Go. Background location works best in a Saveful Driver build.';
  }

  return new Promise((resolve) => {
    showAppConfirm('Keep location on while live', message, {
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

  // 1) System dialog: Allow Once / While Using / Don't Allow
  const foreground = await Location.requestForegroundPermissionsAsync();
  const foregroundGranted = foreground.status === 'granted';

  if (!foregroundGranted) {
    // Only send to Settings if the OS will not show the dialog again.
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

  // 2) Explain briefly, then let the OS show the Always / Allow all the time choice.
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

  // iOS: "Change to Always Allow" sheet
  // Android 10: dialog with "Allow all the time"
  // Android 11+: system location permission screen (selection UI — not manual path hunting)
  const background = await Location.requestBackgroundPermissionsAsync();
  let backgroundGranted = background.status === 'granted';

  // Re-check after the system UI closes (especially Android settings picker).
  if (!backgroundGranted) {
    const recheck = await Location.getBackgroundPermissionsAsync();
    backgroundGranted = recheck.status === 'granted';
  }

  // Settings fallback only if the OS permanently blocked further prompts
  // (e.g. Don't Allow / denied + don't ask again / Allow Once dead-end).
  const needsSettings = !backgroundGranted && background.canAskAgain === false;
  if (needsSettings) {
    showLocationSettingsAlert('background');
  }

  return {
    ok: true,
    foregroundGranted: true,
    backgroundGranted,
    needsSettings,
    backgroundSkipped: false,
  };
}

export function openLocationSettings(): void {
  void Linking.openSettings();
}
