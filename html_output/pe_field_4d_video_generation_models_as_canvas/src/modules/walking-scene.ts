import { C, clearStage, drawCamera, drawSceneLabel } from './stage-analogy';

export const WALK_DURATION = 6;

export type WalkState = {
  time: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
};

export type Point3 = { x: number; y: number; z: number };

export function walkerWorldPoint(state: WalkState): Point3 {
  return {
    x: state.x - 1.8 + (3.6 * state.time) / WALK_DURATION,
    y: state.y,
    z: state.z,
  };
}

function rotatePoint(point: Point3, yawDegree: number) {
  const yaw = (yawDegree * Math.PI) / 180;
  return {
    horizontal: point.x * Math.cos(yaw) - point.y * Math.sin(yaw),
    depth: point.x * Math.sin(yaw) + point.y * Math.cos(yaw),
  };
}

function perspectiveScale(depth: number) {
  return Math.max(0.58, Math.min(1.45, 1 + depth * 0.28));
}

function drawPerspectivePath(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number; scale: number },
  end: { x: number; y: number; scale: number },
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const startHalf = 1.4 + start.scale * 1.4;
  const endHalf = 1.4 + end.scale * 1.4;
  ctx.fillStyle = C.rig;
  ctx.beginPath();
  ctx.moveTo(start.x + nx * startHalf, start.y + ny * startHalf);
  ctx.lineTo(end.x + nx * endHalf, end.y + ny * endHalf);
  ctx.lineTo(end.x - nx * endHalf, end.y - ny * endHalf);
  ctx.lineTo(start.x - nx * startHalf, start.y - ny * startHalf);
  ctx.closePath();
  ctx.fill();
}

function drawNearFarLabels(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number; scale: number },
  end: { x: number; y: number; scale: number },
) {
  const near = start.scale >= end.scale ? start : end;
  const far = start.scale >= end.scale ? end : start;
  drawSceneLabel(ctx, '近 · 大', near.x, near.y - 10, C.orange, 'center');
  drawSceneLabel(ctx, '远 · 小', far.x, far.y - 10, C.muted, 'center');
}

export function projectWorld(point: Point3, yawDegree: number) {
  const rotated = rotatePoint(point, yawDegree);
  const scale = perspectiveScale(rotated.depth);
  return {
    x: 170 + rotated.horizontal * 52 * scale,
    y: 171 - point.z * 38 * scale + rotated.depth * 15,
    scale,
  };
}

export function projectTarget(point: Point3, yawDegree: number, cx: number, baseY: number, scale = 36) {
  const rotated = rotatePoint(point, yawDegree);
  const perspective = perspectiveScale(rotated.depth);
  return {
    x: cx + rotated.horizontal * scale * perspective,
    y: baseY - point.z * scale * 0.8 * perspective + rotated.depth * scale * 0.16,
    scale: perspective,
  };
}

export function drawWalker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  color: string,
  scale = 1,
) {
  const swing = Math.sin(time * Math.PI * 2.2) * 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -25, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 2);
  ctx.moveTo(0, -11);
  ctx.lineTo(-8 - swing * 0.45, -1);
  ctx.moveTo(0, -11);
  ctx.lineTo(8 + swing * 0.45, -1);
  ctx.moveTo(0, 2);
  ctx.lineTo(-7 + swing, 18);
  ctx.moveTo(0, 2);
  ctx.lineTo(7 - swing, 18);
  ctx.stroke();
  ctx.restore();
}

function drawAxes(ctx: CanvasRenderingContext2D) {
  const ox = 38;
  const oy = 207;
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.blue;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 30, oy); ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 17, oy - 14); ctx.stroke();
  ctx.strokeStyle = C.orange;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - 28); ctx.stroke();
  drawSceneLabel(ctx, 'X', ox + 34, oy + 4, C.blue);
  drawSceneLabel(ctx, 'Y', ox + 18, oy - 16, C.green);
  drawSceneLabel(ctx, 'Z', ox - 5, oy - 32, C.orange);
}

export function drawTargetPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  state: WalkState,
  aligned: boolean,
  title: string,
) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = aligned ? C.blue : C.red;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  drawSceneLabel(ctx, title, x + width / 2, y + 20, aligned ? C.green : C.red, 'center');
  const start = { x: state.x - 1.8, y: state.y, z: state.z };
  const end = { x: state.x + 1.8, y: state.y, z: state.z };
  const pathStart = projectTarget(start, state.yaw, x + width / 2, y + height * 0.68, width / 6.2);
  const pathEnd = projectTarget(end, state.yaw, x + width / 2, y + height * 0.68, width / 6.2);
  drawPerspectivePath(ctx, pathStart, pathEnd);
  drawNearFarLabels(ctx, pathStart, pathEnd);

  const world = walkerWorldPoint(state);
  const correct = projectTarget(world, state.yaw, x + width / 2, y + height * 0.68, width / 6.2);
  const strength = Math.min(1, Math.abs(state.yaw) / 55);
  const driftX = aligned ? 0 : Math.sign(state.yaw || 1) * 28 * strength + Math.sin(state.time * 1.2) * 8 * strength;
  const driftY = aligned ? 0 : Math.cos(state.time * 0.9) * 7 * strength;

  if (!aligned && strength > 0.08) {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(correct.x, correct.y - 8 * correct.scale, 13 * correct.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(correct.x, correct.y - 8);
    ctx.lineTo(correct.x + driftX, correct.y + driftY - 8);
    ctx.stroke();
  }
  drawWalker(
    ctx,
    correct.x + driftX,
    correct.y + driftY,
    state.time,
    aligned ? C.green : C.red,
    0.72 * correct.scale,
  );
  drawSceneLabel(ctx, `t=${state.time.toFixed(1)}s`, x + 12, y + height - 12, C.orange);
  drawSceneLabel(ctx, `透视 ${Math.round(correct.scale * 100)}%`, x + width - 12, y + height - 12, C.blue, 'right');
  ctx.restore();
}

export function drawWalkingProjection(
  ctx: CanvasRenderingContext2D,
  state: WalkState,
  aligned: boolean,
) {
  clearStage(ctx, 560, 260);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(18, 28, 304, 196);
  ctx.strokeRect(18, 28, 304, 196);
  drawSceneLabel(ctx, '世界坐标中的直线路径', 34, 51, C.ink);

  const lineStart = projectWorld({ x: state.x - 1.8, y: state.y, z: state.z }, state.yaw);
  const lineEnd = projectWorld({ x: state.x + 1.8, y: state.y, z: state.z }, state.yaw);
  drawPerspectivePath(ctx, lineStart, lineEnd);
  drawNearFarLabels(ctx, lineStart, lineEnd);
  const world = walkerWorldPoint(state);
  const projected = projectWorld(world, state.yaw);
  drawWalker(ctx, projected.x, projected.y, state.time, C.blue, projected.scale);
  drawAxes(ctx);
  drawCamera(ctx, 278, 201, C.blue, 0.68);
  drawSceneLabel(ctx, `相机 ${state.yaw >= 0 ? '+' : ''}${state.yaw.toFixed(0)}°`, 300, 213, C.blue, 'right');
  drawSceneLabel(
    ctx,
    `P(t)=(${world.x.toFixed(1)}, ${world.y.toFixed(1)}, ${world.z.toFixed(1)})`,
    170,
    244,
    C.blue,
    'center',
  );
  drawSceneLabel(ctx, `画面尺度 ${Math.round(projected.scale * 100)}%`, 300, 69, C.orange, 'right');

  drawTargetPanel(ctx, 342, 28, 200, 196, state, aligned, aligned ? '目标画面：位置对齐' : '目标画面：隐式猜测');
}
