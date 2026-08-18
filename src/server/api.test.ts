import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { parseMap } from "./map.js";
import { parseGuests } from "./guests.js";
import { ResortService } from "./resort.js";
import { createApp } from "./app.js";

// Small deterministic fixtures — never depends on real files
const TEST_MAP = ["WWW", "ppp", "..."].join("\n");
const TEST_GUESTS = JSON.stringify([
  { room: "101", guestName: "Alice Smith" },
  { room: "102", guestName: "Bob Jones" },
]);

function makeApp() {
  const service = new ResortService(
    parseMap(TEST_MAP),
    parseGuests(TEST_GUESTS)
  );
  // No clientDir — no static files needed in tests
  return { app: createApp(service), service };
}

// ── GET /api/map ─────────────────────────────────────────────────────────────

describe("GET /api/map", () => {
  it("returns 200 with map dimensions from the supplied test map", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/map");
    expect(res.status).toBe(200);
    expect(res.body.width).toBe(3);
    expect(res.body.height).toBe(3);
  });

  it("returns the tile layout", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/map");
    expect(res.body.tiles).toEqual([
      ["W", "W", "W"],
      ["p", "p", "p"],
      [".", ".", "."],
    ]);
  });

  it("returns all discovered cabanas", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/map");
    expect(res.body.cabanas).toHaveLength(3);
  });

  it("cabanas initially report available: true", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/map");
    for (const c of res.body.cabanas) {
      expect(c.available).toBe(true);
    }
  });

  it("does not expose guest-registry data", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/map");
    expect(res.body).not.toHaveProperty("guests");
    expect(res.body).not.toHaveProperty("bookings");
    expect(JSON.stringify(res.body)).not.toContain("Alice");
    expect(JSON.stringify(res.body)).not.toContain("101");
  });
});

// ── Successful booking ────────────────────────────────────────────────────────

describe("POST /api/cabanas/:cabanaId/bookings — success", () => {
  it("valid guest booking an available cabana returns 201", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: "Alice Smith" });
    expect(res.status).toBe(201);
  });

  it("successful booking response includes cabanaId and status", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: "Alice Smith" });
    expect(res.body.cabanaId).toBe("W_0_0");
    expect(res.body.status).toBe("booked");
  });

  it("booked cabana shows available: false in a subsequent GET /api/map", async () => {
    const { app } = makeApp();
    await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: "Alice Smith" });

    const mapRes = await request(app).get("/api/map");
    const booked = mapRes.body.cabanas.find(
      (c: { id: string }) => c.id === "W_0_0"
    );
    expect(booked.available).toBe(false);
  });

  it("other cabanas remain available after a booking", async () => {
    const { app } = makeApp();
    await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: "Alice Smith" });

    const mapRes = await request(app).get("/api/map");
    const others = mapRes.body.cabanas.filter(
      (c: { id: string }) => c.id !== "W_0_0"
    );
    for (const c of others) {
      expect(c.available).toBe(true);
    }
  });
});

// ── Invalid booking ──────────────────────────────────────────────────────────

describe("POST /api/cabanas/:cabanaId/bookings — invalid booking", () => {
  it("unknown cabana returns 404", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/cabanas/W_99_99/bookings")
      .send({ room: "101", guestName: "Alice Smith" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("unknown_cabana");
  });

  it("already-booked cabana returns 409", async () => {
    const { app } = makeApp();
    await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: "Alice Smith" });
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "102", guestName: "Bob Jones" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("already_booked");
  });

  it("invalid room/name pair returns 422", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "999", guestName: "Nobody Here" });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("invalid_guest");
  });

  it("valid room with wrong guest name returns 422", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/cabanas/W_0_1/bookings")
      .send({ room: "101", guestName: "Bob Jones" });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("invalid_guest");
  });
});

// ── Malformed requests ───────────────────────────────────────────────────────

describe("POST /api/cabanas/:cabanaId/bookings — malformed request", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    ({ app } = makeApp());
  });

  it("empty body returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("null body returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .set("Content-Type", "application/json")
      .send("null");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("array body returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send([]);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("non-string room returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: 101, guestName: "Alice Smith" });

    expect(res.status).toBe(400);
  });

  it("non-string guestName returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: 42 });

    expect(res.status).toBe(400);
  });

  it("blank room returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "   ", guestName: "Alice Smith" });

    expect(res.status).toBe(400);
  });

  it("blank guestName returns 400", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .send({ room: "101", guestName: "" });

    expect(res.status).toBe(400);
  });

  it("malformed JSON returns a controlled JSON 400, not an HTML error page", async () => {
    const res = await request(app)
      .post("/api/cabanas/W_0_0/bookings")
      .set("Content-Type", "application/json")
      .send("{ bad json }");

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("error");
  });
});