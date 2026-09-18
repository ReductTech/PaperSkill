import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// hero-new — 本文方法：一台织机上一次连续引纬织满整行，上层经线（冻结、带斜纹标记）
// 与下层纬线在 4 个交叉点交错。540×200，与 hero-old 共用同一个 2.6 秒循环。无控件、无反馈。

const W = 540;
const H = 200;

const SCENE_BG = '#f5f8f0';
const C_WARP = '#b8c9a7';
const C_WARP_DEEP = '#76906a';
const C_LOOM = '#92400e';
const C_WEAVE = '#27446e';
const C_CROSS = '#7c3aed';
const C_SHUTTLE = '#f07e47';
const C_DONE = '#228d5c';
const C_BAD = '#c43f52';
const C_INSET = '#ffffff';
const C_MUTED = '#68778f';
const C_AXIS = '#d7deea';
const C_LABEL = '#21324a';

type XY = [number, number];
type WarpMark = 'normal' | 'dim' | 'broken';
type WarpState = (i: number) => WarpMark;

// ── Reusable Canvas drawing kit (defined locally in every widget file) ──────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = SCENE_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_AXIS;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C_WARP;
  ctx.lineWidth = 1.5;
  for (let x = 60; x <= w - 60; x += 24) {
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
  warpState?: WarpState
): void {
  ctx.strokeStyle = C_LOOM;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 12, w - 28, h - 24);
  if (warpCount <= 0) return;
  const from = 60;
  const to = w - 60;
  const step = warpCount > 1 ? (to - from) / (warpCount - 1) : 0;
  for (let i = 0; i < warpCount; i++) {
    const x = from + i * step;
    const st = warpState ? warpState(i) : 'normal';
    ctx.strokeStyle = st === 'broken' ? C_BAD : st === 'dim' ? C_AXIS : C_WARP;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
    if (st === 'broken') {
      ctx.strokeStyle = C_BAD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, h / 2);
      ctx.lineTo(x + 6, h / 2);
      ctx.stroke();
    }
  }
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string,
  flip = false
): void {
  const bw = 46 * scale;
  const bh = 18 * scale;
  const dir = flip ? -1 : 1;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - dir * bw * 2.4, y);
  ctx.lineTo(x - dir * bw * 0.5, y);
  ctx.stroke();
  roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 6 * scale);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * bw * 0.5, y - bh / 2);
  ctx.lineTo(x + dir * (bw * 0.5 + 9 * scale), y);
  ctx.lineTo(x + dir * bw * 0.5, y + bh / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: XY[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'corner' | 'band'
): void {
  ctx.strokeStyle = C_DONE;
  ctx.lineWidth = 2.5;
  if (mode === 'band') {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - w, y - w);
    ctx.lineTo(x, y - w);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'label' | 'muted'
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = variant === 'muted' ? C_MUTED : C_LABEL;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; text: string }[]
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 10, 12, 12);
    ctx.fillStyle = C_MUTED;
    ctx.fillText(it.text, cx + 17, y);
    cx += 17 + ctx.measureText(it.text).width + 22;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: XY,
  to: XY,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = C_INSET;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C_AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = C_LABEL;
    ctx.fillText(title, x + 10, y + 20);
  }
}

// ── Widget ─────────────────────────────────────────────────────────────────────

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (t: number) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 0);

      const x0 = 56;
      const x1 = 484;
      const yTop = 70;
      const yBot = 122;
      const prog = clamp(t / 0.82, 0, 1);

      // 上层经线：冻结（带斜纹标记）
      ctx.strokeStyle = C_WARP;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x0, yTop);
      ctx.lineTo(x1, yTop);
      ctx.stroke();
      ctx.strokeStyle = C_WARP_DEEP;
      ctx.lineWidth = 1.5;
      for (let x = x0 + 6; x < x1; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, yTop - 6);
        ctx.lineTo(x + 7, yTop + 6);
        ctx.stroke();
      }

      // 下层纬线：一次连续引纬
      const tip = x0 + (x1 - x0) * prog;
      ctx.strokeStyle = C_WEAVE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, yBot);
      ctx.lineTo(tip, yBot);
      ctx.stroke();

      // 4 个交叉点：垂直跳跃连接
      for (let i = 0; i < 4; i++) {
        const cx = x0 + ((i + 0.5) / 4) * (x1 - x0);
        const active = prog >= (i + 0.5) / 4;
        ctx.strokeStyle = active ? C_CROSS : C_AXIS;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, yTop);
        ctx.lineTo(cx, yBot);
        ctx.stroke();
        ctx.fillStyle = active ? C_CROSS : C_AXIS;
        ctx.beginPath();
        ctx.arc(cx, (yTop + yBot) / 2, active ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 织面与完成标记
      const clothW = (482 - 56) * prog;
      ctx.fillStyle = C_DONE;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(56, 148, clothW, 14);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C_DONE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(56, 148);
      ctx.lineTo(56 + clothW, 148);
      ctx.stroke();
      if (prog > 0.99) drawTarget(ctx, 484, 158, 12, 'corner');

      // 梭子（唯一独立运动的主体）
      if (prog < 1) drawSubject(ctx, tip, yBot, 0.72, C_SHUTTLE);
    };

    const tick = () => {
      const t = (performance.now() % 2600) / 2600;
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

export default HeroNew;
