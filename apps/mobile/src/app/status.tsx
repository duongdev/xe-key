import {
  CarBatteryIcon,
  CaretRightIcon,
  CheckIcon,
  ClockIcon,
  EngineIcon,
  GasPumpIcon,
  GaugeIcon,
  LockIcon,
  LockOpenIcon,
  WarningIcon,
  WrenchIcon,
} from "phosphor-react-native";
import { Alert, Pressable, ScrollView, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { engineState, clock as formatClock } from "../car/engine";
import { freshness } from "../car/freshness";
import { bodyParts, type Row, type Side } from "../car/status";
import { useLang, useT } from "../i18n";
import { useCar } from "../services/query";
import { iconSize, radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { PageHeader, Pill } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";

/** Door/window strip per side in the 140×280 top-down drawing. */
const STRIPS: Record<Side, string> = {
  fl: "M20 106 L20 148",
  rl: "M20 152 L20 194",
  fr: "M120 106 L120 148",
  rr: "M120 152 L120 194",
};

function TopDown({
  sides,
  locked,
  label,
}: {
  sides: Record<Side, "ok" | "warn" | "open">;
  locked: boolean;
  label: string;
}) {
  const { c } = useTheme();
  const wheel = c.s2;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={132} height={264} viewBox="0 0 140 280">
        <Rect x={12} y={44} width={10} height={34} rx={4} fill={wheel} />
        <Rect x={118} y={44} width={10} height={34} rx={4} fill={wheel} />
        <Rect x={12} y={198} width={10} height={34} rx={4} fill={wheel} />
        <Rect x={118} y={198} width={10} height={34} rx={4} fill={wheel} />
        <Rect
          x={20}
          y={10}
          width={100}
          height={260}
          rx={42}
          fill={c.s1}
          stroke={c.line}
          strokeWidth={2}
        />
        <Path d="M30 70 C44 50 96 50 110 70" fill="none" stroke={c.line} strokeWidth={2} />
        <Path d="M34 80 L106 80 L98 110 L42 110 Z" fill={c.s2} />
        <Path d="M42 190 L98 190 L104 214 L36 214 Z" fill={c.s2} />
        <Path d="M30 222 C44 246 96 246 110 222" fill="none" stroke={c.line} strokeWidth={2} />
        <Rect x={6} y={90} width={12} height={7} rx={3} fill={c.line} />
        <Rect x={122} y={90} width={12} height={7} rx={3} fill={c.line} />
        {(Object.keys(STRIPS) as Side[]).map((s) => (
          <Path
            key={s}
            d={STRIPS[s]}
            stroke={sides[s] === "ok" ? c.acc : c.warn}
            strokeWidth={sides[s] === "ok" ? 4 : 5}
            strokeLinecap="round"
            strokeDasharray={sides[s] === "open" ? "6 5" : undefined}
          />
        ))}
        <Circle cx={70} cy={150} r={17} fill={c.bg} />
      </Svg>
      <View style={{ position: "absolute", left: 66 - 9, top: 141 - 9, width: 18, height: 18 }}>
        {locked ? <LockIcon size={18} color={c.fg} /> : <LockOpenIcon size={18} color={c.warn} />}
      </View>
    </View>
  );
}

export default function Status() {
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const now = useNow();
  const { data: car } = useCar();
  if (!car)
    return (
      <Screen>
        <PageHeader title={t.status} />
      </Screen>
    );

  const locked = car.doors === "locked";
  const parts = bodyParts({ ...car.body, doorsLocked: locked });
  const age = freshness(car.updatedAt, now);
  const ageText =
    age.unit === "live" ? t.live : age.unit === "m" ? t.minShort(age.n) : t.age(age.n, age.unit);
  const engine = engineState(car.engine, now);
  const num = (n: number) => n.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");

  const rowText = (r: Row): { title: string; value: string } => {
    const v = r.value;
    const title = { doors: t.doors, windows: t.window, trunk: t.trunk, hood: t.hood }[r.part];
    switch (v.kind) {
      case "locked":
        return { title, value: t.locked };
      case "unlocked":
        return { title, value: t.unlocked };
      case "closed":
        return { title, value: t.closed };
      case "open":
        return {
          title,
          value: v.sides?.length
            ? t.doorsOpenAt(v.sides.map((s) => t.sideNames[s]).join(", "))
            : t.open,
        };
      case "window":
        return { title, value: t.windowOpen(t.sideNames[v.side], v.cm) };
      case "windows":
        return { title: t.windows, value: t.windowsOpen(v.count) };
    }
  };
  const rowIcon = (r: Row, color: string) => {
    if (r.tone === "warn") return <WarningIcon size={16} color={color} />;
    if (r.part === "doors") return <LockIcon size={16} color={color} />;
    return <CheckIcon size={16} color={color} />;
  };
  const summary = parts.rows.map((r) => `${rowText(r).title}: ${rowText(r).value}`).join(", ");

  const tiles = [
    {
      key: "engine",
      icon: EngineIcon,
      label: t.engine,
      value: engine.running ? formatClock(engine.left) : t.off,
    },
    {
      key: "fuel",
      icon: GasPumpIcon,
      label: t.fuelLabel,
      value: `${car.fuelPct}% · ${num(car.rangeKm)} km`,
      bar: car.fuelPct,
    },
    {
      key: "12v",
      icon: CarBatteryIcon,
      label: t.battery12v,
      value: `${car.batteryV.toFixed(1)} V`,
    },
    { key: "odo", icon: GaugeIcon, label: t.odometer, value: `${num(car.odometerKm)} km` },
  ];

  return (
    <Screen>
      <PageHeader
        title={t.status}
        right={<Pill icon={<ClockIcon size={14} color={c.fg2} />} text={ageText} />}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 20, paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {car.serviceInKm <= 2000 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert(t.serviceIn(num(car.serviceInKm)))}
            style={({ pressed }) => ({
              minHeight: 52,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: `${c.warn}1F`,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <WrenchIcon size={iconSize.sm} color={c.warn} />
            <Text variant="label" weight={600} color="warn" style={{ flex: 1 }}>
              {t.serviceIn(num(car.serviceInKm))}
            </Text>
            <CaretRightIcon size={16} color={c.warn} />
          </Pressable>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
          <TopDown sides={parts.sides} locked={locked} label={`${t.carFromAbove}: ${summary}`} />
          <View style={{ flex: 1, gap: 18 }}>
            {parts.rows.map((r) => {
              const color = r.tone === "warn" ? c.warn : c.acc;
              const { title, value } = rowText(r);
              return (
                <View key={r.part} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: `${color}24`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {rowIcon(r, color)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight={600}>
                      {title}
                    </Text>
                    <Text variant="caption" style={{ color }}>
                      {value}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {tiles.map(({ key, icon: Icon, label, value, bar }) => (
            <View
              key={key}
              accessible
              accessibilityLabel={`${label}: ${value}`}
              style={{
                width: "48.5%",
                padding: 14,
                borderRadius: radius.card - 2,
                backgroundColor: c.s1,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon size={16} color={c.fg2} />
                <Text variant="caption" color="fg2">
                  {label}
                </Text>
              </View>
              <Text
                variant="stat"
                style={{ fontSize: 20, lineHeight: 26 }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value}
              </Text>
              {bar !== undefined ? (
                <View style={{ height: 6, borderRadius: 3, backgroundColor: c.s2 }}>
                  <View
                    style={{ width: `${bar}%`, height: 6, borderRadius: 3, backgroundColor: c.acc }}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
