/** API paths (relative to the region base URL). Verified by static analysis + live capture. */
export const ENDPOINTS = {
  // auth
  login: "/auth/login",
  logout: "/auth/logout",
  verifyCode: "/auth/verifyCode",
  verificationCode: "/auth/verificationCode", // resend (GET)
  otpVerify: "/auth/otp/verify",
  preAppUser: "/auth/preAppUser",
  verifyEmail: "/auth/verifyEmail",
  // pin
  pinCheck: "/auth/pin/check",
  pinGet: "/auth/pin/get",
  pinSet: "/auth/pin/set",
  pinVerify: "/auth/pin/verify",
  pinReset: "/auth/pin/reset",
  pinForget: "/auth/pin/forget",
  // vehicle (reads)
  car: "/car",
  dashboard: "/car/dashboard",
  topPage: "/car/topPage",
  carStatus: "/car/status",
  doorStatus: "/car/status/door",
  engineStatus: "/car/status/engine",
  currentLocation: "/car/currentLocation",
  finderLocation: "/car/finder/location", // GET = read position, POST = ping TCU
  geoFence: "/car/geoFence",
  carSetting: "/car/setting",
  nextMaintenance: "/car/nextMaintenance",
  warning: "/car/warning",
  alertMessages: "/car/alertMessages",
  carProfile: "/car/profile",
  accessScreen: "/car/access-screen", // POST {apiName,[status]} wakes the TCU for a fresh read
  // trips
  tripRecent: "/car/trip/recent",
  tripSummary: "/car/trip/summary",
  tripDetail: "/car/trip/detail",
  tripFavorite: "/car/trip/favorite",
  // remote commands (POST) — command value is the enum toString()
  doorLock: "/remote/doorLock", // command: allLock | doorUnlock
  hornLight: "/remote/hornLight", // command: horn-lights | horn | lights
  engine: "/remote/engine", // command: start | stop | extend (+ vehicleControl.acSetting)
  pullEngineResult: "/remote/pullEngineResult",
  pullDoorLockResult: "/remote/pullDoorLockResult",
  pullHornLightResult: "/remote/pullHornLightResult",
  pullCarFinderResult: "/remote/pullCarFinderResult",
  // user / account
  profile: "/user/profile",
  device: "/user/device",
  emergencyContact: "/emergencyContact",
  ratingCheck: "/user/rating/check",
  // messages / notifications
  messages: "/message",
  messageDelete: "/message/delete", // POST {deleteItems:[{oid}]}
  // settings / subscription / misc
  settingCommon: "/setting/common",
  consent: "/consent/update",
  sideMenu: "/sideMenu",
  appVersion: "/app/version",
  servicePackageList: "/renew/servicePackageList",
  vehicleServicePackageDetail: "/renew/vehicleServicePackageDetail",
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;

/** Remote command `command` field values (enum toString, lowercase/kebab). */
export const COMMANDS = {
  lock: "allLock",
  unlock: "doorUnlock",
  hornLights: "horn-lights",
  horn: "horn",
  lights: "lights",
  engineStart: "start",
  engineStop: "stop",
  engineExtend: "extend",
} as const;

/** acTempVal codes for vehicleControl.acSetting (strings, not numbers). */
export const AC_TEMP = { high: "03", mid: "04", low: "05" } as const;
