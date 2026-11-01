#!/usr/bin/env -S npx tsx
import { REGIONS, type Region } from "@honda/core";
import { runLogin } from "./login.js";

const region = (process.argv[2] ?? "vietnam").toLowerCase();

if (!(region in REGIONS)) {
  console.error(`unknown region '${region}'. choices: ${Object.keys(REGIONS).join(", ")}`);
  process.exit(2);
}

runLogin(region as Region)
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
