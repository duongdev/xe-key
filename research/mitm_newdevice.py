"""
mitmproxy addon: rewrite the app's deviceId to a FIXED fresh value on the wire,
so the server treats the phone as a new device and the app runs its native
device-change + OTP flow. Captures every request/response so we see the exact
verify call the real app makes.

Run:  FAKE_DEVICE_ID=$(uuidgen) mitmdump --mode regular --listen-port 8080 -s mitm_newdevice.py
Output: honda_capture.log (JSONL). No secrets stored (field names + whitelist only).
"""

import json
import os
import re
import uuid

from mitmproxy import http

HOSTS = ("aohondaconnect.com", "aoc-eks.iplass.jp", "aoc-cf.iplass.jp")
DEVICE_FIELDS = {"deviceId", "uid"}
FAKE = os.environ.get("FAKE_DEVICE_ID") or str(uuid.uuid4()).upper()
SAFE_FIELDS = {
    "deviceId", "uid", "appID", "appVersion", "osVersion", "osPlatform",
    "model", "manufacturer", "locale", "timeZone", "apiName", "carOid",
    "command", "clientUUID", "mobileNumber",
}
_HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(_HERE, "honda_capture.log")
_MULTIPART = re.compile(r'(name="([^"]+)"\r?\n\r?\n)(.*?)(\r?\n--)', re.S)

print(f"[mitm_newdevice] rewriting deviceId/uid -> {FAKE}")


def _rewrite(flow: http.HTTPFlow) -> list[str]:
    changed: list[str] = []
    ct = flow.request.headers.get("content-type", "")
    body = flow.request.get_text(strict=False) or ""
    if not body:
        return changed

    if "multipart/form-data" in ct:
        def sub(m):
            name = m.group(2)
            if name in DEVICE_FIELDS:
                changed.append(name)
                return f"{m.group(1)}{FAKE}{m.group(4)}"
            return m.group(0)
        new = _MULTIPART.sub(sub, body)
        if changed:
            flow.request.set_text(new)
    elif "application/json" in ct:
        try:
            j = json.loads(body)
            for k in list(j):
                if k in DEVICE_FIELDS:
                    j[k] = FAKE
                    changed.append(k)
            if changed:
                flow.request.set_text(json.dumps(j))
        except Exception:
            pass
    else:  # urlencoded
        form = flow.request.urlencoded_form
        for k in list(form):
            if k in DEVICE_FIELDS:
                form[k] = FAKE
                changed.append(k)
    return changed


def _extract(body: str, ct: str):
    names, safe = [], {}
    if not body:
        return names, safe
    if "multipart/form-data" in (ct or ""):
        for _, name, val, _ in _MULTIPART.findall(body):
            names.append(name)
            if name in SAFE_FIELDS:
                safe[name] = val.strip()
    else:
        try:
            from urllib.parse import parse_qs
            for k, v in parse_qs(body, keep_blank_values=True).items():
                names.append(k)
                if k in SAFE_FIELDS:
                    safe[k] = v[0] if len(v) == 1 else v
        except Exception:
            pass
    return names, safe


def request(flow: http.HTTPFlow) -> None:
    host = flow.request.pretty_host
    if not any(h in host for h in HOSTS):
        return
    changed = _rewrite(flow)
    names, safe = _extract(flow.request.get_text(strict=False) or "", flow.request.headers.get("content-type", ""))
    path = flow.request.path.split("?")[0]
    with open(LOG, "a") as f:
        f.write(json.dumps({
            "method": flow.request.method, "path": path, "field_names": names,
            "safe_fields": safe, "rewrote": changed,
        }, ensure_ascii=False) + "\n")
    tag = f"  REWROTE {changed}" if changed else ""
    print(f"[-> ] {flow.request.method} {path} {tag}")


def response(flow: http.HTTPFlow) -> None:
    host = flow.request.pretty_host
    if not any(h in host for h in HOSTS):
        return
    status = code = None
    try:
        j = json.loads(flow.response.get_text(strict=False) or "{}")
        status = j.get("status")
        err = (j.get("results") or {}).get("error")
        code = err.get("code") if isinstance(err, dict) else None
    except Exception:
        pass
    path = flow.request.path.split("?")[0]
    with open(LOG, "a") as f:
        f.write(json.dumps({
            "kind": "response", "method": flow.request.method, "path": path,
            "httpStatus": flow.response.status_code, "envStatus": status, "errorCode": code,
        }) + "\n")
    print(f"[<- ] {flow.request.method} {path} http={flow.response.status_code} env={status} {code or ''}")
