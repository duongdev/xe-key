import { router } from "expo-router";
import { XIcon } from "phosphor-react-native";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "../i18n";
import { useService } from "../services/use-service";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { GlassButton } from "../ui/glass";
import { VisitRow } from "../ui/service-visit";
import { Text } from "../ui/text";

/** Every dealer visit, newest first: form sheet sized to its rows (`historyDetent`), ✕ to close. */
export default function ServiceHistory() {
  const { c } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const visits = useService()?.info.visits ?? [];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.s1 }}
      contentContainerStyle={{ paddingTop: 18, paddingBottom: Math.max(insets.bottom, 16) + 4 }}
    >
      <View
        style={{
          zIndex: 1,
          minHeight: 44,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text weight={700} accessibilityRole="header" style={{ fontSize: 20 }}>
          {t.serviceHistory}
        </Text>
        <GlassButton
          label={t.closeSheet}
          symbol="xmark"
          onPress={() => router.back()}
          style={{ position: "absolute", right: 14 }}
        >
          <XIcon size={18} color={c.fg} />
        </GlassButton>
      </View>
      <View
        style={{
          margin: 16,
          backgroundColor: c.s2,
          borderRadius: radius.card - 4,
          overflow: "hidden",
        }}
      >
        {visits.map((v, i) => (
          <VisitRow key={v.id} visit={v} first={i === 0} />
        ))}
      </View>
    </ScrollView>
  );
}
