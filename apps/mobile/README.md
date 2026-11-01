# @xekey/mobile — Xe Key

Expo app. Runs in Expo Go on the iOS Simulator.

```bash
pnpm --filter @xekey/mobile start   # Metro + opens the iOS Simulator
pnpm --filter @xekey/mobile test
pnpm --filter @xekey/mobile typecheck
```

Consume the API through `@xekey/core` — keep all networking/auth logic in the package, not in screens.
