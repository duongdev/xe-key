import { router } from "expo-router";
import {
  CalendarBlankIcon,
  GaugeIcon,
  HourglassIcon,
  type IconProps,
  WrenchIcon,
} from "phosphor-react-native";
import type { ComponentType } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hideKey } from "../car/service";
import { useLang, useT } from "../i18n";
import { usePrefs } from "../prefs";
import { useService } from "../services/use-service";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { useDay, VisitRow, vnd } from "../ui/service-visit";
import { Text } from "../ui/text";

/** Service reminder detail, native form sheet (see `_layout`). HANDOFF › Service, frame 5. */
export default function ServiceSheet() {
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const { update } = usePrefs();
  const day = useDay();
  const svc = useService();
  if (!svc?.level) return null;
  const { info, level } = svc;
  const num = (n: number) => n.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
  const overdue = level === "overdue";

  const rows: { icon: ComponentType<IconProps>; label: string; value: string; warn?: boolean }[] = [
    info.targetKm !== null && {
      icon: GaugeIcon,
      label: t.dueAt,
      value: `${num(info.targetKm)} km`,
    },
    info.dueDate !== null && {
      icon: CalendarBlankIcon,
      label: t.dueDate,
      value: day(info.dueDate, true),
    },
    {
      icon: HourglassIcon,
      label: t.left,
      value: overdue ? t.overdue : t.kmDaysLeft(num(info.kmLeft ?? 0), info.daysLeft ?? 0),
      warn: overdue,
    },
    info.planVnd !== null && { icon: WrenchIcon, label: t.planEstimate, value: vnd(info.planVnd) },
  ].filter((r) => !!r);

  return (
    <View
      style={{
        backgroundColor: c.s1,
        paddingHorizontal: 16,
        paddingTop: 26,
        paddingBottom: Math.max(insets.bottom, 16) + 4,
        gap: 14,
      }}
    >
      <View style={{ gap: 6, paddingHorizontal: 8 }}>
        <Text
          weight={700}
          accessibilityRole="header"
          color={overdue ? "warn" : "fg"}
          style={{ fontSize: 20, textAlign: "center" }}
        >
          {overdue
            ? t.serviceOverdue
            : info.kmLeft !== null
              ? t.serviceIn(num(info.kmLeft))
              : t.nextService}
        </Text>
        <Text color="fg2" style={{ fontSize: 14, textAlign: "center" }}>
          {t.serviceHelp}
        </Text>
      </View>

      <View style={{ backgroundColor: c.s2, borderRadius: radius.card - 4, overflow: "hidden" }}>
        {rows.map(({ icon: Icon, label, value, warn }, i) => (
          <View
            key={label}
            accessible
            accessibilityLabel={`${label}: ${value}`}
            style={{
              minHeight: 48,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: c.line,
            }}
          >
            <Icon size={16} color={c.fg2} />
            <Text color="fg2" style={{ flex: 1, fontSize: 15 }}>
              {label}
            </Text>
            <Text weight={600} color={warn ? "warn" : "fg"} style={{ fontSize: 15 }}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      {info.visits.length ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
            <Text weight={600} style={{ flex: 1, fontSize: 15 }}>
              {t.serviceHistory}
            </Text>
            {info.visits.length > 3 ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => router.push("/service-history")}
              >
                <Text color="acc" style={{ fontSize: 13 }}>
                  {t.allN(info.visits.length)}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View
            style={{ backgroundColor: c.s2, borderRadius: radius.card - 4, overflow: "hidden" }}
          >
            {info.visits.slice(0, 3).map((v, i) => (
              <VisitRow key={v.id} visit={v} first={i === 0} />
            ))}
          </View>
        </View>
      ) : null}

      {level !== "ok" && !svc.hidden ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            update({ serviceHidden: hideKey(info) });
            router.back();
          }}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: 16,
            backgroundColor: c.s2,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text weight={600} style={{ fontSize: 15, textAlign: "center" }}>
            {t.hideService}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
