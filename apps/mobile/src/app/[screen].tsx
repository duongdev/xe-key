import { router, useLocalSearchParams } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";
import { useT } from "../i18n";
import { iconSize, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";

// ponytail: one stub for screens tasks 006/008 build (engine, find, status, trips, alerts, settings).
export default function Stub() {
  const { c } = useTheme();
  const t = useT();
  const { screen } = useLocalSearchParams<{ screen: string }>();
  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.back}
        onPress={() => router.back()}
        style={{ width: 44, height: 44, justifyContent: "center", marginLeft: -10 }}
      >
        <CaretLeftIcon size={iconSize.md} color={c.fg} />
      </Pressable>
      <View style={{ flex: 1, justifyContent: "center", gap: 8 }}>
        <Text style={{ ...textStyle("large"), textTransform: "capitalize" }}>{screen}</Text>
        <Text color="fg2">{t.comingSoon}</Text>
      </View>
    </Screen>
  );
}
