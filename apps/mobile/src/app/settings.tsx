import { useQuery } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import { getCalendars, getLocales } from "expo-localization";
import { router } from "expo-router";
import {
  CaretRightIcon,
  CarProfileIcon,
  ChatTextIcon,
  ClockIcon,
  CodeIcon,
  CrownIcon,
  GasPumpIcon,
  GlobeIcon,
  HardDrivesIcon,
  LockKeyIcon,
  ScanSmileyIcon,
  SignOutIcon,
  SquaresFourIcon,
} from "phosphor-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, View } from "react-native";
import { fuelAverage } from "../car/behaviour";
import { useLang, useT } from "../i18n";
import { formatTime } from "../i18n/format";
import { formatFuel } from "../i18n/fuel";
import { type Prefs, usePrefs } from "../prefs";
import { resetLiveCar } from "../services/live-car";
import { carService, useCar, wipeCache } from "../services/query";
import { hondaPin, password, secret } from "../services/secret";
import { forgetPin } from "../services/trip-pin";
import { useAuth } from "../services/use-auth";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { PageHeader } from "../ui/page-header";
import { askPin } from "../ui/pin-sheet";
import { Screen, useBottomPad } from "../ui/screen";
import { selectSheet } from "../ui/select-sheet";
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
  const bottomPad = useBottomPad();
  const { c } = useTheme();
  const t = useT();
  const { prefs, update } = usePrefs();
  const { data: car } = useCar();
  const auth = useAuth();
  const lang = useLang();
  // Samples in the select sheets show the user's own values.
  const deviceVi = getLocales()[0]?.languageCode === "vi";
  const deviceClock = getCalendars()[0]?.uses24hourClock === false ? "12h" : "24h";
  // The System label already says "Follows iPhone" in VI ("Theo iPhone"); don't repeat it there.
  const systemSample = (v: string) =>
    t.languages.system === t.followsPhone ? v : `${t.followsPhone} · ${v}`;
  // Same query as Trips (cached there); only read for the Fuel use sample.
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => carService.summary() }).data;
  const myKmPerL = summary ? fuelAverage(summary.day, new Date()).kmPerL : null;
  const [deviceId, setDeviceId] = useState<string | null>(null);
  useEffect(() => {
    if (__DEV__) secret.get("deviceId").then(setDeviceId);
  }, []);

  const toggle = (key: "faceId" | "siri") => (
    <Switch
      accessibilityLabel={key === "faceId" ? t.faceIdSetting : t.siri}
      value={prefs[key]}
      trackColor={{ true: c.acc, false: c.s2 }}
      onValueChange={async (on) => {
        // The setting also puts the stored Honda password behind Face ID (ADR 0005).
        if (key === "faceId" && on) {
          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: t.faceIdPrompt,
            disableDeviceFallback: true,
          });
          if (!res.success) return;
          await password
            .protect(true)
            .catch((e: unknown) => console.warn("face id: lock failed", e));
          update({ faceId: true });
          return;
        }
        if (key === "faceId") {
          // Reading the guarded password asks Face ID: only the owner can turn this off.
          try {
            await password.protect(false);
            update({ faceId: false });
          } catch {
            // Face ID cancelled: the setting stays on.
          }
          return;
        }
        update({ [key]: on } as Partial<Prefs>);
      }}
    />
  );

  const [pinSaved, setPinSaved] = useState(false);
  useEffect(() => {
    hondaPin.saved().then(setPinSaved);
  }, []);

  const signOut = () =>
    Alert.alert(t.signOutConfirm, t.signOutBody, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
        style: "destructive",
        onPress: async () => {
          await auth.signOut();
          resetLiveCar();
          void forgetPin();
          wipeCache();
          update({ onboarded: false, region: null, carName: null, faceId: false });
          router.dismissAll();
          router.replace("/onboarding/welcome");
        },
      },
    ]);

  return (
    <Screen scroll>
      <PageHeader title={t.settings} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 18, paddingTop: 8, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* No car loaded (signed out, first launch): nothing to show for vehicle or package. */}
        {car ? (
          <>
            <Group title={t.vehicle}>
              {[
                <Row
                  key="car"
                  icon={CarProfileIcon}
                  tint="acc"
                  label={prefs.carName ?? car?.model ?? ""}
                  value={car?.plate ?? undefined}
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
          </>
        ) : null}
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
        <Group title={t.hondaPin}>
          {[
            <Row
              key="pin-faceid"
              icon={ScanSmileyIcon}
              tint="acc"
              label={t.pinRemember}
              right={
                <View style={{ height: 31 }}>
                  <Switch
                    accessibilityLabel={t.pinRemember}
                    value={pinSaved}
                    trackColor={{ true: c.acc, false: c.s2 }}
                    onValueChange={async (on) => {
                      // On needs the PIN once: the sheet stores it behind Face ID.
                      if (on)
                        return askPin({ remember: true }, async () =>
                          setPinSaved(await hondaPin.saved()),
                        );
                      await hondaPin.del();
                      setPinSaved(false);
                    }}
                  />
                </View>
              }
            />,
            <Row
              key="pin-forget"
              icon={LockKeyIcon}
              tint="fg2"
              label={t.forgetPin}
              onPress={() =>
                Alert.alert(t.forgetPinConfirm, t.forgetPinBody, [
                  { text: t.cancel, style: "cancel" },
                  {
                    text: t.forgetPin,
                    style: "destructive",
                    onPress: async () => {
                      await forgetPin();
                      setPinSaved(false);
                    },
                  },
                ])
              }
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
                selectSheet({
                  title: t.language,
                  value: prefs.language,
                  // Each language named in itself; System shows what it follows now.
                  options: [
                    {
                      key: "system",
                      label: t.languages.system,
                      sample: systemSample(deviceVi ? "Tiếng Việt" : "English"),
                    },
                    { key: "en", label: "English" },
                    { key: "vi", label: "Tiếng Việt" },
                  ],
                  onSelect: (k) => update({ language: k as Prefs["language"] }),
                })
              }
            />,
            <Row
              key="fuel"
              icon={GasPumpIcon}
              tint="fg2"
              label={t.fuelUse}
              value={t.fuelUnits[prefs.fuel]}
              onPress={() =>
                selectSheet({
                  title: t.fuelUse,
                  value: prefs.fuel,
                  note: t.fuelUseNote,
                  options: (["kml", "l100"] as const).map((k) => {
                    const f = formatFuel(myKmPerL, k, lang);
                    const own = f ? `${f.value} ${f.unit}` : null;
                    return {
                      key: k,
                      label: t.fuelUnits[k],
                      sample:
                        k === "kml"
                          ? [own, t.hondasUnit].filter(Boolean).join(" · ")
                          : (own ?? undefined),
                    };
                  }),
                  onSelect: (k) => update({ fuel: k as Prefs["fuel"] }),
                })
              }
            />,
            <Row
              key="format"
              icon={ClockIcon}
              tint="fg2"
              label={t.timeFormat}
              value={t.formats[prefs.format]}
              onPress={() => {
                const now = Date.now();
                selectSheet({
                  title: t.timeFormat,
                  value: prefs.format,
                  options: [
                    {
                      key: "system",
                      label: t.formats.system,
                      sample: systemSample(formatTime(now, deviceClock, lang)),
                    },
                    { key: "24h", label: t.formats["24h"], sample: formatTime(now, "24h", lang) },
                    { key: "12h", label: t.formats["12h"], sample: formatTime(now, "12h", lang) },
                  ],
                  onSelect: (k) => update({ format: k as Prefs["format"] }),
                });
              }}
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
                value={prefs.honda === "live" ? t.liveService : t.mock}
                onPress={() => {
                  const honda = prefs.honda === "live" ? "mock" : "live";
                  update({ honda });
                  if (honda === "live") Alert.alert(t.liveService, t.liveNotReady);
                }}
              />,
              <Row
                key="device"
                icon={HardDrivesIcon}
                tint="fg2"
                label={t.deviceIdDev}
                value={deviceId ? `${deviceId.slice(0, 8)}…` : "-"}
                onPress={() =>
                  Alert.prompt(
                    t.deviceIdDev,
                    t.deviceIdHint,
                    async (v) => {
                      const id = v.trim();
                      await (id ? secret.set("deviceId", id) : secret.del("deviceId"));
                      setDeviceId(id || null);
                    },
                    "plain-text",
                    deviceId ?? "",
                  )
                }
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
