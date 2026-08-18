import { describe, it, expect } from "vitest";
import { pathVisual } from "./pathTile";

// Expected rotations derived from actual asset base orientations:
//   arrowEnd          default (0°) = closed at top (N), open at bottom → connects D
//   arrowCornerSquare default (0°) = bend at bottom-left, arms extend Up + Right → connects U+R
//   arrowSplit        default (0°) = two vertical sides + stub right → connects U+D+R (missing L)
//   arrowStraight     default (0°) = vertical → connects U+D
//   arrowCrossing     (no rotation) → connects all four

describe("pathVisual — path sprite and rotation selection", () => {
  // ── End caps (1 neighbour) ────────────────────────────────────────────────

  describe("end cap", () => {
    it("D only → end sprite, 0° (default: open South)", () => {
      const v = pathVisual({
        up: false,
        right: false,
        down: true,
        left: false,
      });

      expect(v.sprite).toBe("arrowEnd");
      expect(v.rotation).toBe(0);
    });

    it("U only → end sprite, 180° (rotated to open North)", () => {
      const v = pathVisual({
        up: true,
        right: false,
        down: false,
        left: false,
      });

      expect(v.sprite).toBe("arrowEnd");
      expect(v.rotation).toBe(180);
    });

    it("R only → end sprite, 270° (rotated to open East)", () => {
      const v = pathVisual({
        up: false,
        right: true,
        down: false,
        left: false,
      });

      expect(v.sprite).toBe("arrowEnd");
      expect(v.rotation).toBe(270);
    });

    it("L only → end sprite, 90° (rotated to open West)", () => {
      const v = pathVisual({
        up: false,
        right: false,
        down: false,
        left: true,
      });

      expect(v.sprite).toBe("arrowEnd");
      expect(v.rotation).toBe(90);
    });
  });

  // ── Straights (2 opposite neighbours) ────────────────────────────────────

  describe("straight", () => {
    it("U+D → straight sprite, 0° (vertical — default)", () => {
      const v = pathVisual({
        up: true,
        right: false,
        down: true,
        left: false,
      });

      expect(v.sprite).toBe("arrowStraight");
      expect(v.rotation).toBe(0);
    });

    it("L+R → straight sprite, 90° (horizontal)", () => {
      const v = pathVisual({
        up: false,
        right: true,
        down: false,
        left: true,
      });

      expect(v.sprite).toBe("arrowStraight");
      expect(v.rotation).toBe(90);
    });
  });

  // ── Corners (2 adjacent neighbours) ──────────────────────────────────────
  //
  // arrowCornerSquare default (0°):
  // bend at bottom-left, arms extend Up and Right → U+R

  describe("corner", () => {
    it("U+R → corner sprite, 0° (default: bend at bottom-left)", () => {
      const v = pathVisual({
        up: true,
        right: true,
        down: false,
        left: false,
      });

      expect(v.sprite).toBe("arrowCornerSquare");
      expect(v.rotation).toBe(0);
    });

    it("R+D → corner sprite, 90°", () => {
      const v = pathVisual({
        up: false,
        right: true,
        down: true,
        left: false,
      });

      expect(v.sprite).toBe("arrowCornerSquare");
      expect(v.rotation).toBe(90);
    });

    it("D+L → corner sprite, 180°", () => {
      const v = pathVisual({
        up: false,
        right: false,
        down: true,
        left: true,
      });

      expect(v.sprite).toBe("arrowCornerSquare");
      expect(v.rotation).toBe(180);
    });

    it("L+U → corner sprite, 270°", () => {
      const v = pathVisual({
        up: true,
        right: false,
        down: false,
        left: true,
      });

      expect(v.sprite).toBe("arrowCornerSquare");
      expect(v.rotation).toBe(270);
    });
  });

  // ── T-junctions / splits (3 neighbours) ──────────────────────────────────
  //
  // arrowSplit default (0°):
  // two vertical sides + stub right → U+D+R (missing L)

  describe("split / T-junction", () => {
    it("U+D+R (missing L) → split sprite, 0° (default)", () => {
      const v = pathVisual({
        up: true,
        right: true,
        down: true,
        left: false,
      });

      expect(v.sprite).toBe("arrowSplit");
      expect(v.rotation).toBe(0);
    });

    it("R+D+L (missing U) → split sprite, 90°", () => {
      const v = pathVisual({
        up: false,
        right: true,
        down: true,
        left: true,
      });

      expect(v.sprite).toBe("arrowSplit");
      expect(v.rotation).toBe(90);
    });

    it("U+D+L (missing R) → split sprite, 180°", () => {
      const v = pathVisual({
        up: true,
        right: false,
        down: true,
        left: true,
      });

      expect(v.sprite).toBe("arrowSplit");
      expect(v.rotation).toBe(180);
    });

    it("U+R+L (missing D) → split sprite, 270°", () => {
      const v = pathVisual({
        up: true,
        right: true,
        down: false,
        left: true,
      });

      expect(v.sprite).toBe("arrowSplit");
      expect(v.rotation).toBe(270);
    });
  });

  // ── 4-way crossing ────────────────────────────────────────────────────────

  describe("crossing", () => {
    it("U+R+D+L → crossing sprite, 0°", () => {
      const v = pathVisual({
        up: true,
        right: true,
        down: true,
        left: true,
      });

      expect(v.sprite).toBe("arrowCrossing");
      expect(v.rotation).toBe(0);
    });
  });
});