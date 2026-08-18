import { useState, useEffect } from "react";
import { fetchMap } from "./api";
import type { MapData } from "./api";
import { ResortMap } from "./components/ResortMap";
import "./styles.css";

export function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMap()
      .then(setMapData)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load resort map."
        );
      });
  }, []);

  if (error) {
    return (
      <main className="app-status">
        <p className="app-error" role="alert">
          {error}
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

  return (
    <main className="app-main">
      <header className="app-header">
        <h1 className="app-title">Resort Map</h1>
      </header>
      <ResortMap data={mapData} />
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
    </main>
  );
}
