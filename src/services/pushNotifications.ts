import { AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';

import { showAppSettingsPrompt } from '../utils/appAlert';
import { extractApiMessage } from '../utils/apiError';
import { isPickupAlertType } from '../utils/pickupAlert';

import {
  notificationsService,
  type PushPlatform,
  type RegisterPushTokenPayload,
} from './notifications.service';

const IS_EXPO_GO = Constants.appOwnership === 'expo';
const FIREBASE_ENABLED = Constants.expoConfig?.extra?.firebaseEnabled === true;

let tokenRefreshUnsubscribe: (() => void) | null = null;
let foregroundUnsubscribe: (() => void) | null = null;
let tapUnsubscribe: (() => void) | null = null;
let appStateUnsubscribe: (() => void) | null = null;
let permissionSettingsAlertShown = false;
let tokenRegistrationInFlight = false;
let diagnosticsLogged = false;

type AxiosLikeError = {
  isAxiosError?: boolean;
  response?: { status?: number; data?: unknown };
  message?: string;
};

function isAxiosError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosLikeError).isAxiosError === true
  );
}

function pushLog(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.log(`[Push] ${message}`, detail);
    return;
  }
  console.log(`[Push] ${message}`);
}

function pushWarn(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.warn(`[Push] ${message}`, detail);
    return;
  }
  console.warn(`[Push] ${message}`);
}

function pushError(message: string, error: unknown, detail?: Record<string, unknown>): void {
  const payload: Record<string, unknown> = { ...detail };

  if (isAxiosError(error)) {
    payload.httpStatus = error.response?.status;
    payload.apiMessage = extractApiMessage(error.response?.data);
    payload.apiBody = error.response?.data;
    payload.requestMessage = error.message;
  } else if (error instanceof Error) {
    payload.errorName = error.name;
    payload.errorMessage = error.message;
  } else {
    payload.error = error;
  }

  console.error(`[Push] ERROR: ${message}`, payload);
}

export function formatPushError(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage = extractApiMessage(error.response?.data);
    if (status && apiMessage) return `${status} — ${apiMessage}`;
    if (apiMessage) return apiMessage;
    if (status) return `Request failed (${status})`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function logPushEnvironmentOnce(): void {
  if (diagnosticsLogged) return;
  diagnosticsLogged = true;

  pushLog('Environment', {
    platform: Platform.OS,
    expoGo: IS_EXPO_GO,
    firebaseEnabled: FIREBASE_ENABLED,
    appBundle: getAppBundle(),
    appVersion: Application.nativeApplicationVersion,
    appBuild: Application.nativeBuildVersion,
    tokenMode: __DEV__ ? 'dev' : 'prod',
    targetApp: 'driver',
  });

  if (IS_EXPO_GO) {
    pushWarn('Running in Expo Go — remote FCM push is not supported. Use a dev client build.');
  }

  if (!FIREBASE_ENABLED) {
    pushWarn(
      'firebaseEnabled=false in this build. google-services.json was not bundled at build time. Rebuild after EAS GOOGLE_SERVICES_JSON secret is set.',
    );
  }
}

function isPermissionGranted(
  permissions: { granted?: boolean; status?: string },
): boolean {
  return permissions.granted === true || permissions.status === 'granted';
}

function getNotificationsModule() {
  return require('expo-notifications') as typeof import('expo-notifications');
}

async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = getNotificationsModule();
  await Promise.all([
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    }),
    Notifications.setNotificationChannelAsync('pickup_alerts', {
      name: 'Pickup Alerts',
      description: 'Loud alerts for new pickup requests',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 800, 400, 800, 400, 800, 400, 800, 400, 800],
      enableVibrate: true,
      sound: 'default',
    }),
  ]);
  pushLog('Android notification channels ready (default + pickup_alerts)');
}

function showNotificationSettingsAlert(): void {
  if (permissionSettingsAlertShown) return;
  permissionSettingsAlertShown = true;

  showAppSettingsPrompt(
    'Enable notifications',
    'Allow notifications to receive pickup assignments and trip updates.',
    {
      cancelText: 'Not now',
      confirmText: 'Open Settings',
    },
  );

  setTimeout(() => {
    permissionSettingsAlertShown = false;
  }, 500);
}

export async function ensureNotificationPermission(
  options: { prompt?: boolean } = {},
): Promise<boolean> {
  const { prompt = true } = options;
  const Notifications = getNotificationsModule();

  await setupAndroidNotificationChannel();

  let permissions = await Notifications.getPermissionsAsync();
  pushLog('Current notification permission', {
    status: permissions.status,
    granted: permissions.granted,
    canAskAgain: permissions.canAskAgain,
  });

  if (!isPermissionGranted(permissions) && prompt) {
    pushLog('Requesting notification permission from OS');
    permissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    pushLog('OS permission result', {
      status: permissions.status,
      granted: permissions.granted,
      canAskAgain: permissions.canAskAgain,
    });
  }

  if (!isPermissionGranted(permissions)) {
    pushWarn('Notification permission not granted', {
      status: permissions.status,
      canAskAgain: permissions.canAskAgain,
    });
    if (prompt && permissions.canAskAgain === false) {
      showNotificationSettingsAlert();
    }
    return false;
  }

  if (Platform.OS === 'ios' && FIREBASE_ENABLED && !IS_EXPO_GO) {
    const {
      default: messaging,
      AuthorizationStatus,
    } = require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    pushLog('iOS FCM permission status', { authStatus, enabled });
    if (!enabled) {
      if (prompt) showNotificationSettingsAlert();
      return false;
    }
  }

  return true;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type NotificationPermissionState = {
  supported: boolean;
  firebaseEnabled: boolean;
  granted: boolean;
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
};

export function isPushSupportedOnDevice(): boolean {
  return (Platform.OS === 'ios' || Platform.OS === 'android') && !IS_EXPO_GO;
}

export async function readNotificationPermissionState(): Promise<NotificationPermissionState> {
  logPushEnvironmentOnce();

  if (!isPushSupportedOnDevice()) {
    return {
      supported: false,
      firebaseEnabled: FIREBASE_ENABLED,
      granted: false,
      status: 'unavailable',
      canAskAgain: false,
    };
  }

  const Notifications = getNotificationsModule();
  const permissions = await Notifications.getPermissionsAsync();
  const granted = isPermissionGranted(permissions);

  let status: NotificationPermissionStatus = 'undetermined';
  if (granted) {
    status = 'granted';
  } else if (permissions.status === 'denied') {
    status = 'denied';
  }

  return {
    supported: true,
    firebaseEnabled: FIREBASE_ENABLED,
    granted,
    status,
    canAskAgain: permissions.canAskAgain !== false,
  };
}

export async function requestNotificationPermissionFromSettings(): Promise<NotificationPermissionState> {
  if (!isPushSupportedOnDevice()) {
    return readNotificationPermissionState();
  }

  const granted = await ensureNotificationPermission({ prompt: true });
  if (granted) {
    await registerDeviceToken({ prompt: false });
  }

  return readNotificationPermissionState();
}

export function openNotificationSystemSettings(): void {
  Linking.openSettings();
}

export function setupPushPermissionRetryOnAppFocus(): void {
  if (IS_EXPO_GO || !FIREBASE_ENABLED || appStateUnsubscribe) return;

  pushLog('App focus listener enabled — will retry silent token registration');
  appStateUnsubscribe = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void registerDeviceToken({ prompt: false }).catch((error) => {
        pushError('Silent token re-registration on app focus failed', error);
      });
    }
  }).remove;
}

export function teardownPushPermissionRetryOnAppFocus(): void {
  appStateUnsubscribe?.();
  appStateUnsubscribe = null;
}

function getAppBundle(): string | undefined {
  if (Platform.OS === 'ios') return Constants.expoConfig?.ios?.bundleIdentifier;
  if (Platform.OS === 'android') return Constants.expoConfig?.android?.package;
  return undefined;
}

function buildTokenPayload(
  token: string,
  tokenType: RegisterPushTokenPayload['tokenType'],
): RegisterPushTokenPayload {
  return {
    token,
    platform: Platform.OS as PushPlatform,
    tokenType,
    tokenMode: __DEV__ ? 'dev' : 'prod',
    appVersion: Application.nativeApplicationVersion ?? undefined,
    appBuild: Application.nativeBuildVersion ?? undefined,
    appBundle: getAppBundle(),
    targetApp: 'driver',
  };
}

function maskToken(token: string): string {
  if (token.length <= 12) return token;
  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}

export async function registerDeviceToken(
  options: { prompt?: boolean } = {},
): Promise<void> {
  logPushEnvironmentOnce();

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    pushWarn('Unsupported platform for push registration', { platform: Platform.OS });
    return;
  }

  if (IS_EXPO_GO) {
    throw new Error('Expo Go does not support FCM. Install the dev client APK and run npm run start:dev.');
  }

  if (!FIREBASE_ENABLED) {
    throw new Error(
      'Firebase is not enabled in this build (firebaseEnabled=false). Rebuild the dev client after GOOGLE_SERVICES_JSON is set in EAS.',
    );
  }

  if (tokenRegistrationInFlight) {
    pushLog('Token registration already in progress — skipping duplicate call');
    return;
  }

  tokenRegistrationInFlight = true;
  pushLog('Starting device token registration', { prompt: options.prompt !== false });

  try {
    const { default: messaging } =
      require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');

    const permitted = await ensureNotificationPermission({ prompt: options.prompt !== false });
    if (!permitted) {
      throw new Error('Notification permission was denied. Enable notifications in system settings.');
    }

    pushLog('Requesting FCM token from Firebase');
    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      throw new Error('Firebase returned an empty FCM token');
    }

    const payload = buildTokenPayload(fcmToken, 'fcm');
    pushLog('Registering token with backend', {
      tokenPreview: maskToken(fcmToken),
      platform: payload.platform,
      tokenType: payload.tokenType,
      tokenMode: payload.tokenMode,
      appBundle: payload.appBundle,
      targetApp: payload.targetApp,
    });

    const response = await notificationsService.registerToken(payload);
    const data = response.data as { message?: string; targetApp?: string } | undefined;
    pushLog('FCM token registered successfully', {
      tokenPreview: maskToken(fcmToken),
      backendMessage: data?.message,
      backendTargetApp: data?.targetApp,
    });

    if (!tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (newToken) => {
        try {
          pushLog('FCM token refreshed — re-registering with backend', {
            tokenPreview: maskToken(newToken),
          });
          await notificationsService.registerToken(buildTokenPayload(newToken, 'fcm'));
          pushLog('Refreshed FCM token registered successfully');
        } catch (error) {
          pushError('Token refresh registration failed', error);
        }
      });
      pushLog('FCM onTokenRefresh listener attached');
    }
  } catch (error) {
    pushError('Device token registration failed', error);
    throw error;
  } finally {
    tokenRegistrationInFlight = false;
  }
}

export async function unregisterDeviceToken(): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  if (tokenRefreshUnsubscribe) {
    tokenRefreshUnsubscribe();
    tokenRefreshUnsubscribe = null;
    pushLog('FCM onTokenRefresh listener removed');
  }

  if (!FIREBASE_ENABLED) {
    pushLog('Logout — skipped token unregister (Firebase not configured in this build)');
    return;
  }

  try {
    pushLog('Unregistering all driver tokens on backend');
    const response = await notificationsService.unregisterAllTokens();
    const data = response.data as { count?: number } | undefined;
    pushLog('Driver tokens unregistered', { count: data?.count });
  } catch (error) {
    pushError('Backend token unregister failed', error);
  }

  if (!IS_EXPO_GO) {
    try {
      const { default: messaging } =
        require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');
      await messaging().deleteToken();
      pushLog('Local FCM token deleted');
    } catch (error) {
      pushError('FCM deleteToken failed', error);
    }
  }
}

export function setupForegroundNotificationHandler(): void {
  if (IS_EXPO_GO || !FIREBASE_ENABLED) {
    pushWarn('Foreground handler not started', { expoGo: IS_EXPO_GO, firebaseEnabled: FIREBASE_ENABLED });
    return;
  }
  if (foregroundUnsubscribe) return;

  const Notifications =
    require('expo-notifications') as typeof import('expo-notifications');
  const { default: messaging } =
    require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');

  foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    const data = (remoteMessage.data ?? {}) as Record<string, string>;
    pushLog('Foreground FCM message received', {
      messageId: remoteMessage.messageId,
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data,
    });

    const isPickup = isPickupAlertType(data.type);
    const channelId = isPickup ? 'pickup_alerts' : 'default';

    let soundEnabled = true;
    if (isPickup) {
      try {
        const { useNotificationPrefsStore } = require('../store/notificationPrefsStore');
        soundEnabled = useNotificationPrefsStore.getState().alertSoundEnabled;
      } catch {}
    }

    if (remoteMessage.notification?.title || remoteMessage.notification?.body) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title ?? '',
          body: remoteMessage.notification.body ?? '',
          data: { ...data, _localNotif: '1' },
          sound: soundEnabled,
        },
        trigger: Platform.OS === 'android' ? { channelId } : null,
      });
      pushLog('Foreground banner scheduled via expo-notifications', { channelId, soundEnabled });
    }

    if (isPickup && data.claimId && data.listingId) {
      const { usePickupAlertStore } = require('../store/pickupAlertStore');
      usePickupAlertStore.getState().show({
        claimId: data.claimId,
        listingId: data.listingId,
        title: remoteMessage.notification?.title ?? 'New pickup available!',
        body: remoteMessage.notification?.body ?? '',
        type: data.type,
        claimMode: data.claimMode,
        remainingQtyKg: data.remainingQtyKg,
      });
      pushLog('Pickup alert modal triggered', { type: data.type, claimId: data.claimId });
    }
  });

  pushLog('Foreground FCM handler attached');
}

export function teardownForegroundNotificationHandler(): void {
  foregroundUnsubscribe?.();
  foregroundUnsubscribe = null;
}

export type NotificationPayload = {
  messageId?: string;
  data?: Record<string, string>;
  notification?: { title?: string; body?: string };
};

export async function setupNotificationOpenedHandler(
  onOpen: (payload: NotificationPayload) => void,
): Promise<void> {
  if (IS_EXPO_GO) {
    pushWarn('Notification tap handler skipped — Expo Go does not support FCM');
    return;
  }

  if (!FIREBASE_ENABLED) {
    pushWarn('Notification tap handler skipped — Firebase not enabled in this build');
    return;
  }

  const Notifications =
    require('expo-notifications') as typeof import('expo-notifications');
  const { default: messaging } =
    require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');

  const firebaseUnsub = messaging().onNotificationOpenedApp((remoteMessage) => {
    pushLog('Notification opened app from background', {
      messageId: remoteMessage.messageId,
      data: remoteMessage.data,
    });
    onOpen({
      messageId: remoteMessage.messageId,
      data: remoteMessage.data as Record<string, string> | undefined,
      notification: remoteMessage.notification,
    });
  });

  const localNotifSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, string>;
    if (!data._localNotif) return;
    pushLog('Foreground notification tapped', {
      identifier: response.notification.request.identifier,
      data,
    });
    onOpen({
      messageId: response.notification.request.identifier,
      data,
      notification: {
        title: response.notification.request.content.title ?? undefined,
        body: response.notification.request.content.body ?? undefined,
      },
    });
  });

  tapUnsubscribe = () => {
    firebaseUnsub();
    localNotifSub.remove();
  };

  const initialMessage = await messaging().getInitialNotification();
  if (initialMessage) {
    pushLog('App opened from killed state via notification', {
      messageId: initialMessage.messageId,
      data: initialMessage.data,
    });
    onOpen({
      messageId: initialMessage.messageId,
      data: initialMessage.data as Record<string, string> | undefined,
      notification: initialMessage.notification,
    });
  }

  pushLog('Notification tap handlers attached');
}

export function teardownNotificationOpenedHandler(): void {
  tapUnsubscribe?.();
  tapUnsubscribe = null;
}
