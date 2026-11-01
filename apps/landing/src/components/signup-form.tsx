import {
  ArrowRightIcon,
  CheckCircleIcon,
  DeviceMobileIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { type FormEvent, useRef, useState } from "react";
import type { Copy, Lang } from "../copy";
import { isEmail } from "../lib/email";
import type { Platform, SubmitError } from "../lib/signup";
import { verifyHuman } from "../lib/turnstile";
import s from "./signup-form.module.css";

type Props = {
  t: Copy;
  lang: Lang;
  email: string;
  platform: Platform;
  onEmail: (v: string) => void;
  onPlatform: (p: Platform) => void;
  /** Runs only with a valid email and a Turnstile token; resolves to an error to show, or null. */
  onSubmit: (token: string) => Promise<SubmitError | null>;
};

const PLATFORMS: [Platform, string][] = [
  ["ios", "iPhone"],
  ["android", "Android"],
];

export function SignupForm({ t, lang, email, platform, onEmail, onPlatform, onSubmit }: Props) {
  const [error, setError] = useState<"email" | SubmitError | null>(null);
  const [busy, setBusy] = useState(false);
  const check = useRef<HTMLDivElement>(null);
  const bad = error === "email";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !check.current) return;
    if (!isEmail(email)) {
      setError("email");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      setError(await onSubmit(await verifyHuman(check.current, lang)));
    } catch (err) {
      console.error("sign-up check failed", err);
      setError("verify");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={s.signup}>
      <div className={s.plat} role="radiogroup" aria-label={t.platQ}>
        <span>{t.platQ}</span>
        {PLATFORMS.map(([p, name]) => (
          // biome-ignore lint/a11y/useSemanticElements: pill buttons styled as a segmented control
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={platform === p}
            onClick={() => onPlatform(p)}
          >
            {name}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className={bad ? `${s.form} ${s.err}` : s.form} noValidate>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-label={t.emailLabel}
          aria-invalid={bad}
          placeholder={t.emailPh}
          value={email}
          onChange={(e) => {
            onEmail(e.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="go" disabled={busy} aria-busy={busy}>
          {t.cta}
          <ArrowRightIcon size={18} color="var(--onacc)" aria-hidden />
        </button>
      </form>
      <div ref={check} className={s.check} />
      {error ? (
        <div className={s.errline} role="alert">
          <WarningCircleIcon size={16} color="var(--error)" aria-hidden />
          {{ email: t.err, verify: t.verifyErr, rate: t.rateErr, server: t.serverErr }[error]}
        </div>
      ) : null}
      <div className={s.note}>
        <span>
          <DeviceMobileIcon size={16} color="var(--fg2)" aria-hidden />
          {t.n1}
        </span>
        <span>
          <CheckCircleIcon size={16} color="var(--fg2)" aria-hidden />
          {t.n2}
        </span>
        <span>
          <ShieldCheckIcon size={16} color="var(--fg2)" aria-hidden />
          {t.n3}
        </span>
      </div>
    </div>
  );
}
