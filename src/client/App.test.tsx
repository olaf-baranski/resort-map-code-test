// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import { App } from "./App";

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEST_MAP = {
  width: 3,
  height: 3,
  tiles: [
    ["W", "W", "W"],
    ["p", "#", "c"],
    [".", ".", "."],
  ],
  cabanas: [
    { id: "W_0_0", row: 0, col: 0, available: true },
    { id: "W_0_1", row: 0, col: 1, available: false },
    { id: "W_0_2", row: 0, col: 2, available: true },
  ],
};

// ── Fetch stubs ───────────────────────────────────────────────────────────────

function stubMapOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TEST_MAP),
    })
  );
}

function stubMapFail() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })
  );
}

/**
 * First call → GET /api/map success.
 * Second call → POST booking with given status.
 */
function stubMapThenBooking(bookingStatus: number) {
  const mock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(TEST_MAP) })
    .mockResolvedValueOnce({ ok: bookingStatus === 201, status: bookingStatus });
  vi.stubGlobal("fetch", mock);
  return mock;
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => cleanup());

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderWithMap() {
  render(<App />);
  await waitFor(() =>
    expect(screen.getByRole("grid", { name: /resort map/i })).toBeTruthy()
  );
}

function getAvailableButtons() {
  return screen
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-label")?.startsWith("Available cabana"));
}

function getUnavailableButtons() {
  return screen
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-label")?.startsWith("Unavailable cabana"));
}

async function openDialogOnFirstAvailable() {
  const [btn] = getAvailableButtons();
  fireEvent.click(btn);
  await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
  return btn;
}

function fillAndSubmit(room: string, name: string) {
  fireEvent.change(screen.getByLabelText(/room number/i), {
    target: { value: room },
  });
  fireEvent.change(screen.getByLabelText(/guest full name/i), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: /book cabana/i }));
}

// ── App data loading ──────────────────────────────────────────────────────────

describe("App — data loading", () => {
  it("shows a loading state before map data resolves", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<App />);
    expect(screen.getByText(/loading resort map/i)).toBeTruthy();
  });

  it("renders the map grid when /api/map succeeds", async () => {
    stubMapOk();
    await renderWithMap();
    expect(screen.getByRole("grid", { name: /resort map/i })).toBeTruthy();
  });

  it("shows an error alert when /api/map fails", async () => {
    stubMapFail();
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/failed to load map/i)
    );
  });
});

// ── Map tile rendering ────────────────────────────────────────────────────────

describe("ResortMap — tile rendering", () => {
  beforeEach(() => stubMapOk());

  it("renders a chalet image for 'c' tiles", async () => {
    await renderWithMap();
    expect(screen.getAllByAltText("chalet").length).toBeGreaterThan(0);
  });

  it("renders a pool image for 'p' tiles", async () => {
    await renderWithMap();
    expect(screen.getAllByAltText("pool").length).toBeGreaterThan(0);
  });

  it("renders path images for '#' tiles", async () => {
    await renderWithMap();
    expect(screen.getAllByAltText("path").length).toBeGreaterThan(0);
  });

  it("renders a button for each cabana", async () => {
    await renderWithMap();
    const cabanaButtons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.includes("cabana"));
    expect(cabanaButtons).toHaveLength(3);
  });

  it("available and unavailable cabanas have distinct accessible labels", async () => {
    await renderWithMap();
    expect(getAvailableButtons()).toHaveLength(2);
    expect(getUnavailableButtons()).toHaveLength(1);
  });

  it("unavailable cabanas carry the unavailable CSS class", async () => {
    await renderWithMap();
    const [el] = getUnavailableButtons();
    expect(el.className).toContain("cabana-unavailable");
  });

  it("available cabanas carry the available CSS class", async () => {
    await renderWithMap();
    for (const el of getAvailableButtons()) {
      expect(el.className).toContain("cabana-available");
    }
  });
});

// ── Cabana selection ──────────────────────────────────────────────────────────

describe("Cabana selection", () => {
  it("clicking an available cabana opens the booking dialog", async () => {
    stubMapOk();
    await renderWithMap();
    await openDialogOnFirstAvailable();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /book cabana/i })).toBeTruthy();
  });

  it("clicking an unavailable cabana does NOT open the booking dialog", async () => {
    stubMapOk();
    await renderWithMap();
    const [btn] = getUnavailableButtons();
    fireEvent.click(btn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("clicking an unavailable cabana shows a not-available status message", async () => {
    stubMapOk();
    await renderWithMap();
    const [btn] = getUnavailableButtons();
    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/not available/i)
    );
  });
});

// ── Booking form behavior ─────────────────────────────────────────────────────

describe("Booking form behavior", () => {
  it("dialog contains room and guest-name fields with visible labels", async () => {
    stubMapOk();
    await renderWithMap();
    await openDialogOnFirstAvailable();
    expect(screen.getByLabelText(/room number/i)).toBeTruthy();
    expect(screen.getByLabelText(/guest full name/i)).toBeTruthy();
  });

  it("cancel closes the dialog without sending a POST", async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TEST_MAP),
    });
    vi.stubGlobal("fetch", mock);
    await renderWithMap();
    await openDialogOnFirstAvailable();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // Only the initial GET was called
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("blank room is rejected client-side without a POST", async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TEST_MAP),
    });
    vi.stubGlobal("fetch", mock);
    await renderWithMap();
    await openDialogOnFirstAvailable();
    // Fill name but leave room blank
    fireEvent.change(screen.getByLabelText(/guest full name/i), {
      target: { value: "Alice Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: /book cabana/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/room number/i)
    );
    expect(mock).toHaveBeenCalledTimes(1); // no POST
    expect(screen.getByRole("dialog")).toBeTruthy(); // dialog stays open
  });

  it("blank guest name is rejected client-side without a POST", async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TEST_MAP),
    });
    vi.stubGlobal("fetch", mock);
    await renderWithMap();
    await openDialogOnFirstAvailable();
    fireEvent.change(screen.getByLabelText(/room number/i), {
      target: { value: "101" },
    });
    // Leave name blank
    fireEvent.click(screen.getByRole("button", { name: /book cabana/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/guest name/i)
    );
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("valid input sends POST to the correct URL with room and guestName", async () => {
    const mock = stubMapThenBooking(201);
    await renderWithMap();
    await openDialogOnFirstAvailable();
    fillAndSubmit("101", "Alice Smith");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    const [, [url, init]] = mock.mock.calls as [[string], [string, RequestInit]];
    expect(url).toMatch(/\/api\/cabanas\/W_0_0\/bookings/);
    const body = JSON.parse(init.body as string) as unknown;
    expect(body).toMatchObject({ room: "101", guestName: "Alice Smith" });
  });

  it("submit button is disabled while request is in flight", async () => {
    let resolvePost!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(TEST_MAP) })
        .mockReturnValueOnce(new Promise((r) => (resolvePost = r)))
    );
    await renderWithMap();
    await openDialogOnFirstAvailable();
    fillAndSubmit("101", "Alice Smith");

    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: /booking/i }) as HTMLButtonElement).disabled
      ).toBe(true)
    );

    // Resolve to clean up
    resolvePost({ ok: true, status: 201 });
  });
});

// ── Successful booking ────────────────────────────────────────────────────────

describe("Successful booking", () => {
  async function doSuccessfulBooking() {
    stubMapThenBooking(201);
    await renderWithMap();
    const [btn] = getAvailableButtons();
    const bookedId = btn.getAttribute("aria-label")!.replace("Available cabana ", "");
    fireEvent.click(btn);
    await waitFor(() => screen.getByRole("dialog"));
    fillAndSubmit("101", "Alice Smith");
    return bookedId;
  }

  it("201 closes the dialog", async () => {
    await doSuccessfulBooking();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("201 shows a success confirmation message", async () => {
    await doSuccessfulBooking();
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toMatch(/booked successfully/i)
    );
  });

  it("booked cabana immediately appears unavailable without page reload", async () => {
    const bookedId = await doSuccessfulBooking();
    await waitFor(() => {
      const updatedBtn = screen
        .getAllByRole("button")
        .find(
          (b) => b.getAttribute("aria-label") === `Unavailable cabana ${bookedId}`
        );
      expect(updatedBtn).toBeTruthy();
    });
  });
});

// ── API error handling ────────────────────────────────────────────────────────

describe("API error handling", () => {
  async function doBookingWithStatus(status: number) {
    stubMapThenBooking(status);
    await renderWithMap();
    await openDialogOnFirstAvailable();
    fillAndSubmit("101", "Wrong Name");
  }

  it("422 shows a guest-validation message and keeps the dialog open", async () => {
    await doBookingWithStatus(422);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(
        /room number and guest name do not match/i
      )
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("409 shows an already-booked message", async () => {
    await doBookingWithStatus(409);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/no longer available/i)
    );
  });

  it("409 marks the cabana unavailable in the visible map state", async () => {
    stubMapThenBooking(409);
    await renderWithMap();
    const [btn] = getAvailableButtons();
    const bookedId = btn.getAttribute("aria-label")!.replace("Available cabana ", "");
    fireEvent.click(btn);
    await waitFor(() => screen.getByRole("dialog"));
    fillAndSubmit("101", "Alice Smith");

    await waitFor(() => {
      const updated = screen
        .getAllByRole("button")
        .find(
          (b) => b.getAttribute("aria-label") === `Unavailable cabana ${bookedId}`
        );
      expect(updated).toBeTruthy();
    });
  });

  it("network error shows a generic unable-to-complete message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(TEST_MAP) })
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    );
    await renderWithMap();
    await openDialogOnFirstAvailable();
    fillAndSubmit("101", "Alice Smith");

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/unable to complete/i)
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
