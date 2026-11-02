export type Point = { lat: number; lng: number };

/** Google encoded polyline at 1e5 precision (Honda's `tripRoute`, FINDINGS Round 8). */
export function decodePolyline(s: string): Point[] {
  const out: Point[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let shift = 0;
    let n = 0;
    for (;;) {
      if (i >= s.length) return null;
      const b = s.charCodeAt(i++) - 63;
      n |= (b & 31) << shift;
      shift += 5;
      if (b < 32) return n & 1 ? ~(n >> 1) : n >> 1;
    }
  };
  for (;;) {
    const dLat = next();
    const dLng = dLat === null ? null : next();
    if (dLat === null || dLng === null) return out;
    lat += dLat;
    lng += dLng;
    out.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
}
