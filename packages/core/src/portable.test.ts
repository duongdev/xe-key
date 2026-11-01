import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(import.meta.dirname, ".");

// ADR 0003: the package root must bundle in React Native. Node-only code lives in src/node/.
describe("package root is runtime-agnostic", () => {
  const files = readdirSync(SRC).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

  it.each(files)("%s imports no Node built-ins and reads no process env", (file) => {
    const code = readFileSync(join(SRC, file), "utf8");
    expect(code).not.toMatch(/from\s+["']node:/);
    expect(code).not.toMatch(/\bprocess\.env\b/);
  });
});
