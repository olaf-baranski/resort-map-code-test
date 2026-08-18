import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { ResortService } from "./resort.js";

export function createApp(service: ResortService, clientDir?: string) {
  const app = express();

  app.use(express.json());

  // ── API routes ──────────────────────────────────────────────────────────────

  app.get("/api/map", (_req: Request, res: Response) => {
    const { width, height, tiles } = service.map;
    const cabanas = service.getCabanas();

    res.json({ width, height, tiles, cabanas });
  });

  app.post(
    "/api/cabanas/:cabanaId/bookings",
    (req: Request, res: Response) => {
      const cabanaId = req.params["cabanaId"] as string;
      const body: unknown = req.body;

      // Structural validation — domain handles guest validity
      if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
      ) {
        res.status(400).json({
          error: "room and guestName must be non-empty strings",
        });
        return;
      }

      const { room, guestName } = body as Record<string, unknown>;

      if (
        typeof room !== "string" ||
        room.trim() === "" ||
        typeof guestName !== "string" ||
        guestName.trim() === ""
      ) {
        res.status(400).json({
          error: "room and guestName must be non-empty strings",
        });
        return;
      }

      const result = service.book(cabanaId, room, guestName);

      if (result.ok) {
        res.status(201).json({
          cabanaId,
          status: "booked",
        });
        return;
      }

      switch (result.reason) {
        case "unknown_cabana":
          res.status(404).json({ error: "unknown_cabana" });
          break;

        case "already_booked":
          res.status(409).json({ error: "already_booked" });
          break;

        case "invalid_guest":
          res.status(422).json({ error: "invalid_guest" });
          break;
      }
    }
  );

  // ── Static frontend (production only) ───────────────────────────────────────

  if (clientDir) {
    app.use(express.static(clientDir));
  }

  // ── Error handler ───────────────────────────────────────────────────────────
  // Handles malformed JSON from express.json() and unexpected server errors.

  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ error: "invalid JSON" });
        return;
      }

      res.status(500).json({ error: "internal server error" });
    }
  );

  return app;
}