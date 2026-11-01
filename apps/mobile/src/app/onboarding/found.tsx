import { Redirect, router } from "expo-router";
import { ClockIcon, SealCheckIcon, WifiHighIcon } from "phosphor-react-native";
import { Alert, View } from "react-native";
import { Car } from "../../car/car";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { useOnboarding } from "../../onboarding/session";
import { StepHeader } from "../../onboarding/step-header";
import { usePrefs } from "../../prefs";
import { iconSize } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Glow } from "../../ui/glow";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";
import { TextButton } from "../../ui/text-button";

export default function Found() {
  const { c, scheme } = useTheme();
  const t = useT();
  const { car } = useOnboarding();
  const { prefs, update } = usePrefs();
  if (!car) return <Redirect href="/onboarding/welcome" />;

  const name = prefs.carName ?? car.model;
  const minutes = Math.max(1, Math.round((Date.now() - car.updatedAt) / 60_000));
  const tile = {
    flex: 1,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: c.s1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  } as const;

  return (
    <Screen>
      <Glow color={c.fg} opacity={0.1} style={{ left: -80, right: -80, top: 150, height: 360 }} />
      <StepHeader step="found" canGoBack={false} />
      <View style={{ marginTop: 36, alignItems: "center", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <SealCheckIcon size={iconSize.sm} color={c.acc} />
          <Text variant="caption" weight={600} color="acc" style={{ letterSpacing: 1.04 }}>
            {t.found}
          </Text>
        </View>
        <Text variant="title">{name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: car.paint,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,.25)",
            }}
          />
          <Text variant="label" weight={400} color="fg2">
            {car.paintName}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 28, marginHorizontal: -16 }}>
        <Car body={car.body} paint={car.paint} ground={scheme} />
      </View>

      <View style={{ marginTop: 8, alignItems: "center" }}>
        <View
          style={{
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 6,
            backgroundColor: "#F2F2F0",
            borderWidth: 2,
            borderColor: "#111111",
          }}
        >
          <Text
            weight={700}
            style={{ fontSize: 20, lineHeight: 24, letterSpacing: 1.2, color: "#111111" }}
          >
            {car.plate}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={tile}>
          <WifiHighIcon size={iconSize.sm} color={car.connectActive ? c.acc : c.fg2} />
          <Text variant="caption" style={{ fontSize: 14 }}>
            {t.connectActive}
          </Text>
        </View>
        <View style={tile}>
          <ClockIcon size={iconSize.sm} color={c.fg2} />
          <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
            {t.minAgo(minutes)}
          </Text>
        </View>
      </View>
      <Button
        height={64}
        tone="neutral"
        label={t.thatsMyCar}
        style={{ marginTop: 16 }}
        onPress={() => {
          update({ car: { ...prefs.car, body: car.body, paint: car.paint } });
          router.push(`/onboarding/${next("found")}`);
        }}
      />
      <TextButton
        label={t.rename}
        style={{ marginTop: 6 }}
        onPress={() =>
          Alert.prompt(
            t.rename,
            undefined,
            (v) => update({ carName: v.trim() || null }),
            "plain-text",
            name,
          )
        }
      />
    </Screen>
  );
}
