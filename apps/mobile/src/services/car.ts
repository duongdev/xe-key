import type { CommandEvent, CommandKind } from "../car/command";
import type { Engine } from "../car/engine";
import type { Body } from "../car/status";
import type { TripSummary } from "../car/trips";

export type AcLevel = "low" | "mid" | "high";

/** Set `cancelled` to stop waiting; the service must not change the car after that. */
export type CancelToken = { cancelled: boolean };

export type CarStatus = {
  model: string;
  /** Honda does not send it; null hides it. */
  plate: string | null;
  doors: "locked" | "unlocked";
  engine: Engine;
  /** Remote starts left before the car must be driven; null when unknown. */
  startsLeft: number | null;
  /** Doors, windows, trunk, hood; lock state is `doors`. */
  body: Omit<Body, "doorsLocked">;
  /** Null when the car did not report it. */
  cabinC: number | null;
  fuelPct: number;
  rangeKm: number;
  /** Last GPS fix; null when the car has no signal. */
  location: CarLocation | null;
  batteryV: number | null;
  odometerKm: number | null;
  serviceInKm: number | null;
  alerts: number;
  /** When the car last reported (not when we fetched). */
  updatedAt: number;
  account: "ok" | "signed-out" | "expired";
  signedOutAt?: number;
};

/** Honda sends only lat/lng/time; the rest is filled on the phone when possible. */
export type CarLocation = {
  name: string | null;
  area: string | null;
  lat: number;
  lng: number;
  distanceKm: number | null;
  accuracyM: number | null;
  at: number;
};

export type Trip = TripSummary & { id: string; minutes: number; from: string; to: string };
export type Driving = {
  score: number;
  scoreDelta: number;
  accel: number;
  hardBrakes: number;
  speed: number;
};

export type AlertKind =
  | "unlocked"
  | "auto-off"
  | "locked"
  | "zone"
  | "service"
  | "renew"
  /** A command result from Honda; `ok` false for a failure. */
  | "command"
  /** A warning light from the car. */
  | "diagnosis";
/** `n`: minutes unlocked, km to service or days to renewal, by kind. `text`: Honda's own words. */
export type CarAlert = {
  id: string;
  kind: AlertKind;
  at: number;
  n?: number;
  unread: boolean;
  title?: string;
  text?: string;
  ok?: boolean;
};

export interface CarService {
  /** Last snapshot Honda holds; may be old. */
  status(): Promise<CarStatus>;
  /** Sends a command and reports progress until confirmed or failed. Resolves with the confirmed status. */
  command(
    kind: CommandKind,
    onEvent: (e: CommandEvent) => void,
    opts?: { ac?: AcLevel; cancel?: CancelToken },
  ): Promise<CarStatus | null>;
  /** `soon`: this service cannot read trips yet (live: needs the Honda PIN token). */
  trips(): Promise<{ trips: Trip[]; driving: Driving | null; soon?: boolean }>;
  alerts(): Promise<CarAlert[]>;
  deleteAlert(id: string): Promise<void>;
}
