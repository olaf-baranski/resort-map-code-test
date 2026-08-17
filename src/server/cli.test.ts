import { describe, it, expect } from "vitest";
import { parseArgs } from "./cli.js";

describe("parseArgs", () => {
  it("no options produce the working-directory default file names", () => {
    const opts = parseArgs([]);
    expect(opts.mapPath).toBe("map.ascii");
    expect(opts.bookingsPath).toBe("bookings.json");
  });

  it("--map overrides the map path", () => {
    const opts = parseArgs(["--map", "/custom/resort.ascii"]);
    expect(opts.mapPath).toBe("/custom/resort.ascii");
    expect(opts.bookingsPath).toBe("bookings.json");
  });

  it("--bookings overrides the bookings path", () => {
    const opts = parseArgs(["--bookings", "/custom/guests.json"]);
    expect(opts.mapPath).toBe("map.ascii");
    expect(opts.bookingsPath).toBe("/custom/guests.json");
  });

  it("both --map and --bookings may be supplied together", () => {
    const opts = parseArgs(["--map", "my.ascii", "--bookings", "my.json"]);
    expect(opts.mapPath).toBe("my.ascii");
    expect(opts.bookingsPath).toBe("my.json");
  });

  it("--map without a value fails clearly", () => {
    expect(() => parseArgs(["--map"])).toThrow("--map requires a path argument");
  });

  it("--bookings without a value fails clearly", () => {
    expect(() => parseArgs(["--bookings"])).toThrow(
      "--bookings requires a path argument"
    );
  });

  it("--map followed by another flag fails clearly", () => {
    expect(() => parseArgs(["--map", "--bookings", "b.json"])).toThrow(
      "--map requires a path argument"
    );
  });
});
