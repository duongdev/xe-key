type Point = { lat: number; lng: number };

/** Great-circle distance in km, rounded to 0.1. */
export function distanceKm(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return Math.round(12_742 * Math.asin(Math.sqrt(h)) * 10) / 10;
}
