import { describe, it, expect } from "vitest";
import { parseGuests, isValidGuest, loadGuests } from "./guests.js";

const VALID_JSON = JSON.stringify([
  { room: "101", guestName: "Alice Smith" },
  { room: "102", guestName: "Bob Jones" },
]);

describe("parseGuests", () => {
  it("loads valid room/name pairs", () => {
    const guests = parseGuests(VALID_JSON);
    expect(guests).toHaveLength(2);
    expect(guests[0]).toEqual({ room: "101", guestName: "Alice Smith" });
    expect(guests[1]).toEqual({ room: "102", guestName: "Bob Jones" });
  });

  it("rejects invalid JSON", () => {
    expect(() => parseGuests("not json")).toThrow("invalid JSON");
  });

  it("rejects a non-array top-level structure", () => {
    expect(() =>
      parseGuests('{"room":"101","guestName":"Alice"}')
    ).toThrow("must contain a JSON array");
    expect(() => parseGuests('"string"')).toThrow("must contain a JSON array");
  });

  it("rejects entries missing room", () => {
    expect(() =>
      parseGuests(JSON.stringify([{ guestName: "Alice Smith" }]))
    ).toThrow("missing or invalid 'room'");
  });

  it("rejects entries missing guestName", () => {
    expect(() =>
      parseGuests(JSON.stringify([{ room: "101" }]))
    ).toThrow("missing or invalid 'guestName'");
  });

  it("trims whitespace from stored values", () => {
    const guests = parseGuests(
      JSON.stringify([{ room: " 101 ", guestName: "  Alice Smith  " }])
    );
    expect(guests[0].room).toBe("101");
    expect(guests[0].guestName).toBe("Alice Smith");
  });
});

describe("loadGuests", () => {
  it("loads the real bookings.json file", async () => {
    const guests = await loadGuests("bookings.json");
    expect(guests.length).toBeGreaterThan(0);
    for (const g of guests) {
      expect(typeof g.room).toBe("string");
      expect(typeof g.guestName).toBe("string");
    }
  });

  it("throws a clear error for a missing file", async () => {
    await expect(loadGuests("nonexistent.json")).rejects.toThrow(
      "Cannot read bookings file"
    );
  });
});

describe("isValidGuest", () => {
  const guests = [
    { room: "101", guestName: "Alice Smith" },
    { room: "102", guestName: "Bob Jones" },
  ];

  it("matches a valid room and guest name", () => {
    expect(isValidGuest(guests, "101", "Alice Smith")).toBe(true);
  });

  it("matches guest name case-insensitively", () => {
    expect(isValidGuest(guests, "101", "alice smith")).toBe(true);
    expect(isValidGuest(guests, "101", "ALICE SMITH")).toBe(true);
  });

  it("trims surrounding whitespace from input before matching", () => {
    expect(isValidGuest(guests, " 101 ", " Alice Smith ")).toBe(true);
  });

  it("rejects a valid room with the wrong guest name", () => {
    expect(isValidGuest(guests, "101", "Bob Jones")).toBe(false);
  });

  it("rejects an unknown room number", () => {
    expect(isValidGuest(guests, "999", "Alice Smith")).toBe(false);
  });
});
