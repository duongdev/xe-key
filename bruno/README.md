# Honda CONNECT One — Bruno collection

API collection for [Bruno](https://www.usebruno.com/). Open this folder in Bruno.

## Setup
1. Select the **Vietnam** environment (top-right).
2. Fill its vars from your `research/honda_session.json`:
   - `cookie` → `JSESSIONID=...; iprmtkn=...` (join the cookies with `; `)
   - `carOid` → your vehicle's `oid` (from `GET /car`)
   - `oid` → your user `oid`
   - `phone`, `deviceId` → as used by the CLI
   - `clientUUID` → any UUID; regenerate per remote command
3. Run **Auth/login** first if you need a fresh session, then the reads.

Do not commit real values — edit the env locally or make a `Vietnam.local.bru` (gitignored).

## Folders
- **Auth** — login, verify code, OTP, logout.
- **Vehicle / User / System** — read-only endpoints.
- **Remote (danger)** — lock, unlock, horn, engine start/stop, finder ping. These send real
  commands to the car. Results show up in `/car/alertMessages` (category `command`); `W001(0)`
  means the car could not be reached. See research/FINDINGS.md Round 7.

Regenerate with `node research/build-bruno.mjs`.
