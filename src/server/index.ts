import express from "express";
import { fileURLToPath } from "node:url";

const app = express();
const port = 3000;
const clientDirectory = fileURLToPath(new URL("../client", import.meta.url));

app.use(express.static(clientDirectory));

app.listen(port, (error) => {
  if (error) {
    console.error("Failed to start Resort Map", error);
    process.exitCode = 1;
    return;
  }

  console.log(`Resort Map is running at http://localhost:${port}`);
});
