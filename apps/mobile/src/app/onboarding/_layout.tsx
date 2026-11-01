import { Stack } from "expo-router";
import { OnboardingSession } from "../../onboarding/session";
import { useTheme } from "../../theme/use-theme";

export default function OnboardingLayout() {
  const { c } = useTheme();
  return (
    <OnboardingSession>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="found" options={{ gestureEnabled: false }} />
        <Stack.Screen name="setup" options={{ gestureEnabled: false }} />
      </Stack>
    </OnboardingSession>
  );
}
