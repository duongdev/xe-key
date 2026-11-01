# @honda/mobile (Expo)

The Expo client — not scaffolded yet. Initialize it here:

```bash
# from repo root
pnpm create expo apps/mobile
# then add the shared client:
pnpm --filter @honda/mobile add @honda/core@workspace:*
```

Consume the API through `@honda/core` (`login`, `HondaHttp`, endpoints) — keep all
networking/auth logic in the package, not in screens.
