import type { CommandEvent, CommandKind } from "../car/command";
import type { Engine } from "../car/engine";
import type { ServiceInfo } from "../car/service";
import type { Body } from "../car/status";
import type { SummaryRow } from "../car/summary";
import type { TripSummary } from "../car/trips";
import type { PinResult } from "./honda-car";
import type { SavedTrip } from "./trip-places";

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
  /** Last GPS fix; null when the car has no signal; undefined until fetched (never saved to disk). */
  location?: CarLocation | null;
  batteryV: number | null;
  alerts: number;
  /** When the car last reported (not when we fetched). */
  updatedAt: number;
  account: "ok" | "signed-out" | "expired";
  /** Set when a command confirmed this state; older reads can't undo it (see `pickSnapshot`). */
  confirmedAt?: number;
  /** Commands the car's Honda CONNECT package allows (Entitlement). */
  can: { lock: boolean; engine: boolean };
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

export type Trip = TripSummary & {
  id: string;
  minutes: number;
  /** Place names need the Honda PIN (trip detail), so live trips have none. */
  from: string | null;
  to: string | null;
  endedAt?: number | null;
  avgKmh?: number | null;
  maxKmh?: number | null;
  kmPerL?: number | null;
  daySeconds?: number | null;
  nightSeconds?: number | null;
};
/** Honda's driving summary rows (FINDINGS Round 9), newest first. */
export type Summary = { day: SummaryRow[]; month: SummaryRow[]; year: SummaryRow[] };

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

/** What Honda says about the car itself ("Your car" › From Honda; Reset). */
export type HondaCar = {
  model: string;
  year: string | null;
  vin: string | null;
  plate: string | null;
  /** Honda's paint text, e.g. "NH-883P Trắng ngà". */
  color: string | null;
  /** Honda's car photo; needs the session cookie. Null when Honda has none. */
  photo: { uri: string; headers: Record<string, string> } | null;
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
  /** Recent trips (last 7 days), newest first. */
  trips(): Promise<Trip[]>;
  summary(): Promise<Summary>;
  /** Trips of the calendar day that starts at `day` (local midnight). */
  dayTrips(day: number): Promise<Trip[]>;
  /** Checks the Honda PIN; on success the PIN token is kept in memory for this app session. */
  verifyPin(pin: string): Promise<PinResult>;
  /** Route and place names of a trip. Needs this session's PIN token; throws `NoPin` without it. */
  tripDetail(id: string): Promise<SavedTrip>;
  /** Drops this session's PIN token. */
  forgetPin(): void;
  hondaCar(): Promise<HondaCar>;
  /** Service reminder + dealer history; prices only for the 3 newest visits. */
  service(): Promise<ServiceInfo>;
  /** Price of one dealer visit (VND), for the full history list. */
  visitPrice(id: string): Promise<number | null>;
  alerts(): Promise<CarAlert[]>;
  deleteAlert(id: string): Promise<void>;
}

/** A trip detail was asked for without this session's Honda PIN token. */
export class NoPin extends Error {}
