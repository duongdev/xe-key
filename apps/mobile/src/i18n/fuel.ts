import { usePrefs } from "../prefs";
import { useLang } from "./index";

export type FuelUnit = "kml" | "l100";

/**
 * Fuel use in the chosen unit, 1 decimal. Honda sends km/l; L/100 km = 100 / km/l. Only the number
 * changes with the unit: the fuel meter's fill and colour stay km/l-based (fuller = thriftier).
 */
export function formatFuel(kmPerL: number | null | undefined, unit: FuelUnit, lang: "en" | "vi") {
  if (!kmPerL) return null;
  const v = unit === "l100" ? 100 / kmPerL : kmPerL;
  const value = v.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return { value, unit: unit === "l100" ? "L/100 km" : "km/l" };
}

/** `formatFuel` with the Fuel use setting and app language. */
export function useFuel() {
  const unit = usePrefs().prefs.fuel;
  const lang = useLang();
  return (kmPerL: number | null | undefined) => formatFuel(kmPerL, unit, lang);
}
