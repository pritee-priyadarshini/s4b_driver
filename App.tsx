import "react-native-gesture-handler";
import "react-native-reanimated";

import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { useFonts } from "expo-font";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { SplashScreen } from "./src/screens/SplashScreen";
import { AuthProvider, useAuth } from "./src/store/AuthContext";
import { useDriverShiftStore } from "./src/store/driverShiftStore";

export default function App() {
  const [splashTimerDone, setSplashTimerDone] = useState(false);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppRoot
            fontsReady={fontsLoaded}
            splashTimerDone={splashTimerDone}
            onSplashFinish={() => setSplashTimerDone(true)}
          />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

type AppRootProps = {
  fontsReady: boolean;
  splashTimerDone: boolean;
  onSplashFinish: () => void;
};

function AppRoot({ fontsReady, splashTimerDone, onSplashFinish }: AppRootProps) {
  const { loading: authLoading } = useAuth();
  const appReady = splashTimerDone && fontsReady && !authLoading;

  useEffect(() => {
    if (!appReady) return;
    void useDriverShiftStore.getState().hydrate();
  }, [appReady]);

  if (!appReady) {
    return <SplashScreen onFinish={onSplashFinish} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
