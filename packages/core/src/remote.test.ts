import { describe, expect, it } from "vitest";
import type { HondaHttp } from "./http.js";
import { pullRemote, type RemoteKind, sendRemote } from "./remote.js";

// Records calls instead of talking to Honda.
function fakeHttp() {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const call = (method: string) => async (path: string, body?: unknown) => {
    calls.push(body === undefined ? { method, path } : { method, path, body });
    return { statusCode: 200, json: null, headers: {} };
  };
  const http = {
    postForm: call("form"),
    postJson: call("json"),
    get: call("get"),
  } as unknown as HondaHttp;
  return { http, calls };
}

describe("horn and lights (FINDINGS Round 4)", () => {
  it.each<[RemoteKind, string]>([
    ["lights", "lights"],
    ["horn", "horn-lights"],
  ])("%s posts the form command %s", async (kind, command) => {
    const { http, calls } = fakeHttp();
    await sendRemote(http, "c1", kind, "u1");
    expect(calls).toEqual([
      {
        method: "form",
        path: "/remote/hornLight",
        body: { carOid: "c1", clientUUID: "u1", command },
      },
    ]);
  });

  it("pulls the result from pullHornLightResult", async () => {
    const { http, calls } = fakeHttp();
    await pullRemote(http, "c1", "horn", "u1", 123);
    expect(calls[0]?.path).toBe(
      "/remote/pullHornLightResult?carOid=c1&clientUUID=u1&timeStampSpecified=123",
    );
  });

  it("keeps door commands on doorLock", async () => {
    const { http, calls } = fakeHttp();
    await sendRemote(http, "c1", "lock", "u1");
    expect(calls[0]).toMatchObject({ path: "/remote/doorLock", body: { command: "allLock" } });
  });
});
