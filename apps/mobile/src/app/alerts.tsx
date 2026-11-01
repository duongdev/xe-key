import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  LockIcon,
  LockOpenIcon,
  MapPinIcon,
  PowerIcon,
  ShieldCheckIcon,
  TrashIcon,
  WarningIcon,
  WrenchIcon,
  XCircleIcon,
} from "phosphor-react-native";
import { useRef, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { useT } from "../i18n";
import { useFormatTime } from "../i18n/format";
import { markSeen } from "../services/alert-seen";
import type { AlertKind, CarAlert, CarStatus } from "../services/car";
import {
  CAR_KEY,
  carService,
  ALERTS_KEY as KEY,
  loadAlerts,
  useRefreshOnFocus,
} from "../services/query";
import { haptics } from "../theme/haptics";
import { iconSize } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Shimmer } from "../ui/appear";
import { EmptyState } from "../ui/empty-state";
import { GlassButton } from "../ui/glass";
import { GLASS_TABS_H, GlassTabs } from "../ui/glass-tabs";
import { PageHeader } from "../ui/page-header";
import { Screen, useBottomPad } from "../ui/screen";
import { Text } from "../ui/text";
import { useToast } from "../ui/toast";
import { usePullRefresh } from "../ui/use-pull-refresh";

const DELETE_W = 96;

const KINDS: Record<AlertKind, { icon: typeof LockIcon; tone: "acc" | "warn" | "fg2" }> = {
  unlocked: { icon: LockOpenIcon, tone: "warn" },
  "auto-off": { icon: PowerIcon, tone: "acc" },
  locked: { icon: LockIcon, tone: "fg2" },
  zone: { icon: MapPinIcon, tone: "acc" },
  service: { icon: WrenchIcon, tone: "warn" },
  renew: { icon: CalendarIcon, tone: "fg2" },
  command: { icon: CheckCircleIcon, tone: "acc" },
  diagnosis: { icon: WarningIcon, tone: "warn" },
};

function AlertRow({ alert, onDelete }: { alert: CarAlert; onDelete: (a: CarAlert) => void }) {
  const { c } = useTheme();
  const t = useT();
  const time = useFormatTime();
  const swipe = useRef<SwipeableMethods>(null);
  const failed = alert.kind === "command" && alert.ok === false;
  const { icon: Icon, tone } = failed
    ? { icon: XCircleIcon, tone: "error" as const }
    : KINDS[alert.kind];
  const color = c[tone];
  // Honda's alerts carry their own words; ours use the dictionary.
  const title =
    alert.title ||
    (alert.kind in t.alertText ? t.alertText[alert.kind as keyof typeof t.alertText](alert.n) : "");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const d = new Date(alert.at);
  const when =
    alert.at >= start.getTime()
      ? time(alert.at)
      : alert.at >= start.getTime() - 6 * 86_400_000
        ? `${t.weekdaysShort[d.getDay()] ?? ""} ${time(alert.at)}`
        : `${d.getDate()}/${d.getMonth() + 1} ${time(alert.at)}`;

  return (
    <Swipeable
      ref={swipe}
      // Rows only open to the left; a rightward drag stays free for the iOS swipe-back.
      dragOffsetFromLeft={Number.MAX_SAFE_INTEGER}
      friction={1.6}
      rightThreshold={DELETE_W / 2}
      overshootRight={false}
      // haptics: the swipe passing its delete threshold; no shared swipe row yet (HANDOFF › Haptics).
      onSwipeableWillOpen={() => haptics.selection()}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.delete} ${title}`}
          onPress={() => onDelete(alert)}
          style={{
            width: DELETE_W,
            backgroundColor: c.danger,
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <TrashIcon size={iconSize.md} color="#FFFFFF" />
          <Text variant="caption" weight={700} style={{ color: "#FFFFFF" }}>
            {t.delete}
          </Text>
        </Pressable>
      )}
    >
      <View
        accessible
        accessibilityLabel={[title, alert.text, when].filter(Boolean).join(", ")}
        accessibilityActions={[{ name: "delete", label: t.delete }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === "delete" && onDelete(alert)}
        style={{
          minHeight: 68,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          backgroundColor: c.bg,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: tone === "fg2" ? c.s1 : `${color}24`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={color} />
        </View>
        <View style={{ flex: 1, gap: 2, paddingVertical: alert.text ? 12 : 0 }}>
          <Text variant="label" weight={alert.unread ? 700 : 500} numberOfLines={1}>
            {title}
          </Text>
          {alert.text && alert.text !== title ? (
            <Text variant="caption" color="fg2" numberOfLines={2} style={{ fontSize: 14 }}>
              {alert.text}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
          {when}
        </Text>
        {/* Inset divider: same 20 pt as the content on both sides. */}
        <View
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 0,
            height: 1,
            backgroundColor: c.s1,
          }}
        />
      </View>
    </Swipeable>
  );
}

type Filter = "all" | "warnings" | "commands";
const FILTERS: Filter[] = ["all", "warnings", "commands"];
/** Warnings = everything that isn't a command result (Honda's warning lights, our own kinds). */
const inFilter = (a: CarAlert, f: Filter) =>
  f === "all" || (f === "commands" ? a.kind === "command" : a.kind !== "command");

/** First-load placeholder shaped like an alert row. */
function SkeletonRow({ wide }: { wide: boolean }) {
  const { c } = useTheme();
  const bar = { height: 12, borderRadius: 6, backgroundColor: c.s1 };
  return (
    <View style={{ minHeight: 68, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <Shimmer style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.s1 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Shimmer style={{ ...bar, width: wide ? "70%" : "50%" }} />
        <Shimmer style={{ ...bar, width: "30%" }} />
      </View>
      <Shimmer style={{ ...bar, width: 56 }} />
    </View>
  );
}

export default function Alerts() {
  const bottomPad = useBottomPad();
  const { c } = useTheme();
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  useRefreshOnFocus(KEY);
  const [filter, setFilter] = useState<Filter>("all");
  const {
    data: all,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: KEY,
    queryFn: loadAlerts,
  });
  const pull = usePullRefresh(refetch);
  const data = all?.filter((a) => inFilter(a, filter));
  // Count badge matches Home's: unread items only.
  const count = (f: Filter) => all?.filter((a) => a.unread && inFilter(a, f)).length ?? 0;

  const setAlerts = (fn: (list: CarAlert[]) => CarAlert[]) =>
    qc.setQueryData<CarAlert[]>(KEY, (list) => (list ? fn(list) : list));

  // Remove now, delete on the server only once the Undo window has passed.
  const remove = (alert: CarAlert) => {
    setAlerts((list) => list.filter((a) => a.id !== alert.id));
    let undone = false;
    toast.show({
      kind: "undo",
      text: t.deleted,
      action: {
        label: t.undo,
        onPress: () => {
          undone = true;
          setAlerts((list) => [...list, alert].sort((a, b) => b.at - a.at));
        },
      },
      onDismiss: () => {
        if (undone) return;
        carService
          .deleteAlert(alert.id)
          .then(() => qc.invalidateQueries({ queryKey: CAR_KEY }))
          .catch((e: unknown) => {
            console.warn("delete alert failed", e);
            setAlerts((list) => [...list, alert].sort((a, b) => b.at - a.at));
          });
      },
    });
  };

  const unread = all?.some((a) => a.unread) ?? false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = data?.filter((a) => a.at >= start.getTime()) ?? [];
  const earlier = data?.filter((a) => a.at < start.getTime()) ?? [];

  const body = (() => {
    if (isPending)
      return (
        <View accessibilityLabel={t.loading} style={{ paddingTop: 14 }}>
          {[true, false, true, true, false, true].map((wide, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed placeholder rows
            <SkeletonRow key={i} wide={wide} />
          ))}
        </View>
      );
    if (isError || !data)
      return (
        <EmptyState
          icon={<BellIcon size={56} color={c.fg2} />}
          badge={<WarningIcon size={20} color={c.warn} />}
          badgeTone="warn"
          title={t.loadFailed}
          action={{ label: t.retry, onPress: () => refetch() }}
        />
      );
    if (data.length === 0) {
      const Icon = { all: BellIcon, warnings: ShieldCheckIcon, commands: LockIcon }[filter];
      return (
        <EmptyState
          icon={<Icon size={56} color={filter === "warnings" ? c.acc : c.fg2} />}
          title={t.alertEmpty[filter].title}
          text={t.alertEmpty[filter].text}
        />
      );
    }
    // Honda keeps hundreds of alerts with no paging: a virtualized list keeps scrolling smooth.
    return (
      <SectionList
        style={{ flex: 1, marginHorizontal: -20 }}
        contentContainerStyle={{ paddingBottom: bottomPad + GLASS_TABS_H + 72 }}
        sections={[
          { key: "today", title: t.today, data: today },
          { key: "earlier", title: t.earlier, data: earlier },
        ].filter((g) => g.data.length)}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AlertRow alert={item} onDelete={remove} />}
        renderSectionHeader={({ section }) => (
          <Text
            variant="caption"
            weight={600}
            color="fg2"
            style={{
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 6,
              backgroundColor: c.bg,
            }}
          >
            {section.title}
          </Text>
        )}
        stickySectionHeadersEnabled={false}
        initialNumToRender={14}
        windowSize={7}
        removeClippedSubviews
        refreshing={pull.refreshing}
        onRefresh={pull.onRefresh}
      />
    );
  })();

  return (
    <Screen scroll>
      <PageHeader
        title={t.alerts}
        right={
          all?.length ? (
            <GlassButton
              label={t.markAllRead}
              symbol="checkmark"
              color={unread ? c.acc : c.fg2}
              disabled={!unread}
              onPress={() => {
                const ids = all.filter((a) => a.unread).map((a) => a.id);
                void markSeen(ids);
                setAlerts((list) => list.map((a) => ({ ...a, unread: false })));
                qc.setQueryData<CarStatus>(CAR_KEY, (car) => (car ? { ...car, alerts: 0 } : car));
              }}
            >
              <CheckIcon size={iconSize.md} color={unread ? c.acc : c.fg2} />
            </GlassButton>
          ) : null
        }
      />
      {body}
      {all?.length ? (
        <GlassTabs
          value={filter}
          onChange={setFilter}
          tabs={FILTERS.map((f) => ({
            key: f,
            label: t.alertFilters[f],
            // Commands are never unread, so only Warnings carries a badge.
            badge: f === "warnings" ? count(f) : undefined,
          }))}
        />
      ) : null}
    </Screen>
  );
}
