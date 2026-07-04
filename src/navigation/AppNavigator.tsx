import React, { useEffect, useRef } from 'react';

import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from './types';
import { useAuth } from '../store/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import {
  setupNotificationOpenedHandler,
  teardownNotificationOpenedHandler,
  type NotificationPayload,
} from '../services/pushNotifications';
import { PickupAlertModal } from '../components/PickupAlertModal';
import { usePickupAlertStore } from '../store/pickupAlertStore';
import { isPickupAlertType } from '../utils/pickupAlert';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { authenticated } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const isAuthenticatedRef = useRef(authenticated);
  const pendingNotificationRef = useRef<NotificationPayload | null>(null);

  useEffect(() => {
    isAuthenticatedRef.current = authenticated;
  }, [authenticated]);

  function navigateFromNotification(payload: NotificationPayload) {
    if (!navigationRef.current?.isReady()) return;

    const data = payload.data ?? {};

    if (isPickupAlertType(data.type) && data.claimId && data.listingId) {
      navigationRef.current.navigate('MainTabs', { screen: 'Dashboard' });
      usePickupAlertStore.getState().show({
        claimId: data.claimId,
        listingId: data.listingId,
        title: payload.notification?.title ?? 'New pickup available!',
        body: payload.notification?.body ?? '',
        type: data.type,
        claimMode: data.claimMode,
        remainingQtyKg: data.remainingQtyKg,
      });
      return;
    }

    if (data.pickupId || data.type === 'driver_assigned') {
      navigationRef.current.navigate('MainTabs', { screen: 'Dashboard' });
      return;
    }

    if (data.screen === 'History') {
      navigationRef.current.navigate('MainTabs', { screen: 'History' });
      return;
    }

    if (data.screen === 'Profile') {
      navigationRef.current.navigate('MainTabs', { screen: 'Profile' });
      return;
    }

    navigationRef.current.navigate('MainTabs', { screen: 'Dashboard' });
  }

  useEffect(() => {
    setupNotificationOpenedHandler((payload) => {
      if (!navigationRef.current?.isReady() || !isAuthenticatedRef.current) {
        pendingNotificationRef.current = payload;
        return;
      }
      navigateFromNotification(payload);
    });

    return () => teardownNotificationOpenedHandler();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      pendingNotificationRef.current = null;
      return;
    }

    if (!pendingNotificationRef.current) return;

    const payload = pendingNotificationRef.current;
    pendingNotificationRef.current = null;
    navigateFromNotification(payload);
  }, [authenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </>
        )}
      </Stack.Navigator>
      {authenticated ? <PickupAlertModal /> : null}
    </NavigationContainer>
  );
}
