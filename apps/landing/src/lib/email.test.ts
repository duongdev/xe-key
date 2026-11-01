import { describe, expect, it } from "vitest";
import { isEmail } from "./email";

describe("isEmail", () => {
  it.each(["a@b.co", "an.nguyen@gmail.com", "  me@xekey.vn  ", "x+tag@sub.domain.io"])(
    "accepts %s",
    (s) => expect(isEmail(s)).toBe(true),
  );

  it.each(["", "   ", "abc", "a@b", "@b.co", "a@.co", "a b@c.co", "a@b c.co", "a@@b.co"])(
    "rejects %j",
    (s) => expect(isEmail(s)).toBe(false),
  );
});
