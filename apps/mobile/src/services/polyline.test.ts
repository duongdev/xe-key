import { decodePolyline } from "./polyline";

test("decodes Google's sample polyline (1e5 precision)", () => {
  expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
    { lat: 38.5, lng: -120.2 },
    { lat: 40.7, lng: -120.95 },
    { lat: 43.252, lng: -126.453 },
  ]);
  expect(decodePolyline("")).toEqual([]);
});

test("stops at a cut-off string instead of throwing", () => {
  expect(decodePolyline("_p~iF~ps|U_ulL")).toEqual([{ lat: 38.5, lng: -120.2 }]);
});
