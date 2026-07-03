import api from './api';

export type PushPlatform = 'ios' | 'android';
export type PushTokenType = 'fcm' | 'expo' | 'apns';
export type PushTokenMode = 'prod' | 'dev';
export type PushTargetApp = 'business' | 'driver';

export type RegisterPushTokenPayload = {
  token: string;
  platform: PushPlatform;
  tokenType: PushTokenType;
  tokenMode?: PushTokenMode;
  appVersion?: string;
  appBuild?: string;
  appBundle?: string;
  targetApp?: PushTargetApp;
};

export const notificationsService = {
  ping: () => api.get('/notifications/ping'),

  registerToken: (data: RegisterPushTokenPayload) =>
    api.post('/notifications/token', data),

  unregisterToken: (token: string) =>
    api.delete('/notifications/token', { data: { token } } as any),

  unregisterAllTokens: (targetApp: PushTargetApp = 'driver') =>
    api.delete('/notifications/tokens/all', { params: { targetApp } }),
};
