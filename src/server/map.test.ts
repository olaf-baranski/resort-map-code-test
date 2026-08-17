import { describe, it, expect } from "vitest";
import { parseMap, loadMap } from "./map.js";

describe("parseMap", () => {
  it("parses a valid rectangular map and derives dimensions from the input", () => {
    const map = parseMap(".W.\nWpW\n...");
    expect(map.width).toBe(3);
    expect(map.height).toBe(3);
    expect(map.tiles[0]).toEqual([".", "W", "."]);
    expect(map.tiles[1]).toEqual(["W", "p", "W"]);
    expect(map.tiles[2]).toEqual([".", ".", "."]);
  });

  it("discovers cabanas from W positions with correct coordinates", () => {
    const map = parseMap(".W.\nWpW\n...");
    expect(map.cabanas).toHaveLength(3);
    expect(map.cabanas[0]).toMatchObject({ row: 0, col: 1 });
    expect(map.cabanas[1]).toMatchObject({ row: 1, col: 0 });
    expect(map.cabanas[2]).toMatchObject({ row: 1, col: 2 });
  });

  it("produces deterministic coordinate-based cabana IDs", () => {
    const map = parseMap("W.\n.W");
    expect(map.cabanas[0].id).toBe("W_0_0");
    expect(map.cabanas[1].id).toBe("W_1_1");
  });

  it("tolerates a trailing newline", () => {
    const map = parseMap("W.\n.W\n");
    expect(map.width).toBe(2);
    expect(map.height).toBe(2);
    expect(map.cabanas).toHaveLength(2);
  });

  it("tolerates CRLF line endings", () => {
    const map = parseMap("W.\r\n.W\r\n");
    expect(map.width).toBe(2);
    expect(map.height).toBe(2);
    expect(map.cabanas).toHaveLength(2);
  });

  it("rejects an empty map", () => {
    expect(() => parseMap("")).toThrow("empty");
    expect(() => parseMap("\n")).toThrow("empty");
  });

  it("rejects a non-rectangular (ragged) map", () => {
    expect(() => parseMap("WW\nW")).toThrow("not rectangular");
  });

  it("rejects unknown tile characters", () => {
    expect(() => parseMap("W.\nXp")).toThrow("Unknown tile 'X'");
  });
});

describe("loadMap", () => {
  it("loads and parses the real map.ascii file correctly", async () => {
    const map = await loadMap("map.ascii");
    expect(map.width).toBe(20);
    expect(map.height).toBe(19);
    expect(map.cabanas.length).toBeGreaterThan(0);
    // Cabana IDs are unique
    const ids = map.cabanas.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Every cabana cell in tiles is a W
    for (const c of map.cabanas) {
      expect(map.tiles[c.row][c.col]).toBe("W");
    }
  });

  it("throws a clear error for a missing file", async () => {
    await expect(loadMap("nonexistent.ascii")).rejects.toThrow(
      "Cannot read map file"
    );
  });
});
