import { describe, expect, it } from "vitest";
import { parsePhone, formatPhone, nameKey, splitPhones } from "./phone";
import { resolveZone, normalizeState } from "./geo";
import { datetimeLocalToUtc, isCallableNow, localHour, utcToDatetimeLocal, zonedToUtc, dayBounds } from "./time";

describe("phone", () => {
  it("normalises US numbers", () => {
    expect(parsePhone("(512) 555-1234")).toEqual({ ok: true, e164: "+15125551234", national: "5125551234" });
    expect(parsePhone("1-512-555-1234 x22")).toMatchObject({ ok: true, e164: "+15125551234" });
    expect(parsePhone("+1 512.555.1234")).toMatchObject({ ok: true });
  });
  it("rejects bad numbers", () => {
    expect(parsePhone("555-1234").ok).toBe(false);
    expect(parsePhone("(012) 555-1234").ok).toBe(false);
    expect(parsePhone("512-155-1234").ok).toBe(false);
    expect(parsePhone("911-555-1234").ok).toBe(false);
    expect(parsePhone("5125551234567").ok).toBe(false);
    expect(parsePhone("").ok).toBe(false);
  });
  it("formats and splits", () => {
    expect(formatPhone("+15125551234")).toBe("(512) 555-1234");
    expect(splitPhones("512-555-1234 / 737 555 9999")).toHaveLength(2);
  });
  it("builds duplicate keys that ignore suffixes and punctuation", () => {
    expect(nameKey("Smith & Sons Roofing, LLC")).toBe(nameKey("smith and sons roofing"));
  });
});

describe("geo", () => {
  it("normalises states", () => {
    expect(normalizeState("texas")).toBe("TX");
    expect(normalizeState("tx.")).toBe("TX");
    expect(normalizeState("Narnia")).toBeNull();
  });
  it("resolves zone from state or area code", () => {
    expect(resolveZone({ state: "NY" })).toMatchObject({ timezone: "America/New_York", approx: false });
    expect(resolveZone({ phone: "+13105551234" })).toMatchObject({ state: "CA", timezone: "America/Los_Angeles" });
    expect(resolveZone({ state: "TX", phone: "+19155551234" })).toMatchObject({ timezone: "America/Denver", approx: false });
    expect(resolveZone({ state: "TX", phone: "+12145551234" })).toMatchObject({ timezone: "America/Chicago", approx: true });
    expect(resolveZone({ state: "FL", phone: "+18505551234" })).toMatchObject({ timezone: "America/Chicago", approx: true });
    expect(resolveZone({ state: "AZ" }).timezone).toBe("America/Phoenix");
    expect(resolveZone({}).timezone).toBeNull();
  });
});

describe("time", () => {
  const w = { start: 8, end: 21, approxPad: 1 };
  it("enforces 8am-9pm in the lead's local time", () => {
    // 2026-10-03 13:00Z = 9am ET / 8am CT / 6am PT
    const t = new Date("2026-10-03T13:00:00Z");
    expect(isCallableNow(t, "America/New_York", false, w)).toBe(true);
    expect(isCallableNow(t, "America/Chicago", false, w)).toBe(true);
    expect(isCallableNow(t, "America/Los_Angeles", false, w)).toBe(false);
    // approximate zones need an extra hour of margin
    expect(isCallableNow(t, "America/Chicago", true, w)).toBe(false);
    expect(isCallableNow(new Date("2026-10-04T01:30:00Z"), "America/New_York", false, w)).toBe(false); // 9:30pm ET
    expect(isCallableNow(t, null, false, w)).toBe(false);
  });
  it("converts wall-clock times across DST", () => {
    expect(zonedToUtc("2026-10-03", "14:30", "America/New_York").toISOString()).toBe("2026-10-03T18:30:00.000Z");
    expect(zonedToUtc("2026-12-03", "14:30", "America/New_York").toISOString()).toBe("2026-12-03T19:30:00.000Z");
    expect(datetimeLocalToUtc("2026-10-03T09:00", "Asia/Karachi")!.toISOString()).toBe("2026-10-03T04:00:00.000Z");
    expect(utcToDatetimeLocal("2026-10-03T18:30:00Z", "America/New_York")).toBe("2026-10-03T14:30");
    expect(localHour(new Date("2026-10-03T18:30:00Z"), "America/New_York")).toBe(14.5);
  });
  it("finds day bounds in a zone", () => {
    const { start, end } = dayBounds(new Date("2026-10-03T03:00:00Z"), "America/New_York");
    expect(start.toISOString()).toBe("2026-10-02T04:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-03T04:00:00.000Z");
  });
});
