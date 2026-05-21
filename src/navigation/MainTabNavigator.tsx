import React from "react";

import { BottomTabNavigationOptions, createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import { DashboardScreen } from "../screens/DashboardScreen";
import { RouteScreen } from "../screens/RouteScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

import { MainTabParamList } from "./types";
import { palette } from "../theme/colors";
import { HistoryScreen } from "../screens/HistoryScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'bicycle-outline',
  History: 'time-outline',
  Profile: 'person-outline',
  Route: 'navigate-outline',
};

const screenOptions = ({ route }: any): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarActiveTintColor: palette.primary,
  tabBarInactiveTintColor: palette.textMuted,
  tabBarStyle: {
    height: 76,
    paddingBottom: 12,
    paddingTop: 10,
    backgroundColor: palette.surface,
    borderTopColor: palette.strokecream,
  },
  tabBarLabelStyle: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
    <Ionicons
      color={color}
      name={iconMap[route.name as keyof typeof iconMap]}
      size={size}
    />
  ),
});

export function MainTabNavigator() {

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'PICKUP' }}
      />
      <Tab.Screen name="Route" component={RouteScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}