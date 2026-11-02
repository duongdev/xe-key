import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const { c, scheme } = useTheme();
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  // Plays once per cold start, over the first screen.
  // Cold start only, and only into Home: a deep link (Siri, widget, notification) opens its screen
  // directly. The pathname at first render is the one the app was opened with.
  const startPath = usePathname();
  const [launching, setLaunching] = useState(startPath === "/" || startPath === "/home");
  const endLaunch = useCallback(() => setLaunching(false), []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // The native window behind every screen shows during transitions and swipe-back: match the theme.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);

  const navTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: c.bg,
        card: c.s1,
        text: c.fg,
        border: c.line,
        primary: c.acc,
        notification: c.warn,
      },
    };
  }, [scheme, c]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <PrefsProvider>
          <QueryProvider>
            <ToastProvider>
              <StatusBar style="auto" />
              {/* The native stack paints its container with the navigation theme; on iOS 26+ it
                  shows around screens during push and swipe-back. Default is light #F2F2F2. */}
              <ThemeProvider value={navTheme}>
                <Stack
                  screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}
                >
                  {/* Native iOS sheet: system dim, grabber, drag to close, keyboard handling. */}
                  {/* iOS page sheet: Trips zooms out behind, drag down to close. */}
                  <Stack.Screen
                    name="trip/[id]"
                    options={{ presentation: "modal", contentStyle: { backgroundColor: c.s1 } }}
                  />
                  <Stack.Screen
                    name="pin"
                    options={{
                      presentation: "formSheet",
                      sheetAllowedDetents: "fitToContents",
                      sheetGrabberVisible: true,
                      sheetCornerRadius: 24,
                      contentStyle: { backgroundColor: c.s1 },
                    }}
                  />
                </Stack>
              </ThemeProvider>
              {launching ? <Launch onDone={endLaunch} /> : null}
            </ToastProvider>
          </QueryProvider>
        </PrefsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
