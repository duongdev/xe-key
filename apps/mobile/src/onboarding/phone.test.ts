import { formatVnPhone, maskPhone, normalizeVnPhone } from "./phone";

describe("normalizeVnPhone", () => {
  it.each([
    ["0901234567", "901234567"],
    ["090 123 4567", "901234567"],
    ["+84 90 123 4567", "901234567"],
    ["84901234567", "901234567"],
    ["901234567", "901234567"],
    ["(090) 123-4567", "901234567"],
  ])("normalises %s", (raw, out) => {
    expect(normalizeVnPhone(raw)).toBe(out);
  });

  it.each(["", "12345", "0101234567", "09012345678", "abc"])("rejects %s", (raw) => {
    expect(normalizeVnPhone(raw)).toBeNull();
  });
});

describe("formatVnPhone", () => {
  it("groups as 2-3-4 while typing", () => {
    expect(formatVnPhone("9")).toBe("9");
    expect(formatVnPhone("901")).toBe("90 1");
    expect(formatVnPhone("90123")).toBe("90 123");
    expect(formatVnPhone("901234567")).toBe("90 123 4567");
  });

  it("drops the +84 country code from AutoFill", () => {
    expect(formatVnPhone("+84 97 947 7635")).toBe("97 947 7635");
    expect(formatVnPhone("+84979477635")).toBe("97 947 7635");
    expect(formatVnPhone("84979477635")).toBe("97 947 7635");
  });

  it("keeps a real number that starts with 84 (Vinaphone 084)", () => {
    expect(formatVnPhone("843123456")).toBe("84 312 3456");
  });

  it("drops a leading 0 and caps at 9 digits", () => {
    expect(formatVnPhone("0901234567")).toBe("90 123 4567");
    expect(formatVnPhone("9012345678")).toBe("90 123 4567");
  });
});

describe("maskPhone", () => {
  it("shows only the last four digits", () => {
    expect(maskPhone("901234567")).toBe("•••• 4567");
  });
});
