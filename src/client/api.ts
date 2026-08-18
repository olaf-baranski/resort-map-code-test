export type Tile = "W" | "p" | "#" | "c" | ".";

export interface CabanaState {
  id: string;
  row: number;
  col: number;
  available: boolean;
}

export interface MapData {
  width: number;
  height: number;
  tiles: Tile[][];
  cabanas: CabanaState[];
}

export async function fetchMap(): Promise<MapData> {
  const res = await fetch("/api/map");
  if (!res.ok) {
    throw new Error(`Failed to load map: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<MapData>;
}
