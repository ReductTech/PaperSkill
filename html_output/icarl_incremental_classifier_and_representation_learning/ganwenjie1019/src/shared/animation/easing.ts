import type { Vector2 } from "../../data/icarl-runtime";

/**
 * Deterministic motion helpers shared by the P3/P4 feature-space animations and the P5 flow map.
 * Every renderer derives geometry from a single timeline clock; nothing here advances business
 * state, produces randomness or mutates algorithm data.
 */

export function clamp(value: number, min = 0, max = 1): number {
  return value < min ? min : value > max ? max : value;
}

/** Maps a value from one window onto 0–1, then clamps. */
export function progressWithin(value: number, start: number, end: number): number {
  if (end <= start) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start));
}

export function smoothstep(value: number): number {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/** Reaches its target a little more deliberately than smoothstep; used for object landings. */
export function easeOutCubic(value: number): number {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
}

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp(progress);
}

export function lerpVector(from: Vector2, to: Vector2, progress: number): [number, number] {
  const t = smoothstep(progress);
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

/** Straight-line position between two already-projected points. */
export function lerpPoint(from: { x: number; y: number }, to: { x: number; y: number }, progress: number) {
  const t = smoothstep(progress);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** Linear (constant-speed) point interpolation for scanning indicators. */
export function movePoint(from: { x: number; y: number }, to: { x: number; y: number }, progress: number) {
  const t = clamp(progress);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

export type Point = { x: number; y: number };

/** Arc path segment of `sweepDeg` degrees starting at `startDeg`, following SVG screen orientation. */
export function arcSegmentPath(
  center: Point,
  radius: number,
  startDeg: number,
  sweepDeg: number,
  segments = 24,
): string {
  const sweep = Math.max(Math.abs(sweepDeg), 0.0001) * Math.sign(sweepDeg || 1);
  const pieces = Math.max(1, Math.ceil(Math.abs(sweep) / (360 / segments)));
  const step = sweep / pieces;
  const toPoint = (deg: number): Point => {
    const radians = (deg * Math.PI) / 180;
    return { x: center.x + Math.cos(radians) * radius, y: center.y + Math.sin(radians) * radius };
  };
  const start = toPoint(startDeg);
  let path = `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`;
  for (let index = 1; index <= pieces; index += 1) {
    const point = toPoint(startDeg + step * index);
    path += ` A ${radius} ${radius} 0 0 ${step >= 0 ? 1 : 0} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
  }
  return path;
}

/** Draws `progress` of a straight line without moving either endpoint. */
export function lineRevealPath(from: Point, to: Point, progress: number): string {
  const end = movePoint(from, to, clamp(progress));
  return `M ${from.x.toFixed(3)} ${from.y.toFixed(3)} L ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

/** Angle of a projected chart point measured in SVG screen degrees (0° = +x, growing clockwise). */
export function angleDeg(center: Point, point: Point): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

export function pointAtAngle(center: Point, radius: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return { x: center.x + Math.cos(radians) * radius, y: center.y + Math.sin(radians) * radius };
}

/** Shortest absolute distance between two angles, in degrees. */
export function angularDistance(a: number, b: number): number {
  let delta = Math.abs(a - b) % 360;
  if (delta > 180) delta = 360 - delta;
  return delta;
}

/**
 * Clockwise interval measured in screen-clockwise degrees from a common start angle.
 * Crossing the -180/180 boundary simply keeps growing instead of jumping back.
 */
export function clockwiseOffset(startDeg: number, degrees: number): number {
  const raw = startDeg - degrees;
  return ((raw % 360) + 360) % 360;
}

export function formatFixed(value: number, digits = 3): string {
  return value.toFixed(digits);
}

/**
 * Places a label for a mark without letting the text leave the canvas.
 *
 * A label may move; the mark it describes may not. Widths are estimated in text units from the
 * font size, so the result stays correct at every rendered scale, and the anchor flips when the
 * preferred side has no room.
 */
export function placeLabel(
  point: Point,
  text: string,
  options: {
    dx: number;
    dy: number;
    anchor?: "start" | "middle" | "end";
    fontSize?: number;
    bounds: { width: number; height: number };
    pad?: number;
  },
): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  const fontSize = options.fontSize ?? 17;
  const pad = options.pad ?? 8;
  const textUnits =
    [...text].reduce((sum, char) => sum + (/[\u2e80-\u9fff\uff00-\uffef]/.test(char) ? 1 : 0.62), 0) * fontSize;
  const lineHalf = fontSize * 0.62;
  let anchor = options.anchor ?? "start";
  let x = point.x + options.dx;
  let y = point.y + options.dy;
  const rightExtent = (candidate: "start" | "middle" | "end") =>
    x + (candidate === "start" ? textUnits : candidate === "middle" ? textUnits / 2 : 0);
  const leftExtent = (candidate: "start" | "middle" | "end") =>
    x - (candidate === "end" ? textUnits : candidate === "middle" ? textUnits / 2 : 0);
  if (rightExtent(anchor) > options.bounds.width - pad && leftExtent("end") >= pad) anchor = "end";
  if (rightExtent(anchor) > options.bounds.width - pad) x -= rightExtent(anchor) - (options.bounds.width - pad);
  if (leftExtent(anchor) < pad) x += pad - leftExtent(anchor);
  y = Math.min(Math.max(y, pad + lineHalf), options.bounds.height - pad);
  return { x, y, anchor };
}
