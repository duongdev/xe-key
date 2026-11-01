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

/**
 * Minimal HTTP client with an in-memory cookie jar. The Honda backend (iPLAss)
 * authenticates by session cookie (JSESSIONID + iprmtkn), so cookies carry the
 * session across login -> verify -> API calls.
 */
export class HondaHttp {
  private cookies = new Map<string, string>();

  constructor(private readonly base: string) {}

  cookiesObject(): Record<string, string> {
    return Object.fromEntries(this.cookies);
  }

  /** Seed the jar from a saved session's cookies. */
  loadCookies(cookies: Record<string, string>): void {
    for (const [k, v] of Object.entries(cookies)) this.cookies.set(k, v);
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h = { ...DEFAULT_HEADERS, ...extra };
    const cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookie) h.Cookie = cookie;
    return h;
  }

  private store(res: Response): void {
    for (const raw of res.headers.getSetCookie()) {
      const pair = raw.split(";", 1)[0] ?? "";
      const eq = pair.indexOf("=");
      if (eq > 0) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  private async send<T>(path: string, init: RequestInit): Promise<HttpResponse<T>> {
    const res = await fetch(this.base + path, init);
    this.store(res);
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
