# Honda Connect ONE (Asia) — reverse engineering plan

Goal: build a better unofficial client for the Honda Connect ONE app used in the Asia
region. The EU app `pymyhondaplus` is the reference — same vendor, different region, so
the EU implementation is a near-complete map of what to expect and what to adapt.

## What the EU reference already tells you

From `~/personal/pymyhondaplus` (cloned):

| Thing | EU value | Expect to change for Asia |
|---|---|---|
| API host | `https://mobile-api.connected.honda-eu.com` | different host, e.g. `*-asia` or per-country |
| App package id | `com.honda_eu.connected.app` | Asia package id (find in APK manifest) |
| App version header | `applicationVersion: "3.0.0"` | Asia app version |
| User-Agent | `okhttp/4.12.0` | likely same (OkHttp) |
| Request crypto | AES-256-CBC payload + RSA/PKCS1 wrap of key+iv, server RSA pubkey **hardcoded in app** | new server pubkey + `keyId`; scheme may be identical |
| Device auth | per-device RSA-2048 keypair, `SHA256withRSA` challenge signing | likely same mechanism |
| MFA | email magic-link | likely same |
| Tokens | JWT access + refresh, `POST /auth/isv-prod/refresh` | same shape, maybe different `isv-*` provider id |
| Endpoints | `/auth/*`, `/tsp/*`, `/user/*` | mostly same families; confirm per endpoint |

So the real unknowns are: **host, package id, hardcoded server pubkey + keyId, and any
per-endpoint payload differences.** Everything else you adapt from the reference.

## Setup

REA 6.8.0 is already installed and wired to Claude Code. Remaining pieces:

### Required
- **Android platform-tools (adb)** — pull the APK off a device, and for live capture
  `brew install --cask android-platform-tools`
- **The Asian APK** — pull from a device that has the app installed (preferred, exact
  version), or download the regional build from APKMirror/APKPure and verify the signer
  with `rea inspect-apk-signature`.
- **apktool** — REA decodes resources/manifest with a caller-supplied apktool
  `brew install apktool`, then check with `rea inspect-apktool-client`
- **Python 3.12+ venv** — to run and fork `pymyhondaplus`

### For deeper decompile (recommended)
- **jadx-headless-mcp 0.7.1 JAR** — set `REA_JADX_MCP_JAR=/abs/path/to/jadx-headless-mcp.jar`.
  REA will not download it. Gives richer method decompilation than apktool alone.

### For live traffic capture (needed to confirm real request/response shapes)
- **A rooted device or an emulator** — Android Studio emulator with a **Google APIs**
  image (not Play), so it is rootable.
- **mitmproxy** — `brew install mitmproxy`; install its CA on the device.
- **Frida** — already present as a REA dependency. Push matching `frida-server` to the
  device for **SSL unpinning** (the app almost certainly pins TLS, so a plain proxy will
  fail until you unpin).
- *(optional)* **tshark/Wireshark** — only if you also grab a pcap.

## Sandbox (static phase)

A throwaway OrbStack container holds all static tooling. Nothing lands on the host except
this project dir.

- `Dockerfile` — Node 24.22.2, REA 6.8.0, apktool 2.9.3 (CVE-2024-21633 patched), jadx
  1.5.0, Java 21, Python 3.13.
- `./re` — control script:
  - `./re build` — build the image
  - `./re shell` — shell inside; `apk/` mounts read-only, `work/` is writable, **no network**
  - `./re run <cmd>` — one-shot command
  - `./re clean` — remove the image

Layout: drop the APK in `apk/`, analysis output goes to `work/`. Inside the container the
APK is at `/work/apk/<name>.apk` and REA output goes under `/work/work/`.

The container runs with `--network none` — static analysis is fully offline, so a malicious
APK cannot exfiltrate. If a REA command genuinely needs network, drop that flag in `re`.

### Teardown (zero leftovers)
```bash
./re clean                               # remove the image
rm -rf ~/personal/smart-honda-connect    # APK, output, fork, this doc — all of it
```
Nothing else touches the host. The dynamic phase (if used later) adds exactly one throwaway
AVD, deleted with `avdmanager delete avd honda-re-tmp`.

## Process

### Phase 1 — Static (APK), no device needed to start

Run all of this inside `./re shell`.
1. Get the APK onto disk (pull with `rea pull-adb-package`, or a verified download).
2. `rea identify-flutter-build <apk>` and `rea inspect-android-package <apk>` — find out
   the stack. **If it is Flutter/React Native**, the API logic is in a Dart/JS bundle, not
   Java classes — the decompile path is different (Dart snapshot / JS bundle), and REA's
   JS-bundle tooling is the right lane. Native-Android (Kotlin/Java) is the easy case.
3. `rea decode-android-resources <apk>` — manifest + strings. Grab the **package id** and
   any base URLs / config strings.
4. `rea search-android-classes <apk>` and `rea inspect-android-class` / `inspect-android-method`
   — locate the networking + crypto layer. Search for: the API host, `encryptedPayload`,
   `keyId`, `devicePublicKey`, OkHttp interceptors, the hardcoded RSA public key.
5. `rea trace-android-references` — trace from the host string / crypto constants to the
   call sites to confirm the request-building flow.
   Output: host, package id, app version, server pubkey + keyId, endpoint list.

### Phase 2 — Dynamic (confirm live shapes)
6. Boot the emulator, push `frida-server`, run mitmproxy as the proxy.
7. `rea instrument-with-frida` with an SSL-unpinning script, then drive the app (login,
   status, lock) so real HTTPS flows through mitmproxy.
8. `rea inspect-web-network-capture` on the mitmproxy dump (or `inspect-pcap-capture` on a
   pcap) — read exact request/response JSON per endpoint.
   Output: verified payloads to diff against the EU reference.

### Phase 3 — Build the client
9. Fork `pymyhondaplus`. Swap: `API_BASE`, `SERVER_PUBLIC_KEY_B64`,
   `AUTH_SERVER_PUBLIC_KEY_VERSION`, `applicationId`, `applicationVersion`, provider ids,
   locale/country defaults. Keep the device-key + encrypt_request machinery if the crypto
   scheme matches (likely).
10. Run `login` — it does email magic-link MFA.
11. Adjust each endpoint where Phase 2 showed a difference. Port the test suite.
