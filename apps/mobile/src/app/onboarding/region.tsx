import { getLocales } from "expo-localization";
import { router } from "expo-router";
import { CheckIcon, SealCheckIcon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { REGIONS, type RegionId, regionFromCountry } from "../../onboarding/region";
import { StepHeader } from "../../onboarding/step-header";
import { usePrefs } from "../../prefs";
import { haptics } from "../../theme/haptics";
import { iconSize, radius, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";

export default function Region() {
  const { c } = useTheme();
  const t = useT();
  const { prefs, update } = usePrefs();
  const [picked, setPicked] = useState<RegionId>(
    prefs.region ?? regionFromCountry(getLocales()[0]?.regionCode),
  );

  return (
    <Screen>
      <StepHeader step="region" />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={{ ...textStyle("large"), marginTop: 28, marginBottom: 8 }}>
          {t.regionTitle}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <SealCheckIcon size={iconSize.sm} color={c.fg2} />
          <Text variant="label" weight={400} color="fg2">
            {t.regionHint}
          </Text>
        </View>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t.region}
          style={{ backgroundColor: c.s1, borderRadius: radius.card, paddingHorizontal: 16 }}
        >
          {REGIONS.map((r, i) => {
            const on = r.id === picked;
            return (
              <Pressable
                key={r.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={r.name}
                onPress={() => {
                  if (on) return;
                  // haptics: radio list step; no shared list component (HANDOFF › Haptics).
                  haptics.selection();
                  setPicked(r.id);
                }}
                style={{
                  minHeight: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: c.s2,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: on ? c.acc : c.s2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    weight={700}
                    color={on ? "onacc" : "fg2"}
                    style={{ fontSize: 11, lineHeight: 14, letterSpacing: 0.44 }}
                  >
                    {r.iso}
                  </Text>
                </View>
                <Text weight={on ? 600 : 400} style={{ flex: 1, fontSize: 16 }}>
                  {r.name}
                </Text>
                {on ? <CheckIcon size={20} color={c.acc} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Button
        height={64}
        tone="neutral"
        label={t.continue}
        style={{ marginTop: 16 }}
        onPress={() => {
          update({ region: picked });
          router.push(`/onboarding/${next("region")}`);
        }}
      />
      <Text
        variant="caption"
        color="fg2"
        style={{ marginTop: 12, fontSize: 12, textAlign: "center" }}
      >
        {t.regionAuto}
      </Text>
    </Screen>
  );
}
