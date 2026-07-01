import React from "react";

import { BottomTabNavigationOptions, createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import { DashboardScreen } from "../screens/DashboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

import { MainTabParamList } from "./types";
import { palette } from "../theme/colors";
import { HistoryScreen } from "../screens/HistoryScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const iconMap: Record<
  keyof MainTabParamList,
  { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }
> = {
  Dashboard: { outline: 'bicycle-outline', filled: 'bicycle' },
  History: { outline: 'time-outline', filled: 'time' },
  Profile: { outline: 'person-outline', filled: 'person' },
};

const screenOptions = ({ route }: any): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarActiveTintColor: palette.kale,
  tabBarInactiveTintColor: palette.textMuted,
  tabBarStyle: {
    height: 76,
    paddingBottom: 12,
    paddingTop: 10,
    backgroundColor: palette.background,
    borderTopColor: palette.strokecream,
  },
  tabBarLabelStyle: {
    fontFamily: 'Saveful-SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => {
    const icons = iconMap[route.name as keyof MainTabParamList];
    return (
      <Ionicons
        color={color}
        name={focused ? icons.filled : icons.outline}
        size={size}
      />
    );
  },
});

export function MainTabNavigator() {

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'PICKUP' }}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}