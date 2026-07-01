import "react-native-gesture-handler";
import "react-native-reanimated";

import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { useFonts } from "expo-font";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/store/AuthContext";
import { TripProvider } from "./src/store/TripContext";
import { useDriverShiftStore } from "./src/store/driverShiftStore";

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "Saveful-Bold": require("./assets/fonts/Saveful-Bold.ttf"),
    "Saveful-BoldItalic": require("./assets/fonts/Saveful-BoldItalic.ttf"),
    "Saveful-Italic": require("./assets/fonts/Saveful-Italic.ttf"),
    "Saveful-Regular": require("./assets/fonts/Saveful-Regular.ttf"),
    "Saveful-SemiBold": require("./assets/fonts/Saveful-SemiBold.ttf"),
    "Saveful-SemiBoldItalic": require("./assets/fonts/Saveful-SemiBoldItalic.ttf"),
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <TripProvider>
            <AppWithShiftHydration />
          </TripProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppWithShiftHydration() {
  useEffect(() => {
    void useDriverShiftStore.getState().hydrate();
  }, []);

  return <AppNavigator />;
}