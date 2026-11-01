"""
mitmproxy addon: capture the Honda app's deviceId and request shapes.

Records request field *names* plus a whitelist of device/app metadata values.

Run:  mitmdump --mode regular --listen-port 8080 -s mitm_honda.py
Output: honda_capture.log (JSONL) + honda_all_hosts.log (host heartbeat).
"""

import json
import os
import re
from urllib.parse import parse_qs

from mitmproxy import http

HOSTS = ("aohondaconnect.com", "aoc-eks.iplass.jp", "aoc-cf.iplass.jp")
# Only these values are safe to record; everything else keeps name only.
SAFE_FIELDS = {
    "deviceId", "uid", "appID", "appVersion", "osVersion", "osPlatform",
    "model", "manufacturer", "locale", "timeZone", "apiName", "carOid",
    "command", "clientUUID",  # remote-command fields (not sensitive)
}
_HERE = os.path.dirname(os.path.abspath(__file__))
LOGFILE = os.path.join(_HERE, "honda_capture.log")
ALLHOSTS = os.path.join(_HERE, "honda_all_hosts.log")

_MULTIPART = re.compile(r'name="([^"]+)"\r?\n\r?\n(.*?)\r?\n--', re.S)


def extract(body: str, content_type: str):
    """Return (field_names, safe_values) — never any secret value."""
    names, safe = [], {}
    if not body:
        return names, safe
    if "multipart/form-data" in (content_type or ""):
        for k, v in _MULTIPART.findall(body):
            names.append(k)
            if k in SAFE_FIELDS:
                safe[k] = v.strip()
    else:
        try:
            for k, vs in parse_qs(body, keep_blank_values=True).items():
                names.append(k)
                if k in SAFE_FIELDS:
                    safe[k] = vs[0] if len(vs) == 1 else vs
        except Exception:
            pass
    return names, safe


def request(flow: http.HTTPFlow) -> None:
    host = flow.request.pretty_host
    try:
        with open(ALLHOSTS, "a") as f:
            f.write(f"{flow.request.method} {host}\n")
    except Exception:
        pass
    if not any(h in host for h in HOSTS):
        return
    ct = flow.request.headers.get("content-type", "")
    names, safe = extract(flow.request.get_text(strict=False) or "", ct)
    device_id = safe.get("deviceId") or safe.get("uid") or flow.request.query.get("deviceId")
    rec = {
        "method": flow.request.method,
        "path": flow.request.path.split("?")[0],
        "query": dict(flow.request.query),
        "field_names": names,          # names only — no values
        "safe_fields": safe,           # whitelisted non-secret values only
        "deviceId": device_id,
        "app_header": flow.request.headers.get("app"),
        "user_agent": flow.request.headers.get("User-Agent"),
    }
    try:
        with open(LOGFILE, "a") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    except Exception:
        pass
    extra = f"  fields={names}" if names else ""
    print(f"[honda ->] {rec['method']} {rec['path']}{extra}")


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
    rec = {
        "kind": "response",
        "method": flow.request.method,
        "path": path,
        "httpStatus": flow.response.status_code,
        "envStatus": status,
        "errorCode": code,
    }
    try:
        with open(LOGFILE, "a") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    except Exception:
        pass
    print(f"[honda <-] {flow.request.method} {path} http={flow.response.status_code} env={status} {code or ''}")
