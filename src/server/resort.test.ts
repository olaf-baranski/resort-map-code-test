import { describe, it, expect, beforeEach } from "vitest";
import { parseMap } from "./map.js";
import { parseGuests } from "./guests.js";
import { ResortService } from "./resort.js";

// Small inline map: 3 cabanas in row 0, pool row, empty row
const TEST_MAP = ["WWW", "ppp", "..."].join("\n");
const TEST_GUESTS = JSON.stringify([
  { room: "101", guestName: "Alice Smith" },
  { room: "102", guestName: "Bob Jones" },
]);

function makeService(): ResortService {
  return new ResortService(parseMap(TEST_MAP), parseGuests(TEST_GUESTS));
}

describe("ResortService", () => {
  let service: ResortService;

  beforeEach(() => {
    service = makeService();
  });

  it("all discovered cabanas start as available", () => {
    const cabanas = service.getCabanas();
    expect(cabanas).toHaveLength(3);
    expect(cabanas.every((c) => c.available)).toBe(true);
  });

  it("a valid guest can book an available cabana", () => {
    const result = service.book("W_0_0", "101", "Alice Smith");
    expect(result).toEqual({ ok: true });
  });

  it("the booked cabana immediately becomes unavailable", () => {
    service.book("W_0_0", "101", "Alice Smith");
    const cabana = service.getCabanas().find((c) => c.id === "W_0_0");
    expect(cabana?.available).toBe(false);
  });

  it("other cabanas remain available after one is booked", () => {
    service.book("W_0_0", "101", "Alice Smith");
    const others = service.getCabanas().filter((c) => c.id !== "W_0_0");
    expect(others.every((c) => c.available)).toBe(true);
  });

  it("booking the same cabana again is rejected with already_booked", () => {
    service.book("W_0_0", "101", "Alice Smith");
    const result = service.book("W_0_0", "102", "Bob Jones");
    expect(result).toEqual({ ok: false, reason: "already_booked" });
  });

  it("an unknown cabana ID is rejected with unknown_cabana", () => {
    const result = service.book("W_99_99", "101", "Alice Smith");
    expect(result).toEqual({ ok: false, reason: "unknown_cabana" });
  });

  it("an invalid room/name pair is rejected with invalid_guest", () => {
    const result = service.book("W_0_0", "999", "Nobody Here");
    expect(result).toEqual({ ok: false, reason: "invalid_guest" });
  });

  it("a valid room with the wrong guest name is rejected with invalid_guest", () => {
    const result = service.book("W_0_1", "101", "Bob Jones");
    expect(result).toEqual({ ok: false, reason: "invalid_guest" });
  });

  it("a failed booking does not change availability", () => {
    service.book("W_0_0", "999", "Nobody"); // invalid guest
    const cabana = service.getCabanas().find((c) => c.id === "W_0_0");
    expect(cabana?.available).toBe(true);
  });

  it("the same valid guest can book two different available cabanas", () => {
    const r1 = service.book("W_0_0", "101", "Alice Smith");
    const r2 = service.book("W_0_1", "101", "Alice Smith");
    expect(r1).toEqual({ ok: true });
    expect(r2).toEqual({ ok: true });
  });
});
