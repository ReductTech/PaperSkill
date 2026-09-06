import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStage, drawSceneLabel, startObservedLoop } from './stage-analogy';

type Point3 = { x: number; y: number; z: number };
type Point2 = { x: number; y: number; depth: number; scale: number };

const lowerFrame: Point3[] = [
  { x: -1.35, y: 0.42, z: -0.58 },
  { x: 1.35, y: 0.42, z: -0.58 },
  { x: 1.35, y: 0.42, z: 0.58 },
  { x: -1.35, y: 0.42, z: 0.58 },
  { x: -1.35, y: 0.78, z: -0.58 },
  { x: 1.35, y: 0.78, z: -0.58 },
  { x: 1.35, y: 0.78, z: 0.58 },
  { x: -1.35, y: 0.78, z: 0.58 },
];

const cabinFrame: Point3[] = [
  { x: -0.68, y: 0.78, z: -0.48 },
  { x: 0.68, y: 0.78, z: -0.48 },
  { x: 0.68, y: 0.78, z: 0.48 },
  { x: -0.68, y: 0.78, z: 0.48 },
  { x: -0.48, y: 1.34, z: -0.42 },
  { x: 0.48, y: 1.34, z: -0.42 },
  { x: 0.48, y: 1.34, z: 0.42 },
  { x: -0.48, y: 1.34, z: 0.42 },
];

const boxEdges: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const wheels: Point3[] = [
  { x: -0.94, y: 0.36, z: -0.72 },
  { x: 0.94, y: 0.36, z: -0.72 },
  { x: -0.94, y: 0.36, z: 0.72 },
  { x: 0.94, y: 0.36, z: 0.72 },
];

function project(point: Point3, yaw: number): Point2 {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const horizontal = point.x * cos - point.z * sin;
  const depth = point.x * sin + point.z * cos;
  const scale = 1 + depth * 0.075;
  return {
    x: 180 + horizontal * 72 * scale,
    y: 139 - point.y * 58 * scale + depth * 12,
    depth,
    scale,
  };
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  points: Point3[],
  yaw: number,
  color: string,
  width: number,
) {
  const projected = points.map((point) => project(point, yaw));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  boxEdges.forEach(([from, to]) => {
    ctx.beginPath();
    ctx.moveTo(projected[from].x, projected[from].y);
    ctx.lineTo(projected[to].x, projected[to].y);
    ctx.stroke();
  });
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  center: Point2,
  yaw: number,
  color: string,
  ghost = false,
) {
  const radius = 11.5 * center.scale;
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(yaw * 0.18);
  ctx.fillStyle = ghost ? 'rgba(255,255,255,.18)' : C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = ghost ? 1.5 : 3;
  if (ghost) ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.78, radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (!ghost) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTurntable(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(184,201,167,.22)';
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(180, 145, 128, 29, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawWheelMismatchInset(
  ctx: CanvasRenderingContext2D,
  yaw: number,
  correctWheelPoints: Point2[],
  displayedWheelPoints: Point2[],
) {
  let focusIndex = 0;
  let largestOffset = -1;
  displayedWheelPoints.forEach((shown, index) => {
    const correct = correctWheelPoints[index];
    const offset = Math.hypot(shown.x - correct.x, shown.y - correct.y);
    if (offset > largestOffset) {
      largestOffset = offset;
      focusIndex = index;
    }
  });

  const correct = correctWheelPoints[focusIndex];
  const shown = displayedWheelPoints[focusIndex];
  const focus = { x: (correct.x + shown.x) / 2, y: (correct.y + shown.y) / 2 };
  const inset = { x: 238, y: 8, w: 112, h: 88 };

  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(focus.x, focus.y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(focus.x + 13, focus.y - 12);
  ctx.lineTo(inset.x, inset.y + inset.h - 9);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(inset.x, inset.y, inset.w, inset.h, 8);
  ctx.clip();
  ctx.fillStyle = '#fff7f7';
  ctx.fillRect(inset.x, inset.y, inset.w, inset.h);

  ctx.save();
  ctx.translate(inset.x + inset.w / 2, inset.y + inset.h / 2 + 11);
  ctx.scale(2.45, 2.45);
  ctx.translate(-focus.x, -focus.y);
  drawFrame(ctx, lowerFrame, yaw, C.rig, 1.15);
  const axleX = wheels[focusIndex].x;
  const axleLeft = project({ x: axleX, y: 0.36, z: -0.72 }, yaw);
  const axleRight = project({ x: axleX, y: 0.36, z: 0.72 }, yaw);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(axleLeft.x, axleLeft.y);
  ctx.lineTo(axleRight.x, axleRight.y);
  ctx.stroke();
  drawWheel(ctx, correct, yaw, C.line, true);
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(correct.x, correct.y);
  ctx.lineTo(shown.x, shown.y);
  ctx.stroke();
  drawWheel(ctx, shown, yaw, C.red);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,.94)';
  ctx.fillRect(inset.x, inset.y, inset.w, 23);
  ctx.restore();

  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(inset.x, inset.y, inset.w, inset.h, 8);
  ctx.stroke();
  drawSceneLabel(ctx, '轮胎错位 ×2.5', inset.x + inset.w / 2, inset.y + 16, C.ink, 'center');
}

type CarSceneOptions = {
  backgroundColor?: string;
  showLabels?: boolean;
  showTurntable?: boolean;
  showWheelInset?: boolean;
};

export function drawCarCameraScene(
  ctx: CanvasRenderingContext2D,
  yaw: number,
  isNew: boolean,
  options: CarSceneOptions = {},
) {
  const {
    backgroundColor,
    showLabels = true,
    showTurntable = true,
    showWheelInset = false,
  } = options;
  const degree = Math.round((yaw * 180) / Math.PI);
  if (backgroundColor) {
    ctx.clearRect(0, 0, 360, 190);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 360, 190);
  } else {
    clearStage(ctx, 360, 190);
  }
  if (showTurntable) drawTurntable(ctx);

  const correctWheelPoints = wheels.map((wheel) => project(wheel, yaw));
  const displayedWheelPoints = wheels.map((wheel, index) => {
    if (isNew) return correctWheelPoints[index];
    const wheelYaw = yaw * 0.52 + (wheel.x > 0 ? 0.055 : -0.04);
    return project(wheel, wheelYaw);
  });

  const sorted = wheels
    .map((_, index) => index)
    .sort((a, b) => correctWheelPoints[a].depth - correctWheelPoints[b].depth);

  if (!isNew) {
    sorted.forEach((index) => drawWheel(ctx, correctWheelPoints[index], yaw, C.line, true));
  }

  drawFrame(ctx, lowerFrame, yaw, isNew ? C.blue : C.rig, 2.6);
  drawFrame(ctx, cabinFrame, yaw, isNew ? C.blue : C.rig, 2.2);

  [-0.94, 0.94].forEach((axleX) => {
    const left = project({ x: axleX, y: 0.36, z: -0.72 }, yaw);
    const right = project({ x: axleX, y: 0.36, z: 0.72 }, yaw);
    ctx.strokeStyle = isNew ? C.green : C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  });

  if (!isNew) {
    sorted.forEach((index) => {
      const correct = correctWheelPoints[index];
      const shown = displayedWheelPoints[index];
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(correct.x, correct.y);
      ctx.lineTo(shown.x, shown.y);
      ctx.stroke();
    });
  }

  sorted.forEach((index) => {
    drawWheel(ctx, displayedWheelPoints[index], yaw, isNew ? C.green : C.red);
  });

  if (showWheelInset && !isNew) {
    drawWheelMismatchInset(ctx, yaw, correctWheelPoints, displayedWheelPoints);
  }

  if (showLabels) {
    drawSceneLabel(ctx, `相机视角 ${degree >= 0 ? '+' : ''}${degree}°`, 18, 23, C.blue);
    drawSceneLabel(
      ctx,
      isNew ? '车架与四轮对齐' : '轮位随视角发生漂移',
      180,
      177,
      isNew ? C.green : C.red,
      'center',
    );
  }
}

export const HeroCamera: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return startObservedLoop(canvas, 360, 190, (ctx, ms) => {
      const phase = reduced ? 0.72 : (ms % 4200) / 4200;
      const yaw = Math.sin(phase * Math.PI * 2) * 0.52;
      drawCarCameraScene(ctx, yaw, isNew);
    });
  }, [isNew]);

  return (
    <canvas
      ref={ref}
      width={360}
      height={190}
      aria-label={isNew ? 'PE-Field汽车几何对齐机制示意' : '传统方法汽车轮位漂移机制示意'}
    />
  );
};

export default HeroCamera;
