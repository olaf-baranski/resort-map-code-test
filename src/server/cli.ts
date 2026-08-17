export interface CliOptions {
  mapPath: string;
  bookingsPath: string;
}

export function parseArgs(args: string[]): CliOptions {
  let mapPath = "map.ascii";
  let bookingsPath = "bookings.json";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--map") {
      if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
        throw new Error("--map requires a path argument");
      }
      mapPath = args[++i];
    } else if (arg === "--bookings") {
      if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
        throw new Error("--bookings requires a path argument");
      }
      bookingsPath = args[++i];
    }
  }

  return { mapPath, bookingsPath };
}
