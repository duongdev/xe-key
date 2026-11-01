import type { CommandEvent, CommandKind } from "../car/command";

export type CarStatus = {
  model: string;
  plate: string;
  doors: "locked" | "unlocked";
  engine: { on: false } | { on: true; endsAt: number };
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
  command(kind: CommandKind, onEvent: (e: CommandEvent) => void): Promise<CarStatus | null>;
}
