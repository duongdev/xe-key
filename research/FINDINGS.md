# Honda CONNECT One (APAC) — static analysis findings

APK: `Honda-CONNECT-One_1.2.7_apkcube.apk` (108 MB)
SHA-256: `e12dd7f7c98faec6f98f5947a87866d830f5f44161dfdf36df90f4bcad1966b5`
Source: apkcube mirror (third-party, unverified).

## Headline
This is **not** the same API as the EU `pymyhondaplus` app. It is a separate, **simpler**
APAC backend (`aohondaconnect.com`, iPLAss framework) covering Vietnam and 7 other
countries from one app. The EU reference (device-RSA keypair + magic-link + payload
encryption) does **not** apply here — build a fresh client.

## App identity
- Package / applicationId: `ao.co.honda.hconnect`
- Core code package: `th.co.honda.hconnect` (Thailand-origin codebase)
- Version: 1.2.7, compileSdk 36, native Android (Kotlin/Java, 6 dex) — no Flutter/RN
- Signer (declared, self-signed, **not** cryptographically verified): `CN=Honda Thailand, O=Honda Thailand, C=TH`, v3 scheme
- Native libs: `libheresdk.so` (HERE Maps), `libpl_droidsonroids_gif.so`

## Region selection
`BuildConfigHelper.getBaseUrl()` switches on `AppConfig.getUserCountry()`. Per-country host:

| Country | Base URL |
|---|---|
| **Vietnam** | `https://vietnam-mob.aohondaconnect.com/rest/command` |
| Indonesia | `https://indonesia-mob.aohondaconnect.com/rest/command` |
| Malaysia | `https://malaysia-mob.aohondaconnect.com/rest/command` |
| Philippines | `https://philippines-mob.aohondaconnect.com/rest/command` |
| Taiwan | `https://taiwan-mob.aohondaconnect.com/rest/command` |
| Korea | `https://korea-mob.aohondaconnect.com/rest/command` |
| New Zealand | `https://newzealand-mob.aohondaconnect.com/rest/command` |
| Australia | `https://australia-tz1-mob.aohondaconnect.com/rest/command` |

**Your host: `https://vietnam-mob.aohondaconnect.com/rest/command`**

## Transport (g3 = current generation)
- Retrofit + Gson + RxJava2 over OkHttp (`RetrofitFactory`, `MyOkHttpClient`).
- **Session = cookies** (persistent cookie jar in SharedPrefs, iPLAss `JSESSIONID`-style) +
  a remember-me `token` saved from responses (`saveRmToken`).
- Response envelope: iPLAss `IPlassResponse`. Error codes include `INVALID_TOKEN`,
  `NO_LOGIN_SESSION` (triggers up to 3 retries / re-auth).
- **No request-body encryption or signing** in transport. Plain form/JSON over TLS.
- Identity fields carried in requests: `uoid` (user id), `deviceId`, `token`.
- Timeouts 120s (matches TCU wake latency for remote commands).

## Auth contract (`REST_API.java`, all `application/x-www-form-urlencoded`)
```
POST /rest/command/auth/login        username, password, deviceId
POST /rest/command/auth/login        BIOMETRIC_REFRESH_TOKEN, deviceId   (biometric)
POST /rest/command/auth/verifyCode   code
POST /rest/command/auth/otp/verify   mobileNumber, OTP, deviceId, token
POST /rest/command/auth/preAppUser   token, deviceId, deviceLocale
POST /rest/command/auth/verifyEmail  email, firstName, ..., deviceId, deviceLocale, decryptToken
```
Generic calls: `doPOSTWithBody(@Url, @Body)` with `application/json`, `@Url`-relative paths
from the endpoint map below.

## Endpoint map (from `BuildConfig`)
- Auth: `/auth/login` `/auth/logout` `/auth/otp/verify` `/auth/verifyEmail` `/auth/verifyCode` `/auth/verificationCode` `/auth/resetPassword` `/auth/changePassword` `/auth/preAppUser`
- PIN: `/auth/pin/check` `/auth/pin/set` `/auth/pin/verify` `/auth/pin/reset` `/auth/pin/forget`
- Car: `/car/dashboard` `/car/toppage` `/car/image` `/car/status/door` `/car/status/engine` `/car/geoFence` `/car/setting` `/car/alertMessages` `/car/alertMessages/detail` `/car/maintenanceMode`
- Remote: `/remote/doorLock` `/remote/engine` `/remote/engineCancel` `/remote/hornLight` `/remote/carFinder` `/remote/wiFiSpot`
- Remote polling (async result): `/remote/pullDoorLockResult` `/remote/pullEngineResult` `/remote/pullEngineEvent` `/remote/pullHornLightResult` `/remote/pullWiFiSpotResult` `/pullCarFinderResult`
- User: `/user/profile?uoid=` `/user/agreement` `/user/image` `/user/wallpaper` `/user/event` `/user/emergencyContact`
- Misc: `/warning/getSpeedAlert` `/warning/setSpeedAlert` `/province` `/profession` `/ads` `/other/nonTcuPage`

## Still unknown (needs confirmation)
- Exact success-response JSON shape per endpoint (envelope fields, how `uoid`/`token`/cookies
  come back on login). Static shows the request contract; response bodies are built server-side.
- Whether remote commands need the PIN (`/auth/pin/verify`) before `/remote/*`.
- The HERE Maps access key/secret (in `BuildConfig`, `getHereAccessKey()` — pull if needed).

Confirm these either by reading the g3 repository/usecase classes deeper, or with one live
login capture. Given the simplicity (cookie session, no crypto), a Python `requests.Session`
client is straightforward: POST login, keep cookies, call `/car/*` and `/remote/*`.

## Deeper dig (round 2)

### Login response + session mechanics (confirmed from models)
- `POST /auth/login` (form: `username`, `password`, `deviceId`) returns the iPLAss envelope
  `{status, exceptionType, exceptionMessage, results:{data, error}}`.
- `results.data` (login) carries: `accessToken`, `oid` (user id = `uoid`), `car`, `email`,
  `phone`, `newUser`, `tcuUser`, `biometricRefreshToken`, `settings`, `wallpapers`, profile.
- Server sets cookies `JSESSIONID` (session) + `iprmtkn` (remember-me). The app reads
  `iprmtkn` out of `Set-Cookie` (`MyOkHttpClient.saveRmToken`) and stores it under SharedPrefs
  key `iprmtkn`. Subsequent calls authenticate by **cookie** (+ `uoid`/`deviceId`/`token`
  fields on specific calls).
- `deviceId` = Android `Settings.Secure.ANDROID_ID` (16 hex). A new/unknown deviceId usually
  forces an SMS OTP: `POST /auth/otp/verify` (`mobileNumber`, `OTP`, `deviceId`, `token`).
- No request signing or body encryption. TLS only. (Registration's `verifyEmail` carries a
  `decryptToken`, but normal login does not.)

### Remote engine request shape
`RemoteEngineRequest{ carOid, clientUUID, command, vehicleControl{ acSetting, startTimer{unit,value} } }`
POSTed as JSON to `/remote/engine`; async result polled at `/remote/pullEngineResult`.
Engine response `data{ X_Request_Id, message, timeOutInterval, timeUnit }` — **no remaining-
count field**.

### The "2 remote starts" limit — verdict: NOT client-side, cannot be unblocked from a client
Searched all 18k decompiled classes and the full string tables. There is **no** engine-start
counter, no "remaining starts" field, no `== 2` start gate, and no limit message anywhere in
the app or the API response models. The only `max_count` in the engine code is
`R.integer.engine_status_request_max_count` — a cap on how many times the app **polls** for
async status, unrelated to the start limit.

So the 2-consecutive-remote-start cap is enforced **below the app**: the vehicle's TCU/ECU
(the well-known Honda safety behavior — after 2 remote starts without the car being physically
driven, it refuses further remote starts until a real key-on/drive cycle re-arms it), relayed
as a failure through the cloud. There is nothing in the phone app or the HTTP API to patch or
flip — a custom client hitting `/remote/engine` a 3rd time gets the same TCU rejection, and
hammering it risks an abuse flag on the account.

**Reset condition: drive the car once** (or whatever the model's manual defines as the re-arm
condition — key-on, gear engaged, or door cycle). This is a hardware/safety limit in the TCU,
not an app lock — no client-side bypass exists.

## Login script
`honda_login.py` (stdlib only, no deps). Run it in a terminal, type the creds, and it saves
the session to
`honda_session.json`: cookies (`JSESSIONID`, `iprmtkn`), `access_token`, `oid`,
`device_id`, `biometric_refresh_token`. Handles the OTP challenge. `deviceId` persists in
`honda_device_id.txt`; set `HONDA_DEVICE_ID` to your phone's real `android_id` to avoid a fresh
registration/OTP.
```
python3 honda_login.py            # defaults to vietnam
python3 honda_login.py malaysia   # other region
```

### App-version gate (OLD_APP_BLOCK_LOGIN)
Login carries **no** version field. The only app signal is a request header the official
OkHttp clients add to every call: `app: OneApp` (g2 `HttpUtil`, g3 `MyOkHttpClient`; g3 also
uses `User-Agent: HConnect-OneApp`). A client without `app: OneApp` is treated as the
pre-rebrand old app and gets `{"status":"FAILURE","error":{"code":"OLD_APP_BLOCK_LOGIN"}}`.
The script now sends these headers. `/app/version?...&currentVersion=<versionName>` is only a
client-side update nudge, not the login gate.

Username on the Vietnam region is the **phone number**, not email (login field is still
`username`).

If the block persists with the headers set, the fallbacks are: POST `/user/device` once with a
current `appVersion` to refresh the server's record, or capture the real app's login headers to
diff.

## Device binding + the capture problem (open)

Live results from running the script against the VN API:
- `OLD_APP_BLOCK_LOGIN` → fixed by sending `app: OneApp` (+ UA `HConnect-OneApp`).
- Username is the **phone number**, not email.
- Then login returns `NEED_VERIFICATION_CODE`. The SMS reads "Mã OTP để thay đổi thiết bị"
  = **device-change OTP**. The account is single-device bound (currently to the user's iPhone).
- The app sends that code to `POST /auth/verifyCode` (field `code`, same cookie session:
  `AWSALB`, `AWSALBCORS`, `JSESSIONID`). In our script this returned
  `{"status":"FAILURE","results":{"data":null,"error":null}}` for the SMS codes — an empty
  failure we could not resolve statically. Likely the device-change OTP consumes a different
  endpoint/state than the plain login-verify code, OR the code was session/state-mismatched.
  Resolving this cleanly needs to see one real app exchange (interception).

Goal to keep the iPhone working alongside a script: reuse the **iPhone's `deviceId`** so the
server sees the same device (no device change, no OTP). The Android app derives it from
`Settings.Secure.ANDROID_ID`; the iOS value is unknown and is only revealed in the iOS app's
login POST body — so it must be captured live.

### Interception attempts (all blocked by a café/USB/cellular environment)
- **iOS TLS pinning:** the Android app pins only `*.aoc-eks.iplass.jp`, NOT the
  `*-mob.aohondaconnect.com` login host — so the login host should be interceptable.
- **WireGuard mode (mitmproxy) over USB-hotspot:** no handshake. iOS routes the excluded WG
  endpoint via the primary physical interface (cellular), so it can't reach the Mac's hotspot/USB
  IP `172.20.10.12`.
- **Tailscale exit-node + pf transparent redirect:** exit node approved, iPhone routed through
  the Mac (tx/rx climbing), pf `rdr` rules confirmed loaded, forwarding on — but mitmproxy caught
  nothing. `tcpdump -i utun6` showed only tailnet peer traffic, never the phone's forwarded `:443`
  flows → Tailscale's macsys network-extension forwards in **userspace, bypassing pf**. Dead end.
- Mac's only uplink here is the iPhone USB tether, which loops any "route phone through Mac" plan.

### Resume plan (needs a normal WiFi)
On a WiFi where Mac + iPhone are both connected (café WiFi failed to get an IP):
1. `mitmdump --mode regular --listen-port 8080 -s mitm_honda.py`
2. iPhone → that WiFi → Configure Proxy → Manual → `<Mac LAN IP>` : `8080`
3. Trust the mitm CA (`honda_mitm_ca.cer`, already generated) on the iPhone.
4. Honda app → log out → log in. The addon prints the iOS `deviceId` (password redacted).
5. `export HONDA_DEVICE_ID=<captured>` and run `honda_login.py` — same device, no OTP.

All scaffolding is saved: `mitm_honda.py` (redacting addon), `honda_mitm_ca.cer`, `honda_login.py`.
Clean up the one-off bits: `honda_wg_keys`, `honda_wg_client.conf`, `honda_wg_qr.png`,
`honda_pf.conf` (WireGuard/exit-node attempts, no longer needed).

## Round 3 — live command capture (iPhone) + corrections

_Note (2026-11-02): no log of this capture or of Round 4 is in the repo; the claims below that
the app source does not also support are unverified._

Captured the real app's commands via proxy. Static analysis had misled me twice:

- **Command values are the enum `toString()`, not the constant name:**
  `allLock` (lock), `doorUnlock` (unlock), `horn-lights` (horn+lights), `horn`, `lights`,
  `start`, `stop`, `extend`, `locate`, `wifi-on`/`wifi-off`. Door/horn are form POSTs; engine
  is a JSON body.
- **Engine body needs `vehicleControl.acSetting`** on start AND stop:
  `{command, clientUUID, carOid, vehicleControl:{acSetting:{acTempVal, acDefSetting}}}`.
  `acTempVal` is a **String** code: `"03"` high, `"04"` mid, `"05"` low. `acDefSetting`:
  `"autoOn"`/`"autoOff"`.
- **Commands only work when the car is awake.** A sleeping/out-of-signal TCU returns
  `COMMUNICATION_ERROR` (the app's "kết nối không ổn định"); the app retries/polls until it wakes.
  _Unverified (2026-11-02): no capture in the repo shows this code and the app source never
  names it. Live alert history shows `W001(0)` (no connection) and `W101` (timeout) instead —
  see Round 7._
- **Fresh status:** `GET /car/status/*` returns a cached snapshot. To force live data the app
  first POSTs `/car/access-screen` with `apiName` (e.g. `remote/engine`) + `status` (a code,
  `"1"`/`"2"`), which wakes the TCU; then the GET returns live state.
  _Corrected (2026-11-02): the app only logs this call's reply and never waits on it. `status`
  is `"1"` when the user confirms an action, `"2"` on cancel or failed auth; it is sent next to
  the command, not before it. It reads as an access/audit log; no wake effect is shown._

### The 2-remote-start cap — no client bypass
`resStartCounter` / `resRequester:"TCU"` come from the vehicle; there is **no client-side limit
check** in the app (confirmed by search). The cap is enforced by the car's TCU and only resets
by physically driving. The legitimate lever is **`extend`** (`command:"extend"` to `/remote/engine`)
— it prolongs a *running* session's timer without a new start, so you avoid *needing* a second
start. It does not reset the counter and is not a bypass of the safety limit.

## Round 4 — full live catalog (iPhone capture)

Verified live (all `200/SUCCESS` unless noted). Reads unless marked POST.

**Vehicle:** `/car`, `/car/topPage`, `/car/dashboard`, `/car/status`, `/car/status/door`,
`/car/status/engine`, `/car/finder/location` (read position), `/car/setting`,
`/car/nextMaintenance`, `/car/warning`, `/car/profile`, `/car/currentLocation`.
**Access log:** `POST /car/access-screen {apiName, status?}` (not a wake call — see Round 3 correction). apiName values:
`topPage, remote/engine, remote/doorLock, remote/hornLight, car/finder/location, alertMessages,
emergencyCall, locationSearch, tripRecent, tripSummary`.
**Trips/driving:** `/car/trip/recent` (drive log), `/car/trip/summary` (driving behaviour),
`/car/trip/detail?oid=&pinToken=`.
**Notifications:** `/message`; `POST /message/delete {"deleteItems":[{"oid":"..."}]}`.
**Subscription:** `/renew/servicePackageList`, `/renew/vehicleServicePackageDetail`.
**Account:** `/user/profile?uoid=`, `/emergencyContact`, `/user/rating/check`, `/auth/pin/get`,
`/auth/pin/check`, `/setting/common`, `/user/device` (POST push reg), `/consent/update`, `/sideMenu`.

**Remote commands (POST, command = enum toString):**
- `/remote/doorLock` form `command=allLock | doorUnlock`
- `/remote/hornLight` form `command=horn-lights | lights | horn` (no "off" — lights auto-off on a timeout)
- `/remote/engine` json `command=start | stop | extend` + `vehicleControl.acSetting{acTempVal,acDefSetting}`
- `/car/finder/location` json (POST) pings the TCU for live location (_the app never calls it;
  Find My Car only GETs the last position_)
All succeed only when the car is awake; a sleeping TCU returns `COMMUNICATION_ERROR` and the app
retries/polls (_unverified, see Round 3_).

## Round 5 — per-country matrix (static, 8 regions)

One codebase; per-country **config only** (selected by `AppConfig.getUserCountry()`). No
per-country endpoint/auth differences found — login, commands and reads are identical. The only
behavioral special-case is Korea's HERE map key.

| Country | Base host (`*-mob.aohondaconnect.com`) | Calling code | Lang | HERE map key (app, extracted) |
|---|---|---|---|---|
| Vietnam | vietnam-mob | +84 | vi | <redacted — extract from APK> |
| Indonesia | indonesia-mob | +62 | in | <redacted — extract from APK> |
| Malaysia | malaysia-mob | +60 | ms | <redacted — extract from APK> |
| Philippines | philippines-mob | +63 | en | <redacted — extract from APK> |
| New Zealand | newzealand-mob | +64 | en | <redacted — extract from APK> |
| Australia | australia-tz1-mob | +61 | en | <redacted — extract from APK> |
| Taiwan | taiwan-mob | +886 | zh | <redacted — extract from APK> |
| South Korea | korea-mob | +82 | ko | <redacted — extract from APK> |

- Username is the phone number across regions (all use calling codes); no email-only region found.
- `getServerUrl()` returns the same host without `/rest/command` (used for images / web links).
- HERE keys are the app's own map keys (geocoding / reverse-geocoding), bundled in `BuildConfig`;
  needed only for client-side map display, not for the API itself.
- Base URLs and metadata are in `@xekey/core` (`REGIONS`, `REGION_META`). Only Vietnam is
  verifiable live (the only account we have).

## Round 6 — device-change / onboarding flow (cracked via proxy deviceId rewrite)

Single-device account. Registering a new device does NOT drop an active session immediately
(no "signed-in-elsewhere" kick), but the next login on the old device needs re-verification.

Captured the real app completing a device change (by rewriting deviceId on the wire). The
**order matters** — our script failed because it skipped step 1:

1. `POST /user/device {uid=deviceId, deviceToken, appID, appVersion, osPlatform, osVersion, model, manufacturer, locale, timeZone}` — register the device + push token. **Required first.**
2. `POST /auth/login {username, password, deviceId}` -> `NEED_VERIFICATION_CODE` (server SMSes the code).
3. `POST /auth/verifyCode {code}` -> `SUCCESS` — **verifies the device only; does NOT log you in**
   (the app returns to the login screen). Without step 1 this returns an empty `FAILURE`.
4. `POST /auth/login {username, password, deviceId}` again -> `SUCCESS`, no OTP (device now registered).

So verifyCode is a device-verification step, not a session grant; a fresh login completes it.
`research/mitm_newdevice.py` rewrites `deviceId`/`uid` on the wire to force this flow for capture.

## Round 7 — live values (2026-11-02)

Read-only probe with real values (`HONDA_PROBE_BODIES=1 pnpm probe`, raw bodies kept in the
gitignored `research/probe-bodies.local.json`). One VN car, TCU gen 3. No personal data below.

**Car (`/car`):** `default` true; `color` is a paint code + local name (`"NH-883P Trắng ngà"`);
`carModel.modelName`/`name` are an internal code (`"VC5 883"`), not a model name;
`packageServiceCode` `8191` (all features); `isTcu` true; `tcuGen` `"3"`. No plate, licence or
odometer field in `/car`, `/car/profile` or `/car/topPage`. `name` is the user's nickname.

**`/car/topPage` `vehicleInfo`:** `fuel{unit:"%",value:15}`, `driveRange{unit:"km",value:87}`,
`cabinTemperature{unit:"c",value:26}`, `lockStatus` bool, `engineStatus` bool, `ignition` bool,
`RemoteEngineStatus` `"OFF"`, `batteryVoltage` `"14.9"` (string), `battLevel` `"Normal"`,
`maintenanceReminderLevel` `"OVER_DUE"`, `nextMaintenanceDate`/`lastTimeCall` epoch ms,
`nextMaintenanceMileage` number, `remainingDayToMaintenance`, `carLocation{latitude,longitude}`
(strings). `lastTimeCall` is the time of the car's last report.

**`/car/dashboard` `carStatus`:** `doors{allDoors:"Lock",tailgate:"Close",hood:"Close"}` — mixed
case, compare case-insensitively; `batteryVoltage{unit:"V",value:"14.9",battLevel}`,
`coolantTemperature{unit:"°C",value}`, `parkingBrake`/`transmission` `"Error"` on this car.

**`/car/status/door`:** same `allDoors/tailgate/hood` values. **`/car/status`:** all numbers `0`
on this car — not useful. **`/car/status/engine`:** `{engine:false, autoAC:true, ACDescription:"",
remoteEngine:{resTime:0, resStartCounter:1, resStatus:"OFF", resRequester:"NO"}}` — meaning of
`resStartCounter` still unknown (needs a reading after a start).

**`/car/finder/location` (GET):** `{latitude, longitude, time}` — numbers, `time` epoch ms.

**`/car/alertMessages?carOid=`:** 361 items, no paging. `category`/`warningType` ∈ `command`,
`diagnosis`. Delete: `DELETE /car/alertMessages?oid=&warningType=` (one) or
`POST /car/alertMessages {deleteItems:[{oid,warningType}]}` (many) — from the app source.
`command` items are the server's command results, in the user's language, e.g. lock/unlock
success, engine started/stopped, and these failures:

| Code | Meaning |
|---|---|
| `W001(0)` | cannot connect to the car, try later |
| `W101` | connection timed out / not allowed while the engine runs |
| `W003(12)` | only possible when the car is in Park |
| `W003(19)` | not possible now, contact the dealer |
| `RTS02(29)` | Start pressed max 2 times; start the engine with the key (the 2-start cap) |

**Still 500:** `/car/currentLocation`, `/car/geoFence`, `/car/default`, `/message/paymentInstruction`.

**App findings (2026-11-02, task 014):** `cabinTemperature.value` comes back `0` on a parked car — treat 0 as no reading. `resStartCounter` read `1` the morning after two remote starts; working guess: starts used since the last drive (`startsLeft = 2 − counter`), to confirm on the first real start in task 015. Alert dates are epoch ms in `createDate`; `name` uses `_` as a separator (`"Đèn cảnh báo _ACC"`).

**Remote commands, live (2026-11-02, task 015):**
- Lock (car already locked): POST `SUCCESS`; the car logged "Khóa cửa thành công" ~5 s later; `pullDoorLockResult` returned `SUCCESS` (empty data) when polled after the ~150 s wait.
- Engine start: confirmed by `/car/status/engine` `engine: true` within ~10 s; alert "Động cơ đã được khởi động".
- `resStartCounter` = remote starts used since the last drive (1 → 2 on this start; cap 2). `resStatus` `"ENGINE START IG RUN"`, `resRequester` `"TCU"` while running.
- `resTime` = whole minutes left, updated only with the car's reports (`lastTimeCall`, ~1/min while running) and unevenly (10, 8, 6, 5, 4, 3, 3, 1). The run ended ~10 min 20 s after the start alert; the car's report flips `engine` to `false`.

## Round 8 — trips without the PIN

- `GET /car/trip?day=D&month=M&year=Y` returns that day's trips with the session alone (the
  Android app also sends `uoid`; the server ignores it). Each row: `oid`, `tripStartTime`,
  `tripEndTime` (ms), `duration` (s), `mileage.value` (whole km, unit mislabelled "Km/h"),
  `avgSpeed`, `maxSpeed`, `fuelConsumption` (km/l), `dayDuration`/`nightDuration` (s),
  `accelPercentage`/`brakePercentage` (value null on our car).
- No place names or route here. The route (`tripRoute`, an encoded polyline) is only in
  `/car/trip/detail?oid=&pinToken=`; `/car/trip/recent` and `/car/trip/favorite` also need the PIN token.
- `/car/trip/summary?sumDay=1|7` → `INVALID_ARGUMENT`; the valid `sumDay` values are still unknown.

