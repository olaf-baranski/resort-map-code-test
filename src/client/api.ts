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

// ── Booking ───────────────────────────────────────────────────────────────────

export type BookingError =
  | "invalid_guest"   // 422 — room/name pair not in registry
  | "already_booked"  // 409 — cabana taken since last map fetch
  | "unknown_cabana"  // 404 — shouldn't normally occur
  | "bad_request"     // 400 — structural issue
  | "network_error";  // fetch failed entirely

export type BookingResult =
  | { ok: true }
  | { ok: false; error: BookingError };

export async function bookCabana(
  cabanaId: string,
  room: string,
  guestName: string
): Promise<BookingResult> {
  let res: Response;
  try {
    res = await fetch(`/api/cabanas/${cabanaId}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, guestName }),
    });
  } catch {
    return { ok: false, error: "network_error" };
  }

  if (res.status === 201) return { ok: true };

  const errorMap: Record<number, BookingError> = {
    400: "bad_request",
    404: "unknown_cabana",
    409: "already_booked",
    422: "invalid_guest",
  };

  return { ok: false, error: errorMap[res.status] ?? "network_error" };
}
