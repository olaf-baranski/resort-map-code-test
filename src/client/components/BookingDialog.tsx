import { useState, useEffect, useRef } from "react";
import type { CabanaState } from "../api";

interface BookingDialogProps {
  cabana: CabanaState;
  onConfirm: (room: string, guestName: string) => Promise<void>;
  onCancel: () => void;
  /** Error message from the API, if any */
  apiError: string | null;
  submitting: boolean;
}

export function BookingDialog({
  cabana,
  onConfirm,
  onCancel,
  apiError,
  submitting,
}: BookingDialogProps) {
  const [room, setRoom] = useState("");
  const [guestName, setGuestName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Focus the first field when dialog opens
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!room.trim()) {
      setLocalError("Please enter a room number.");
      return;
    }
    if (!guestName.trim()) {
      setLocalError("Please enter a guest name.");
      return;
    }

    setLocalError(null);
    void onConfirm(room.trim(), guestName.trim());
  }

  const displayError = localError ?? apiError;

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (!submitting && e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="dialog"
      >
        <h2 id="dialog-title" className="dialog-title">
          Book Cabana
        </h2>
        <p className="dialog-subtitle">Cabana {cabana.id}</p>

        {displayError && (
          <p className="dialog-error" role="alert">
            {displayError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="booking-room" className="form-label">
              Room number
            </label>
            <input
              id="booking-room"
              type="text"
              className="form-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              autoComplete="off"
              disabled={submitting}
              ref={firstInputRef}
            />
          </div>

          <div className="form-field">
            <label htmlFor="booking-name" className="form-label">
              Guest full name
            </label>
            <input
              id="booking-name"
              type="text"
              className="form-input"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoComplete="off"
              disabled={submitting}
            />
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Booking…" : "Book cabana"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
