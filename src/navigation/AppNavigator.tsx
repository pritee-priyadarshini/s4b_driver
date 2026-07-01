import React, { useEffect, useRef } from 'react';

import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { PickupConfirmScreen } from '../screens/PickupConfirmScreen';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { authenticated, loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const isAuthenticatedRef = useRef(authenticated);
  const pendingNotificationRef = useRef<NotificationPayload | null>(null);

  useEffect(() => {
    isAuthenticatedRef.current = authenticated;
  }, [authenticated]);

  function navigateFromNotification(payload: NotificationPayload) {
    if (!navigationRef.current?.isReady()) return;

    const data = payload.data ?? {};

    if (data.pickupId) {
      navigationRef.current.navigate('MainTabs', { screen: 'Route' });
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

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="PickupConfirm" component={PickupConfirmScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
