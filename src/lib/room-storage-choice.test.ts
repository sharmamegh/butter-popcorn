import { describe, expect, it } from "vitest";
import { chooseStorageMode } from "./room-storage";

describe("chooseStorageMode", () => {
  it("keeps Redis when credentials exist even if the boot ping fails", () => {
    expect(
      chooseStorageMode({
        hasRedisCreds: true,
        redisProbeOk: false,
        isVercel: true,
      })
    ).toEqual({ mode: "upstash", redisUnreachable: true });

    expect(
      chooseStorageMode({
        hasRedisCreds: true,
        redisProbeOk: false,
        isVercel: false,
      })
    ).toEqual({ mode: "upstash", redisUnreachable: true });
  });

  it("uses Redis when the boot ping succeeds", () => {
    expect(
      chooseStorageMode({
        hasRedisCreds: true,
        redisProbeOk: true,
        isVercel: true,
      })
    ).toEqual({ mode: "upstash", redisUnreachable: false });
  });

  it("falls back to memory on Vercel only when Redis is not configured", () => {
    expect(
      chooseStorageMode({
        hasRedisCreds: false,
        redisProbeOk: false,
        isVercel: true,
      })
    ).toEqual({ mode: "memory", redisUnreachable: false });
  });

  it("uses the local file store when Redis is not configured off Vercel", () => {
    expect(
      chooseStorageMode({
        hasRedisCreds: false,
        redisProbeOk: false,
        isVercel: false,
      })
    ).toEqual({ mode: "file", redisUnreachable: false });
  });
});
