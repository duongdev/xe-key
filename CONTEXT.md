# CONTEXT — domain glossary

The single authority for vocabulary in this repo.

- **Honda CONNECT One** — Honda's APAC connected-car app (`ao.co.honda.hconnect`), one
  build serving 8 countries incl. Vietnam. The product we interoperate with.
- **Region** — a country whose API lives at `<country>-mob.aohondaconnect.com`. Selected
  at runtime; Vietnam is the default here. Only ever the Honda country.
- **Format** — how times and numbers are written (24h/12h, digit grouping). Follows the
  device's region setting unless overridden in the app. _Avoid:_ "region" for this.
- **iPLAss** — the Java backend framework behind the API. Replies are wrapped in an
  **envelope**: `{ status, results: { data, error } }`.
- **Bound device** — the one device an account is tied to. Signing in from a new
  deviceId makes it the bound device; the old one must pass a device-change OTP again.
- **deviceId** — the identifier the server binds a session/registration to. Android uses
  `ANDROID_ID`; the official iOS app uses an `identifierForVendor` UUID; Xe Key uses its
  own UUID kept in the Keychain (survives reinstall). A new deviceId triggers a
  **device-change OTP**; reusing a registered device's id avoids it.
- **Session** — cookie-based: `JSESSIONID` + `iprmtkn` (remember-me), plus `oid` (user
  id) and an `accessToken`. No payload encryption; TLS only.
- **TCU** — the car's telematics unit. Enforces hardware limits (e.g. max 2 consecutive
  remote engine starts) that no client can bypass.
- **`app: OneApp`** — the request header that marks the current app; without it the
  server returns `OLD_APP_BLOCK_LOGIN`.
- **research/** — the reverse-engineering record: static analysis sandbox, findings, and
  the original Python reference scripts.

## Car and its picture

- **Model** — Honda's name for the car (HR-V, Civic RS, City, CR-V, BR-V).
- **Body** — the drawn silhouette: `crossover`, `sedan`, `city`, `suv`, `mpv`. Each model
  has a default body; the user can override it. _Avoid:_ "model" for the silhouette.
- **Look** — how the car is drawn: `shaded`, `line`, or `photo` (Honda's own image).
- **Paint** — the body colour shown in the picture.

## Commands

- **Command** — a remote request to the car: lock, unlock, start, stop, extend, find.
- A command moves through these states:
  - **Sent** — the app posted it.
  - **Accepted** — the server took it and gave a time to wait for the result.
  - **Confirmed** — the result check after that wait reports success. Only a confirmed
    change alters the UI headline or car picture.
  - **Failed** — the result check reports anything else, or never comes back; nothing
    changed on the car as far as we know.
  _Avoid:_ "fire", "pending" as a state name.
- **Entitlement** — which commands the car's Honda CONNECT package allows (engine,
  lock, horn/light). A command the package does not allow is not offered.

## Messages

- **Alert** — a warning about the car (e.g. low battery, door open). Per car; can be deleted.
- **Notification** — a message from Honda to the user (news, service). Per user.
  _Avoid:_ "message" alone; say which one.
