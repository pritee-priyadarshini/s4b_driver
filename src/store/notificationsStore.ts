import { create } from 'zustand';

import {
  openNotificationSystemSettings,
  readNotificationPermissionState,
  registerDeviceToken as registerDeviceTokenService,
  requestNotificationPermissionFromSettings,
  setupForegroundNotificationHandler,
  setupPushPermissionRetryOnAppFocus,
  teardownForegroundNotificationHandler,
  teardownPushPermissionRetryOnAppFocus,
  unregisterDeviceToken as unregisterDeviceTokenService,
  formatPushError,
  logPushEnvironmentOnce,
  type NotificationPermissionState,
} from '../services/pushNotifications';

export type { NotificationPermissionState };

interface NotificationsState {
  permission: NotificationPermissionState | null;
  isFetchingPermission: boolean;
  isUpdatingPermission: boolean;
  isRegisteringToken: boolean;
  error: string | null;
  lastSuccessAt: string | null;
}

interface NotificationsActions {
  fetchPermission: () => Promise<void>;
  enableNotifications: () => Promise<void>;
  openSystemSettings: () => void;
  registerDeviceToken: (options?: { prompt?: boolean }) => Promise<void>;
  unregisterDeviceToken: () => Promise<void>;
  setupPushHandlers: () => void;
  teardownPushHandlers: () => void;
  reset: () => void;
}

const INITIAL: NotificationsState = {
  permission: null,
  isFetchingPermission: false,
  isUpdatingPermission: false,
  isRegisteringToken: false,
  error: null,
  lastSuccessAt: null,
};

export const useNotificationsStore = create<NotificationsState & NotificationsActions>(
  (set, get) => ({
    ...INITIAL,

    fetchPermission: async () => {
      if (get().isFetchingPermission) return;

      logPushEnvironmentOnce();
      set({ isFetchingPermission: true, error: null });
      try {
        const permission = await readNotificationPermissionState();
        set({ permission });
      } catch (error: unknown) {
        const message = formatPushError(error, 'Failed to load notification settings');
        console.error('[Push] fetchPermission failed', message);
        set({ error: message });
      } finally {
        set({ isFetchingPermission: false });
      }
    },

    enableNotifications: async () => {
      if (get().isUpdatingPermission) return;

      set({ isUpdatingPermission: true, error: null });
      try {
        const permission = await requestNotificationPermissionFromSettings();
        set({
          permission,
          lastSuccessAt: permission.granted && permission.firebaseEnabled ? new Date().toISOString() : null,
        });
      } catch (error: unknown) {
        const message = formatPushError(error, 'Failed to update notification permission');
        console.error('[Push] enableNotifications failed', message);
        set({ error: message });
      } finally {
        set({ isUpdatingPermission: false });
      }
    },

    openSystemSettings: () => {
      openNotificationSystemSettings();
    },

    registerDeviceToken: async (options = {}) => {
      if (get().isRegisteringToken) return;

      logPushEnvironmentOnce();
      set({ isRegisteringToken: true, error: null });
      try {
        await registerDeviceTokenService(options);
        const permission = await readNotificationPermissionState();
        set({
          permission,
          lastSuccessAt: new Date().toISOString(),
          error: null,
        });
      } catch (error: unknown) {
        const message = formatPushError(error, 'Failed to register device for notifications');
        console.error('[Push] registerDeviceToken failed', message);
        set({ error: message, lastSuccessAt: null });
      } finally {
        set({ isRegisteringToken: false });
      }
    },

    unregisterDeviceToken: async () => {
      set({ error: null });
      try {
        await unregisterDeviceTokenService();
        set({ lastSuccessAt: null });
      } catch (error: unknown) {
        const message = formatPushError(error, 'Failed to unregister notification token');
        console.error('[Push] unregisterDeviceToken failed', message);
        set({ error: message });
      }
    },

    setupPushHandlers: () => {
      logPushEnvironmentOnce();
      setupForegroundNotificationHandler();
      setupPushPermissionRetryOnAppFocus();
    },

    teardownPushHandlers: () => {
      teardownForegroundNotificationHandler();
      teardownPushPermissionRetryOnAppFocus();
    },

    reset: () => {
      get().teardownPushHandlers();
      set({ ...INITIAL });
    },
  }),
);
