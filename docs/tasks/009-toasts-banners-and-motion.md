# 009 — build toasts, banners and motion polish

- **Status:** ready
- **Mode:** HITL
- **Estimate:** 0.5d
- **Depends on:** 005
- **Blocks:** none

## Goal

A toast and banner system and the eight signature animations match [Toasts.dc.html](../../apps/mobile/design/boards/Toasts.dc.html) and [Motion.dc.html](../../apps/mobile/design/boards/Motion.dc.html).

## Acceptance criteria

- [ ] Toast: top, under the Dynamic Island, 3 s (5 s with action), swipe up, never stacks, announced to VoiceOver.
- [ ] Banners stay until the condition clears (offline, window open, car asleep).
- [ ] Launch, lock confirmed, hold to arm, engine running, car answers, toast, car asleep, live data arrive animations implemented with Settle/Pop.
- [ ] Reduce Motion disables all of them except the hold fill.

## Test plan

### Layer 1 — Pure logic (TDD)

- [ ] Toast queue — replace not stack, timing with and without action.

### Layer 2 — Manual smoke (glue/IO)

n/a.

### Layer 3 — Visual review

- [ ] Screen recordings of each animation; Reduce Motion on and off.

## Out of scope

- Siri, widgets and Control Center ([Siri.dc.html](../../apps/mobile/design/boards/Siri.dc.html)) — separate native-extension task.

## Definition of Done

See [TEMPLATE.md](TEMPLATE.md#definition-of-done).
