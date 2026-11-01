/** The iPLAss response envelope the backend wraps every reply in. */
export interface IplassError {
  code?: string;
  message?: string;
  title?: string;
}

export interface IplassEnvelope<T = unknown> {
  status?: string;
  results?: { data?: T | null; error?: IplassError | null } | null;
  exceptionType?: string | null;
  exceptionMessage?: string | null;
}

export interface Parsed<T> {
  status: string;
  data: T;
  error: IplassError;
}

/** Null-safe unwrap of the envelope. Returns empty objects, never null. */
export function parseEnvelope<T extends object = Record<string, unknown>>(
  body: IplassEnvelope<T> | null | undefined,
): Parsed<T> {
  const results = body?.results ?? {};
  return {
    status: body?.status ?? "",
    data: (results.data ?? {}) as T,
    error: results.error ?? {},
  };
}

export function isSuccess(status: string): boolean {
  return status.toUpperCase() === "SUCCESS";
}
