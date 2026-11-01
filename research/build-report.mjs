#!/usr/bin/env node
// Build a self-contained HTML coverage report from probe-results.json.
// Structure only (field names + types) — no account values are read or shown.
import { readFileSync, writeFileSync } from "node:fs";

const IN = process.argv[2] ?? "research/probe-results.json";
const OUT = process.argv[3] ?? "research/probe-report.html";
const { probedAt, results } = JSON.parse(readFileSync(IN, "utf8"));

// A call succeeded only if the envelope says SUCCESS (a body on FAILURE is not success).
const isOk = (r) => r.httpStatus === 200 && String(r.envStatus ?? "").toUpperCase() === "SUCCESS";
for (const r of results) r.ok = isOk(r);

const reads = results.filter((r) => r.kind === "read");
const commands = results.filter((r) => r.kind === "command");

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function badge(r) {
  if (r.kind === "command" && !r.fired) return `<span class="b skip">not fired</span>`;
  if (r.ok) return `<span class="b ok">ok</span>`;
  if (r.httpStatus >= 500) return `<span class="b fail">${r.httpStatus}</span>`;
  return `<span class="b warn">${esc(r.errorCode ?? r.envStatus ?? "error")}</span>`;
}

function topKeys(r) {
  const s = r?.dataShape;
  const obj = Array.isArray(s) ? s[1] : s;
  if (!obj || typeof obj !== "object") return "";
  return Object.keys(obj).map((k) => `<code>${esc(k)}</code>`).join(" ");
}

function readRow(r) {
  const note = r.ok
    ? topKeys(r)
    : r.httpStatus >= 500
      ? `<span class="muted">${r.httpStatus} — needs a param or no data</span>`
      : `<span class="muted">${esc(r.errorCode ?? r.note ?? "")}</span>`;
  return `<tr><td>${esc(r.feature)}</td><td>${badge(r)}</td><td><span class="path">${esc(`${r.method} ${r.path}`)}</span></td><td class="keys">${note}</td></tr>`;
}

function cmdRow(r) {
  const result = !r.fired
    ? `<span class="muted">not fired</span>`
    : r.ok
      ? `<span class="muted">executed</span>`
      : `<span class="muted">${esc(r.errorCode ?? "error")}</span>`;
  return `<tr><td>${esc(r.feature)}</td><td>${badge(r)}</td><td><span class="path">${esc(r.path)}</span></td><td class="keys">${esc(r.risk ?? "")} — ${result}</td></tr>`;
}

const okReads = reads.filter((r) => r.ok).length;
const firedOk = commands.filter((r) => r.fired && r.ok).length;
const firedTotal = commands.filter((r) => r.fired).length;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Honda CONNECT One — API probe</title>
<style>
  :root { --bg:#fff; --fg:#111; --muted:#777; --line:#e6e6e6; --card:#fafafa;
    --ok:#15803d; --okbg:#dcfce7; --warn:#92400e; --warnbg:#fef3c7; --fail:#b91c1c; --failbg:#fee2e2; --skip:#555; --skipbg:#eee; --code:#f1f5f9; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme=light]) {
    --bg:#0f1115; --fg:#e8e8ea; --muted:#9aa0a6; --line:#262a31; --card:#161922;
    --ok:#4ade80; --okbg:#064e3b; --warn:#fbbf24; --warnbg:#4a3410; --fail:#f87171; --failbg:#4c1d1d; --skip:#aaa; --skipbg:#23262d; --code:#1e232c; } }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--fg);
    font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; padding:24px 16px; }
  .wrap { max-width:940px; margin:0 auto; }
  h1 { font-size:22px; margin:0 0 4px; } h2 { font-size:16px; margin:28px 0 8px; }
  .sub { color:var(--muted); margin:0 0 18px; }
  .stat { display:flex; gap:12px; flex-wrap:wrap; margin:16px 0 8px; }
  .stat div { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px 14px; }
  .stat b { font-size:20px; } .stat span { color:var(--muted); font-size:12px; display:block; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  th,td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
  td:first-child { font-weight:600; white-space:nowrap; }
  .b { font-size:12px; font-weight:700; padding:2px 8px; border-radius:999px; }
  .ok{color:var(--ok);background:var(--okbg);} .warn{color:var(--warn);background:var(--warnbg);}
  .fail{color:var(--fail);background:var(--failbg);} .skip{color:var(--skip);background:var(--skipbg);}
  .path { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--muted); }
  .keys code, code { font-family:ui-monospace,Menlo,monospace; font-size:11px; background:var(--code); padding:1px 5px; border-radius:5px; margin:1px 2px 1px 0; display:inline-block; }
  .muted { color:var(--muted); }
  .warnbox { background:var(--warnbg); color:var(--warn); border-radius:10px; padding:10px 14px; font-size:13px; margin:8px 0 4px; }
  footer { margin-top:28px; color:var(--muted); font-size:12px; border-top:1px solid var(--line); padding-top:12px; }
</style></head>
<body><div class="wrap">
  <h1>Honda CONNECT One — API feature probe</h1>
  <p class="sub">Region: Vietnam · ${esc(new Date(probedAt).toLocaleString())}</p>
  <div class="stat">
    <div><b>${okReads}/${reads.length}</b><span>read features reachable</span></div>
    <div><b>${firedOk}/${firedTotal}</b><span>commands executed on the car</span></div>
    <div><b>${commands.length}</b><span>commands mapped</span></div>
  </div>

  <h2>Read endpoints</h2>
  <table>
    <thead><tr><th>Feature</th><th>Status</th><th>Endpoint</th><th>Response fields (names, no values)</th></tr></thead>
    <tbody>${reads.map(readRow).join("")}</tbody>
  </table>

  <h2>Remote commands</h2>
  <div class="warnbox">These actuate the vehicle. When fired, <code>COMMUNICATION_ERROR</code> means the server
    accepted the command but the car's TCU was unreachable (asleep / no signal) — nothing executed.</div>
  <table>
    <thead><tr><th>Command</th><th>Status</th><th>Endpoint</th><th>Effect — result</th></tr></thead>
    <tbody>${commands.map(cmdRow).join("")}</tbody>
  </table>

  <footer>
    Structure only — field <em>names</em> and types, never values. Reads are read-only, sequential, with
    back-off. Commands fire only when explicitly requested. Source: <code>research/probe-results.json</code>.
  </footer>
</div></body></html>`;

writeFileSync(OUT, html);
console.log(`report -> ${OUT}  (${okReads}/${reads.length} reads, ${firedOk}/${firedTotal} commands executed)`);
