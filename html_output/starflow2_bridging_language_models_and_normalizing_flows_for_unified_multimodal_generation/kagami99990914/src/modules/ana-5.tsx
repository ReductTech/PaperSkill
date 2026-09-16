import React, { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 类比动画：从经线束里挑出一根蓝色参照线，搭上橙色梭线继续引纬（560×140，无控件、无反馈）
const W = 560;
const H = 140;
const DURATION = 2600;

const CLR = {
  field: '#f5f8f0',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  inset: '#ffffff',
  muted: '#68778f',
  axis: '#d7deea',
  ink: '#21324a',
};

type Pt = { x: number; y: number };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = CLR.field;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = CLR.axis;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = CLR.warp;
  ctx.lineWidth = 2;
  for (let x = 24; x <= w - 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  }
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: number[]
): void {
  ctx.fillStyle = CLR.loom;
  ctx.fillRect(16, 10, w - 32, 6);
  ctx.fillRect(16, 10, 6, h - 40);
  ctx.fillRect(w - 22, 10, 6, h - 40);
  ctx.lineWidth = 2;
  for (let i = 0; i < warpCount; i++) {
    const x = 24 + (i * (w - 48)) / Math.max(1, warpCount - 1);
    const st = warpState ? warpState[i] ?? 1 : 1;
    ctx.strokeStyle = st < 0.5 ? CLR.axis : st > 0.85 ? CLR.warpDeep : CLR.warp;
    ctx.lineWidth = st > 0.85 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, h - 32);
    ctx.stroke();
  }
}

// 唯一运动主体：梭子（圆角船形 + 背后拖出一根线）
function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
): void {
  const w = 44 * scale;
  const h = 16 * scale;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 30 * scale, y);
  ctx.lineTo(x - w / 2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.quadraticCurveTo(x, y - h * 0.9, x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.quadraticCurveTo(x, y + h * 0.9, x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = stateColor;
  ctx.fill();
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Pt[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: string
): void {
  ctx.save();
  if (mode === 'corner') {
    ctx.fillStyle = CLR.done;
    ctx.fillRect(x, y, 9, 9);
  } else if (mode === 'band') {
    ctx.fillStyle = CLR.done;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y, w, 5);
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = CLR.done;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant = 'primary'
): void {
  ctx.fillStyle = variant === 'muted' ? CLR.muted : CLR.ink;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { label: string; color: string }[]
): void {
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  items.forEach((it, i) => {
    const lx = x + i * 112;
    ctx.fillStyle = it.color;
    ctx.fillRect(lx, y - 9, 12, 9);
    ctx.fillStyle = CLR.muted;
    ctx.fillText(it.label, lx + 18, y);
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  color: string,
  width: number,
  dashed = false
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = CLR.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = CLR.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  if (title) {
    ctx.fillStyle = CLR.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, x + 10, y + 18);
  }
}

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const refX = 300;

    const render = (t: number) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 22);

      // 织口横线
      drawPathOrSupport(ctx, [{ x: 40, y: 94 }, { x: 520, y: 94 }], CLR.loom, 1.5);

      const sx = 90 + (470 - 90) * easeInOutQuad(Math.min(1, t / 0.85));
      const linked = t >= 0.55;
      const connect = clamp(1 - Math.abs(sx - refX) / 150, 0, 1);

      // 冻结的参照线：始终留在经线束里，不随梭子移动
      ctx.save();
      ctx.strokeStyle = CLR.weave;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(refX, 22);
      ctx.lineTo(refX, 106);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = CLR.loom;
      ctx.fillRect(refX - 7, 16, 14, 7);

      // 搭上梭线的连接（由梭子位置驱动）
      if (connect > 0.02) {
        ctx.save();
        ctx.globalAlpha = connect;
        drawThread(ctx, { x: refX, y: 30 }, { x: sx, y: 88 }, CLR.weave, 2, false);
        ctx.restore();
        if (connect > 0.6) {
          ctx.fillStyle = CLR.cross;
          ctx.beginPath();
          ctx.arc(sx, 90, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = CLR.axis;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 已织出的这一行：搭上参照线后与参照线同粗细
      drawThread(
        ctx,
        { x: 64, y: 92 },
        { x: sx, y: 92 },
        linked ? CLR.weave : CLR.shuttle,
        3,
        false
      );

      // 唯一运动主体：梭子
      drawSubject(ctx, sx, 90, 1, CLR.shuttle);

      drawSceneLabel(ctx, refX + 8, 32, '冻结', 'muted');
    };

    const tick = () => {
      const t = (performance.now() % DURATION) / DURATION;
      render(t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
