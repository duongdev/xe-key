import { SITE_URL } from "../lib/seo";

const MAX_BODY = 8 * 1024;

export const json = (status: number, data: unknown) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Reads at most MAX_BODY bytes; null when the body is larger, so a huge upload is never buffered. */
async function readCapped(req: Request): Promise<string | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** Same-origin JSON body, capped in size; null when the request is not acceptable. */
export async function readJson(req: Request): Promise<unknown | null> {
  const origin = req.headers.get("origin");
  if (origin && origin !== SITE_URL.origin) return null;
  if (!req.headers.get("content-type")?.startsWith("application/json")) return null;
  const text = await readCapped(req);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Log line for a failure: the root cause only, never the query params (they hold emails). */
export function errorSummary(e: unknown): string {
  const cause = e instanceof Error && e.cause instanceof Error ? e.cause : e;
  return cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
}
