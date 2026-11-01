export type Body = "crossover" | "sedan" | "city" | "suv" | "mpv";
export type Ground = "dark" | "light";

type Profile = {
  name: string;
  /** Wheel centres x: [rear, front]. */
  w: readonly [number, number];
  /** Wheel centre y. */
  wy: number;
  /** Tyre radius. */
  wr: number;
  /** Rocker (sill) line y — arches end here. */
  yb: number;
  /** Arch clearance over the tyre. */
  gap?: number;
  spokes: number;
  sport?: boolean;
  top: string;
  glass: string;
  pillars: string;
  belt: string;
  crease: string;
  lower: string;
  doors: string;
  handles: string;
  mirror: string;
  intake: string;
  aero?: string;
  head: string;
  tail: string;
};

/** Side-profile paths in a 720×280 viewBox, ported from design/boards/Car.dc.html. */
export const BODIES: Record<Body, Profile> = {
  crossover: {
    name: "HR-V",
    w: [190, 548],
    wy: 198,
    wr: 58,
    yb: 206,
    spokes: 5,
    top: "M112 206 L104 166 C101 138 108 118 128 108 L158 96 C204 72 246 60 302 54 L418 55 C452 57 480 72 522 104 C582 112 640 120 668 132 C684 139 690 154 688 174 L684 206",
    glass: "M200 106 C230 84 262 72 304 68 L412 68 C438 70 458 84 486 108 Z",
    pillars: "M334 68 L344 68 L346 108 L336 108 Z",
    belt: "M198 110 L490 112",
    crease: "M132 134 C300 124 500 126 662 146",
    lower: "M262 178 C340 174 420 174 480 178",
    doors: "M488 112 C492 150 490 176 484 192 M340 112 L344 192 M262 112 C256 140 256 164 262 182",
    handles: "M378 128 L400 128 M276 124 L294 124",
    mirror: "M494 100 L512 97 L515 110 L497 112 Z",
    intake: "M664 194 L686 194",
    head: "M630 134 C650 137 664 141 676 146",
    tail: "M112 116 L152 102",
  },
  sedan: {
    name: "Civic",
    w: [186, 561],
    wy: 210,
    wr: 46,
    yb: 233,
    gap: 5,
    spokes: 10,
    sport: true,
    top: "M56 233 L50 202 C48 178 52 158 60 146 C64 128 70 118 78 114 L70 107 L112 108 L170 104 C216 86 266 72 340 68 C370 67 390 69 402 73 C428 88 450 108 466 124 C544 130 622 142 676 156 C688 160 694 172 692 186 L690 212 C690 222 686 228 682 233",
    glass: "M176 114 C220 94 268 80 340 75 C368 74 390 76 400 80 C424 92 444 108 460 120 Z",
    pillars: "M318 76 L328 75 L330 120 L320 120 Z M206 100 L214 97 L216 119 L208 119 Z",
    belt: "M174 122 C280 121 380 122 462 124",
    crease: "M64 142 C200 134 420 136 684 162",
    lower: "M232 206 C330 199 430 199 514 204",
    doors: "M464 126 C470 160 472 190 468 222 M325 122 L327 224 M208 122 C206 160 212 190 230 210",
    handles: "M368 138 L390 138 M236 136 L256 136",
    mirror: "M448 110 L470 106 L474 120 L452 122 Z",
    intake: "M656 222 L688 222",
    aero: "M640 231 L693 228 L693 235 L646 237 Z M54 224 L108 224 L104 236 L60 236 Z M70 107 L66 103 L96 104 L112 108 Z",
    head: "M632 154 C652 157 670 162 686 170",
    tail: "M52 142 C62 130 74 120 96 116",
  },
  city: {
    name: "City",
    w: [211, 567],
    wy: 214,
    wr: 42,
    yb: 236,
    gap: 7,
    spokes: 5,
    top: "M74 236 L68 210 C64 186 64 160 70 136 C72 124 76 118 84 115 L176 111 C200 92 226 72 252 63 C300 54 360 53 430 60 C448 76 464 98 478 119 C560 126 630 138 676 149 C688 154 692 166 692 182 L690 212 C690 224 688 232 684 236",
    glass: "M196 116 C214 98 236 80 258 72 C300 64 360 63 424 69 C440 84 454 100 466 117 Z",
    pillars: "M330 66 L340 66 L342 118 L332 118 Z M236 84 L243 80 L246 118 L239 118 Z",
    belt: "M196 120 C300 119 400 119 470 121",
    crease: "M84 136 C240 128 440 130 680 158",
    lower: "M262 210 C350 204 440 204 520 208",
    doors: "M470 122 C476 160 478 194 474 224 M336 120 L338 226 M246 120 C242 160 246 192 260 212",
    handles: "M376 140 L398 140 M262 138 L282 138",
    mirror: "M456 106 L478 102 L482 116 L460 118 Z",
    intake: "M660 226 L688 226",
    head: "M640 150 C656 153 672 158 688 166",
    tail: "M70 130 C78 122 90 117 112 115",
  },
  suv: {
    name: "CR-V",
    w: [190, 548],
    wy: 198,
    wr: 58,
    yb: 206,
    spokes: 5,
    top: "M108 206 L104 150 C102 112 110 92 130 84 L170 70 C210 50 250 44 304 42 L430 42 C462 44 486 58 522 92 C584 102 640 112 670 126 C686 133 692 150 690 172 L686 206",
    glass: "M150 98 L176 74 C210 58 250 52 304 50 L414 50 C440 52 460 66 490 94 Z",
    pillars: "M334 50 L344 50 L346 94 L336 94 Z M228 56 L236 54 L238 96 L230 96 Z",
    belt: "M150 98 L492 98",
    crease: "M126 124 C300 116 500 118 664 136",
    lower: "M262 176 C340 172 420 172 480 176",
    doors: "M494 100 C498 140 496 174 488 192 M340 98 L344 192 M234 98 C228 136 230 166 238 186",
    handles: "M376 114 L400 114 M262 112 L282 112",
    mirror: "M492 88 L510 85 L513 98 L495 100 Z",
    intake: "M664 192 L688 192",
    head: "M636 122 C654 125 668 129 680 134",
    tail: "M110 96 L110 138",
  },
  mpv: {
    name: "BR-V",
    w: [190, 548],
    wy: 198,
    wr: 58,
    yb: 206,
    spokes: 5,
    top: "M104 206 L100 140 C100 108 106 92 120 86 L150 76 C200 62 250 58 310 56 L440 56 C470 58 492 70 526 98 C588 108 640 118 668 130 C684 137 690 152 688 172 L684 206",
    glass: "M124 102 L136 86 C190 70 250 66 310 64 L424 64 C448 66 466 78 494 102 Z",
    pillars: "M230 66 L238 66 L240 102 L232 102 Z M358 64 L368 64 L370 102 L360 102 Z",
    belt: "M124 106 L496 106",
    crease: "M120 128 C300 120 500 122 664 140",
    lower: "M262 178 C340 174 420 174 480 178",
    doors: "M496 108 C500 146 498 176 490 192 M364 106 L366 192 M238 106 L242 192",
    handles: "M392 122 L414 122 M270 120 L290 120",
    mirror: "M496 96 L514 93 L517 106 L499 108 Z",
    intake: "M662 192 L686 192",
    head: "M632 128 C652 131 666 135 678 140",
    tail: "M106 98 L106 136",
  },
};

const f1 = (n: number) => n.toFixed(1);
const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

/**
 * Arch over a wheel at `cx`: from where the arch circle meets the rocker line on the
 * front side, over the top (large arc), to the rear side. Appended to the body outline.
 */
export function wheelArch(cx: number, r: number, wy: number, yb: number): string {
  const dx = Math.sqrt(r * r - (yb - wy) ** 2);
  return ` L${f1(cx + dx)} ${yb} A${r} ${r} 0 1 0 ${f1(cx - dx)} ${yb}`;
}

/** Rec. 709 weighted brightness of a hex colour, 0..1 (on gamma-encoded channels, as the board does). */
export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

/** A dark car on dark ground, or a light car on light ground, needs extra edge contrast. */
export function needsAssist(paint: string, ground: Ground): boolean {
  const lum = luminance(paint);
  return ground === "light" ? lum > 0.7 : lum < 0.18;
}

export function bodyGeometry(body: Body) {
  const s = BODIES[body];
  const ar = s.wr + (s.gap ?? 8);
  const [rear, front] = s.w;
  const outline = `${s.top + wheelArch(front, ar, s.wy, s.yb) + wheelArch(rear, ar, s.wy, s.yb)} Z`;
  const well = (cx: number) =>
    `M${cx - ar} ${s.wy} A${ar} ${ar} 0 1 1 ${cx + ar} ${s.wy} L${cx + ar} ${s.yb} L${cx - ar} ${s.yb} Z`;

  const rockerTop = s.yb - (s.sport ? 18 : 14);
  const rx = (cx: number, side: 1 | -1) =>
    f1(cx + side * Math.sqrt(ar * ar - (rockerTop - s.wy) ** 2));
  const rocker = `M${rx(rear, 1)} ${rockerTop} L${rx(front, -1)} ${rockerTop} L${rx(front, -1)} ${s.yb} L${rx(rear, 1)} ${s.yb} Z`;

  const rim = Math.round(s.wr * 0.72);
  const thin = s.spokes > 6;
  const cr = rim - 9;
  const wheels = s.w.map((cx) => {
    let spokes = "";
    for (let i = 0; i < s.spokes; i++) {
      const a = (i / s.spokes) * Math.PI * 2 - Math.PI / 2;
      spokes += `M${f1(cx + Math.cos(a) * 8)} ${f1(s.wy + Math.sin(a) * 8)} L${f1(cx + Math.cos(a) * (rim - 2))} ${f1(s.wy + Math.sin(a) * (rim - 2))} `;
    }
    return {
      cx,
      cy: s.wy,
      r: s.wr,
      rim,
      inner: Math.round(rim * 0.82),
      lineR: s.wr - 4,
      spokes,
      spokeWidth: s.sport ? 4.5 : thin ? 3.5 : 7,
      spokeColor: s.sport ? "#5E646C" : thin ? "#B9BEC4" : "#2A2D31",
      darkRim: s.sport === true,
      caliper: s.sport
        ? `M${f1(cx - cr * Math.cos(0.35))} ${f1(s.wy - cr * Math.sin(0.35))} A${cr} ${cr} 0 0 1 ${f1(cx - cr * Math.cos(1.15))} ${f1(s.wy - cr * Math.sin(1.15))}`
        : "",
    };
  });

  const h = nums(s.head);
  const t = nums(s.tail);
  const m = nums(s.mirror);
  const o = nums(s.top);
  const exhaust = { x: (o[0] ?? 0) + 16, y: s.yb - 4 };

  return {
    profile: s,
    archRadius: ar,
    body: outline,
    archShadow: `${well(rear)} ${well(front)}`,
    rocker,
    wheels,
    beltColor: s.sport ? "#0B0C0E" : "rgba(255,255,255,.28)",
    beltWidth: s.sport ? 3 : 2,
    /** Anchor points for state effects. */
    head: { x: h[h.length - 2] ?? 0, y: h[h.length - 1] ?? 0 },
    tail: { x: (t[0] ?? 0) + 4, y: t[1] ?? 0 },
    mirror: { x: (m[0] ?? 0) + 12, y: (m[1] ?? 0) + 6 },
    exhaust,
  };
}
