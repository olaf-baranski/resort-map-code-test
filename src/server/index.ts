import { fileURLToPath } from "node:url";
import { parseArgs } from "./cli.js";
import { loadMap } from "./map.js";
import { loadGuests } from "./guests.js";
import { ResortService } from "./resort.js";
import { createApp } from "./app.js";

const PORT = 3000;
const clientDir = fileURLToPath(new URL("../client", import.meta.url));

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Startup error: ${(err as Error).message}`);
    process.exit(1);
  }

  let map, guests;
  try {
    [map, guests] = await Promise.all([
      loadMap(opts.mapPath),
      loadGuests(opts.bookingsPath),
    ]);
  } catch (err) {
    console.error(`Startup error: ${(err as Error).message}`);
    process.exit(1);
  }

  const service = new ResortService(map, guests);
  const app = createApp(service, clientDir);

  app.listen(PORT, () => {
    console.log(`Resort Map is running at http://localhost:${PORT}`);
  });
}

main();
