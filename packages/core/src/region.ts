/** Per-country API base URLs (from the app's BuildConfigHelper). */
export const REGIONS = {
  vietnam: "https://vietnam-mob.aohondaconnect.com/rest/command",
  indonesia: "https://indonesia-mob.aohondaconnect.com/rest/command",
  malaysia: "https://malaysia-mob.aohondaconnect.com/rest/command",
  philippines: "https://philippines-mob.aohondaconnect.com/rest/command",
  taiwan: "https://taiwan-mob.aohondaconnect.com/rest/command",
  korea: "https://korea-mob.aohondaconnect.com/rest/command",
  newzealand: "https://newzealand-mob.aohondaconnect.com/rest/command",
  australia: "https://australia-tz1-mob.aohondaconnect.com/rest/command",
} as const;

export type Region = keyof typeof REGIONS;

export function baseUrl(region: Region): string {
  return REGIONS[region];
}

/** Per-country config (from the APK). `country` is the exact value the API expects. */
export const REGION_META = {
  vietnam: { country: "Vietnam", callingCode: "+84", lang: "vi" },
  indonesia: { country: "Indonesia", callingCode: "+62", lang: "in" },
  malaysia: { country: "Malaysia", callingCode: "+60", lang: "ms" },
  philippines: { country: "Philippines", callingCode: "+63", lang: "en" },
  newzealand: { country: "New Zealand", callingCode: "+64", lang: "en" },
  australia: { country: "Australia", callingCode: "+61", lang: "en" },
  taiwan: { country: "Taiwan", callingCode: "+886", lang: "zh" },
  korea: { country: "South Korea", callingCode: "+82", lang: "ko" },
} as const satisfies Record<Region, { country: string; callingCode: string; lang: string }>;
