// Path tile visual selection.
//
// Sprite base orientations established by visual inspection of the actual assets:
//
//   arrowStraight    — two vertical lines; connects U + D (North–South)
//   arrowCornerSquare — corner with bend at bottom-left, arms extend Up and Right;
//                       connects U + R
//   arrowEnd         — pointed arch cap at top (North), open at bottom (South);
//                       connects D only
//   arrowSplit       — two vertical lines on the left with a horizontal stub
//                       extending right; connects U + D + R (missing Left)
//   arrowCrossing    — four-way crossing; no rotation needed
//
// "Connected" means the orthogonal neighbour is also a '#' tile.
//
// Rotation is CSS clockwise degrees: 0° is default, 90° = one quarter-turn CW, etc.
//
// Explicit connector-set → { sprite, rotation } table:
//
//   End caps (1 neighbour):
//     D        → arrowEnd,         0°   (default: open South)
//     U        → arrowEnd,       180°
//     R        → arrowEnd,       270°
//     L        → arrowEnd,        90°
//
//   Straights (2 opposite):
//     UD       → arrowStraight,    0°   (default: vertical)
//     LR       → arrowStraight,   90°
//
//   Corners (2 adjacent):
//     UR       → arrowCornerSquare, 0°  (default: bend bottom-left, arms up+right)
//     RD       → arrowCornerSquare, 90°
//     DL       → arrowCornerSquare,180°
//     LU       → arrowCornerSquare,270°
//
//   T-junctions (3 neighbours):
//     UDR      → arrowSplit,  0°  (default: vertical sides, stub right)
//     RDL      → arrowSplit,  90°
//     DLU      → arrowSplit, 180°
//     LUR      → arrowSplit, 270°
//
//   Crossing (4 neighbours):
//     URDL     → arrowCrossing, 0°

export type PathSprite =
  | "arrowStraight"
  | "arrowCornerSquare"
  | "arrowEnd"
  | "arrowSplit"
  | "arrowCrossing";

export interface PathVisual {
  sprite: PathSprite;
  /** CSS rotate() degrees applied to the sprite (clockwise) */
  rotation: number;
}

export interface Neighbours {
  up: boolean;
  right: boolean;
  down: boolean;
  left: boolean;
}

/**
 * Derive the correct path sprite and rotation from the four orthogonal
 * neighbour connections.
 *
 * Uses an explicit connector-set lookup table rather than arithmetic, so the
 * mapping is easy to verify against the actual asset orientations.
 */
export function pathVisual({ up, right, down, left }: Neighbours): PathVisual {
  // Build a canonical key from which directions are connected.
  // Order: U R D L — consistent with the comment table above.
  const key =
    (up ? "U" : "") +
    (right ? "R" : "") +
    (down ? "D" : "") +
    (left ? "L" : "");

  switch (key) {
    // ── Crossing ────────────────────────────────────────────────────────────
    case "URDL": return { sprite: "arrowCrossing", rotation: 0 };

    // ── T-junctions ─────────────────────────────────────────────────────────
    case "URD":  return { sprite: "arrowSplit",        rotation:   0 }; // missing L
    case "RDL":  return { sprite: "arrowSplit",        rotation:  90 }; // missing U
    case "DLU":  // DLU same ordering as UDL — normalise
    case "UDL":  return { sprite: "arrowSplit",        rotation: 180 }; // missing R
    case "LUR":  // LUR same as URL
    case "URL":  return { sprite: "arrowSplit",        rotation: 270 }; // missing D

    // ── Straights ───────────────────────────────────────────────────────────
    case "UD":   return { sprite: "arrowStraight",     rotation:   0 };
    case "LR":   // LR same as RL
    case "RL":   return { sprite: "arrowStraight",     rotation:  90 };

    // ── Corners ─────────────────────────────────────────────────────────────
    case "UR":   return { sprite: "arrowCornerSquare", rotation:   0 };
    case "RD":   return { sprite: "arrowCornerSquare", rotation:  90 };
    case "DL":   // DL same as LD
    case "LD":   return { sprite: "arrowCornerSquare", rotation: 180 };
    case "LU":   // LU same as UL
    case "UL":   return { sprite: "arrowCornerSquare", rotation: 270 };

    // ── End caps ────────────────────────────────────────────────────────────
    case "D":    return { sprite: "arrowEnd",          rotation:   0 };
    case "U":    return { sprite: "arrowEnd",          rotation: 180 };
    case "R":    return { sprite: "arrowEnd",          rotation: 270 };
    case "L":    return { sprite: "arrowEnd",          rotation:  90 };

    // ── Isolated / unknown — fallback to horizontal straight ────────────────
    default:     return { sprite: "arrowStraight",     rotation:  90 };
  }
}
