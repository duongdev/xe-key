import type { CommandEvent, CommandKind } from "../car/command";
import type { Engine } from "../car/engine";

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
  closed: { doors: boolean; trunk: boolean; hood: boolean };
  cabinC: number;
  fuelPct: number;
  rangeKm: number;
  location: { name: string; distanceKm: number };
  alerts: number;
  /** When the car last reported (not when we fetched). */
  updatedAt: number;
  account: "ok" | "signed-out" | "expired";
  signedOutAt?: number;
};

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
}
