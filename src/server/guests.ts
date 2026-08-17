import { readFile } from "node:fs/promises";

export interface Guest {
  room: string;
  guestName: string;
}

export function parseGuests(content: string): Guest[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Bookings file contains invalid JSON");
  }

  if (!Array.isArray(data)) {
    throw new Error("Bookings file must contain a JSON array");
  }

  return data.map((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Bookings entry ${i} must be an object`);
    }
    const obj = entry as Record<string, unknown>;
    if (typeof obj.room !== "string" || obj.room.trim() === "") {
      throw new Error(`Bookings entry ${i} has a missing or invalid 'room'`);
    }
    if (typeof obj.guestName !== "string" || obj.guestName.trim() === "") {
      throw new Error(`Bookings entry ${i} has a missing or invalid 'guestName'`);
    }
    return { room: obj.room.trim(), guestName: obj.guestName.trim() };
  });
}

export async function loadGuests(filePath: string): Promise<Guest[]> {
  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch (err) {
    throw new Error(
      `Cannot read bookings file '${filePath}': ${(err as NodeJS.ErrnoException).message}`
    );
  }
  return parseGuests(content);
}

export function isValidGuest(
  guests: Guest[],
  room: string,
  guestName: string
): boolean {
  const normalizedRoom = room.trim();
  const normalizedName = guestName.trim().toLowerCase();
  return guests.some(
    (g) =>
      g.room === normalizedRoom && g.guestName.toLowerCase() === normalizedName
  );
}
