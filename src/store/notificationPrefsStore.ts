import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const PREFS_KEY = 'notification_prefs';

interface NotificationPrefs {
  alertSoundEnabled: boolean;
  alertVibrationEnabled: boolean;
}

interface NotificationPrefsState extends NotificationPrefs {
  loaded: boolean;
  load: () => Promise<void>;
  setAlertSound: (enabled: boolean) => void;
  setAlertVibration: (enabled: boolean) => void;
}

const DEFAULTS: NotificationPrefs = {
  alertSoundEnabled: true,
  alertVibrationEnabled: true,
};

function persist(prefs: NotificationPrefs) {
  SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
}

export const useNotificationPrefsStore = create<NotificationPrefsState>(
  (set, get) => ({
    ...DEFAULTS,
    loaded: false,

    load: async () => {
      try {
        const raw = await SecureStore.getItemAsync(PREFS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
          set({
            alertSoundEnabled: parsed.alertSoundEnabled ?? DEFAULTS.alertSoundEnabled,
            alertVibrationEnabled: parsed.alertVibrationEnabled ?? DEFAULTS.alertVibrationEnabled,
            loaded: true,
          });
          return;
        }
      } catch {}
      set({ loaded: true });
    },

    setAlertSound: (enabled) => {
      set({ alertSoundEnabled: enabled });
      const s = get();
      persist({ alertSoundEnabled: enabled, alertVibrationEnabled: s.alertVibrationEnabled });
    },

    setAlertVibration: (enabled) => {
      set({ alertVibrationEnabled: enabled });
      const s = get();
      persist({ alertSoundEnabled: s.alertSoundEnabled, alertVibrationEnabled: enabled });
    },
  }),
);
