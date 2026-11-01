import type { CommandEvent, CommandKind } from "../car/command";
import type { Engine } from "../car/engine";
import type { Body } from "../car/status";
import type { TripSummary } from "../car/trips";

export type AcLevel = "low" | "mid" | "high";

/** Set `cancelled` to stop waiting; the service must not change the car after that. */
export type CancelToken = { cancelled: boolean };

export type CarStatus = {
  model: string;
  plate: string;
  doors: "locked" | "unlocked";
  engine: Engine;
  /** Remote starts left before the car must be driven. */
  startsLeft: number;
  /** Doors, windows, trunk, hood; lock state is `doors`. */
  body: Omit<Body, "doorsLocked">;
  cabinC: number;
  fuelPct: number;
  rangeKm: number;
  /** Last GPS fix; null when the car has no signal. */
  location: CarLocation | null;
  batteryV: number;
  odometerKm: number;
  serviceInKm: number;
  alerts: number;
  /** When the car last reported (not when we fetched). */
  updatedAt: number;
  account: "ok" | "signed-out" | "expired";
  signedOutAt?: number;
};

export type CarLocation = {
  name: string;
  area: string;
  lat: number;
  lng: number;
  distanceKm: number;
  accuracyM: number;
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

export type AlertKind = "unlocked" | "auto-off" | "locked" | "zone" | "service" | "renew";
/** `n`: minutes unlocked, km to service or days to renewal, by kind. */
export type CarAlert = { id: string; kind: AlertKind; at: number; n?: number; unread: boolean };

export interface CarService {
  /** Last snapshot Honda holds; may be old. */
  status(): Promise<CarStatus>;
  /** Asks the car for live data, then returns the fresh snapshot. */
  wake(): Promise<CarStatus>;
  /** Sends a command and reports progress until confirmed or failed. Resolves with the confirmed status. */
  command(
    kind: CommandKind,
    onEvent: (e: CommandEvent) => void,
    opts?: { ac?: AcLevel; cancel?: CancelToken },
  ): Promise<CarStatus | null>;
  trips(): Promise<{ trips: Trip[]; driving: Driving | null }>;
  alerts(): Promise<CarAlert[]>;
  deleteAlert(id: string): Promise<void>;
}
