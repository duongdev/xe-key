import { randomUUID } from "node:crypto";
import {
  baseUrl,
  buildSession,
  HondaHttp,
  isSuccess,
  type LoginData,
  parseEnvelope,
  REGION_META,
  REGIONS,
  type Region,
} from "@xekey/core";
import { saveSession } from "@xekey/core/node";
import { ask, askHidden } from "./prompt.js";

// Completes a device change to map the full onboarding flow. Registers THIS fresh
// deviceId (de-registers the current device, e.g. your phone — reversible by logging
// back in there). Saves the new session to honda_session.json.
const SESSION_FILE = process.env.HONDA_SESSION_FILE ?? "research/honda_session.json";

function keys(o: unknown): string[] {
  return o && typeof o === "object" ? Object.keys(o as object) : [];
}

async function main(): Promise<number> {
  const arg = (process.argv[2] ?? "vietnam").toLowerCase();
  const region = (arg in REGIONS ? arg : "vietnam") as Region;
  const base = baseUrl(region);
  const http = new HondaHttp({ base });
  const deviceId = randomUUID();

  console.log(`region=${region} base=${base}`);
  console.log(`fresh deviceId=${deviceId}\n`);
  const username = await ask("Honda phone number: ");
  const password = await askHidden("Honda password: ");

  // 0. Register the device (push token) FIRST — without this the later verifyCode
  //    has no device record to attach the code to and returns an empty FAILURE.
  const reg = await http.postForm<Record<string, unknown>>("/user/device", {
    uid: deviceId,
    appID: "ao.co.honda.hconnect",
    appVersion: "1.2.7",
    osPlatform: "Android",
    osVersion: "14",
    model: "honda-cli",
    manufacturer: "cli",
    locale: REGION_META[region].lang,
    timeZone: "VN",
    deviceToken: randomUUID(),
  });
  console.log(
    `[0] POST /user/device -> http=${reg.statusCode} status=${parseEnvelope(reg.json).status}`,
  );

  // 1. Login with the fresh device -> NEED_VERIFICATION_CODE (server sends the SMS).
  const login = await http.postForm<LoginData>("/auth/login", { username, password, deviceId });
  const p = parseEnvelope<LoginData>(login.json);
  console.log(
    `\n[1] POST /auth/login -> http=${login.statusCode} status=${p.status} error=${p.error.code ?? "-"}`,
  );
  console.log(`    cookies=${JSON.stringify(Object.keys(http.cookiesObject()))}`);

  if (isSuccess(p.status) && p.data.accessToken) {
    console.log("    already registered — no device change needed.");
    saveSession(SESSION_FILE, buildSession(base, deviceId, p.data, http.cookiesObject()));
    return 0;
  }
  if (p.error.code?.toUpperCase() !== "NEED_VERIFICATION_CODE") {
    console.log("    unexpected — stopping. raw:", login.text.slice(0, 300));
    return 1;
  }

  // 2. Enter the OTP and verify in the SAME session (cookies carry the challenge).
  console.log("\nCheck your SMS for the device-change OTP.");
  const code = await ask("OTP code (blank to abort): ");
  if (!code) {
    console.log("aborted — device NOT changed.");
    return 1;
  }
  const v = await http.postForm<LoginData>("/auth/verifyCode", { code });
  const pv = parseEnvelope<LoginData>(v.json);
  console.log(
    `[2] POST /auth/verifyCode -> http=${v.statusCode} status=${pv.status} error=${pv.error.code ?? "-"} keys=${JSON.stringify(keys(pv.data))}`,
  );

  // 3. Hypothesis: verifyCode marks the device verified; a re-login now completes it.
  const re = await http.postForm<LoginData>("/auth/login", { username, password, deviceId });
  const pr = parseEnvelope<LoginData>(re.json);
  console.log(
    `[3] POST /auth/login (same device) -> http=${re.statusCode} status=${pr.status} error=${pr.error.code ?? "-"} keys=${JSON.stringify(keys(pr.data))}`,
  );

  if (isSuccess(pr.status) || pr.data.accessToken || pr.data.oid) {
    saveSession(SESSION_FILE, buildSession(base, deviceId, pr.data, http.cookiesObject()));
    console.log(`    REGISTERED. oid=${pr.data.oid} -> session saved to ${SESSION_FILE}`);
    console.log("    Your phone is now de-registered — log in there again to switch back.");
    return 0;
  }
  console.log(`    device NOT registered (re-login: ${pr.error.code ?? "empty"}).`);
  return 1;
}

main()
  .then((c) => process.exit(c))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
