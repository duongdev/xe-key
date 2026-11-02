import { router } from "expo-router";
import { CheckIcon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics } from "../theme/haptics";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

export type SelectOption = { key: string; label: string; sample?: string };
type Request = {
  title: string;
  options: SelectOption[];
  value: string;
  note?: string;
  onSelect: (key: string) => void;
};

let pending: Request | null = null;

/**
 * Opens a single-choice setting in the native form sheet (route `/select`, same sheet as the PIN):
 * the check moves at once, the value saves, and the sheet closes 200 ms later. Drag down cancels.
 */
export function selectSheet(req: Request) {
  pending = req;
  router.push("/select");
}

export function SelectPanel() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [req] = useState(() => pending);
  const [value, setValue] = useState(req?.value);
  if (!req) return null;

  const choose = (key: string) => {
    if (key === value) return router.back();
    // haptics: a single-choice step; the select sheet is the shared component that owns it.
    haptics.selection();
    setValue(key);
    req.onSelect(key);
    setTimeout(() => router.back(), 200);
  };

  return (
    <View
      style={{
        backgroundColor: c.s1,
        paddingHorizontal: 16,
        paddingTop: 22,
        paddingBottom: Math.max(insets.bottom, 16) + 4,
        gap: 14,
      }}
    >
      <Text weight={600} accessibilityRole="header" style={{ fontSize: 17, textAlign: "center" }}>
        {req.title}
      </Text>
      <View style={{ backgroundColor: c.s2, borderRadius: radius.card - 4, overflow: "hidden" }}>
        {req.options.map((o, i) => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={[o.label, o.sample].filter(Boolean).join(", ")}
              onPress={() => choose(o.key)}
              style={({ pressed }) => ({
                minHeight: 56,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: c.line,
                backgroundColor: pressed ? c.line : "transparent",
              })}
            >
              <View style={{ flex: 1, gap: 2, paddingVertical: 8 }}>
                <Text weight={on ? 600 : 400} style={{ fontSize: 16 }}>
                  {o.label}
                </Text>
                {o.sample ? (
                  <Text color="fg2" style={{ fontSize: 13 }}>
                    {o.sample}
                  </Text>
                ) : null}
              </View>
              {on ? <CheckIcon size={18} color={c.acc} weight="bold" /> : null}
            </Pressable>
          );
        })}
      </View>
      {req.note ? (
        <Text color="fg2" style={{ fontSize: 13, paddingHorizontal: 4 }}>
          {req.note}
        </Text>
      ) : null}
    </View>
  );
}
