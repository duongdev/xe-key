import { useQuery } from "@tanstack/react-query";
import { hideKey, odometerEstimate, serviceLevel } from "../car/service";
import { usePrefs } from "../prefs";
import { carService } from "./query";

/** Service reminder for Status, Home and the sheet; null until loaded or when Honda sends none. */
export function useService() {
  const { prefs } = usePrefs();
  const info = useQuery({ queryKey: ["service"], queryFn: () => carService.service() }).data;
  const days = useQuery({ queryKey: ["summary"], queryFn: () => carService.summary() }).data?.day;
  if (!info) return null;
  return {
    info,
    level: serviceLevel(info),
    odo: days ? odometerEstimate(info.visits, days) : null,
    hidden: prefs.serviceHidden === hideKey(info),
  };
}
