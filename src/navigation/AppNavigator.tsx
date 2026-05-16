import React from "react";

import { NavigationContainer, } from "@react-navigation/native";
import { createNativeStackNavigator, } from "@react-navigation/native-stack";
import { MainTabNavigator } from "./MainTabNavigator";
import { PickupConfirmScreen } from "../screens/PickupConfirmScreen";
import { RootStackParamList } from "./types";
import { useAuth } from "../store/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";
import { ChangePasswordScreen } from "../screens/ChangePasswordScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { authenticated, loading, } = useAuth();

  if (loading) {
    return null;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, }}>
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