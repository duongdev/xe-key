"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { COPY, type Lang } from "../copy";
import { type Platform, type SubmitError, submitSignup } from "../lib/signup";
import { CarShapes } from "./car-shapes";
import { Footer, Nav, NavCta, Tile } from "./chrome";
import { Features } from "./features";
import { Hero } from "./hero";
import { HoldDemo } from "./hold-demo";
import s from "./landing.module.css";
import { Registered } from "./registered";
import { SignupForm } from "./signup-form";
import { StraightTalk } from "./straight-talk";
import { Tour } from "./tour";

export function Landing({ lang, contactEmail }: { lang: Lang; contactEmail: string }) {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [surveyToken, setSurveyToken] = useState<string | null>(null);
  const t = COPY[lang];

  const submit = async (turnstileToken: string): Promise<SubmitError | null> => {
    const res = await submitSignup({
      email: email.trim(),
      platform,
      language: lang,
      turnstileToken,
    });
    if (!res.ok) return res.error;
    setSurveyToken(res.surveyToken);
    setDone(true);
    return null;
  };

  const form = (
    <SignupForm
      t={t}
      lang={lang}
      email={email}
      platform={platform}
      onEmail={setEmail}
      onPlatform={setPlatform}
      onSubmit={submit}
    />
  );

  return (
    <div className="page">
      <main>
        <div className={`glow ${s.topGlow}`} />
        <div className="wrap">
          <Nav lang={lang} path="/" cta={<NavCta>{t.navCta}</NavCta>} />
          <Hero
            t={t}
            signup={
              done ? (
                <Registered
                  t={t}
                  email={email.trim()}
                  platform={platform}
                  surveyToken={surveyToken}
                />
              ) : (
                form
              )
            }
          />
        </div>
        <HoldDemo t={t} />
        <Tour t={t} lang={lang} />
        <Features t={t} />
        <CarShapes t={t} />
        <StraightTalk t={t} />
        <section className="sec">
          <div className={`glow ${s.finalGlow}`} />
          <div className={`wrap ${s.final}`}>
            <Tile big />
            <h2>{t.h2e}</h2>
            <p className="sub">{t.s2e}</p>
            {done ? (
              <div className={s.done} role="status">
                <CheckCircleIcon size={28} color="var(--acc)" aria-hidden />
                <div>
                  <b>{t.doneT}</b>
                  <span>{platform === "android" ? t.doneSA : t.doneS}</span>
                </div>
              </div>
            ) : (
              form
            )}
          </div>
        </section>
      </main>
      <Footer lang={lang} contactEmail={contactEmail} />
    </div>
  );
}
