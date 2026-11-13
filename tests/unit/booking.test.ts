import { describe, expect, it } from "vitest";
import { availableSlots, isBookableSlot, kathmanduDate, slotsOnDate } from "@/lib/booking";

describe("booking availability", () => {
  it("turns Kathmandu wall-clock hours into UTC slot starts", () => {
    // 2026-11-16 is a Monday: 19:00–21:30 NPT in 30-minute slots.
    const slots = slotsOnDate("2026-11-16").map((d) => d.toISOString());
    expect(slots).toEqual([
      "2026-11-16T13:15:00.000Z",
      "2026-11-16T13:45:00.000Z",
      "2026-11-16T14:15:00.000Z",
      "2026-11-16T14:45:00.000Z",
      "2026-11-16T15:15:00.000Z",
    ]);
  });

  it("has no slots on Sunday", () => {
    expect(slotsOnDate("2026-11-15")).toEqual([]);
  });

  it("dates instants in Kathmandu, not UTC", () => {
    expect(kathmanduDate(new Date("2026-11-16T20:00:00Z"))).toBe("2026-11-17");
  });

  it("respects minimum notice and removes taken slots", () => {
    const now = new Date("2026-11-16T05:00:00Z"); // 10:45 NPT Monday
    const all = availableSlots(now).map((d) => d.toISOString());
    expect(all[0]).toBe("2026-11-17T13:15:00.000Z"); // tonight is within 12h notice
    const without = availableSlots(now, ["2026-11-17T13:15:00.000Z"]).map((d) => d.toISOString());
    expect(without[0]).toBe("2026-11-17T13:45:00.000Z");
  });

  it("only accepts exact, open slot starts", () => {
    const now = new Date("2026-11-16T05:00:00Z");
    expect(isBookableSlot("2026-11-17T13:15:00.000Z", now)).toBe(true);
    expect(isBookableSlot("2026-11-17T13:20:00.000Z", now)).toBe(false);
    expect(isBookableSlot("2026-11-16T13:15:00.000Z", now)).toBe(false);
    expect(isBookableSlot("not a date", now)).toBe(false);
  });
});
