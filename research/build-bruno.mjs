#!/usr/bin/env node
// Generate a Bruno API collection for the Honda CONNECT One (APAC) API.
// No secrets are written — values come from Bruno environment variables you fill in.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.argv[2] ?? "bruno";

const COMMON_HEADERS = { app: "OneApp", "User-Agent": "HConnect-OneApp", Cookie: "{{cookie}}" };

// folder, name, method, url (after baseUrl), body spec, docs
const E = [
  // Auth
  ["Auth", "login", "post", "/auth/login", { form: { username: "{{phone}}", password: "{{password}}", deviceId: "{{deviceId}}" } }],
  ["Auth", "verify code", "post", "/auth/verifyCode", { form: { code: "" } }],
  ["Auth", "otp verify", "post", "/auth/otp/verify", { form: { mobileNumber: "{{phone}}", OTP: "", deviceId: "{{deviceId}}", token: "" } }],
  ["Auth", "logout", "post", "/auth/logout", { form: { deviceId: "{{deviceId}}" } }],
  // Vehicle (reads)
  ["Vehicle", "vehicle list", "get", "/car", {}],
  ["Vehicle", "top page", "get", "/car/topPage?carOid={{carOid}}", {}],
  ["Vehicle", "dashboard", "get", "/car/dashboard?carOid={{carOid}}", {}],
  ["Vehicle", "car status", "get", "/car/status", {}],
  ["Vehicle", "door status", "get", "/car/status/door?carOid={{carOid}}", {}],
  ["Vehicle", "engine status", "get", "/car/status/engine?carOid={{carOid}}", {}],
  ["Vehicle", "current location", "get", "/car/currentLocation?oid={{carOid}}", {}],
  ["Vehicle", "finder location", "get", "/car/finder/location?carOid={{carOid}}", {}],
  ["Vehicle", "geofence", "get", "/car/geoFence?carOid={{carOid}}", {}],
  ["Vehicle", "car setting", "get", "/car/setting?carOid={{carOid}}", {}],
  ["Vehicle", "next maintenance", "get", "/car/nextMaintenance?carOid={{carOid}}", {}],
  ["Vehicle", "warnings", "get", "/car/warning?carOid={{carOid}}", {}],
  ["Vehicle", "alert messages", "get", "/car/alertMessages", {}],
  ["Vehicle", "car profile", "get", "/car/profile?uoid={{oid}}", {}],
  // User
  ["User", "profile", "get", "/user/profile?uoid={{oid}}", {}],
  ["User", "emergency contact", "get", "/emergencyContact", {}],
  ["User", "rating check", "get", "/user/rating/check?preload=true", {}],
  ["User", "remaining service", "get", "/user/deletion/remaining/service", {}],
  // System
  ["System", "messages", "get", "/message", {}],
  ["System", "side menu", "get", "/sideMenu", {}],
  ["System", "consent", "get", "/consent/update", {}],
  ["System", "app version", "get", "/app/version?osPlatform=IOS&apiVersion=2&currentVersion=1.2.7", {}],
  ["System", "setting common", "get", "/setting/common", {}],
  // Vehicle extras (verified live)
  ["Vehicle", "finder location (read)", "get", "/car/finder/location?carOid={{carOid}}", {}],
  ["Vehicle", "current location", "get", "/car/currentLocation?oid={{carOid}}", {}],
  ["Vehicle", "next maintenance", "get", "/car/nextMaintenance?carOid={{carOid}}", {}],
  ["Vehicle", "warnings", "get", "/car/warning?carOid={{carOid}}", {}],
  ["Vehicle", "car profile", "get", "/car/profile?uoid={{oid}}", {}],
  // Trips / driving
  ["Trips", "recent trips", "get", "/car/trip/recent", {}],
  ["Trips", "trip summary", "get", "/car/trip/summary?sumDay=7&uoid={{oid}}", {}],
  ["Trips", "trip detail", "get", "/car/trip/detail?oid={{tripOid}}&pinToken={{pinToken}}", {}],
  // Notifications
  ["Notifications", "delete message", "post", "/message/delete", { json: { deleteItems: [{ oid: "{{messageOid}}" }] } }],
  // Subscription
  ["Subscription", "service package list", "get", "/renew/servicePackageList", {}],
  ["Subscription", "vehicle package detail", "get", "/renew/vehicleServicePackageDetail", {}],
  // PIN
  ["Auth", "pin get", "get", "/auth/pin/get", {}],
  ["Auth", "pin check", "get", "/auth/pin/check", {}],
  // Remote commands — actuate the car
  ["Remote (danger)", "lock", "post", "/remote/doorLock", { form: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "allLock" }, danger: "Locks the car." }],
  ["Remote (danger)", "unlock", "post", "/remote/doorLock", { form: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "doorUnlock" }, danger: "UNLOCKS the car." }],
  ["Remote (danger)", "horn and lights", "post", "/remote/hornLight", { form: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "horn-lights" }, danger: "Honks the horn and flashes the lights." }],
  ["Remote (danger)", "lights only", "post", "/remote/hornLight", { form: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "lights" }, danger: "Flashes the lights (auto-off, no explicit off command)." }],
  ["Remote (danger)", "horn only", "post", "/remote/hornLight", { form: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "horn" }, danger: "Honks the horn." }],
  ["Remote (danger)", "engine start", "post", "/remote/engine", { json: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "start", vehicleControl: { acSetting: { acTempVal: "04", acDefSetting: "autoOn" } } }, danger: "STARTS the engine. Max 2 consecutive starts (TCU limit)." }],
  ["Remote (danger)", "engine stop", "post", "/remote/engine", { json: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "stop", vehicleControl: { acSetting: { acTempVal: "04", acDefSetting: "autoOn" } } }, danger: "Stops the engine." }],
  ["Remote (danger)", "engine extend", "post", "/remote/engine", { json: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}", command: "extend", vehicleControl: { acSetting: { acTempVal: "04", acDefSetting: "autoOn" } } }, danger: "Extends a RUNNING engine session (no new start)." }],
  ["Remote (danger)", "finder ping", "post", "/car/finder/location", { json: { carOid: "{{carOid}}", clientUUID: "{{clientUUID}}" }, danger: "Pings the car for its live location." }],
  // Fresh-status: POST access-screen (wakes the TCU) before reading /car/status/*
  ["Vehicle", "wake (access-screen)", "post", "/car/access-screen", { form: { apiName: "remote/engine", status: "2" }, danger: "Wakes the TCU so the next status read is live." }],
];

function headersBlock() {
  const lines = Object.entries(COMMON_HEADERS).map(([k, v]) => `  ${k}: ${v}`);
  return `headers {\n${lines.join("\n")}\n}`;
}

function bodyBlocks(method, body) {
  if (body.form) {
    const kv = Object.entries(body.form).map(([k, v]) => `  ${k}: ${v}`).join("\n");
    return { bodyType: "formUrlEncoded", block: `body:form-urlencoded {\n${kv}\n}` };
  }
  if (body.json) {
    return { bodyType: "json", block: `body:json {\n${JSON.stringify(body.json, null, 2)}\n}` };
  }
  return { bodyType: "none", block: "" };
}

function bru(e, seq) {
  const [, name, method, url, body] = e;
  const { bodyType, block } = bodyBlocks(method, body);
  const parts = [
    `meta {\n  name: ${name}\n  type: http\n  seq: ${seq}\n}`,
    `${method} {\n  url: {{baseUrl}}${url}\n  body: ${bodyType}\n  auth: none\n}`,
    headersBlock(),
  ];
  if (block) parts.push(block);
  if (body.danger) parts.push(`docs {\n  WARNING: ${body.danger} This sends a real command to the vehicle.\n}`);
  return `${parts.join("\n\n")}\n`;
}

// Write collection
mkdirSync(ROOT, { recursive: true });
writeFileSync(
  join(ROOT, "bruno.json"),
  `${JSON.stringify({ version: "1", name: "Honda CONNECT One", type: "collection", ignore: ["node_modules", ".git"] }, null, 2)}\n`,
);

mkdirSync(join(ROOT, "environments"), { recursive: true });
writeFileSync(
  join(ROOT, "environments", "Vietnam.bru"),
  `vars {
  baseUrl: https://vietnam-mob.aohondaconnect.com/rest/command
  cookie: PASTE JSESSIONID=...; iprmtkn=... from honda_session.json
  carOid: PASTE your carOid
  oid: PASTE your user oid
  phone: PASTE your phone number
  deviceId: PASTE your deviceId
  password:
  clientUUID: generate-a-uuid-per-command
}
`,
);

const seqByFolder = {};
for (const e of E) {
  const [folder] = e;
  seqByFolder[folder] = (seqByFolder[folder] ?? 0) + 1;
  const file = join(ROOT, folder, `${e[1]}.bru`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bru(e, seqByFolder[folder]));
}

console.log(`bruno collection -> ${ROOT}/  (${E.length} requests)`);
