import type { Lang } from "../copy";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Public site key, inlined at build. Without it the page uses Cloudflare's always-pass invisible
 * test key; its dummy token is rejected by a production secret, so the server check still holds.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000BB";

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<Turnstile> | undefined;

function load(): Promise<Turnstile> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"));
    script.onerror = () => {
      loading = undefined;
      script.remove();
      reject(new Error("turnstile script failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

/**
 * Runs one check in `el` and resolves with a single-use token. Invisible with an invisible site
 * key; with a managed key the widget shows only when Cloudflare needs the visitor to act.
 */
export async function verifyHuman(el: HTMLElement, lang: Lang): Promise<string> {
  const ts = await load();
  return new Promise((resolve, reject) => {
    const done = () => setTimeout(() => ts.remove(id));
    const id = ts.render(el, {
      sitekey: SITE_KEY,
      action: "signup",
      language: lang,
      theme: "dark",
      appearance: "interaction-only",
      callback: (token: string) => {
        done();
        resolve(token);
      },
      "error-callback": (code: string) => {
        done();
        reject(new Error(`turnstile error ${code}`));
        return true;
      },
      "timeout-callback": () => {
        done();
        reject(new Error("turnstile timeout"));
      },
    });
  });
}
