export type Vec3 = { x: number; y: number; z: number };

export type View3D = {
  ox: number;
  oy: number;
  scale: number;
  yaw?: number;
  pitch?: number;
  focal?: number;
};

export const LSM_COLORS = {
  bg: '#f5f8f0',
  floor: '#dfe8d7',
  floorDark: '#b8c9a7',
  blue: '#27446e',
  blueSoft: '#9bb2d3',
  green: '#228d5c',
  greenSoft: '#a8d8bd',
  red: '#c43f52',
  redSoft: '#efb6bf',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  white: '#ffffff',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = LSM_COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = LSM_COLORS.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

export function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = LSM_COLORS.ink,
  bold = false,
  size = 14,
) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 700 : 400} ${size}px "Segoe UI", sans-serif`;
  ctx.fillText(value, x, y);
}

export function project3D(point: Vec3, view: View3D) {
  const yaw = view.yaw ?? -0.65;
  const pitch = view.pitch ?? -0.45;
  const focal = view.focal ?? 520;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const rx = cy * point.x - sy * point.z;
  const rz = sy * point.x + cy * point.z;
  const ry = cp * point.y - sp * rz;
  const depth = sp * point.y + cp * rz;
  const perspective = focal / Math.max(120, focal + depth * view.scale);
  return {
    x: view.ox + rx * view.scale * perspective,
    y: view.oy - ry * view.scale * perspective,
    depth,
    perspective,
  };
}

export function line3D(
  ctx: CanvasRenderingContext2D,
  a: Vec3,
  b: Vec3,
  view: View3D,
  color: string,
  width = 1,
  dash: number[] = [],
) {
  const pa = project3D(a, view);
  const pb = project3D(b, view);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.stroke();
  ctx.restore();
}

export function poly3D(
  ctx: CanvasRenderingContext2D,
  points: Vec3[],
  view: View3D,
  fill: string,
  stroke = LSM_COLORS.line,
  width = 1,
) {
  const projected = points.map((p) => project3D(p, view));
  ctx.beginPath();
  projected.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawFloorGrid(
  ctx: CanvasRenderingContext2D,
  view: View3D,
  half = 65,
  step = 16,
  y = 0,
) {
  poly3D(
    ctx,
    [
      { x: -half, y, z: -half },
      { x: half, y, z: -half },
      { x: half, y, z: half },
      { x: -half, y, z: half },
    ],
    view,
    LSM_COLORS.floor,
    LSM_COLORS.floorDark,
  );
  for (let v = -half; v <= half; v += step) {
    line3D(ctx, { x: v, y: y + 0.1, z: -half }, { x: v, y: y + 0.1, z: half }, view, '#c4d2bc');
    line3D(ctx, { x: -half, y: y + 0.1, z: v }, { x: half, y: y + 0.1, z: v }, view, '#c4d2bc');
  }
}

export function drawCuboid(
  ctx: CanvasRenderingContext2D,
  center: Vec3,
  size: Vec3,
  view: View3D,
  colors: { front: string; side?: string; top?: string; stroke?: string },
) {
  const x0 = center.x - size.x / 2;
  const x1 = center.x + size.x / 2;
  const y0 = center.y - size.y / 2;
  const y1 = center.y + size.y / 2;
  const z0 = center.z - size.z / 2;
  const z1 = center.z + size.z / 2;
  const stroke = colors.stroke ?? LSM_COLORS.line;
  poly3D(ctx, [{ x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z0 }, { x: x1, y: y0, z: z1 }, { x: x0, y: y0, z: z1 }], view, colors.top ?? colors.front, stroke);
  poly3D(ctx, [{ x: x1, y: y0, z: z0 }, { x: x1, y: y1, z: z0 }, { x: x1, y: y1, z: z1 }, { x: x1, y: y0, z: z1 }], view, colors.side ?? colors.front, stroke);
  poly3D(ctx, [{ x: x0, y: y0, z: z1 }, { x: x1, y: y0, z: z1 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 }], view, colors.front, stroke);
}

export function drawPoint3D(
  ctx: CanvasRenderingContext2D,
  point: Vec3,
  view: View3D,
  color: string,
  radius = 4,
  halo = false,
) {
  const p = project3D(point, view);
  const r = Math.max(1.5, radius * p.perspective);
  if (halo) {
    ctx.fillStyle = `${color}28`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = LSM_COLORS.white;
  ctx.lineWidth = 1;
  ctx.stroke();
  return p;
}

export function drawCamera3D(
  ctx: CanvasRenderingContext2D,
  position: Vec3,
  target: Vec3,
  view: View3D,
  color = LSM_COLORS.blue,
  frustum = true,
) {
  const p = project3D(position, view);
  const t = project3D(target, view);
  if (frustum) {
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = (-dy / len) * 10;
    const ny = (dx / len) * 10;
    ctx.fillStyle = `${color}16`;
    ctx.strokeStyle = `${color}70`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(t.x + nx, t.y + ny);
    ctx.lineTo(t.x - nx, t.y - ny);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const angle = Math.atan2(t.y - p.y, t.x - p.x);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = LSM_COLORS.white;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-10, -7, 20, 14);
  ctx.strokeRect(-10, -7, 20, 14);
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.lineTo(17, 0);
  ctx.lineTo(10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return p;
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  view: View3D,
  offset: Vec3 = { x: 0, y: 0, z: 0 },
  accent = LSM_COLORS.green,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawCuboid(
    ctx,
    { x: offset.x, y: offset.y + 18, z: offset.z },
    { x: 46, y: 36, z: 32 },
    view,
    { front: '#f8faf7', side: '#dce7d8', top: '#ffffff', stroke: accent },
  );
  drawCuboid(
    ctx,
    { x: offset.x + 7, y: offset.y + 10, z: offset.z + 16.5 },
    { x: 11, y: 20, z: 1.2 },
    view,
    { front: '#f7fbf7', side: '#eef4ec', top: '#ffffff', stroke: accent },
  );
  drawPoint3D(ctx, { x: offset.x + 11, y: offset.y + 10, z: offset.z + 17.5 }, view, accent, 2.5);
  ctx.restore();
}

export function drawOrbitPath(
  ctx: CanvasRenderingContext2D,
  view: View3D,
  radiusX: number,
  radiusZ: number,
  color: string,
  from = -Math.PI * 0.82,
  to = Math.PI * 1.18,
  width = 2,
  dash: number[] = [],
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const a = from + ((to - from) * i) / 80;
    const p = project3D({ x: Math.cos(a) * radiusX, y: 2, z: Math.sin(a) * radiusZ }, view);
    i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawWorldAxes(ctx: CanvasRenderingContext2D, view: View3D, origin: Vec3, length = 18) {
  line3D(ctx, origin, { ...origin, x: origin.x + length }, view, LSM_COLORS.red, 2);
  line3D(ctx, origin, { ...origin, y: origin.y + length }, view, LSM_COLORS.green, 2);
  line3D(ctx, origin, { ...origin, z: origin.z + length }, view, LSM_COLORS.blue, 2);
  const px = project3D({ ...origin, x: origin.x + length }, view);
  const py = project3D({ ...origin, y: origin.y + length }, view);
  const pz = project3D({ ...origin, z: origin.z + length }, view);
  label(ctx, 'X', px.x + 3, px.y, LSM_COLORS.red, true, 11);
  label(ctx, 'Y', py.x + 3, py.y, LSM_COLORS.green, true, 11);
  label(ctx, 'Z', pz.x + 3, pz.y, LSM_COLORS.blue, true, 11);
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}
