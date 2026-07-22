import { Platform, Vibration } from 'react-native';

const VIBRATE_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800, 400, 800, 400, 800];
const IOS_VIBRATE_INTERVAL_MS = 1100;
const ALERT_DURATION_MS = 12_000;
const ALARM_BURST_COUNT = 6;
const ALARM_BURST_INTERVAL_MS = 1800;

/** Android raw resource name — no extension, underscores only. */
export const PICKUP_ALERT_SOUND = 'pickup_alert';
/** iOS bundled notification sound filename. */
export const PICKUP_ALERT_SOUND_IOS = 'pickup_alert.wav';
/**
 * Android channel id. Bumped when channel settings change — Android channels are immutable,
 * so a new id is required for sound/vibration updates to take effect.
 */
export const PICKUP_ALERT_CHANNEL = 'pickup_alarm_v3';

let vibrationTimer: ReturnType<typeof setTimeout> | null = null;
let iosVibrationInterval: ReturnType<typeof setInterval> | null = null;
let alarmStopTimer: ReturnType<typeof setTimeout> | null = null;
let alarmBurstTimer: ReturnType<typeof setTimeout> | null = null;
let alarmBurstCancelled = false;
let alarmBurstIndex = 0;
let pickupAlertActive = false;
let startGeneration = 0;

export function isPickupAlertActive(): boolean {
  return pickupAlertActive;
}

type NotificationsModule = typeof import('expo-notifications');

function getNotificationsModule(): NotificationsModule | null {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

function getNotificationSound(): string {
  return Platform.OS === 'ios' ? PICKUP_ALERT_SOUND_IOS : PICKUP_ALERT_SOUND;
}

function getImmediateTrigger(): import('expo-notifications').NotificationTriggerInput {
  return Platform.OS === 'android' ? { channelId: PICKUP_ALERT_CHANNEL } : null;
}

function alertLog(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.log(`[PickupAlert] ${message}`, detail);
    return;
  }
  console.log(`[PickupAlert] ${message}`);
}

export async function ensurePickupAlertChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync(PICKUP_ALERT_CHANNEL, {
      name: 'Pickup Alarm',
      description: 'Loud alarm + vibration when a pickup is available',
      importance: Notifications.AndroidImportance.MAX,
      sound: PICKUP_ALERT_SOUND,
      vibrationPattern: VIBRATE_PATTERN,
      enableVibrate: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    alertLog('Android channel ready', { channel: PICKUP_ALERT_CHANNEL });
  } catch (err) {
    console.warn('[PickupAlert] Could not create alarm channel', err);
  }
}

/** Visible system notification with custom alarm sound — works in every app state when JS runs. */
export async function deliverPickupNotificationAlert(params: {
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await ensurePickupAlertChannel();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: getNotificationSound(),
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: VIBRATE_PATTERN,
        data: { ...params.data, _pickupNotif: '1' },
      },
      trigger: getImmediateTrigger(),
    });
    alertLog('Primary pickup notification scheduled', {
      sound: getNotificationSound(),
      channel: Platform.OS === 'android' ? PICKUP_ALERT_CHANNEL : 'ios',
    });
  } catch (err) {
    console.warn('[PickupAlert] Custom pickup notification failed, using default sound', err);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: VIBRATE_PATTERN,
          data: { ...params.data, _pickupNotif: '1' },
        },
        trigger: getImmediateTrigger(),
      });
    } catch (fallbackErr) {
      console.warn('[PickupAlert] Could not deliver pickup notification', fallbackErr);
    }
  }
}

async function fireAlarmBurst(Notifications: NotificationsModule): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New pickup',
      body: 'Accept the pickup request',
      sound: getNotificationSound(),
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: VIBRATE_PATTERN,
      data: { _alarmSound: '1' },
    },
    trigger: getImmediateTrigger(),
  });
}

async function playAlarmBursts(generation: number): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await ensurePickupAlertChannel();
  await stopAlarmBursts();

  if (generation !== startGeneration) return;

  alarmBurstCancelled = false;
  alarmBurstIndex = 0;

  const playNextBurst = async () => {
    if (alarmBurstCancelled || generation !== startGeneration) return;
    if (alarmBurstIndex >= ALARM_BURST_COUNT) return;

    try {
      await fireAlarmBurst(Notifications);
      alertLog('Alarm burst fired', { index: alarmBurstIndex + 1 });
    } catch (err) {
      console.warn('[PickupAlert] Custom alarm sound failed, using default', err);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'New pickup',
            body: 'Accept the pickup request',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: VIBRATE_PATTERN,
            data: { _alarmSound: '1' },
          },
          trigger: getImmediateTrigger(),
        });
      } catch (fallbackErr) {
        console.warn('[PickupAlert] Could not play alarm burst', fallbackErr);
      }
    }

    alarmBurstIndex += 1;

    if (
      !alarmBurstCancelled &&
      generation === startGeneration &&
      alarmBurstIndex < ALARM_BURST_COUNT
    ) {
      alarmBurstTimer = setTimeout(() => {
        void playNextBurst();
      }, ALARM_BURST_INTERVAL_MS);
    }
  };

  await playNextBurst();
}

async function stopAlarmBursts(): Promise<void> {
  alarmBurstCancelled = true;
  alarmBurstIndex = ALARM_BURST_COUNT;

  if (alarmBurstTimer) {
    clearTimeout(alarmBurstTimer);
    alarmBurstTimer = null;
  }
}

function stopVibration(): void {
  Vibration.cancel();
  if (vibrationTimer) {
    clearTimeout(vibrationTimer);
    vibrationTimer = null;
  }
  if (iosVibrationInterval) {
    clearInterval(iosVibrationInterval);
    iosVibrationInterval = null;
  }
}

function startVibration(generation: number): void {
  stopVibration();

  if (Platform.OS === 'android') {
    // Repeating pattern until cancelled.
    Vibration.vibrate(VIBRATE_PATTERN, true);
  } else {
    // iOS ignores vibrate patterns — pulse repeatedly instead.
    Vibration.vibrate();
    iosVibrationInterval = setInterval(() => {
      if (generation !== startGeneration) return;
      Vibration.vibrate();
    }, IOS_VIBRATE_INTERVAL_MS);
  }

  vibrationTimer = setTimeout(() => {
    if (generation !== startGeneration) return;
    stopVibration();
  }, ALERT_DURATION_MS);

  alertLog('Vibration started', { platform: Platform.OS, durationMs: ALERT_DURATION_MS });
}

export async function startPickupAlert(
  options: { vibration?: boolean; sound?: boolean } = {},
): Promise<void> {
  await stopPickupAlert();

  const generation = ++startGeneration;
  pickupAlertActive = true;
  const { vibration = true, sound = true } = options;

  alertLog('Starting pickup alert', { vibration, sound, generation });

  if (sound) {
    void playAlarmBursts(generation);
    alarmStopTimer = setTimeout(() => {
      if (generation !== startGeneration) return;
      void stopAlarmBursts();
    }, ALERT_DURATION_MS);
  }

  if (vibration) {
    startVibration(generation);
  }
}

export async function stopPickupAlert(): Promise<void> {
  pickupAlertActive = false;
  startGeneration += 1;
  stopVibration();
  if (alarmStopTimer) {
    clearTimeout(alarmStopTimer);
    alarmStopTimer = null;
  }
  await stopAlarmBursts();
  alertLog('Pickup alert stopped');
}

const PICKUP_NOTIFICATION_TYPES = new Set([
  'claim_made_driver',
  'pickup_available',
  'driver_assigned',
]);

export function isPickupAlertType(type: string | undefined): boolean {
  return !!type && PICKUP_NOTIFICATION_TYPES.has(type);
}

export function isDriverAssignedAlert(type: string | undefined): boolean {
  return type === 'driver_assigned';
}

export function isAlarmSoundNotification(data: Record<string, unknown> | undefined): boolean {
  return data?._alarmSound === '1';
}

/** Shared gate for foreground + background pickup alert handling. */
export function canProcessPickupNotificationData(data: Record<string, string | undefined>): boolean {
  if (!isPickupAlertType(data.type)) return false;
  if (data.type === 'driver_assigned') return !!data.pickupId;
  return !!(data.claimId && data.listingId);
}
