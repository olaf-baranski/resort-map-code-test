import type { Tile, CabanaState, MapData } from "../api";
import { pathVisual } from "../pathTile";

import arrowStraight from "../../../assets/arrowStraight.png";
import arrowCornerSquare from "../../../assets/arrowCornerSquare.png";
import arrowSplit from "../../../assets/arrowSplit.png";
import arrowCrossing from "../../../assets/arrowCrossing.png";
import arrowEnd from "../../../assets/arrowEnd.png";
import cabanaImg from "../../../assets/cabana.png";
import houseChimneyImg from "../../../assets/houseChimney.png";
import poolImg from "../../../assets/pool.png";
import textureWater from "../../../assets/textureWater.png";

const PATH_SPRITES = {
  arrowStraight,
  arrowCornerSquare,
  arrowSplit,
  arrowCrossing,
  arrowEnd,
} as const;

interface ResortMapProps {
  data: MapData;
}

function getCabana(
  cabanas: CabanaState[],
  row: number,
  col: number
): CabanaState | undefined {
  return cabanas.find((c) => c.row === row && c.col === col);
}

function getNeighbours(tiles: Tile[][], row: number, col: number) {
  const isPath = (r: number, c: number) =>
    r >= 0 &&
    r < tiles.length &&
    c >= 0 &&
    c < (tiles[r]?.length ?? 0) &&
    tiles[r][c] === "#";

  return {
    up: isPath(row - 1, col),
    right: isPath(row, col + 1),
    down: isPath(row + 1, col),
    left: isPath(row, col - 1),
  };
}

function PathTile({
  tiles,
  row,
  col,
}: {
  tiles: Tile[][];
  row: number;
  col: number;
}) {
  const neighbours = getNeighbours(tiles, row, col);
  const { sprite, rotation } = pathVisual(neighbours);
  const src = PATH_SPRITES[sprite];

  return (
    <img
      src={src}
      alt="path"
      className="tile-img path-img"
      style={{ transform: `rotate(${rotation}deg)` }}
      draggable={false}
    />
  );
}

function CabanaTile({ cabana }: { cabana: CabanaState }) {
  const label = cabana.available ? "Available cabana" : "Unavailable cabana";
  return (
    <div
      className={`cabana-tile ${cabana.available ? "cabana-available" : "cabana-unavailable"}`}
      title={label}
      aria-label={label}
    >
      <img src={cabanaImg} alt="" className="tile-img" draggable={false} />
      {!cabana.available && (
        <div className="cabana-booked-overlay" aria-hidden="true" />
      )}
    </div>
  );
}

function MapTile({
  tile,
  row,
  col,
  tiles,
  cabanas,
}: {
  tile: Tile;
  row: number;
  col: number;
  tiles: Tile[][];
  cabanas: CabanaState[];
}) {
  switch (tile) {
    case "W": {
      const cabana = getCabana(cabanas, row, col);
      if (!cabana) return <div className="map-cell" />;
      return (
        <div className="map-cell">
          <CabanaTile cabana={cabana} />
        </div>
      );
    }
    case "c":
      return (
        <div className="map-cell">
          <img
            src={houseChimneyImg}
            alt="chalet"
            className="tile-img"
            draggable={false}
          />
        </div>
      );
    case "p":
      return (
        <div className="map-cell pool-cell">
          <img
            src={textureWater}
            alt=""
            className="tile-img pool-texture"
            draggable={false}
            aria-hidden="true"
          />
          <img
            src={poolImg}
            alt="pool"
            className="tile-img pool-icon"
            draggable={false}
          />
        </div>
      );
    case "#":
      return (
        <div className="map-cell">
          <PathTile tiles={tiles} row={row} col={col} />
        </div>
      );
    case ".":
    default:
      return <div className="map-cell empty-cell" />;
  }
}

export function ResortMap({ data }: ResortMapProps) {
  const { width, height, tiles, cabanas } = data;

  return (
    <div
      className="resort-map-wrapper"
      style={
        { "--map-cols": width, "--map-rows": height } as React.CSSProperties
      }
    >
      <div
        className="resort-map-grid"
        role="grid"
        aria-label="Resort map"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
        }}
      >
        {tiles.map((row, rowIdx) =>
          row.map((tile, colIdx) => (
            <MapTile
              key={`${rowIdx}-${colIdx}`}
              tile={tile}
              row={rowIdx}
              col={colIdx}
              tiles={tiles}
              cabanas={cabanas}
            />
          ))
        )}
      </div>
    </div>
  );
}
