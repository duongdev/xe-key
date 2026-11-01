import { router } from "expo-router";
import { ArrowsClockwiseIcon, ChatTextIcon, KeyIcon, WarningIcon } from "phosphor-react-native";
import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { maskPhone } from "../../onboarding/phone";
import { useOnboarding } from "../../onboarding/session";
import { StepHeader } from "../../onboarding/step-header";
import { mockAuth } from "../../services/auth";
import { iconSize, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Chip } from "../../ui/chip";
import { LogoTile } from "../../ui/logo";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";
import { TextButton } from "../../ui/text-button";

function MoveArt() {
  const { c } = useTheme();
  const t = useT();
  const font = "BeVietnamPro_400Regular";
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t.deviceArt}>
      <Svg width={300} height={230} viewBox="0 0 300 230">
        <Rect
          x={20}
          y={30}
          width={96}
          height={176}
          rx={20}
          fill={c.s1}
          stroke={c.line}
          strokeWidth={2}
        />
        <Rect x={34} y={54} width={68} height={40} rx={8} fill={c.s2} />
        <Rect x={34} y={102} width={44} height={8} rx={4} fill={c.s2} />
        <Rect x={34} y={118} width={58} height={8} rx={4} fill={c.s2} />
        <Circle
          cx={68}
          cy={166}
          r={14}
          fill="none"
          stroke={c.fg2}
          strokeOpacity={0.6}
          strokeWidth={2}
        />
        <Line
          x1={62}
          y1={160}
          x2={74}
          y2={172}
          stroke={c.fg2}
          strokeOpacity={0.6}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Line
          x1={74}
          y1={160}
          x2={62}
          y2={172}
          stroke={c.fg2}
          strokeOpacity={0.6}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <SvgText x={68} y={226} fill={c.fg2} fontSize={12} textAnchor="middle" fontFamily={font}>
          {t.officialApp}
        </SvgText>
        <Line
          x1={120}
          y1={115}
          x2={180}
          y2={115}
          stroke={c.acc}
          strokeOpacity={0.45}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
        <Circle cx={150} cy={115} r={17} fill={c.bg} stroke={c.acc} strokeWidth={2} />
        <Rect
          x={184}
          y={20}
          width={104}
          height={190}
          rx={22}
          fill={c.s1}
          stroke={c.acc}
          strokeWidth={2}
        />
        <Rect x={200} y={122} width={72} height={10} rx={5} fill={c.s2} />
        <Rect x={200} y={140} width={52} height={10} rx={5} fill={c.s2} />
        <Rect x={200} y={170} width={72} height={22} rx={11} fill={c.acc} />
        <SvgText x={236} y={226} fill={c.fg} fontSize={12} textAnchor="middle" fontFamily={font}>
          {t.thisIphone}
        </SvgText>
      </Svg>
      <View style={{ position: "absolute", left: 140, top: 105 }}>
        <KeyIcon size={20} color={c.acc} />
      </View>
      <View style={{ position: "absolute", left: 208, top: 50 }}>
        <LogoTile size={56} />
      </View>
    </View>
  );
}

export default function Device() {
  const { c } = useTheme();
  const t = useT();
  const { phone } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const masked = maskPhone(phone ?? "");

  return (
    <Screen>
      <StepHeader step="device" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <MoveArt />
      </View>
      <Text style={{ ...textStyle("large"), marginBottom: 10 }}>{t.deviceTitle}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <WarningIcon size={iconSize.sm} color={c.warn} />
        <Text variant="label" weight={400} color="warn">
          {t.deviceWarn}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
        <Chip small label={t.switchBack} icon={<ArrowsClockwiseIcon size={16} color={c.fg2} />} />
        <Chip small label={t.smsCode} icon={<ChatTextIcon size={16} color={c.fg2} />} />
      </View>
      <Button
        height={64}
        tone="neutral"
        label={t.sendCodeTo(masked)}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await mockAuth.sendCode();
          setBusy(false);
          router.push(`/onboarding/${next("device")}`);
        }}
      />
      <TextButton
        label={t.notNow}
        style={{ marginTop: 6 }}
        onPress={() => router.dismissTo("/onboarding/welcome")}
      />
    </Screen>
  );
}
