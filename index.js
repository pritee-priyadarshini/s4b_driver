import Constants from 'expo-constants';
import { registerRootComponent } from 'expo';

import './src/services/driverLocationTask';

import App from './App';

const IS_EXPO_GO = Constants.appOwnership === 'expo';
const FIREBASE_ENABLED = Constants.expoConfig?.extra?.firebaseEnabled === true;

if (!IS_EXPO_GO) {
  const { setNotificationHandler } = require('expo-notifications');
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (FIREBASE_ENABLED) {
    try {
      const { logPushEnvironmentOnce } = require('./src/services/pushNotifications');
      logPushEnvironmentOnce();
    } catch {
      // push module not ready yet
    }

    try {
      const { default: messaging } = require('@react-native-firebase/messaging');
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('[Push] Background message received:', remoteMessage.messageId);
      });
    } catch (error) {
      console.log('[Push] Firebase messaging not available', error);
    }
  }
}

registerRootComponent(App);
