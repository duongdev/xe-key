import { router } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import { useState } from "react";
import { View } from "react-native";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { type CarLook, usePrefs } from "../../prefs";
import { iconSize, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { CarLookEditor } from "../../ui/car-look-editor";
import { GlassButton } from "../../ui/glass";
import { Glow } from "../../ui/glow";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";
import { TextButton } from "../../ui/text-button";

export default function Style() {
  const { c } = useTheme();
  const t = useT();
  const { prefs, update } = usePrefs();
  const [look, setLook] = useState<CarLook>(prefs.car);
  const done = (save: boolean) => {
    if (save) update({ car: look });
    router.push(`/onboarding/${next("style")}`);
  };

  return (
    <Screen>
      <Glow color={c.fg} opacity={0.09} style={{ left: -80, right: -80, top: 120, height: 300 }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        <GlassButton
          label={t.back}
          symbol="chevron.left"
          onPress={() => router.back()}
          style={{ marginLeft: -4 }}
        >
          <CaretLeftIcon size={iconSize.md} color={c.fg} />
        </GlassButton>
        <TextButton label={t.skip} onPress={() => done(false)} />
      </View>
      <Text style={{ ...textStyle("large"), fontSize: 30, lineHeight: 36, marginTop: 8 }}>
        {t.styleTitle}
      </Text>

      <CarLookEditor value={look} onChange={setLook} />

      <View style={{ flex: 1 }} />
      <Button height={64} tone="neutral" label={t.looksRight} onPress={() => done(true)} />
    </Screen>
  );
}
