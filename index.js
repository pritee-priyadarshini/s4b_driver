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
    handleNotification: async (notification) => {
      const data = notification.request.content.data ?? {};
      const isHiddenAlarmBurst = data._alarmSound === '1';

      return {
        shouldShowBanner: !isHiddenAlarmBurst,
        shouldShowList: !isHiddenAlarmBurst,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });

  if (Platform.OS === 'android') {
    const { ensurePickupAlertChannel } = require('./src/utils/pickupAlert');
    void ensurePickupAlertChannel();
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
        const data = remoteMessage.data ?? {};
        console.log('[Push] Background message received:', remoteMessage.messageId, data.type);

        try {
          const { canProcessPickupNotificationData } = require('./src/utils/pickupAlert');
          const { processIncomingPickupNotification } = require('./src/services/pushNotifications');
          if (canProcessPickupNotificationData(data)) {
            await processIncomingPickupNotification({
              data,
              notification: remoteMessage.notification,
              source: 'background',
            });
          }
        } catch (error) {
          console.warn('[Push] Background pickup handler failed', error);
        }
      });
    } catch (error) {
      console.log('[Push] Firebase messaging not available', error);
    }
  }
}

registerRootComponent(App);
