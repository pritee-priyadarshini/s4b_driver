import { Platform, Vibration } from 'react-native';

const VIBRATE_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800, 400, 800, 400, 800];
const ALERT_DURATION_MS = 10_000;

let vibrationTimer: ReturnType<typeof setTimeout> | null = null;

export function startPickupAlert(options: { vibration?: boolean } = {}): void {
  stopPickupAlert();

  const { vibration = true } = options;

  if (vibration) {
    if (Platform.OS === 'android') {
      Vibration.vibrate(VIBRATE_PATTERN, true);
    } else {
      Vibration.vibrate(VIBRATE_PATTERN);
    }
    vibrationTimer = setTimeout(() => {
      Vibration.cancel();
      vibrationTimer = null;
    }, ALERT_DURATION_MS);
  }
}

export function stopPickupAlert(): void {
  Vibration.cancel();
  if (vibrationTimer) {
    clearTimeout(vibrationTimer);
    vibrationTimer = null;
  }
}

const PICKUP_NOTIFICATION_TYPES = new Set([
  'claim_made_driver',
  'pickup_available',
]);

export function isPickupAlertType(type: string | undefined): boolean {
  return !!type && PICKUP_NOTIFICATION_TYPES.has(type);
}
