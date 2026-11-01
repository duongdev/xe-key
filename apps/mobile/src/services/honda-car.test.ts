import { toAlerts, toCarStatus } from "./honda-car";

// Values shaped like the live probe (research/FINDINGS.md Round 7); personal data is made up.
const raw = {
  car: { oid: "c1", name: "CIVIC RS", color: "NH-883P Trắng ngà", isExpired: false },
  top: {
    unreadAlertMessages: 9,
    vehicleInfo: {
      fuel: { unit: "%", value: 15 },
      driveRange: { unit: "km", value: 87 },
      cabinTemperature: { unit: "c", value: 26 },
      batteryVoltage: "12.6",
      lastTimeCall: 1_793_544_550_000,
    },
  },
  door: { allDoors: "Lock", tailgate: "Close", hood: "Close" },
  engine: {
    engine: false,
    remoteEngine: { resTime: 0, resStartCounter: 1, resStatus: "OFF", resRequester: "NO" },
  },
  finder: { latitude: 10.79, longitude: 106.72, time: 1_793_557_886_000 },
};

describe("toCarStatus", () => {
  it("maps a parked, locked car", () => {
    const s = toCarStatus(raw);
    expect(s).toMatchObject({
      model: "CIVIC RS",
      plate: null,
      doors: "locked",
      engine: { on: false },
      startsLeft: 1,
      cabinC: 26,
      fuelPct: 15,
      rangeKm: 87,
      batteryV: 12.6,
      odometerKm: null,
      serviceInKm: null,
      alerts: 9,
      updatedAt: 1_793_544_550_000,
      account: "ok",
    });
    expect(s.body).toEqual({
      doorsOpen: null,
      anyDoorOpen: false,
      windowsCm: null,
      trunkOpen: false,
      hoodOpen: false,
    });
    expect(s.location).toEqual({
      name: null,
      area: null,
      lat: 10.79,
      lng: 106.72,
      distanceKm: null,
      accuracyM: null,
      at: 1_793_557_886_000,
    });
  });

  it("reads door states case-insensitively; OPEN is unlocked with a door open", () => {
    const s = toCarStatus({ ...raw, door: { allDoors: "OPEN", tailgate: "open", hood: "Close" } });
    expect(s.doors).toBe("unlocked");
    expect(s.body.anyDoorOpen).toBe(true);
    expect(s.body.trunkOpen).toBe(true);
  });

  it("ends a run resTime minutes (rounded up) after the car's report, minus half a minute", () => {
    // Live: report 02:33:56 with resTime 3; the car turned off at about 02:37:00.
    const on = { ...raw, engine: { engine: true, remoteEngine: { resTime: 3 } } };
    const at = raw.top.vehicleInfo.lastTimeCall;
    expect(toCarStatus(on).engine).toEqual({ on: true, endsAt: at + 180_000 - 30_000 });
  });

  it("runs the engine for 10 min from the last report when Honda gives no end time", () => {
    const s = toCarStatus({ ...raw, engine: { engine: true, remoteEngine: { resTime: 0 } } });
    expect(s.engine).toEqual({ on: true, endsAt: 1_793_544_550_000 + 600_000 });
  });

  it("survives missing blocks", () => {
    const s = toCarStatus({ car: {}, top: {}, door: {}, engine: {}, finder: {} });
    expect(s.model).toBe("Honda");
    expect(s.location).toBeNull();
    expect(s.startsLeft).toBeNull();
    expect(s.batteryV).toBeNull();
  });

  it("treats a 0 cabin temperature as no reading", () => {
    const top = {
      vehicleInfo: { ...raw.top.vehicleInfo, cabinTemperature: { unit: "c", value: 0 } },
    };
    expect(toCarStatus({ ...raw, top }).cabinC).toBeNull();
  });

  it("reads the Entitlement bitmask (16 engine, 32 lock); no code means all", () => {
    expect(toCarStatus(raw).can).toEqual({ lock: true, engine: true });
    const only = (code: number) =>
      toCarStatus({ ...raw, car: { ...raw.car, packageServiceCode: code } }).can;
    expect(only(32)).toEqual({ lock: true, engine: false });
    expect(only(16)).toEqual({ lock: false, engine: true });
  });

  it("marks an expired package", () => {
    expect(toCarStatus({ ...raw, car: { ...raw.car, isExpired: true } }).account).toBe("expired");
  });
});

describe("toAlerts", () => {
  const messages = [
    {
      oid: "1",
      warningType: "command",
      category: "command",
      read: false,
      name: "Khóa cửa",
      description: "Khóa cửa thành công",
      createDate: 3,
    },
    {
      oid: "2",
      warningType: "command",
      category: "command",
      read: true,
      name: "Nổ máy",
      description: "W001(0): Không thể thiết lập kết nối",
      createDate: 2,
    },
    {
      oid: "3",
      warningType: "diagnosis",
      category: "diagnosis",
      read: true,
      name: "Đèn cảnh báo _ACC",
      description: "1. Đèn...",
      createDate: 1,
    },
  ];
  it("keeps Honda's text, flags failed commands, keeps the delete key, and only warnings are unread", () => {
    expect(toAlerts({ messages })).toEqual([
      {
        id: "command:1",
        kind: "command",
        at: 3,
        unread: false,
        title: "Khóa cửa",
        text: "Khóa cửa thành công",
        ok: true,
      },
      {
        id: "command:2",
        kind: "command",
        at: 2,
        unread: false,
        title: "Nổ máy",
        text: "W001(0): Không thể thiết lập kết nối",
        ok: false,
      },
      {
        id: "diagnosis:3",
        kind: "diagnosis",
        at: 1,
        unread: false,
        title: "Đèn cảnh báo ACC",
        text: "1. Đèn...",
        ok: undefined,
      },
    ]);
  });
  it("is empty when Honda sends nothing", () => {
    expect(toAlerts({})).toEqual([]);
  });
});
