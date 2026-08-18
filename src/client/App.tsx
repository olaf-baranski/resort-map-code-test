import { useState, useEffect } from "react";
import { fetchMap, bookCabana } from "./api";
import type { MapData, CabanaState, BookingError } from "./api";
import { ResortMap } from "./components/ResortMap";
import { BookingDialog } from "./components/BookingDialog";
import "./styles.css";

// Human-readable messages for each API error type.
const BOOKING_ERROR_MESSAGES: Record<BookingError, string> = {
  invalid_guest:
    "The room number and guest name do not match a current hotel guest. Please check your details.",
  already_booked:
    "This cabana has just been booked by someone else and is no longer available.",
  unknown_cabana: "This cabana could not be found. Please try another.",
  bad_request: "Please check your room number and name and try again.",
  network_error: "Unable to complete the booking. Please try again.",
};

export function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Booking dialog state
  const [selectedCabana, setSelectedCabana] = useState<CabanaState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Status message shown on the map (success or unavailable-click info)
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMap()
      .then(setMapData)
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load resort map."
        );
      });
  }, []);

  function handleCabanaClick(cabana: CabanaState) {
    if (!cabana.available) {
      setStatusMsg("This cabana is not available.");
      return;
    }
    setStatusMsg(null);
    setApiError(null);
    setSelectedCabana(cabana);
  }

  function handleCancel() {
    setSelectedCabana(null);
    setApiError(null);
  }

  async function handleConfirm(room: string, guestName: string) {
    if (!selectedCabana) return;

    setSubmitting(true);
    setApiError(null);

    const result = await bookCabana(selectedCabana.id, room, guestName);

    setSubmitting(false);

    if (result.ok) {
      // Immutably update the booked cabana to unavailable in local state
      setMapData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cabanas: prev.cabanas.map((c) =>
            c.id === selectedCabana.id ? { ...c, available: false } : c
          ),
        };
      });
      setSelectedCabana(null);
      setStatusMsg(`Cabana ${selectedCabana.id} booked successfully!`);
      return;
    }

    // 409 already_booked: also update local state so the cabana shows unavailable
    if (result.error === "already_booked") {
      setMapData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cabanas: prev.cabanas.map((c) =>
            c.id === selectedCabana.id ? { ...c, available: false } : c
          ),
        };
      });
    }

    setApiError(BOOKING_ERROR_MESSAGES[result.error]);
  }

  // ── Loading / error screens ──────────────────────────────────────────────────

  if (loadError) {
    return (
      <main className="app-status">
        <p className="app-error" role="alert">
          {loadError}
        </p>
      </main>
    );
  }

  if (!mapData) {
    return (
      <main className="app-status">
        <p className="app-loading">Loading resort map…</p>
      </main>
    );
  }

  // ── Main map view ────────────────────────────────────────────────────────────

  return (
    <main className="app-main">
      <header className="app-header">
        <h1 className="app-title">Resort Map</h1>
      </header>

      {statusMsg && (
        <p
          className="status-msg"
          role="status"
          aria-live="polite"
        >
          {statusMsg}
          <button
            type="button"
            className="status-dismiss"
            aria-label="Dismiss"
            onClick={() => setStatusMsg(null)}
          >
            ×
          </button>
        </p>
      )}

      <ResortMap data={mapData} onCabanaClick={handleCabanaClick} />

      <footer className="app-legend">
        <ul className="legend-list" aria-label="Map legend">
          <li className="legend-item legend-available">
            <span className="legend-swatch" />
            Available cabana
          </li>
          <li className="legend-item legend-unavailable">
            <span className="legend-swatch" />
            Unavailable cabana
          </li>
        </ul>
      </footer>

      {selectedCabana && (
        <BookingDialog
          cabana={selectedCabana}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          apiError={apiError}
          submitting={submitting}
        />
      )}
    </main>
  );
}
