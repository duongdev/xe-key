# @honda/core

TypeScript client for the Honda CONNECT One (APAC) API. Shared by the CLI and the
Expo app.

Plain REST over the iPLAss backend: session cookies (`JSESSIONID` + `iprmtkn`) +
the `app: OneApp` header. No payload encryption.

```ts
import { HondaHttp, baseUrl, login, verifyCode, buildSession } from "@honda/core";

const http = new HondaHttp(baseUrl("vietnam"));
const res = await login(http, phone, password, deviceId);
if (res.error.code === "NEED_VERIFICATION_CODE") {
  const v = await verifyCode(http, smsCode);
}
const session = buildSession(baseUrl("vietnam"), deviceId, res.data, http.cookiesObject());
```

See `../../research/FINDINGS.md` for how the API was mapped.
