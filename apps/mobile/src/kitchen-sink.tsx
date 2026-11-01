import * as Icons from "phosphor-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Car, type CarProps } from "./car/car";
import type { Body } from "./car/geometry";
import { haptics } from "./theme/haptics";
import { pop, settle, useTiming } from "./theme/motion";
import { colors, iconSize, radius, space, type TextVariant } from "./theme/tokens";
import { useTheme } from "./theme/use-theme";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

const ICONS = [
  "LockIcon",
  "LockOpenIcon",
  "PowerIcon",
  "SnowflakeIcon",
  "FanIcon",
  "ThermometerSimpleIcon",
  "GasPumpIcon",
  "RoadHorizonIcon",
  "ClockIcon",
  "TimerIcon",
  "MapPinIcon",
  "NavigationArrowIcon",
  "CrosshairIcon",
  "ArrowsClockwiseIcon",
  "WarningIcon",
  "WarningCircleIcon",
  "InfoIcon",
  "CheckIcon",
  "CheckCircleIcon",
  "XCircleIcon",
  "BellIcon",
  "TrashIcon",
  "WifiSlashIcon",
  "CloudSlashIcon",
  "ShieldCheckIcon",
  "SealCheckIcon",
  "KeyIcon",
  "SteeringWheelIcon",
  "EngineIcon",
  "CarProfileIcon",
  "CarBatteryIcon",
  "GaugeIcon",
  "PathIcon",
  "WrenchIcon",
  "CalendarIcon",
  "CrownIcon",
  "DeviceMobileIcon",
  "ChatTextIcon",
  "PasswordIcon",
  "EyeIcon",
  "GlobeIcon",
  "ScanSmileyIcon",
  "SlidersHorizontalIcon",
  "CaretLeftIcon",
  "CaretRightIcon",
  "CaretDownIcon",
  "ArrowRightIcon",
  "PlusIcon",
  "HandSwipeRightIcon",
  "HardDrivesIcon",
  "SparkleIcon",
  "UserIcon",
  "ShareNetworkIcon",
  "DevicesIcon",
] as const satisfies readonly (keyof typeof Icons)[];

const TYPE: [TextVariant, string, string][] = [
  ["hero", "Hero 64/600", "9:42"],
  ["title", "Title 40/600", "Đã khóa"],
  ["large", "Large 34/600", "Trips"],
  ["stat", "Stat 24/600", "418 km"],
  ["body", "Body 17/400", "Nổ máy & làm mát"],
  ["label", "Label 15/500", "Giữ để mở khóa"],
  ["caption", "Caption 13/400", "Cập nhật 2 phút trước"],
];

const SWATCHES = ["bg", "s1", "s2", "line", "fg", "fg2", "acc", "warn", "error", "danger"] as const;

const GALLERY: [Body, string, string][] = [
  ["crossover", "HR-V", "#6B7078"],
  ["sedan", "Civic RS", "#9E1B22"],
  ["city", "City", "#B8BCC2"],
  ["suv", "CR-V", "#E9E9E6"],
  ["mpv", "BR-V", "#1F2F4A"],
];

const CONTRAST: (CarProps & { title: string })[] = [
  {
    body: "crossover",
    paint: "#E9E9E6",
    ground: "light",
    assist: false,
    title: "White on light · before",
  },
  {
    body: "crossover",
    paint: "#E9E9E6",
    ground: "light",
    assist: true,
    title: "White on light · assist",
  },
  {
    body: "sedan",
    paint: "#15171A",
    ground: "dark",
    assist: false,
    title: "Black on dark · before",
  },
  {
    body: "sedan",
    paint: "#15171A",
    ground: "dark",
    assist: true,
    title: "Black on dark · assist",
  },
];

const STATES: (CarProps & { title: string })[] = [
  { body: "city", title: "Locked · off" },
  { body: "city", doors: "unlocked", title: "Unlocked" },
  { body: "city", engine: true, title: "Engine on" },
  { body: "city", doors: "unlocked", engine: true, title: "Engine on · unlocked" },
];

function CarCard({ title, ...car }: CarProps & { title: string }) {
  const { c, scheme } = useTheme();
  const ground = car.ground ?? scheme;
  const p = colors(ground);
  return (
    <View
      style={{
        backgroundColor: car.ground ? p.bg : c.s1,
        borderRadius: radius.card,
        padding: 12,
        gap: 6,
      }}
    >
      <Car paint="#B8BCC2" {...car} ground={ground} />
      <Text variant="caption" weight={600} style={{ color: p.fg }}>
        {title}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="stat">{title}</Text>
      {children}
    </View>
  );
}

function Palette({ scheme }: { scheme: "dark" | "light" }) {
  const p = colors(scheme);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: p.bg,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: p.line,
        padding: 12,
        gap: 8,
      }}
    >
      <Text variant="caption" weight={600} style={{ color: p.fg }}>
        {scheme === "dark" ? "Dark" : "Light"}
      </Text>
      {SWATCHES.map((k) => (
        <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor: p[k],
              borderWidth: 1,
              borderColor: p.line,
            }}
          />
          <Text variant="caption" style={{ color: p.fg, flex: 1 }}>
            {k}
          </Text>
          <Text variant="caption" style={{ color: p.fg2, fontSize: 11 }}>
            {p[k]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CurveDemo() {
  const { c } = useTheme();
  const timing = useTiming();
  const [on, setOn] = useState(false);
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const sa = useAnimatedStyle(() => ({ transform: [{ translateX: a.value }] }));
  const sb = useAnimatedStyle(() => ({ transform: [{ translateX: b.value }] }));
  const run = () => {
    const to = on ? 0 : 200;
    a.value = withTiming(to, timing(420, settle));
    b.value = withTiming(to, timing(320, pop));
    haptics.selection();
    setOn(!on);
  };
  const dot = { width: 28, height: 28, borderRadius: 14, backgroundColor: c.acc };
  return (
    <View style={{ gap: 10 }}>
      <Text variant="caption" color="fg2">
        Settle (top) · Pop (bottom)
      </Text>
      <Animated.View style={[dot, sa]} />
      <Animated.View style={[dot, sb]} />
      <Button tone="secondary" label="Run curves" onPress={run} />
    </View>
  );
}

export function KitchenSink() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: space.gutter,
        gap: 32,
      }}
    >
      <Text variant="large">Kitchen sink</Text>

      <Section title="Color">
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Palette scheme="dark" />
          <Palette scheme="light" />
        </View>
      </Section>

      <Section title="Type">
        <View style={{ backgroundColor: c.s1, borderRadius: radius.card, paddingHorizontal: 16 }}>
          {TYPE.map(([v, spec, sample], i) => (
            <View
              key={v}
              style={{
                paddingVertical: 10,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: c.line,
                gap: 2,
              }}
            >
              <Text variant="caption" color="fg2">
                {spec}
              </Text>
              <Text variant={v}>{sample}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Icons">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
          {ICONS.map((name) => {
            // biome-ignore lint/performance/noDynamicNamespaceImportAccess: dev-only gallery of every icon the design uses
            const Icon = Icons[name];
            return <Icon key={name} size={iconSize.lg} color={c.fg} />;
          })}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          {Object.values(iconSize).map((s) => (
            <Icons.LockIcon key={s} size={s} color={c.fg2} />
          ))}
          <Icons.CheckCircleIcon size={iconSize.lg} color={c.acc} weight="fill" />
        </View>
      </Section>

      <Section title="Buttons">
        <Button
          label="Start & cool"
          icon={<Icons.PowerIcon size={iconSize.md} color={c.onacc} />}
        />
        <Button
          tone="warn"
          label="Hold to unlock"
          icon={<Icons.LockOpenIcon size={iconSize.md} color={c.onwarn} />}
        />
        <Button
          tone="secondary"
          label="Lock"
          icon={<Icons.LockIcon size={iconSize.md} color={c.fg} />}
        />
        <Button label="Disabled" disabled />
      </Section>

      <Section title="Haptics">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(Object.keys(haptics) as (keyof typeof haptics)[]).map((k) => (
            <Button
              key={k}
              tone="secondary"
              label={k}
              onPress={haptics[k]}
              style={{ minHeight: 44 }}
            />
          ))}
        </View>
      </Section>

      <Section title="Car">
        {GALLERY.map(([body, name, paint]) => (
          <View key={body} style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <CarCard body={body} paint={paint} title={`${name} · shaded`} />
            </View>
            <View style={{ flex: 1 }}>
              <CarCard body={body} look="line" paint={c.acc} title={`${name} · line`} />
            </View>
          </View>
        ))}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CONTRAST.map((x) => (
            <View key={x.title} style={{ width: "48.5%" }}>
              <CarCard {...x} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {STATES.map((x) => (
            <View key={x.title} style={{ width: "48.5%" }}>
              <CarCard {...x} />
            </View>
          ))}
        </View>
      </Section>

      <Section title="Motion">
        <CurveDemo />
      </Section>
    </ScrollView>
  );
}
