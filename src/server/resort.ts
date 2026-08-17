import type { ResortMap, Cabana } from "./map.js";
import type { Guest } from "./guests.js";
import { isValidGuest } from "./guests.js";

export interface CabanaState extends Cabana {
  available: boolean;
}

export type BookingResult =
  | { ok: true }
  | { ok: false; reason: "unknown_cabana" | "already_booked" | "invalid_guest" };

export class ResortService {
  private readonly cabanaIndex: Map<string, Cabana>;
  private readonly booked: Set<string>;

  constructor(
    readonly map: ResortMap,
    private readonly guests: Guest[]
  ) {
    this.cabanaIndex = new Map(map.cabanas.map((c) => [c.id, c]));
    this.booked = new Set();
  }

  getCabanas(): CabanaState[] {
    return this.map.cabanas.map((c) => ({
      ...c,
      available: !this.booked.has(c.id),
    }));
  }

  book(cabanaId: string, room: string, guestName: string): BookingResult {
    if (!this.cabanaIndex.has(cabanaId)) {
      return { ok: false, reason: "unknown_cabana" };
    }
    if (this.booked.has(cabanaId)) {
      return { ok: false, reason: "already_booked" };
    }
    if (!isValidGuest(this.guests, room, guestName)) {
      return { ok: false, reason: "invalid_guest" };
    }
    this.booked.add(cabanaId);
    return { ok: true };
  }
}
