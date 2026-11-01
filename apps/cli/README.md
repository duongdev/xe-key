# @xekey/cli

Command-line client for Honda CONNECT One. Ports `research/honda_login.py`.

```bash
# from repo root
pnpm cli                 # vietnam (default)
pnpm cli malaysia        # other region

# reuse a registered device so there's no device-change OTP:
HONDA_DEVICE_ID=<your-device-uuid> pnpm cli
```

Type your phone number + password at the prompt. The session (cookies + tokens) is saved
to `honda_session.json`, overridable with `HONDA_SESSION_FILE`.
