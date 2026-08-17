import { readFile } from "node:fs/promises";

export type Tile = "W" | "p" | "#" | "c" | ".";

export interface Cabana {
  id: string;
  row: number;
  col: number;
}

export interface ResortMap {
  width: number;
  height: number;
  tiles: Tile[][];
  cabanas: Cabana[];
}

const VALID_TILES = new Set<string>(["W", "p", "#", "c", "."]);

export function parseMap(content: string): ResortMap {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  // Tolerate a single trailing newline
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  if (lines.length === 0) {
    throw new Error("Map is empty");
  }

  const width = lines[0].length;
  if (width === 0) {
    throw new Error("Map is empty");
  }

  const tiles: Tile[][] = [];
  const cabanas: Cabana[] = [];

  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    if (line.length !== width) {
      throw new Error(
        `Map is not rectangular: row ${row} has width ${line.length}, expected ${width}`
      );
    }
    const rowTiles: Tile[] = [];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (!VALID_TILES.has(ch)) {
        throw new Error(`Unknown tile '${ch}' at row ${row}, col ${col}`);
      }
      rowTiles.push(ch as Tile);
      if (ch === "W") {
        cabanas.push({ id: `W_${row}_${col}`, row, col });
      }
    }
    tiles.push(rowTiles);
  }

  return { width, height: lines.length, tiles, cabanas };
}

export async function loadMap(filePath: string): Promise<ResortMap> {
  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch (err) {
    throw new Error(
      `Cannot read map file '${filePath}': ${(err as NodeJS.ErrnoException).message}`
    );
  }
  return parseMap(content);
}
