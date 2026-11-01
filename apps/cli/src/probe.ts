import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { HondaHttp, type HttpResponse, loadSession } from "@xekey/core";

// Reads run automatically, one at a time with a pause and early stop.
// Commands actuate the car and fire ONLY when named in HONDA_FIRE (comma list).
const SESSION_FILE = process.env.HONDA_SESSION_FILE ?? "research/honda_session.json";
const DELAY_MS = Number(process.env.HONDA_PROBE_DELAY ?? 3000);
const OUT = process.env.HONDA_PROBE_OUT ?? "research/probe-results.json";
const FIRE = (process.env.HONDA_FIRE ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Json = unknown;

/** Structure only — key names + value *types*, never the values. */
function shape(v: Json): Json {
  if (v === null) return "null";
  if (Array.isArray(v)) return v.length ? [`array(${v.length})`, shape(v[0])] : "array(0)";
  if (typeof v === "object") {
    const o: Record<string, Json> = {};
    for (const k of Object.keys(v as object)) o[k] = shape((v as Record<string, Json>)[k]);
    return o;
  }
  return typeof v;
}

interface Result {
  kind: "read" | "command";
  feature: string;
  method: string;
  path: string;
  risk?: string;
  fired?: boolean;
  httpStatus?: number;
  envStatus?: string;
  errorCode?: string;
  ok: boolean;
  dataShape?: Json;
  note?: string;
}

function record(res: HttpResponse<Json>, base: Partial<Result>): Result {
  const env = (res.json?.results ?? {}) as { error?: { code?: string }; data?: Json };
  const envStatus = (res.json as { status?: string } | null)?.status ?? "";
  const data = env.data ?? null;
  const ok = res.statusCode === 200 && envStatus.toUpperCase() === "SUCCESS";
  return {
    kind: "read",
    feature: "",
    method: "GET",
    path: "",
    ...base,
    httpStatus: res.statusCode,
    envStatus,
    errorCode: env.error?.code,
    ok,
    dataShape: data !== null ? shape(data) : undefined,
  };
}

const redactPath = (p: string) => p.replace(/=[^&]+/g, "=<redacted>");

async function main(): Promise<number> {
  const session = loadSession(SESSION_FILE);
  if (!session) {
    console.error(`no session at ${SESSION_FILE} — run the login first`);
    return 2;
  }
  const http = new HondaHttp(session.baseUrl);
  http.loadCookies(session.cookies);
  const oid = session.oid ?? "";

  const carList = await http.get<Json>("/car");
  const cars = (carList.json?.results as { data?: Json } | undefined)?.data;
  const car = Array.isArray(cars) ? (cars[0] as Record<string, Json>) : undefined;
  const carOid = car?.oid !== undefined ? String(car.oid) : undefined;
  console.log(
    `session oid=${oid}  carOid=${carOid ? "<found>" : "<none>"}  fire=[${FIRE.join(",")}]`,
  );

  const q = (params: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) s.set(k, v);
    const str = s.toString();
    return str ? `?${str}` : "";
  };

  const reads: { feature: string; path: string }[] = [
    { feature: "vehicle list", path: "/car" },
    { feature: "top page", path: `/car/topPage${q({ carOid })}` },
    { feature: "dashboard", path: `/car/dashboard${q({ carOid })}` },
    { feature: "car status", path: "/car/status" },
    { feature: "door status", path: `/car/status/door${q({ carOid })}` },
    { feature: "engine status", path: `/car/status/engine${q({ carOid })}` },
    { feature: "current location", path: `/car/currentLocation${q({ oid: carOid })}` },
    { feature: "finder location", path: `/car/finder/location${q({ carOid })}` },
    { feature: "geofence", path: `/car/geoFence${q({ carOid })}` },
    { feature: "car setting", path: `/car/setting${q({ carOid })}` },
    { feature: "next maintenance", path: `/car/nextMaintenance${q({ carOid })}` },
    { feature: "warnings", path: `/car/warning${q({ carOid })}` },
    { feature: "alert messages", path: "/car/alertMessages" },
    { feature: "car profile", path: `/car/profile${q({ uoid: oid })}` },
    { feature: "car default", path: "/car/default" },
    { feature: "profile", path: `/user/profile${q({ uoid: oid })}` },
    { feature: "emergency contact", path: "/emergencyContact" },
    { feature: "rating check", path: "/user/rating/check?preload=true" },
    { feature: "remaining service", path: "/user/deletion/remaining/service" },
    { feature: "payment instruction", path: "/message/paymentInstruction" },
    { feature: "messages", path: "/message" },
    { feature: "side menu", path: "/sideMenu" },
    { feature: "consent", path: "/consent/update" },
    {
      feature: "app version",
      path: "/app/version?osPlatform=IOS&apiVersion=2&currentVersion=1.2.7",
    },
  ];

  interface Command {
    name: string;
    risk: string;
    run: (h: HondaHttp, c: string) => Promise<HttpResponse<Json>>;
    path: string;
  }
  const commands: Command[] = [
    {
      name: "lock",
      risk: "locks the car",
      path: "POST /remote/doorLock command=allLock",
      run: (h, c) =>
        h.postForm("/remote/doorLock", { carOid: c, clientUUID: randomUUID(), command: "allLock" }),
    },
    {
      name: "unlock",
      risk: "UNLOCKS the car (security)",
      path: "POST /remote/doorLock command=doorUnlock",
      run: (h, c) =>
        h.postForm("/remote/doorLock", {
          carOid: c,
          clientUUID: randomUUID(),
          command: "doorUnlock",
        }),
    },
    {
      name: "horn",
      risk: "honks horn + flashes lights",
      path: "POST /remote/hornLight command=horn-lights",
      run: (h, c) =>
        h.postForm("/remote/hornLight", {
          carOid: c,
          clientUUID: randomUUID(),
          command: "horn-lights",
        }),
    },
    {
      name: "engine-start",
      risk: "STARTS the engine",
      path: "POST /remote/engine command=start",
      run: (h, c) =>
        h.postJson("/remote/engine", {
          carOid: c,
          clientUUID: randomUUID(),
          command: "start",
          vehicleControl: { acSetting: { acTempVal: "04", acDefSetting: "autoOn" } },
        }),
    },
    {
      name: "engine-stop",
      risk: "stops the engine",
      path: "POST /remote/engine command=stop",
      run: (h, c) =>
        h.postJson("/remote/engine", {
          carOid: c,
          clientUUID: randomUUID(),
          command: "stop",
          vehicleControl: { acSetting: { acTempVal: "04", acDefSetting: "autoOn" } },
        }),
    },
    {
      name: "engine-extend",
      risk: "extends a RUNNING engine session (no new start — avoids the 2-start cap)",
      path: "POST /remote/engine command=extend",
      run: (h, c) =>
        h.postJson("/remote/engine", {
          carOid: c,
          clientUUID: randomUUID(),
          command: "extend",
          vehicleControl: { acSetting: { acTempVal: "04", acDefSetting: "autoOn" } },
        }),
    },
    {
      name: "finder-ping",
      risk: "pings the car for its live location",
      path: "POST /car/finder/location",
      run: (h, c) => h.postJson("/car/finder/location", { carOid: c, clientUUID: randomUUID() }),
    },
  ];

  // When firing, keep the previously captured reads so the report stays complete.
  const results: Result[] =
    FIRE.length && existsSync(OUT)
      ? (JSON.parse(readFileSync(OUT, "utf8")).results as Result[]).filter((r) => r.kind === "read")
      : [];
  let serverErrors = 0;

  // When firing commands, skip the read sweep (reads were already captured).
  const readsToRun = FIRE.length ? [] : reads;
  for (const t of readsToRun) {
    let res: HttpResponse<Json>;
    try {
      res = await http.get<Json>(t.path);
    } catch (err) {
      results.push({
        kind: "read",
        feature: t.feature,
        method: "GET",
        path: redactPath(t.path),
        ok: false,
        note: err instanceof Error ? err.message : "request failed",
      });
      await sleep(DELAY_MS);
      continue;
    }
    const r = record(res, {
      kind: "read",
      feature: t.feature,
      method: "GET",
      path: redactPath(t.path),
    });
    results.push(r);
    console.log(
      `${r.ok ? "OK  " : "--  "} ${t.feature.padEnd(18)} http=${r.httpStatus} env=${r.envStatus || "-"} ${r.errorCode ?? ""}`,
    );

    if ((r.httpStatus ?? 0) >= 500 || r.httpStatus === 429) serverErrors++;
    else serverErrors = 0;
    if (serverErrors >= 2) {
      console.error("two server errors in a row — stopping to avoid rate limits");
      break;
    }
    if (["NO_LOGIN_SESSION", "INVALID_TOKEN"].includes(r.errorCode ?? "")) {
      console.error("session no longer valid — stopping. Re-run the login.");
      writeFileSync(OUT, JSON.stringify({ probedAt: new Date().toISOString(), results }, null, 2));
      return 1;
    }
    await sleep(DELAY_MS);
  }

  // Fire the requested commands in the exact HONDA_FIRE order (duplicates allowed).
  const byName = Object.fromEntries(commands.map((c) => [c.name, c]));
  for (const name of FIRE) {
    const c = byName[name];
    if (!c || !carOid) {
      console.log(`?? ${name} — unknown or no carOid; skipped`);
      continue;
    }
    console.log(`FIRE ${c.name} — ${c.risk}`);
    const res = await c.run(http, carOid);
    const r = record(res, {
      kind: "command",
      feature: c.name,
      method: "POST",
      path: c.path,
      risk: c.risk,
      fired: true,
    });
    results.push(r);
    console.log(`     -> http=${r.httpStatus} env=${r.envStatus || "-"} ${r.errorCode ?? ""}`);
    await sleep(DELAY_MS);
  }
  // Record the commands that were not fired.
  for (const c of commands) {
    if (!FIRE.includes(c.name)) {
      results.push({
        kind: "command",
        feature: c.name,
        method: "POST",
        path: c.path,
        risk: c.risk,
        fired: false,
        ok: false,
      });
    }
  }

  // Safety epilogue: after firing, confirm the car was left locked and off.
  if (FIRE.length && carOid) {
    console.log("\nwaiting 10s for the car to execute, then checking final state…");
    await sleep(10000);
    const door = await http.get<Json>(`/car/status/door?carOid=${carOid}`);
    await sleep(DELAY_MS);
    const engine = await http.get<Json>(`/car/status/engine?carOid=${carOid}`);
    const d = (door.json?.results as { data?: Record<string, Json> } | undefined)?.data ?? {};
    const e = (engine.json?.results as { data?: Record<string, Json> } | undefined)?.data ?? {};
    console.log("FINAL door status :", JSON.stringify(d.allDoors ?? d));
    console.log("FINAL engine status:", JSON.stringify(e.engine ?? e.remoteEngine ?? e));
  }

  writeFileSync(OUT, JSON.stringify({ probedAt: new Date().toISOString(), results }, null, 2));
  const okCount = results.filter((r) => r.kind === "read" && r.ok).length;
  const readCount = results.filter((r) => r.kind === "read").length;
  console.log(`\n${okCount}/${readCount} reads reachable. results -> ${OUT}`);
  return 0;
}

main()
  .then((c) => process.exit(c))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
