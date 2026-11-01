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
  TrashIcon,
  WarningIcon,
  WrenchIcon,
  XCircleIcon,
} from "phosphor-react-native";
import { useRef } from "react";
import { Pressable, SectionList, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { useT } from "../i18n";
import { useFormatTime } from "../i18n/format";
import type { AlertKind, CarAlert, CarStatus } from "../services/car";
import { CAR_KEY, carService, useRefreshOnFocus } from "../services/query";
import { haptics } from "../theme/haptics";
import { iconSize } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Shimmer } from "../ui/appear";
import { EmptyState } from "../ui/empty-state";
import { PageHeader } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";
import { useToast } from "../ui/toast";

const KEY = ["alerts"] as const;
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
      friction={1.6}
      rightThreshold={DELETE_W / 2}
      overshootRight={false}
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
  const { c } = useTheme();
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  useRefreshOnFocus(KEY);
  const { data, isPending, isError, isRefetching, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => carService.alerts(),
  });

  const setAlerts = (fn: (list: CarAlert[]) => CarAlert[]) =>
    qc.setQueryData<CarAlert[]>(KEY, (list) => (list ? fn(list) : list));

  // Remove now, delete on the server only once the Undo window has passed.
  const remove = (alert: CarAlert) => {
    haptics.light();
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

  const unread = data?.some((a) => a.unread) ?? false;
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
    if (data.length === 0)
      return (
        <EmptyState
          icon={<BellIcon size={56} color={c.fg2} />}
          badge={<CheckIcon size={20} color={c.acc} />}
          badgeTone="acc"
          title={t.allQuiet}
        />
      );
    // Honda keeps hundreds of alerts with no paging: a virtualized list keeps scrolling smooth.
    return (
      <SectionList
        style={{ flex: 1, marginHorizontal: -20 }}
        contentContainerStyle={{ paddingBottom: 24 }}
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
        refreshing={isRefetching}
        onRefresh={() => refetch()}
      />
    );
  })();

  return (
    <Screen>
      <PageHeader
        title={t.alerts}
        right={
          unread ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.markAllRead}
              onPress={() => {
                haptics.light();
                setAlerts((list) => list.map((a) => ({ ...a, unread: false })));
                qc.setQueryData<CarStatus>(CAR_KEY, (car) => (car ? { ...car, alerts: 0 } : car));
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.s1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleIcon size={iconSize.md} color={c.acc} />
            </Pressable>
          ) : null
        }
      />
      {body}
    </Screen>
  );
}
