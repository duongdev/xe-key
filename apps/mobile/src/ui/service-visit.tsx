import { useQuery } from "@tanstack/react-query";
import { Dimensions, View } from "react-native";
import type { ServiceInfo, ServiceVisit } from "../car/service";
import { useLang } from "../i18n";
import { carService, queryClient } from "../services/query";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

/** VND with dot thousands in both languages (HANDOFF › Service). */
export const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

export function useDay() {
  const locale = useLang() === "vi" ? "vi-VN" : "en-GB";
  return (ms: number, year = false) =>
    new Date(ms).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      ...(year ? { year: "numeric" } : {}),
    });
}

/** Fixed so a fit-to-content sheet knows the list height before it lays out. */
export const VISIT_ROW_H = 64;

/** One dealer visit: Honda's type name, date · km, price (fetched when the list lacks it). */
export function VisitRow({ visit, first }: { visit: ServiceVisit; first: boolean }) {
  const { c } = useTheme();
  const lang = useLang();
  const day = useDay();
  const price = useQuery({
    queryKey: ["visitPrice", visit.id],
    queryFn: () => carService.visitPrice(visit.id),
    enabled: visit.priceVnd === null,
  }).data;
  const vnd_ = visit.priceVnd ?? price ?? null;
  const km = visit.km.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
  return (
    <View
      accessible
      style={{
        height: VISIT_ROW_H,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.line,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight={600} numberOfLines={1} style={{ fontSize: 15 }}>
          {visit.type}
        </Text>
        <Text variant="caption" color="fg2" numberOfLines={1} style={{ fontSize: 12 }}>
          {`${day(visit.date, true)} · ${km} km`}
        </Text>
      </View>
      <Text variant="caption" color="fg2">
        {vnd_ === null ? "—" : vnd(vnd_)}
      </Text>
    </View>
  );
}

/** History sheet height (fraction of the screen) for the visits already loaded; caps at full. */
export function historyDetent() {
  const n = queryClient.getQueryData<ServiceInfo>(["service"])?.visits.length ?? 0;
  // Grabber + title row + list padding + home indicator.
  return Math.min(1, (130 + n * VISIT_ROW_H) / Dimensions.get("window").height);
}
