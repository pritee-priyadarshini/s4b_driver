import { Platform, Vibration } from 'react-native';

const VIBRATE_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800, 400, 800, 400, 800];
const ALERT_DURATION_MS = 10_000;
const ALARM_BURST_COUNT = 5;
const ALARM_BURST_INTERVAL_MS = 2000;

/** Android raw resource name — no extension, underscores only. */
export const PICKUP_ALERT_SOUND = 'pickup_alert';
/** iOS bundled notification sound filename. */
export const PICKUP_ALERT_SOUND_IOS = 'pickup_alert.wav';
/** New channel id so Android picks up the custom sound (channels are immutable). */
export const PICKUP_ALERT_CHANNEL = 'pickup_alarm_v2';

let vibrationTimer: ReturnType<typeof setTimeout> | null = null;
let alarmStopTimer: ReturnType<typeof setTimeout> | null = null;
let alarmBurstTimer: ReturnType<typeof setTimeout> | null = null;
let alarmBurstCancelled = false;
let alarmBurstIndex = 0;

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

export async function ensurePickupAlertChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync(PICKUP_ALERT_CHANNEL, {
      name: 'Pickup Alarm',
      description: 'Loud custom alarm for new pickup requests',
      importance: Notifications.AndroidImportance.MAX,
      sound: PICKUP_ALERT_SOUND,
      enableVibrate: false,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (err) {
    console.warn('[PickupAlert] Could not create alarm channel', err);
  }
}

async function fireAlarmBurst(Notifications: NotificationsModule): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New pickup',
      body: 'Accept the pickup request',
      sound: getNotificationSound(),
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { _alarmSound: '1' },
    },
    trigger: getImmediateTrigger(),
  });
}

async function playAlarmBursts(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await ensurePickupAlertChannel();
  await stopAlarmBursts();

  alarmBurstCancelled = false;
  alarmBurstIndex = 0;

  const playNextBurst = async () => {
    if (alarmBurstCancelled || alarmBurstIndex >= ALARM_BURST_COUNT) return;

    try {
      await fireAlarmBurst(Notifications);
    } catch (err) {
      console.warn('[PickupAlert] Custom alarm sound failed, using default', err);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'New pickup',
            body: 'Accept the pickup request',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { _alarmSound: '1' },
          },
          trigger: getImmediateTrigger(),
        });
      } catch (fallbackErr) {
        console.warn('[PickupAlert] Could not play alarm burst', fallbackErr);
      }
    }

    alarmBurstIndex += 1;

    if (!alarmBurstCancelled && alarmBurstIndex < ALARM_BURST_COUNT) {
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

export function startPickupAlert(options: { vibration?: boolean; sound?: boolean } = {}): void {
  void stopPickupAlert();

  const { vibration = true, sound = true } = options;

  if (sound) {
    void playAlarmBursts();
    alarmStopTimer = setTimeout(() => {
      void stopAlarmBursts();
    }, ALERT_DURATION_MS);
  }

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

export async function stopPickupAlert(): Promise<void> {
  Vibration.cancel();
  if (vibrationTimer) {
    clearTimeout(vibrationTimer);
    vibrationTimer = null;
  }
  if (alarmStopTimer) {
    clearTimeout(alarmStopTimer);
    alarmStopTimer = null;
  }
  await stopAlarmBursts();
}

const PICKUP_NOTIFICATION_TYPES = new Set([
  'claim_made_driver',
  'pickup_available',
]);

export function isPickupAlertType(type: string | undefined): boolean {
  return !!type && PICKUP_NOTIFICATION_TYPES.has(type);
}

export function isAlarmSoundNotification(data: Record<string, unknown> | undefined): boolean {
  return data?._alarmSound === '1';
}
