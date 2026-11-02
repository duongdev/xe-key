import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ArrowsClockwiseIcon,
  BellIcon,
  CaretRightIcon,
  ClockIcon,
  CrownIcon,
  DeviceMobileIcon,
  GasPumpIcon,
  GaugeIcon,
  HourglassIcon,
  LockIcon,
  LockOpenIcon,
  NavigationArrowIcon,
  PathIcon,
  PowerIcon,
  RoadHorizonIcon,
  SlidersHorizontalIcon,
  SnowflakeIcon,
  ThermometerSimpleIcon,
  WarningIcon,
  WifiSlashIcon,
} from "phosphor-react-native";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Car } from "../car/car";
import { MAX_RETRIES } from "../car/command";
import { engineState, clock as formatClock } from "../car/engine";
import { freshness } from "../car/freshness";
import type { Side } from "../car/status";
import { useCommand } from "../car/use-command";
import { useT } from "../i18n";
import { usePrefs } from "../prefs";
import type { CarStatus } from "../services/car";
import { ALERTS_KEY, loadAlerts, refreshCar, useCar } from "../services/query";
import { useDistance } from "../services/use-distance";
import { haptics } from "../theme/haptics";
import { iconSize, radius, space, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Appear, Shimmer } from "../ui/appear";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { Digits } from "../ui/digits";
import { GlassButton } from "../ui/glass";
import { HoldButton } from "../ui/hold-button";
import { setLaunchTarget } from "../ui/launch-target";
import { SolidPressable } from "../ui/press-glass";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";
import { usePullRefresh } from "../ui/use-pull-refresh";

/** No fresh report for this long = the car has gone to sleep. */
const ASLEEP_MIN = 30;

const useOnline = () =>
  useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  );

function Chip({
  icon,
  text,
  after,
  color,
  label,
  onPress,
}: {
  icon: ReactNode;
  text: string;
  after?: ReactNode;
  color?: string;
  label?: string;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const chip = (
    <View
      style={{
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 17,
        backgroundColor: c.s1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      {/\d:\d\d$/.test(text) ? (
        <Digits
          value={text}
          style={{ ...textStyle("caption", 500), fontSize: 14, color: color ?? c.fg }}
        />
      ) : (
        <Text variant="caption" weight={500} style={{ fontSize: 14, color: color ?? c.fg }}>
          {text}
        </Text>
      )}
      {after}
    </View>
  );
  if (!onPress)
    return (
      <View accessible accessibilityLabel={label}>
        {chip}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      // haptics: the wake chip is a solid tap target that no shared button covers (HANDOFF › Haptics).
      onPressIn={() => haptics.light()}
      onPress={onPress}
      hitSlop={5}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      {chip}
    </Pressable>
  );
}

function Skeleton({ w, h = 22 }: { w: number | `${number}%`; h?: number }) {
  const { c } = useTheme();
  return <Shimmer style={{ width: w, height: h, borderRadius: 6, backgroundColor: c.s2 }} />;
}

function MiniMap() {
  const { c } = useTheme();
  return (
    <Svg
      width={52}
      height={52}
      viewBox="0 0 56 56"
      style={{ borderRadius: 12, overflow: "hidden" }}
    >
      <Rect width={56} height={56} fill={c.s2} />
      <Path
        d="M0 18 L56 26 M14 0 L22 56 M0 44 L56 38 M40 0 L36 56"
        stroke={c.line}
        strokeWidth={3}
      />
      <Circle cx={29} cy={29} r={9} fill={c.acc} opacity={0.2} />
      <Circle cx={29} cy={29} r={4.5} fill={c.acc} />
    </Svg>
  );
}

function SignedOut({ car }: { car: CarStatus }) {
  const { c } = useTheme();
  const t = useT();
  const time = car.signedOutAt ? new Date(car.signedOutAt).toTimeString().slice(0, 5) : "";
  const disc = {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  } as const;
  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <View style={{ ...disc, backgroundColor: c.s1, opacity: 0.5 }}>
            <DeviceMobileIcon size={36} color={c.fg2} />
          </View>
          <CaretRightIcon size={iconSize.md} color={c.fg2} />
          <View style={{ ...disc, backgroundColor: c.s1, borderWidth: 2, borderColor: c.warn }}>
            <DeviceMobileIcon size={36} color={c.warn} />
          </View>
        </View>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            style={{ ...textStyle("large"), fontSize: 30, lineHeight: 36, textAlign: "center" }}
          >
            {t.signedOutTitle}
          </Text>
          <Text variant="label" weight={400} color="fg2">
            {t.signedOutWhere(time)}
          </Text>
        </View>
        <View
          style={{
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: c.s1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <LockIcon size={16} color={c.fg2} />
          <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
            {t.carUnchanged}
          </Text>
        </View>
      </View>
      <Button
        height={64}
        tone="neutral"
        label={t.signInAgain}
        onPress={() => router.push("/onboarding/sign-in")}
      />
      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <DeviceMobileIcon size={16} color={c.fg2} />
        <Text variant="caption" color="fg2">
          {t.smsNeeded}
        </Text>
      </View>
    </View>
  );
}

export default function Home() {
  const { c, scheme } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { prefs } = usePrefs();
  const qc = useQueryClient();
  const online = useOnline();
  const { data: car, isPending } = useCar();
  // Tick every second while the engine countdown shows; otherwise freshness only needs 30 s.
  const now = useNow(car?.engine.on ? 1000 : 30_000);
  const { state: cmd, send } = useCommand();
  const carBox = useRef<React.ComponentRef<typeof View>>(null);
  // "Wake" is a fresh read: Honda has no wake call (FINDINGS Round 3 correction).
  const wake = useMutation({ mutationFn: refreshCar });
  const pull = usePullRefresh(() =>
    online && car?.account !== "expired" ? wake.mutateAsync() : null,
  );
  // Alerts aren't saved to disk; load them behind Home so the Alerts screen opens with data.
  const signedIn = !!car;
  const alertList = useQuery({ queryKey: ALERTS_KEY, queryFn: loadAlerts, enabled: false }).data;
  useEffect(() => {
    if (signedIn) qc.prefetchQuery({ queryKey: ALERTS_KEY, queryFn: loadAlerts });
  }, [signedIn, qc]);
  const km = useDistance(car?.location);
  const place = car?.location ? (car.location.name ?? t.carSpot) : t.noGps;
  const placeSub = car?.location ? (km !== null ? `${km} km` : car.location.area) : null;

  const page = (children: ReactNode) => (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingTop: insets.top + 6,
        paddingBottom: Math.max(insets.bottom, 16),
        paddingHorizontal: space.gutter,
      }}
    >
      {children}
    </View>
  );

  if (car?.account === "signed-out") return page(<SignedOut car={car} />);

  const name = prefs.carName ?? car?.model ?? "";
  const { body, look, paint } = prefs.car;
  const loading = isPending && !car;
  const expired = car?.account === "expired";
  const controlsOff = !car || !online || expired;
  const pending = cmd.status === "sent" || cmd.status === "accepted" || cmd.status === "retrying";

  // Headline and picture follow the confirmed snapshot only.
  const unlocked = car?.doors === "unlocked";
  const engine = car ? engineState(car.engine, now) : null;
  const engineOn = engine?.running === true;
  const clock = engine?.running ? formatClock(engine.left) : "";

  const age = car ? freshness(car.updatedAt, now) : null;
  const freshText = wake.isPending
    ? t.waking
    : !age || age.unit === "live"
      ? t.live
      : t.age(age.n, age.unit);
  const freshLabel = wake.isPending
    ? t.waking
    : !age || age.unit === "live"
      ? t.live
      : `${t.ageLong(age.n, age.unit)}. ${t.freshHint}`;

  const lockLabel =
    cmd.status !== "idle" && pending
      ? cmd.kind === "unlock"
        ? t.unlocking
        : t.locking
      : unlocked
        ? t.lock
        : t.holdToUnlock;

  const openWindows = car?.body.windowsCm
    ? (Object.entries(car.body.windowsCm) as [Side, number][]).filter(([, cm]) => cm > 0)
    : [];
  const [firstSide, firstCm] = openWindows[0] ?? ["fl", 0];
  const asleepMin = car && !wake.isPending ? Math.floor((now - car.updatedAt) / 60_000) : 0;
  // Offline is about the phone: top. Car conditions (orange) sit with the car data, under location.
  const offlineBanner = !online ? (
    <Banner
      key="offline"
      tone="neutral"
      icon={<WifiSlashIcon size={iconSize.sm} color={c.fg2} />}
      text={t.offline}
      trailing={<ActivityIndicator size="small" color={c.fg2} />}
    />
  ) : null;
  const carBanners = [
    online && openWindows.length > 0 && (
      <Banner
        key="window"
        tone="warn"
        icon={<WarningIcon size={iconSize.sm} color={c.warn} />}
        text={
          openWindows.length === 1
            ? `${t.window} · ${t.windowOpen(t.sideNames[firstSide], firstCm)}`
            : `${t.windows} · ${t.windowsOpen(openWindows.length)}`
        }
        onPress={() => router.push("/status")}
      />
    ),
    online && !expired && asleepMin >= ASLEEP_MIN && (
      <Banner
        key="asleep"
        tone="warn"
        icon={<HourglassIcon size={iconSize.sm} color={c.warn} />}
        text={t.carAsleep(asleepMin)}
        action={{ label: t.wake, onPress: () => wake.mutate() }}
      />
    ),
  ].filter(Boolean);

  const statusLine = (() => {
    if (cmd.status === "sent") return { text: t.sending, spin: true };
    if (cmd.status === "accepted") return { text: t.acceptedWaiting, spin: true };
    if (cmd.status === "retrying")
      return { text: t.retrying(cmd.attempt, MAX_RETRIES), spin: true, warn: true };
    if (!car && isPending) return { text: t.connecting, spin: true };
    return null;
  })();

  return page(
    <>
      {offlineBanner ? <View style={{ marginBottom: 12 }}>{offlineBanner}</View> : null}

      {/* The scroll view clips; 16 pt of top room lets the settings button's native press grow. */}
      <ScrollView
        style={{ flex: 1, marginHorizontal: -space.gutter, marginTop: -16 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            onRefresh={pull.onRefresh}
            tintColor={c.fg2}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          {/* The car name opens "Your car" (task 018). */}
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t.yourCar}
            onPress={() => router.push("/car")}
            hitSlop={6}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: "center",
              gap: 2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text variant="label" weight={600}>
              {name}
            </Text>
            <Text variant="caption" color="fg2">
              {car?.plate ?? ""}
            </Text>
          </Pressable>
          <GlassButton
            label={t.settings}
            symbol="slider.horizontal.3"
            onPress={() => router.push("/settings")}
          >
            <SlidersHorizontalIcon size={20} color={c.fg} />
          </GlassButton>
        </View>

        <View style={{ marginTop: 24, gap: 10 }}>
          {loading ? (
            <Skeleton w={160} h={44} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${unlocked ? t.unlocked : t.locked}. ${t.doors}`}
              onPress={() => router.push("/doors")}
              style={{ alignSelf: "flex-start" }}
            >
              <Text
                variant="title"
                color={unlocked ? "warn" : "fg"}
                accessibilityLiveRegion="polite"
              >
                {unlocked ? t.unlocked : t.locked}
              </Text>
            </Pressable>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {loading ? (
              <>
                {/* Same height as the chips (40), so the car doesn't move when data arrives. */}
                <Skeleton w={110} h={40} />
                <Skeleton w={84} h={40} />
              </>
            ) : (
              <>
                <Chip
                  label={engineOn ? clock : t.engineOff}
                  color={engineOn ? c.acc : c.fg}
                  icon={<PowerIcon size={16} color={engineOn ? c.acc : c.fg} />}
                  text={engineOn ? clock : t.off}
                />
                {car?.cabinC != null ? (
                  <Chip
                    label={t.cabin(car.cabinC)}
                    icon={<ThermometerSimpleIcon size={16} color={c.fg2} />}
                    after={
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: engineOn ? c.acc : c.warn,
                        }}
                      />
                    }
                    text={`${car.cabinC}°`}
                  />
                ) : null}
                <Chip
                  label={freshLabel}
                  color={age?.unit === "live" && !wake.isPending ? c.acc : c.fg2}
                  icon={
                    <ClockIcon
                      size={16}
                      color={age?.unit === "live" && !wake.isPending ? c.acc : c.fg2}
                    />
                  }
                  onPress={online && !expired && !wake.isPending ? () => wake.mutate() : undefined}
                  text={freshText}
                />
              </>
            )}
          </View>
        </View>

        <View
          ref={carBox}
          // The cold-start animation lands its car exactly here.
          onLayout={() =>
            carBox.current?.measureInWindow((x, y, width) =>
              setLaunchTarget({
                x,
                y,
                width,
                body,
                paint,
                look: look === "line" ? "line" : "shaded",
              }),
            )
          }
          style={{
            marginTop: 2,
            marginHorizontal: -16,
            opacity: loading ? 0.35 : online ? 1 : 0.55,
          }}
        >
          {/* The car stays put; state shows on it (amber lights unlocked, exhaust running). */}
          <Car
            body={body}
            look={look === "line" ? "line" : "shaded"}
            paint={loading ? "#3A3A40" : paint}
            ground={scheme}
            doors={unlocked ? "unlocked" : "locked"}
            engine={engineOn}
          />
        </View>

        <View
          accessible
          accessibilityLabel={car ? t.fuel(car.fuelPct, car.rangeKm) : undefined}
          style={{
            marginTop: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 18,
            backgroundColor: c.s1,
            gap: 10,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <GasPumpIcon size={iconSize.sm} color={c.fg2} />
              {loading ? (
                <Skeleton w={48} />
              ) : (
                <Appear kind="rise" index={0}>
                  <Text variant="stat" style={{ fontSize: 22 }}>{`${car?.fuelPct}%`}</Text>
                </Appear>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {loading ? (
                <Skeleton w={64} />
              ) : (
                <Appear kind="rise" index={1}>
                  <Text variant="stat" style={{ fontSize: 22 }}>
                    {car?.rangeKm}
                    <Text variant="caption" weight={500} color="fg2" style={{ fontSize: 14 }}>
                      {" km"}
                    </Text>
                  </Text>
                </Appear>
              )}
              <RoadHorizonIcon size={iconSize.sm} color={c.fg2} />
            </View>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.s2 }}>
            <View
              style={{
                width: `${car?.fuelPct ?? 0}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: online ? c.fg : c.fg2,
              }}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[place, placeSub].filter(Boolean).join(", ")}
          onPress={() => router.push("/find")}
          style={({ pressed }) => ({
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 10,
            borderRadius: 18,
            backgroundColor: c.s1,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <MiniMap />
          <View style={{ flex: 1, gap: 3 }}>
            {loading || car?.location === undefined ? (
              <>
                <Skeleton w="70%" h={14} />
                <Skeleton w="40%" h={12} />
              </>
            ) : (
              <Appear kind="rise" index={2}>
                <Text variant="label" numberOfLines={1}>
                  {place}
                </Text>
                {placeSub ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    {km !== null ? <NavigationArrowIcon size={14} color={c.fg2} /> : null}
                    <Text variant="caption" color="fg2" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {placeSub}
                    </Text>
                  </View>
                ) : null}
              </Appear>
            )}
          </View>
          <CaretRightIcon size={iconSize.sm} color={c.fg2} />
        </Pressable>
        {carBanners.length ? <View style={{ gap: 8, marginTop: 12 }}>{carBanners}</View> : null}
      </ScrollView>

      <View
        style={{
          minHeight: 28,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {statusLine?.spin ? (
          <ActivityIndicator size="small" color={statusLine.warn ? c.warn : c.fg2} />
        ) : null}
        {statusLine ? (
          <Text
            variant="caption"
            color={statusLine.warn ? "warn" : "fg2"}
            accessibilityLiveRegion="polite"
          >
            {statusLine.text}
          </Text>
        ) : null}
      </View>

      {expired ? (
        <View
          style={{
            marginTop: 8,
            padding: 18,
            borderRadius: radius.cardLg,
            backgroundColor: c.s1,
            borderWidth: 1,
            borderColor: c.warn,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <CrownIcon size={iconSize.md} color={c.warn} />
            <Text weight={600} color="warn" style={{ flex: 1 }}>
              {t.expiredTitle}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, opacity: 0.55 }}>
              <LockIcon size={iconSize.sm} color={c.fg2} />
              <PowerIcon size={iconSize.sm} color={c.fg2} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ArrowsClockwiseIcon size={16} color={c.fg2} />
            <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
              {t.expiredHint}
            </Text>
          </View>
          <Button
            tone="warn"
            label={t.renew}
            height={64}
            onPress={() => Alert.alert(t.renewInHondaApp)}
          />
        </View>
      ) : (
        <View style={{ marginTop: 8, flexDirection: "row", gap: 12 }}>
          {car && !car.can.lock ? null : (
            <HoldButton
              mode={unlocked ? "tap" : "hold"}
              label={lockLabel}
              accessibilityLabel={!unlocked && !pending ? t.unlock : undefined}
              accessibilityHint={unlocked ? undefined : t.holdHint}
              disabled={controlsOff || pending}
              bg={unlocked && !pending ? "warn" : "s1"}
              fg={unlocked && !pending ? "onwarn" : "fg"}
              icon={
                !online ? (
                  <WifiSlashIcon size={iconSize.md} color={c.fg2} />
                ) : unlocked ? (
                  <LockIcon size={iconSize.md} color={pending ? c.fg : c.onwarn} />
                ) : (
                  <LockOpenIcon size={iconSize.md} color={c.fg} />
                )
              }
              onAction={() => send(unlocked ? "lock" : "unlock")}
            />
          )}
          {car && !car.can.engine ? null : (
            <SolidPressable
              accessibilityRole="button"
              accessibilityLabel={engineOn ? clock : t.start}
              disabled={controlsOff}
              onPress={() => router.push("/engine")}
              style={{
                flex: 1,
                height: 68,
                borderRadius: 34,
                backgroundColor: engineOn ? c.s2 : c.s1,
                borderWidth: engineOn ? 2 : 0,
                borderColor: c.acc,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: controlsOff ? 0.5 : 1,
              }}
            >
              {!online ? (
                <WifiSlashIcon size={iconSize.md} color={c.fg2} />
              ) : (
                <SnowflakeIcon size={iconSize.md} color={c.acc} />
              )}
              {engineOn ? (
                <Digits
                  value={clock}
                  style={{ ...textStyle("body", 600), fontSize: 16, color: c.fg }}
                />
              ) : (
                <Text weight={600} style={{ fontSize: 16 }}>
                  {t.start}
                </Text>
              )}
            </SolidPressable>
          )}
        </View>
      )}

      <View style={{ marginTop: 10, flexDirection: "row" }}>
        {[
          { key: "status", icon: GaugeIcon, label: t.status },
          { key: "trips", icon: PathIcon, label: t.trips },
          {
            key: "alerts",
            icon: BellIcon,
            label: t.alerts,
            // Once alerts are loaded the badge counts them (with "marked read" applied).
            badge: alertList ? alertList.filter((a) => a.unread).length : car?.alerts,
          },
        ].map(({ key, icon: Icon, label, badge }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={badge ? `${label}, ${badge}` : label}
            onPress={() => router.push(`/${key}`)}
            style={{ flex: 1, height: 56, alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            <View>
              <Icon size={iconSize.md} color={c.fg2} />
              {badge ? (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -9,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 8,
                    backgroundColor: c.warn,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text weight={700} color="onwarn" style={{ fontSize: 10, lineHeight: 12 }}>
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" color="fg2" style={{ fontSize: 12 }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>,
  );
}
