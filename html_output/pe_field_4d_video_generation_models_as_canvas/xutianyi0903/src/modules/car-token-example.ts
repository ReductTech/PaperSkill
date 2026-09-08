import { C, drawSceneLabel } from './stage-analogy';

export type WheelId = 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';

type Point3 = { x: number; y: number; z: number };
export type ProjectedPoint = { x: number; y: number; depth: number; scale: number };

export const wheelNames: Record<WheelId, string> = {
  frontLeft: '前左轮',
  frontRight: '前右轮',
  rearLeft: '后左轮',
  rearRight: '后右轮',
};

export const wheelPoints: Record<WheelId, Point3> = {
  frontLeft: { x: .94, y: .36, z: -.72 },
  frontRight: { x: .94, y: .36, z: .72 },
  rearLeft: { x: -.94, y: .36, z: -.72 },
  rearRight: { x: -.94, y: .36, z: .72 },
};

const lowerFrame: Point3[] = [
  { x: -1.35, y: .42, z: -.58 }, { x: 1.35, y: .42, z: -.58 },
  { x: 1.35, y: .42, z: .58 }, { x: -1.35, y: .42, z: .58 },
  { x: -1.35, y: .78, z: -.58 }, { x: 1.35, y: .78, z: -.58 },
  { x: 1.35, y: .78, z: .58 }, { x: -1.35, y: .78, z: .58 },
];

const cabinFrame: Point3[] = [
  { x: -.68, y: .78, z: -.48 }, { x: .68, y: .78, z: -.48 },
  { x: .68, y: .78, z: .48 }, { x: -.68, y: .78, z: .48 },
  { x: -.48, y: 1.34, z: -.42 }, { x: .48, y: 1.34, z: -.42 },
  { x: .48, y: 1.34, z: .42 }, { x: -.48, y: 1.34, z: .42 },
];

const boxEdges: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

export function projectCarPoint(point: Point3, yaw: number, centerX: number, groundY: number, size = 1): ProjectedPoint {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const horizontal = point.x * cos - point.z * sin;
  const depth = point.x * sin + point.z * cos;
  const perspective = 1 + depth * .075;
  return {
    x: centerX + horizontal * 67 * size * perspective,
    y: groundY - point.y * 49 * size * perspective + depth * 8 * size,
    depth,
    scale: size * perspective,
  };
}
export function wheelAddress(id: WheelId, yaw: number) {
  const point = wheelPoints[id];
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const horizontal = point.x * cos - point.z * sin;
  const depth = point.x * sin + point.z * cos;
  return {
    t: 1,
    h: Math.max(.08, Math.min(.92, .71 + depth * .055)),
    w: Math.max(.08, Math.min(.92, .5 + horizontal * .235)),
  };
}

export function drawTokenWheel(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, dashed = false) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = C.white; ctx.strokeStyle = color; ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.ellipse(0, 0, radius * .78, radius, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, radius * .24), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, points: Point3[], yaw: number, centerX: number, groundY: number, size: number, color: string) {
  const projected = points.map(point => projectCarPoint(point, yaw, centerX, groundY, size));
  ctx.strokeStyle = color; ctx.lineWidth = 2.3; ctx.lineJoin = 'round';
  boxEdges.forEach(([from, to]) => {
    ctx.beginPath(); ctx.moveTo(projected[from].x, projected[from].y); ctx.lineTo(projected[to].x, projected[to].y); ctx.stroke();
  });
}

export function drawExampleCar(
  ctx: CanvasRenderingContext2D,
  options: {
    centerX: number; groundY: number; yaw: number; size?: number;
    activeWheel?: WheelId; accent?: string; outline?: boolean; labelActive?: boolean;
  },
) {
  const { centerX, groundY, yaw, size = 1, activeWheel, accent = C.orange, outline = false, labelActive = false } = options;
  const wireColor = outline ? C.line : C.blue;
  ctx.fillStyle = outline ? 'rgba(184,201,167,.10)' : 'rgba(184,201,167,.22)'; ctx.strokeStyle = C.light; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(centerX, groundY - 3, 112 * size, 25 * size, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  drawFrame(ctx, lowerFrame, yaw, centerX, groundY, size, wireColor);
  drawFrame(ctx, cabinFrame, yaw, centerX, groundY, size, wireColor);

  const projected = Object.fromEntries(
    (Object.keys(wheelPoints) as WheelId[]).map(id => [id, projectCarPoint(wheelPoints[id], yaw, centerX, groundY, size)]),
  ) as Record<WheelId, ProjectedPoint>;
  const order = (Object.keys(projected) as WheelId[]).sort((a, b) => projected[a].depth - projected[b].depth);
  order.forEach(id => {
    const point = projected[id];
    const active = id === activeWheel;
    drawTokenWheel(ctx, point.x, point.y, 11.5 * point.scale, active ? accent : (outline ? C.line : C.ink));
    if (active) {
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(point.x, point.y, 19 * point.scale, 0, Math.PI * 2); ctx.stroke();
      if (labelActive) drawSceneLabel(ctx, wheelNames[id], point.x, point.y - 25 * point.scale, accent, 'center');
    }
  });
  return projected;
}
