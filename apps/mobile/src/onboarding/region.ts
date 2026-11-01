// ponytail: mirrors @xekey/core REGION_META; import from core once task 010 makes it bundleable.
export const REGIONS = [
  { id: "vietnam", iso: "VN", name: "Vietnam", callingCode: "+84" },
  { id: "indonesia", iso: "ID", name: "Indonesia", callingCode: "+62" },
  { id: "malaysia", iso: "MY", name: "Malaysia", callingCode: "+60" },
  { id: "philippines", iso: "PH", name: "Philippines", callingCode: "+63" },
  { id: "taiwan", iso: "TW", name: "Taiwan", callingCode: "+886" },
  { id: "korea", iso: "KR", name: "Korea", callingCode: "+82" },
  { id: "australia", iso: "AU", name: "Australia", callingCode: "+61" },
  { id: "newzealand", iso: "NZ", name: "New Zealand", callingCode: "+64" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export function regionFromCountry(iso: string | null | undefined): RegionId {
  const code = iso?.toUpperCase();
  return REGIONS.find((r) => r.iso === code)?.id ?? "vietnam";
}

export function regionById(id: RegionId) {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
