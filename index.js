import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerRootComponent } from 'expo';

import './src/services/driverLocationTask';

import App from './App';

const IS_EXPO_GO = Constants.appOwnership === 'expo';
const FIREBASE_ENABLED = Constants.expoConfig?.extra?.firebaseEnabled === true;

if (!IS_EXPO_GO) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('pickup_alerts', {
      name: 'Pickup Alerts',
      description: 'Loud alerts for new pickup requests',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 800, 400, 800, 400, 800, 400, 800, 400, 800],
      enableVibrate: true,
      sound: 'default',
    }).catch(() => {});
  }

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
