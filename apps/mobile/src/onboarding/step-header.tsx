import { router } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import { View } from "react-native";
import { useT } from "../i18n";
import { iconSize } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { GlassButton } from "../ui/glass";
import { progress, type Step } from "./flow";

const SEGMENTS = [1, 2, 3, 4];

/** Back button + 4-part progress bar used by the account steps. */
export function StepHeader({ step, canGoBack = true }: { step: Step; canGoBack?: boolean }) {
  const { c } = useTheme();
  const t = useT();
  const filled = progress(step);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {canGoBack ? (
        <GlassButton
          label={t.back}
          symbol="chevron.left"
          onPress={() => router.back()}
          style={{ marginLeft: -4 }}
        >
          <CaretLeftIcon size={iconSize.md} color={c.fg} />
        </GlassButton>
      ) : (
        <View style={{ width: 40, height: 44 }} />
      )}
      <View
        accessible
        accessibilityLabel={t.stepOf(filled, SEGMENTS.length)}
        style={{ flex: 1, flexDirection: "row", gap: 6 }}
      >
        {SEGMENTS.map((n) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: n <= filled ? c.acc : c.s2,
            }}
          />
        ))}
      </View>
      <View style={{ width: 34 }} />
    </View>
  );
}
