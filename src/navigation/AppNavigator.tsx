import React from "react";

import { NavigationContainer,} from "@react-navigation/native";
import { createNativeStackNavigator,} from "@react-navigation/native-stack";
import { MainTabNavigator } from "./MainTabNavigator";
import { PickupConfirmScreen } from "../screens/PickupConfirmScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="PickupConfirm" component={PickupConfirmScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}