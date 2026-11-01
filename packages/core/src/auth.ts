import { ENDPOINTS } from "./endpoints.js";
import { type Parsed, parseEnvelope } from "./envelope.js";
import type { HondaHttp } from "./http.js";

/** Fields returned in the login/verify envelope's `results.data`. */
export interface LoginData {
  oid?: string;
  accessToken?: string;
  biometricRefreshToken?: string;
  email?: string;
  tcuUser?: boolean;
  newUser?: boolean;
}

export interface AuthResult extends Parsed<LoginData> {
  statusCode: number;
  text: string;
}

async function form(
  http: HondaHttp,
  path: string,
  fields: Record<string, string>,
): Promise<AuthResult> {
  const res = await http.postForm<LoginData>(path, fields);
  return { ...parseEnvelope<LoginData>(res.json), statusCode: res.statusCode, text: res.text };
}

/** Username is the phone number on most APAC regions. */
export function login(
  http: HondaHttp,
  username: string,
  password: string,
  deviceId: string,
): Promise<AuthResult> {
  return form(http, ENDPOINTS.login, { username, password, deviceId });
}

/** Completes the one-time verification a new deviceId triggers. */
export function verifyCode(http: HondaHttp, code: string): Promise<AuthResult> {
  return form(http, ENDPOINTS.verifyCode, { code });
}

/** Re-sends the verification code (GET, same session). */
export async function resendCode(http: HondaHttp): Promise<AuthResult> {
  const res = await http.get<LoginData>(ENDPOINTS.verificationCode);
  return { ...parseEnvelope<LoginData>(res.json), statusCode: res.statusCode, text: res.text };
}
