#!/usr/bin/env python3
"""
Honda CONNECT One (APAC) login + token saver.

Saves the session (cookies + tokens) to ./honda_session.json. Stdlib only.

Contract recovered from the 1.2.7 APK (see FINDINGS.md):
  POST {BASE}/auth/login        username, password, deviceId   (form-urlencoded)
  POST {BASE}/auth/otp/verify   mobileNumber, OTP, deviceId, token
  envelope: {status, exceptionType, exceptionMessage, results:{data, error}}
  session: cookies JSESSIONID + iprmtkn (remember-me) set by server
"""

import getpass
import http.cookiejar
import json
import os
import secrets
import sys
import urllib.parse
import urllib.request

REGIONS = {
    "vietnam": "https://vietnam-mob.aohondaconnect.com/rest/command",
    "indonesia": "https://indonesia-mob.aohondaconnect.com/rest/command",
    "malaysia": "https://malaysia-mob.aohondaconnect.com/rest/command",
    "philippines": "https://philippines-mob.aohondaconnect.com/rest/command",
    "taiwan": "https://taiwan-mob.aohondaconnect.com/rest/command",
    "korea": "https://korea-mob.aohondaconnect.com/rest/command",
    "newzealand": "https://newzealand-mob.aohondaconnect.com/rest/command",
    "australia": "https://australia-tz1-mob.aohondaconnect.com/rest/command",
}

HERE = os.path.dirname(os.path.abspath(__file__))
SESSION_FILE = os.path.join(HERE, "honda_session.json")
DEVICE_FILE = os.path.join(HERE, "honda_device_id.txt")

# The server blocks any client that does not identify as the current app.
# g2/g3 OkHttp clients add header `app: OneApp` to every request; g3 also sets
# this User-Agent. Without `app: OneApp` the server returns OLD_APP_BLOCK_LOGIN.
HEADERS = {
    "app": "OneApp",
    "User-Agent": "HConnect-OneApp",
    "Accept": "application/json",
    "Accept-Encoding": "gzip",
}


def device_id() -> str:
    """Stable per-install id (android_id shape: 16 hex). Reused across runs.

    Set HONDA_DEVICE_ID to pin your phone's real android_id and avoid a fresh
    device registration (which usually forces an SMS OTP).
    """
    env = os.environ.get("HONDA_DEVICE_ID")
    if env:
        return env.strip()
    if os.path.exists(DEVICE_FILE):
        with open(DEVICE_FILE) as f:
            return f.read().strip()
    did = secrets.token_hex(8)  # 16 hex chars, like Settings.Secure.ANDROID_ID
    with open(DEVICE_FILE, "w") as f:
        f.write(did)
    return did


def get(opener, base: str, path: str) -> tuple[int, dict, str]:
    return _send(opener, urllib.request.Request(base + path, headers=HEADERS))


def post(opener, base: str, path: str, fields: dict) -> tuple[int, dict, str]:
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(base + path, data=data, headers={
        **HEADERS, "Content-Type": "application/x-www-form-urlencoded",
    })
    return _send(opener, req)


def _send(opener, req) -> tuple[int, dict, str]:
    try:
        resp = opener.open(req, timeout=120)
        raw, code, headers = resp.read(), resp.getcode(), resp.headers
    except urllib.error.HTTPError as e:
        raw, code, headers = e.read(), e.code, e.headers
    if headers.get("Content-Encoding", "").lower() == "gzip":
        import gzip
        raw = gzip.decompress(raw)
    text = raw.decode("utf-8", "replace")
    try:
        return code, json.loads(text), text
    except json.JSONDecodeError:
        return code, {}, text


def envelope(j: dict) -> tuple[dict, dict, str]:
    """Return (data, error, status) from the iPLAss envelope, null-safe."""
    results = (j or {}).get("results") or {}
    return results.get("data") or {}, results.get("error") or {}, (j or {}).get("status", "")


def cookies_as_dict(jar) -> dict:
    return {c.name: c.value for c in jar}


def save_session(base: str, did: str, data: dict, jar) -> None:
    ck = cookies_as_dict(jar)
    out = {
        "base_url": base,
        "device_id": did,
        "oid": data.get("oid"),
        "access_token": data.get("accessToken"),
        "biometric_refresh_token": data.get("biometricRefreshToken"),
        "email": data.get("email"),
        "tcu_user": data.get("tcuUser"),
        "jsessionid": ck.get("JSESSIONID"),
        "iprmtkn": ck.get("iprmtkn"),
        "cookies": ck,
    }
    with open(SESSION_FILE, "w") as f:
        json.dump(out, f, indent=2)
    os.chmod(SESSION_FILE, 0o600)


def main() -> int:
    region = (sys.argv[1] if len(sys.argv) > 1 else "vietnam").lower()
    if region not in REGIONS:
        print(f"unknown region '{region}'. choices: {', '.join(REGIONS)}")
        return 2
    base = REGIONS[region]
    did = device_id()

    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    print(f"region   : {region}\nendpoint : {base}\ndeviceId : {did}\n")
    # Your region logs in with the phone number as the username.
    username = input("Honda phone number (username): ").strip()
    password = getpass.getpass("Honda password: ")

    code, j, text = post(opener, base, "/auth/login",
                          {"username": username, "password": password, "deviceId": did})
    del password
    data, error, status = envelope(j)
    print(f"\nlogin HTTP {code}  status={status!r}")
    print(f"cookies  : {list(cookies_as_dict(jar))}")  # expect JSESSIONID here

    if code >= 500 or (not j and code != 200):
        print("Server returned a 5xx / non-JSON error (not a client bug). The server "
              "often does this after repeated attempts — wait ~1-2 min and retry once.")
        print("raw (first 400):", text[:400])
        return 1

    # Success: status SUCCESS (auth lives in the session cookie, not the body token).
    if status.upper() == "SUCCESS" or data.get("accessToken"):
        save_session(base, did, data, jar)
        print(f"logged in as oid={data.get('oid')}  tcuUser={data.get('tcuUser')}")
        print(f"session saved -> {SESSION_FILE}")
        return 0

    # Verification-code path: a new deviceId makes the server send a one-time
    # code (SMS/email). Enter it once; the deviceId is trusted afterwards, so
    # later runs log in straight away. Response of verifyCode IS the login data.
    if error.get("code", "").upper() == "NEED_VERIFICATION_CODE":
        print("\nVerification code required (new device). Check your SMS/email.")
        print("(press Enter on an empty prompt to resend the code)")
        while True:
            code_in = input("verification code: ").strip()
            if not code_in:
                rc, rj, rtext = get(opener, base, "/auth/verificationCode")  # resend is GET
                print(f"  resend HTTP {rc} status={(rj or {}).get('status')!r} {rtext[:120]}")
                continue
            vc, jv, vtext = post(opener, base, "/auth/verifyCode", {"code": code_in})
            datav, errorv, statusv = envelope(jv)
            print(f"verifyCode HTTP {vc}  status={statusv!r}  cookies={list(cookies_as_dict(jar))}")
            if statusv.upper() == "SUCCESS" or datav.get("oid") or datav.get("accessToken"):
                save_session(base, did, datav, jar)
                print(f"logged in as oid={datav.get('oid')}  tcuUser={datav.get('tcuUser')}")
                print(f"session saved -> {SESSION_FILE}")
                return 0
            print("  verify failed:", errorv.get("code"), errorv.get("message"))
            print("  raw (first 300):", vtext[:300])
            print("  try again, or Enter to resend.")

    # OTP path: server asks for SMS OTP (common on a new deviceId).
    otp_token = data.get("token") or (j.get("results") or {}).get("token")
    if error.get("code", "").upper().find("OTP") >= 0 or otp_token:
        print(f"OTP required (error={error.get('code')}). Check your SMS.")
        mobile = input("mobile number (as registered): ").strip()
        otp = input("OTP code: ").strip()
        code, j2, _ = post(opener, base, "/auth/otp/verify", {
            "mobileNumber": mobile, "OTP": otp, "deviceId": did,
            "token": otp_token or "",
        })
        data2, error2, status2 = envelope(j2)
        print(f"otp/verify HTTP {code}  status={status2!r}")
        if data2.get("accessToken") or data2.get("oid"):
            save_session(base, did, data2, jar)
            print(f"session saved -> {SESSION_FILE}")
            return 0
        print("OTP verify did not return a session. Raw error:", error2)
        return 1

    # Unknown response: dump it (no secrets involved) so we can adapt the parser.
    print("Login did not succeed and no OTP challenge detected.")
    print("status/error:", status, error)
    print("raw (first 800 chars):", text[:800])
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
