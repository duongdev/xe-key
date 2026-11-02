import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

// The tour draws the app's screens with the app's own words. These files are copies because the
// landing Docker build only gets the landing app; this test fails when the app's copy changes.
describe("app strings copy", () => {
  for (const file of ["en.ts", "vi.ts"]) {
    it(`${file} matches apps/mobile/src/i18n/${file}`, () => {
      expect(read(`./${file}`)).toBe(read(`../../../mobile/src/i18n/${file}`));
    });
  }
});
