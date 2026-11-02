// "Your car" (task 018): the user's own name and look, and what Honda's details reset them to.

import type { CarLook } from "../prefs";
import { bodyFor, paintFor } from "../services/honda-map";

export const NAME_MAX = 24;

/**
 * What the name field saves: trimmed, at most 24 chars. Empty, or Honda's own model name, saves
 * as no own name, so the car follows Honda's name.
 */
export function saveName(input: string, model: string): string | null {
  const name = input.trim().slice(0, NAME_MAX).trim();
  return name && name !== model ? name : null;
}

/** The name shown on Home, widgets and Siri. */
export const carNameFor = (own: string | null, model: string) => own ?? model;

/** Reset to Honda's details: body and paint from Honda's car, shaded drawing, no own name. */
export function hondaLook(car: { model: string; color: string | null }): {
  car: CarLook;
  carName: null;
} {
  return {
    car: { body: bodyFor(car.model), look: "shaded", paint: paintFor(car.color ?? "").hex },
    carName: null,
  };
}

/** VINs show only their last 4 characters. */
export const vinTail = (vin: string | null) => (vin ? `•••• ${vin.slice(-4)}` : null);
