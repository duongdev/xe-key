import { type CookieStore, cookieHeader, memoryCookies, readSetCookie } from "./cookies.js";
import type { IplassEnvelope } from "./envelope.js";

/** Identifies as the current app — without `app: OneApp` the server returns OLD_APP_BLOCK_LOGIN. */
const DEFAULT_HEADERS: Record<string, string> = {
  app: "OneApp",
  "User-Agent": "HConnect-OneApp",
  Accept: "application/json",
};

export interface HttpResponse<T = unknown> {
  statusCode: number;
  json: IplassEnvelope<T> | null;
  text: string;
}

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface HondaHttpOptions {
  base: string;
  /** Defaults to the global `fetch` (Node 18+, React Native). */
  fetch?: Fetch;
  /** Defaults to an in-memory jar; the CLI passes a file-backed one, the app a Keychain-backed one. */
  cookies?: CookieStore;
}

/**
 * Minimal HTTP client. The Honda backend (iPLAss) authenticates by session cookie
 * (JSESSIONID + iprmtkn), so cookies carry the session across login -> verify -> API calls.
 * Runtime-agnostic: no Node or React Native imports (ADR 0003).
 */
export class HondaHttp {
  private readonly base: string;
  private readonly fetch: Fetch;
  private readonly jar: CookieStore;

  constructor(opts: HondaHttpOptions) {
    this.base = opts.base;
    this.fetch = opts.fetch ?? ((url, init) => fetch(url, init));
    this.jar = opts.cookies ?? memoryCookies();
  }

  cookiesObject(): Record<string, string> {
    return this.jar.all();
  }

  /** Seed the jar from a saved session's cookies. */
  loadCookies(cookies: Record<string, string>): void {
    for (const [k, v] of Object.entries(cookies)) this.jar.set(k, v);
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h = { ...DEFAULT_HEADERS, ...extra };
    const cookie = cookieHeader(this.jar.all());
    if (cookie) h.Cookie = cookie;
    return h;
  }

  private async send<T>(path: string, init: RequestInit): Promise<HttpResponse<T>> {
    const res = await this.fetch(this.base + path, init);
    for (const [k, v] of readSetCookie(res.headers)) this.jar.set(k, v);
    const text = await res.text();
    let json: IplassEnvelope<T> | null = null;
    try {
      json = JSON.parse(text) as IplassEnvelope<T>;
    } catch {
      json = null;
    }
    return { statusCode: res.status, json, text };
  }
  get<T>(path: string): Promise<HttpResponse<T>> {
    return this.send<T>(path, { method: "GET", headers: this.headers() });
  }

  delete<T>(path: string): Promise<HttpResponse<T>> {
    return this.send<T>(path, { method: "DELETE", headers: this.headers() });
  }

  postForm<T>(path: string, fields: Record<string, string>): Promise<HttpResponse<T>> {
    return this.send<T>(path, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/x-www-form-urlencoded" }),
      body: new URLSearchParams(fields).toString(),
    });
  }

  postJson<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    return this.send<T>(path, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json; charset=utf-8" }),
      body: JSON.stringify(body),
    });
  }
}
