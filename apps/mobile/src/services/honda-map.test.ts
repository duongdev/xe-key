import { bodyFor, codeError, hondaUsername, paintFor, signInError } from "./honda-map";

describe("signInError", () => {
  it("maps server codes to sign-in states", () => {
    expect(signInError(200, "INVALID_CREDENTIAL")).toBe("wrong-credentials");
    expect(signInError(200, "OLD_APP_BLOCK_LOGIN")).toBe("app-blocked");
    expect(signInError(200, "USER_NOT_FOUND_IN_COUNTRY")).toBe("wrong-region");
    expect(signInError(200, "SOMETHING_NEW")).toBe("unknown");
    expect(signInError(200, undefined)).toBe("unknown");
  });
  it("treats 5xx and no reply as Honda down", () => {
    expect(signInError(502, undefined)).toBe("server-down");
    expect(signInError(0, undefined)).toBe("server-down");
  });
});

describe("codeError", () => {
  it("maps both invalid-code codes to wrong-code", () => {
    expect(codeError(200, "INVALID_VERIFICATION_CODE")).toBe("wrong-code");
    expect(codeError(200, "INVALID_OTP_VERIFICATION_CODE")).toBe("wrong-code");
    expect(codeError(503, undefined)).toBe("server-down");
    expect(codeError(200, "X")).toBe("unknown");
  });
});

describe("paintFor", () => {
  it("picks a paint from the colour words, Vietnamese or English", () => {
    expect(paintFor("NH-883P Trắng ngà").name).toBe("Platinum White");
    expect(paintFor("Crystal Black Pearl").name).toBe("Crystal Black");
    expect(paintFor("Đỏ").name).toBe("Ignite Red");
    expect(paintFor("Bạc").name).toBe("Lunar Silver");
    expect(paintFor("Xanh dương").name).toBe("Obsidian Blue");
  });
  it("falls back to gray", () => {
    expect(paintFor(undefined).name).toBe("Meteoroid Gray");
    expect(paintFor("Xám").name).toBe("Meteoroid Gray");
  });
});

describe("hondaUsername", () => {
  it("adds the trunk 0 for Vietnam (the account is stored as typed locally)", () => {
    expect(hondaUsername("vietnam", "979477635")).toBe("0979477635");
  });
  it("leaves other regions as entered", () => {
    expect(hondaUsername("malaysia", "123456789")).toBe("123456789");
  });
});

describe("bodyFor", () => {
  it("matches the model name inside the car name", () => {
    expect(bodyFor("CIVIC RS")).toBe("sedan");
    expect(bodyFor("Honda City")).toBe("city");
    expect(bodyFor("HRV e:HEV")).toBe("crossover");
    expect(bodyFor("cr-v")).toBe("suv");
  });
  it("falls back to crossover", () => {
    expect(bodyFor("My car")).toBe("crossover");
    expect(bodyFor(undefined)).toBe("crossover");
  });
});
