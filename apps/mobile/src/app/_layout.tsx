import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PrefsProvider } from "../prefs";
import { QueryProvider } from "../services/query";
import { useTheme } from "../theme/use-theme";
import { Launch } from "../ui/launch";
import { ToastProvider } from "../ui/toast";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const { c } = useTheme();
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  // Plays once per cold start, over the first screen.
  const [launching, setLaunching] = useState(true);
  const endLaunch = useCallback(() => setLaunching(false), []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <PrefsProvider>
          <QueryProvider>
            <ToastProvider>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}
              />
              {launching ? <Launch onDone={endLaunch} /> : null}
            </ToastProvider>
          </QueryProvider>
        </PrefsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
