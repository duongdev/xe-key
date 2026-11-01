import type { Body } from "@xekey/car";
import type { Copy } from "../copy";
import { Car } from "./car";
import s from "./car-shapes.module.css";

const CARS: { body: Body; name: string; paint: string; paintName: string }[] = [
  { body: "crossover", name: "HR-V", paint: "#6B7078", paintName: "Meteoroid Gray" },
  { body: "sedan", name: "Civic RS", paint: "#9E1B22", paintName: "Ignite Red" },
  { body: "city", name: "City", paint: "#E9E9E6", paintName: "Platinum White" },
  { body: "suv", name: "CR-V", paint: "#15171A", paintName: "Crystal Black" },
  { body: "mpv", name: "BR-V", paint: "#1F2F4A", paintName: "Obsidian Blue" },
];

export function CarShapes({ t }: { t: Copy }) {
  return (
    <section className="sec">
      <div className="wrap">
        <p className="kick">{t.k3}</p>
        <h2>{t.h2c}</h2>
        <p className="sub">{t.s2c}</p>
        <div className={s.cars}>
          {CARS.map((c) => (
            <div key={c.name} className={s.card}>
              <Car body={c.body} paint={c.paint} label={`Honda ${c.name}, ${c.paintName}`} />
              <b>{c.name}</b>
              <span>
                <i className={s.swatch} style={{ background: c.paint }} />
                {c.paintName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
