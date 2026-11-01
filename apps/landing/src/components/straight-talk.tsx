import { CaretDownIcon, DeviceMobileIcon, InfoIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { Copy } from "../copy";
import s from "./straight-talk.module.css";

export function StraightTalk({ t }: { t: Copy }) {
  const [open, setOpen] = useState<number | null>(0);
  const cards = [
    { Icon: ShieldCheckIcon, color: "var(--acc)", title: t.ho1, body: t.ho1s },
    { Icon: DeviceMobileIcon, color: "var(--warn)", title: t.ho2, body: t.ho2s },
    { Icon: InfoIcon, color: "var(--fg)", title: t.ho3, body: t.ho3s },
  ];
  return (
    <section className="sec">
      <div className="wrap">
        <p className="kick">{t.k4}</p>
        <h2>{t.h2d}</h2>
        <div className={s.honest}>
          {cards.map(({ Icon, color, title, body }) => (
            <div key={title} className={s.card}>
              <Icon size={28} color={color} aria-hidden />
              <div>
                <b>{title}</b>
                <span>{body}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={s.faq}>
          {t.q.map(([q, a], i) => {
            const on = open === i;
            const id = `faq-${i}`;
            return (
              <div key={q} className={s.q}>
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={id}
                  onClick={() => setOpen(on ? null : i)}
                >
                  {q}
                  <CaretDownIcon
                    size={20}
                    color="var(--fg2)"
                    aria-hidden
                    style={{ transform: on ? "rotate(180deg)" : undefined }}
                  />
                </button>
                <p id={id} hidden={!on}>
                  {a}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
