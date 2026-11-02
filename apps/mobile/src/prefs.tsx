import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { Body } from "./car/geometry";
import type { RegionId } from "./onboarding/region";

export type CarLook = { body: Body; look: "shaded" | "line" | "photo"; paint: string };

export type Prefs = {
  onboarded: boolean;
  region: RegionId | null;
  car: CarLook;
  /** User's name for the car; falls back to the model name. */
  carName: string | null;
  faceId: boolean;
  siri: boolean;
  language: "system" | "en" | "vi";
  format: "system" | "24h" | "12h";
  /** Fuel use unit; Honda sends km/l. */
  fuel: "kml" | "l100";
  /** Dev builds only (Settings › Developer); release builds always talk to Honda. Renamed from
   * `api` so devices that saved the old mock default start on live. */
  honda: "mock" | "live";
};

const DEFAULTS: Prefs = {
  onboarded: false,
  region: null,
  car: { body: "crossover", look: "shaded", paint: "#6B7078" },
  carName: null,
  faceId: false,
  siri: false,
  language: "system",
  format: "system",
  fuel: "kml",
  honda: "live",
};

const KEY = "prefs.v1";

type Ctx = { prefs: Prefs; update: (patch: Partial<Prefs>) => void };
const PrefsContext = createContext<Ctx | null>(null);

/** Non-secret app settings, kept on device. Renders nothing until loaded. */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setPrefs({ ...DEFAULTS, ...(raw ? (JSON.parse(raw) as Partial<Prefs>) : {}) }))
      .catch((e: unknown) => {
        console.warn("prefs: load failed, using defaults", e);
        setPrefs(DEFAULTS);
      });
  }, []);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const nextPrefs = { ...(p ?? DEFAULTS), ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(nextPrefs)).catch((e: unknown) =>
        console.warn("prefs: save failed", e),
      );
      return nextPrefs;
    });
  }, []);

  if (!prefs) return null;
  return <PrefsContext value={{ prefs, update }}>{children}</PrefsContext>;
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs outside PrefsProvider");
  return ctx;
}
