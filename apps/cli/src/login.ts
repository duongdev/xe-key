import {
  baseUrl,
  buildSession,
  HondaHttp,
  isSuccess,
  type LoginData,
  login,
  type Region,
  resendCode,
  verifyCode,
} from "@xekey/core";
import { resolveDeviceId, saveSession } from "@xekey/core/node";
import { ask, askHidden } from "./prompt.js";

const SESSION_FILE = process.env.HONDA_SESSION_FILE ?? "honda_session.json";
const DEVICE_FILE = process.env.HONDA_DEVICE_FILE ?? "honda_device_id.txt";

function save(base: string, deviceId: string, data: LoginData, http: HondaHttp): number {
  saveSession(SESSION_FILE, buildSession(base, deviceId, data, http.cookiesObject()));
  console.log(`logged in as oid=${data.oid}  tcuUser=${data.tcuUser}`);
  console.log(`session saved -> ${SESSION_FILE}`);
  return 0;
}

export async function runLogin(region: Region): Promise<number> {
  const base = baseUrl(region);
  const deviceId = resolveDeviceId(DEVICE_FILE);
  const http = new HondaHttp({ base });

  console.log(`region   : ${region}\nendpoint : ${base}\ndeviceId : ${deviceId}\n`);
  const username = await ask("Honda phone number (username): ");
  const password = await askHidden("Honda password: ");

  const res = await login(http, username, password, deviceId);
  console.log(`\nlogin HTTP ${res.statusCode}  status=${JSON.stringify(res.status)}`);
  console.log(`cookies  : ${JSON.stringify(Object.keys(http.cookiesObject()))}`);

  if (res.statusCode >= 500) {
    console.log("Server returned 5xx (not a client bug). Wait ~1-2 min and retry.");
    return 1;
  }
  if (isSuccess(res.status) || res.data.accessToken) return save(base, deviceId, res.data, http);

  if (res.error.code?.toUpperCase() === "NEED_VERIFICATION_CODE") {
    console.log("\nVerification code required (new device). Check your SMS/email.");
    console.log("(press Enter on an empty prompt to resend)");
    for (;;) {
      const code = await ask("verification code: ");
      if (!code) {
        const r = await resendCode(http);
        console.log(`  resend status=${JSON.stringify(r.status)}`);
        continue;
      }
      const v = await verifyCode(http, code);
      console.log(`verifyCode HTTP ${v.statusCode}  status=${JSON.stringify(v.status)}`);
      if (isSuccess(v.status) || v.data.oid || v.data.accessToken) {
        return save(base, deviceId, v.data, http);
      }
      console.log(
        "  verify failed:",
        v.error.code,
        v.error.message,
        "- try again or Enter to resend",
      );
    }
  }

  console.log("Login failed:", res.status, JSON.stringify(res.error));
  return 1;
}
