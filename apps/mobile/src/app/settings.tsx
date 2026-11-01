import { useQueryClient } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import {
  CaretRightIcon,
  CarProfileIcon,
  ChatTextIcon,
  ClockIcon,
  CodeIcon,
  CrownIcon,
  GlobeIcon,
  HardDrivesIcon,
  ScanSmileyIcon,
  SignOutIcon,
  SquaresFourIcon,
} from "phosphor-react-native";
import type { ReactNode } from "react";
import { Alert, Pressable, ScrollView, Switch, View } from "react-native";
import { useT } from "../i18n";
import { type Prefs, usePrefs } from "../prefs";
import { useCar } from "../services/query";
import { haptics } from "../theme/haptics";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { PageHeader } from "../ui/page-header";
import { pick } from "../ui/pick";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";

type Tint = "acc" | "warn" | "fg2";

type RowProps = {
  icon: typeof GlobeIcon;
  tint: Tint;
  label: string;
  value?: string;
  valueTone?: "acc" | "fg2" | "warn";
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
};

function Row({
  icon: Icon,
  tint,
  label,
  value,
  valueTone = "fg2",
  onPress,
  right,
  danger,
}: RowProps) {
  const { c } = useTheme();
  const content = (
    <View style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: tint === "fg2" ? c.s2 : `${c[tint]}24`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={danger ? c.danger : tint === "fg2" ? c.fg : c[tint]} />
      </View>
      <Text variant="label" weight={600} style={{ flex: 1, color: danger ? c.danger : c.fg }}>
        {label}
      </Text>
      {value ? (
        <Text variant="label" weight={400} color={valueTone}>
          {value}
        </Text>
      ) : null}
      {right ? (
        // Native Switch draws at the top of its box; a fixed-height wrapper keeps it centred.
        <View style={{ height: 31, justifyContent: "center" }}>{right}</View>
      ) : onPress ? (
        <CaretRightIcon size={14} color={c.fg2} />
      ) : null}
    </View>
  );
  if (!onPress)
    return (
      <View accessible accessibilityLabel={value ? `${label}: ${value}` : label}>
        {content}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {content}
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: ReactNode[] }) {
  const { c } = useTheme();
  const rows = children.filter(Boolean);
  return (
    <View style={{ gap: 6 }}>
      <Text
        variant="caption"
        weight={600}
        color="fg2"
        accessibilityRole="header"
        style={{ paddingHorizontal: 4 }}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: c.s1, borderRadius: radius.card - 2, paddingHorizontal: 14 }}>
        {rows.map((row, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static rows, order never changes
          <View key={i} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: c.s2 }}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Settings() {
  const { c } = useTheme();
  const t = useT();
  const qc = useQueryClient();
  const { prefs, update } = usePrefs();
  const { data: car } = useCar();

  const toggle = (key: "faceId" | "siri") => (
    <Switch
      accessibilityLabel={key === "faceId" ? t.faceIdSetting : t.siri}
      value={prefs[key]}
      trackColor={{ true: c.acc, false: c.s2 }}
      onValueChange={async (on) => {
        haptics.selection();
        if (key === "faceId" && on) {
          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: t.faceIdPrompt,
            disableDeviceFallback: true,
          });
          update({ faceId: res.success });
          return;
        }
        update({ [key]: on } as Partial<Prefs>);
      }}
    />
  );

  const signOut = () =>
    Alert.alert(t.signOutConfirm, t.signOutBody, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
        style: "destructive",
        onPress: () => {
          // ponytail: mock auth has no session yet; the live adapter also clears the Keychain (ADR 0004/0005).
          qc.clear();
          update({ onboarded: false, region: null, carName: null, faceId: false });
          router.dismissAll();
          router.replace("/onboarding/welcome");
        },
      },
    ]);

  return (
    <Screen>
      <PageHeader title={t.settings} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 18, paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Group title={t.vehicle}>
          {[
            <Row
              key="car"
              icon={CarProfileIcon}
              tint="acc"
              label={prefs.carName ?? car?.model ?? ""}
              value={car?.plate}
              onPress={() =>
                Alert.prompt(
                  t.rename,
                  undefined,
                  (v) => update({ carName: v.trim() || null }),
                  "plain-text",
                  prefs.carName ?? car?.model,
                )
              }
            />,
          ]}
        </Group>
        <Group title={t.package}>
          {[
            <Row
              key="pkg"
              icon={CrownIcon}
              tint="warn"
              label="Honda CONNECT"
              value={car?.account === "expired" ? t.expiredTitle : t.active}
              valueTone={car?.account === "expired" ? "warn" : "acc"}
            />,
          ]}
        </Group>
        <Group title={t.safety}>
          {[
            <Row
              key="faceid"
              icon={ScanSmileyIcon}
              tint="acc"
              label={t.faceIdSetting}
              right={toggle("faceId")}
            />,
          ]}
        </Group>
        <Group title={t.app}>
          {[
            <Row key="siri" icon={ChatTextIcon} tint="fg2" label={t.siri} right={toggle("siri")} />,
            <Row
              key="lang"
              icon={GlobeIcon}
              tint="fg2"
              label={t.language}
              value={t.languages[prefs.language]}
              onPress={() =>
                pick(t.language, t.languages, t.cancel, (language) => update({ language }))
              }
            />,
            <Row
              key="format"
              icon={ClockIcon}
              tint="fg2"
              label={t.timeFormat}
              value={t.formats[prefs.format]}
              onPress={() =>
                pick(t.timeFormat, t.formats, t.cancel, (format) => update({ format }))
              }
            />,
          ]}
        </Group>
        <Group title={t.account}>
          {[
            <Row
              key="out"
              icon={SignOutIcon}
              tint="fg2"
              label={t.signOut}
              danger
              onPress={signOut}
            />,
          ]}
        </Group>
        {__DEV__ ? (
          <Group title={t.developer}>
            {[
              <Row
                key="svc"
                icon={HardDrivesIcon}
                tint="fg2"
                label={t.carService}
                value={t.mock}
                onPress={() => Alert.alert(t.liveService, t.liveNotReady)}
              />,
              <Row
                key="sink"
                icon={SquaresFourIcon}
                tint="fg2"
                label={t.kitchenSink}
                onPress={() => router.push("/dev")}
              />,
              <Row
                key="onb"
                icon={CodeIcon}
                tint="fg2"
                label={t.restartOnboarding}
                onPress={() => {
                  update({ onboarded: false });
                  router.dismissAll();
                  router.replace("/onboarding/welcome");
                }}
              />,
            ]}
          </Group>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
