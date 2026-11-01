# Learnings

Non-obvious things discovered while building. One bullet each.

- Remote command `command` values are the enum's `toString()`, NOT the constant name.
  `DoorLockType.LOCK`→`allLock`, `UNLOCK`→`doorUnlock`; `HornLightType.HORN_LIGHT`→`horn-lights`;
  `EngineType` → lowercase `start`/`stop` (+ `vehicleControl.acSetting` on both). Static enum
  constant names mislead — confirm wire values via `toString()` or a live capture.
