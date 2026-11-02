import { router, useLocalSearchParams } from "expo-router";
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
import { useEffect } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { engineState, clock as formatClock } from "../car/engine";
import { freshness } from "../car/freshness";
import { bodyParts, type Row, type Side } from "../car/status";
import { useLang, useT } from "../i18n";
import { useFormatTime } from "../i18n/format";
import { useCar } from "../services/query";
import { useService } from "../services/use-service";
import { iconSize, radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { PageHeader, Pill } from "../ui/page-header";
import { Screen, useBottomPad } from "../ui/screen";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";
import { usePullRefresh } from "../ui/use-pull-refresh";

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
  const bottomPad = useBottomPad();
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const now = useNow();
  const { data: car, refetch, isFetching, dataUpdatedAt } = useCar();
  const time = useFormatTime();
  const pull = usePullRefresh(refetch);
  const svc = useService();
  // Home's service banner opens Status with the sheet on top.
  const { service: openService } = useLocalSearchParams<{ service?: string }>();
  useEffect(() => {
    if (!openService) return;
    router.setParams({ service: undefined });
    router.push("/service");
  }, [openService]);
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
  const day = (ms: number) =>
    new Date(ms).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
      day: "numeric",
      month: "short",
    });

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

  const odo = svc?.odo;
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
    car.batteryV !== null && {
      key: "12v",
      icon: CarBatteryIcon,
      label: t.battery12v,
      value: `${car.batteryV.toFixed(1)} V`,
    },
    odo && {
      key: "odo",
      icon: GaugeIcon,
      label: t.odometer,
      value: `≈ ${num(odo.km)} km`,
      sub: t.estimated,
      onPress: () => Alert.alert(t.odometer, t.odoSource(num(odo.from.km), day(odo.from.date))),
    },
    svc?.level && serviceTile(svc.info, svc.level),
  ].filter((x) => !!x);

  function serviceTile(s: NonNullable<typeof svc>["info"], level: string) {
    const due = s.dueDate === null ? "" : day(s.dueDate);
    const overdue = level === "overdue";
    return {
      key: "service",
      icon: WrenchIcon,
      label: level === "ok" ? t.nextService : t.service,
      value: overdue ? t.overdue : s.kmLeft !== null ? t.inKm(num(s.kmLeft)) : due,
      sub: overdue
        ? t.wasDueAt(num(s.targetKm ?? 0), due)
        : s.daysLeft !== null
          ? `${t.orDays(s.daysLeft, due)} · ${t.whicheverFirst}`
          : undefined,
      wide: true,
      onPress: () => router.push("/service"),
    };
  }
  const svcBanner =
    svc && !svc.hidden && (svc.level === "soon" || svc.level === "overdue") ? svc : null;

  return (
    <Screen scroll>
      <PageHeader
        title={t.status}
        right={<Pill icon={<ClockIcon size={14} color={c.fg2} />} text={ageText} />}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 20, paddingTop: 12, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            onRefresh={pull.onRefresh}
            tintColor={c.fg}
          />
        }
      >
        {svcBanner ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/service")}
            style={({ pressed }) => ({
              minHeight: 52,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: `${c.warn}1F`,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <WrenchIcon size={iconSize.sm} color={c.warn} />
            <View style={{ flex: 1 }}>
              <Text variant="label" weight={600} color="warn">
                {svcBanner.level === "overdue"
                  ? t.serviceOverdue
                  : t.serviceIn(num(svcBanner.info.kmLeft ?? 0))}
              </Text>
              {(() => {
                const s = svcBanner.info;
                const due = s.dueDate === null ? "" : day(s.dueDate);
                const line =
                  svcBanner.level === "overdue"
                    ? t.wasDueAt(num(s.targetKm ?? 0), due)
                    : s.daysLeft !== null
                      ? t.orDays(s.daysLeft, due)
                      : null;
                return line ? (
                  <Text variant="caption" color="warn">
                    {line}
                  </Text>
                ) : null;
              })()}
            </View>
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
          {tiles.map((tile) => {
            const { key, icon: Icon, label, value } = tile;
            const bar = "bar" in tile ? tile.bar : undefined;
            const sub = "sub" in tile ? tile.sub : undefined;
            const onPress = "onPress" in tile ? tile.onPress : undefined;
            const wide = "wide" in tile && tile.wide;
            return (
              <Pressable
                key={key}
                disabled={!onPress}
                onPress={() => onPress?.()}
                accessibilityRole={onPress ? "button" : undefined}
                accessibilityLabel={[label, value, sub].filter(Boolean).join(": ")}
                style={({ pressed }) => ({
                  width: wide ? "100%" : "48.5%",
                  padding: 14,
                  borderRadius: radius.card - 2,
                  backgroundColor: c.s1,
                  gap: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Icon size={16} color={c.fg2} />
                  <Text variant="caption" color="fg2" style={{ flex: 1 }}>
                    {label}
                  </Text>
                  {wide ? <CaretRightIcon size={14} color={c.fg2} /> : null}
                </View>
                <Text
                  variant="stat"
                  style={{ fontSize: 20, lineHeight: 26 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {value}
                </Text>
                {sub ? (
                  <Text variant="caption" color="fg2" style={{ fontSize: 12 }}>
                    {sub}
                  </Text>
                ) : null}
                {bar !== undefined ? (
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: c.s2 }}>
                    <View
                      style={{
                        width: `${bar}%`,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: c.acc,
                      }}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {/* The pill's age is the car's own report; this also says when the app last asked Honda. */}
        <Text variant="caption" color="fg2" style={{ textAlign: "center" }}>
          {/* Any fetch (pull, focus, foreground) shows here, so the header never changes width. */}
          {t.reportedChecked(time(car.updatedAt), isFetching ? null : time(dataUpdatedAt))}
        </Text>
      </ScrollView>
    </Screen>
  );
}
