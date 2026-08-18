// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { App } from "./App";

// Vite asset imports resolve to a URL string in the real build; in the
// jsdom test environment they come back as the module path string, which
// is fine because we only care about rendered structure, not pixels.

// Minimal deterministic test-map fixture — NOT the production map.
const TEST_MAP_RESPONSE = {
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

function mockFetchSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TEST_MAP_RESPONSE),
    })
  );
}

function mockFetchFailure() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
});

// ── App data loading ──────────────────────────────────────────────────────────

describe("App — data loading", () => {
  it("shows a loading state before map data resolves", async () => {
    // fetch never resolves during this assertion
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<App />);
    expect(screen.getByText(/loading resort map/i)).toBeTruthy();
  });

  it("renders the map grid when /api/map succeeds", async () => {
    mockFetchSuccess();
    render(<App />);
    await waitFor(() => {
      const grid = screen.getByRole("grid", { name: /resort map/i });
      expect(grid).toBeTruthy();
    });
  });

  it("shows an error alert when /api/map fails", async () => {
    mockFetchFailure();
    render(<App />);
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeTruthy();
      expect(alert.textContent).toMatch(/failed to load map/i);
    });
  });
});

// ── Map rendering ─────────────────────────────────────────────────────────────

describe("ResortMap — tile rendering", () => {
  beforeEach(() => {
    mockFetchSuccess();
  });

  it("renders the map grid with correct role and label", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("grid", { name: /resort map/i })).toBeTruthy();
    });
  });

  it("renders a chalet image for 'c' tiles", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));
    const chalets = screen.getAllByAltText("chalet");
    expect(chalets.length).toBeGreaterThan(0);
  });

  it("renders a pool image for 'p' tiles", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));
    const pools = screen.getAllByAltText("pool");
    expect(pools.length).toBeGreaterThan(0);
  });

  it("renders path images for '#' tiles", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));
    const paths = screen.getAllByAltText("path");
    expect(paths.length).toBeGreaterThan(0);
  });

  it("renders all cabanas returned by the API", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));
    // 3 W tiles in the test fixture → 3 cabana elements
    const allCabanaEls = screen.getAllByLabelText(/cabana/i);
    expect(allCabanaEls).toHaveLength(3);
  });

  it("available and unavailable cabanas have distinct accessible labels", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));

    // fixture: W_0_1 is unavailable; W_0_0 and W_0_2 are available
    expect(screen.getAllByLabelText("Unavailable cabana")).toHaveLength(1);
    expect(screen.getAllByLabelText("Available cabana")).toHaveLength(2);
  });

  it("unavailable cabanas carry the unavailable CSS class", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));
    const [el] = screen.getAllByLabelText("Unavailable cabana");
    expect(el.className).toContain("cabana-unavailable");
  });

  it("available cabanas carry the available CSS class", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("grid", { name: /resort map/i }));
    for (const el of screen.getAllByLabelText("Available cabana")) {
      expect(el.className).toContain("cabana-available");
    }
  });
});
