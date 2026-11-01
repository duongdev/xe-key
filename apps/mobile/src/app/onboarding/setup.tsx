import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { ChatTextIcon, ScanSmileyIcon } from "phosphor-react-native";
import { Switch, View } from "react-native";
import { useT } from "../../i18n";
import { usePrefs } from "../../prefs";
import { iconSize, radius, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";

/** Asks for Face ID only when the user switches it on; a failed or cancelled check leaves it off. */
async function confirmFaceId(prompt: string): Promise<boolean> {
  if (
    !(await LocalAuthentication.hasHardwareAsync()) ||
    !(await LocalAuthentication.isEnrolledAsync())
  )
    return false;
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    disableDeviceFallback: true,
  });
  return res.success;
}

export default function Setup() {
  const { c } = useTheme();
  const t = useT();
  const { prefs, update } = usePrefs();

  const rows = [
    {
      key: "faceId",
      icon: ScanSmileyIcon,
      title: t.faceId,
      hint: t.faceIdHint,
      on: prefs.faceId,
      set: async (on: boolean) =>
        update({ faceId: on ? await confirmFaceId(t.faceIdPrompt) : false }),
    },
    {
      key: "siri",
      icon: ChatTextIcon,
      title: t.siri,
      hint: t.siriHint,
      on: prefs.siri,
      set: (on: boolean) => update({ siri: on }),
    },
  ] as const;

  return (
    <Screen style={{ paddingTop: 96 }}>
      <Text style={{ ...textStyle("large"), marginBottom: 8 }}>{t.setupTitle}</Text>
      <Text variant="label" weight={400} color="fg2" style={{ marginBottom: 28 }}>
        {t.setupHint}
      </Text>
      <View style={{ gap: 12 }}>
        {rows.map(({ key, icon: Icon, title, hint, on, set }) => (
          <View
            key={key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: radius.card,
              backgroundColor: c.s1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.chip,
                backgroundColor: c.s2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={iconSize.md} color={c.acc} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight={600} style={{ fontSize: 16 }}>
                {title}
              </Text>
              <Text variant="caption" color="fg2">
                {hint}
              </Text>
            </View>
            <View style={{ height: 31, justifyContent: "center" }}>
              <Switch
                accessibilityLabel={title}
                value={on}
                onValueChange={set}
                trackColor={{ true: c.acc, false: c.s2 }}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Button
        height={64}
        label={t.goToCar}
        onPress={() => {
          update({ onboarded: true });
          router.replace("/home");
        }}
      />
    </Screen>
  );
}
