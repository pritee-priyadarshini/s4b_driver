import { Platform, Vibration } from 'react-native';

const VIBRATE_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800, 400, 800, 400, 800];
const ALERT_DURATION_MS = 10_000;
const SOUND_LOOP_COUNT = 5;

let vibrationTimer: ReturnType<typeof setTimeout> | null = null;
let alertSound: { stopAsync: () => Promise<any>; unloadAsync: () => Promise<any>; replayAsync: () => Promise<any>; setOnPlaybackStatusUpdate: (cb: (status: any) => void) => void } | null = null;
let soundTimer: ReturnType<typeof setTimeout> | null = null;

function getAudioModule(): typeof import('expo-av').Audio | null {
  try {
    const mod = require('expo-av') as typeof import('expo-av');
    return mod.Audio;
  } catch {
    return null;
  }
}

async function playAlertSound(): Promise<void> {
  try {
    const Audio = getAudioModule();
    if (!Audio) {
      console.warn('[PickupAlert] expo-av not available — rebuild the dev client to enable alert sounds');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    const uri =
      Platform.OS === 'android'
        ? 'content://settings/system/alarm_alert'
        : 'content://settings/system/notification_sound';

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0, isLooping: false },
    );
    alertSound = sound;

    let played = 1;
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish && played < SOUND_LOOP_COUNT) {
        played += 1;
        void sound.replayAsync();
      }
    });
  } catch (err) {
    console.warn('[PickupAlert] Could not play alert sound', err);
  }
}

async function stopAlertSound(): Promise<void> {
  if (soundTimer) {
    clearTimeout(soundTimer);
    soundTimer = null;
  }
  if (alertSound) {
    try {
      await alertSound.stopAsync();
      await alertSound.unloadAsync();
    } catch {}
    alertSound = null;
  }
}

export function startPickupAlert(options: { vibration?: boolean; sound?: boolean } = {}): void {
  void stopPickupAlert();

  const { vibration = true, sound = true } = options;

  if (sound) {
    void playAlertSound();
    soundTimer = setTimeout(() => {
      void stopAlertSound();
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
  await stopAlertSound();
}

const PICKUP_NOTIFICATION_TYPES = new Set([
  'claim_made_driver',
  'pickup_available',
]);

export function isPickupAlertType(type: string | undefined): boolean {
  return !!type && PICKUP_NOTIFICATION_TYPES.has(type);
}
