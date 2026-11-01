# 017 — lost session, Face ID password lock, launch and alert polish

- **Status:** done
- **Mode:** AFK
- **Estimate:** 0.5d
- **Depends on:** 013, 014, 016
- **Blocks:** none

## Goal

A session that can't be restored shows Home's signed-out screen; the Face ID setting puts the stored Honda password behind Face ID (ADR 0005); deep links skip the launch animation; the Alerts list agrees with Honda's badge and opens with data.

## Acceptance criteria

- [x] Lost session (re-login fails) → Home's signed-out state, disk cache dropped; a new sign-in loads the car fresh.
- [x] Face ID setting on → password stored with `requireAuthentication`; off → asks Face ID first; a cancelled Face ID during re-login counts as signed out.
- [x] Cold start into any route other than Home skips the launch animation.
- [x] Only unread warning lights count as unread alerts (Honda never clears command results); Home prefetches alerts.

## Test plan

### Layer 1 — Pure logic (TDD)

- [x] Alerts: command results are never unread.

### Layer 2 — Manual smoke (glue/IO)

- [ ] Lost session on a real account (needs a password change or another device).
- [ ] Face ID lock/unlock on a device with Face ID enrolled.
- [ ] Deep link cold start (Expo Go ignores the path on cold start; needs a dev build).

### Layer 3 — Visual review

n/a.

## Notes

- Dropped: cancelling an in-flight command at Honda. `/remote/engineCancel` (`API_CANCEL_DELAY_START_ENGINE`) cancels a scheduled delayed start, not a pending command; Cancel only stops waiting.
- Honda badge = `unreadAlertMessages` (9 live) = unread `diagnosis` alerts; 346 command results stay `read: false` forever.
