/** Survey choices, shared by the panel and the server check. Order matches `t.likes`. */
export const CARS = ["HR-V", "Civic", "City", "CR-V", "BR-V", "Accord", "other"] as const;
export const FEATURES = [
  "lock",
  "climate",
  "find",
  "status",
  "trips",
  "siri-widgets",
  "sharing",
] as const;

export type Car = (typeof CARS)[number];
export type Feature = (typeof FEATURES)[number];
