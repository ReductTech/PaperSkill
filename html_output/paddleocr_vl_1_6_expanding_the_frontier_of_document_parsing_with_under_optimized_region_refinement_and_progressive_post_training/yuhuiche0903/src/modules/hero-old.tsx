import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero old-method side (280x150): one red pen grades one dense exam paper.
// Every 2.8s pass the pen dips and leaves one more red cross (up to 3); a small
// red 误差累积 counter ticks 1 -> 2 -> 3, the page gets messier, then the loop
// restarts. Auto loop only, no controls.

const W = 280;
const H = 150;
const BAND = 14;
const PASS_MS = 2800;
const CYCLE_MS = PASS_MS * 3;

const PAL = {
  bg: '#f5f8f0',
  env: '#b8c9a7',
  envDark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

type Ctx = CanvasRenderingContext2D;

function desk(ctx: Ctx): void {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAL.env;
  ctx.fillRect(0, H - BAND, W, BAND);
  ctx.fillStyle = PAL.envDark;
  ctx.fillRect(0, H - BAND - 1.5, W, 1.5);
}

function lamp(ctx: Ctx): void {
  ctx.strokeStyle = PAL.envDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W - 22, H - 4);
  ctx.lineTo(W - 22, H - 18);
  ctx.lineTo(W - 9, H - 25);
  ctx.stroke();
  ctx.fillStyle = PAL.envDark;
  ctx.beginPath();
  ctx.moveTo(W - 17, H - 31);
  ctx.lineTo(W - 7, H - 31);
  ctx.lineTo(W - 13, H - 23);
  ctx.closePath();
  ctx.fill();
}

function sheet(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = PAL.env;
  ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function pen(ctx: Ctx, x: number, y: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = PAL.route;
  ctx.fillRect(-18, -2, 8, 4); // wooden handle
  ctx.fillStyle = color;
  ctx.fillRect(-10, -1.8, 16, 3.6); // body
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(14, -1.6);
  ctx.lineTo(14, 1.6);
  ctx.closePath();
  ctx.fill(); // nib
  ctx.restore();
}

function cross(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x - s, y + s);
  ctx.lineTo(x + s, y - s);
  ctx.stroke();
}

function label(ctx: Ctx, text: string, x: number, y: number, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.font = size + 'px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// dense paper content; gets visibly messier with each pass
function tableGrid(ctx: Ctx, x: number, y: number, pass: number): void {
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const ox = pass >= 1 && r === 1 ? 4 : 0; // row drifts after the first pass
      ctx.strokeRect(x + ox + c * 14, y + r * 11, 14, 11);
    }
  }
}

function dashRow(ctx: Ctx, x: number, y: number, width: number): void {
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let dx = x; dx < x + width; dx += 7) {
    ctx.moveTo(dx, y);
    ctx.lineTo(dx + 3, y);
  }
  ctx.stroke();
}

function scribbleRow(ctx: Ctx, x: number, y: number, width: number): void {
  ctx.strokeStyle = PAL.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let dx = x; dx < x + width; dx += 5) {
    ctx.moveTo(dx, y - 3);
    ctx.lineTo(dx + 2.5, y + 3);
  }
  ctx.stroke();
}

const CROSS_POS: Array<[number, number]> = [
  [56, 36],
  [128, 60],
  [82, 88],
];

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const t0 = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (now: number) => {
      const elapsed = (now - t0) % CYCLE_MS;
      const pass = Math.floor(elapsed / PASS_MS);
      const local = (elapsed % PASS_MS) / PASS_MS;
      ctx.clearRect(0, 0, W, H);
      // bg -> desk -> props (试卷, 台灯) -> content -> marks -> subject -> labels
      desk(ctx);
      lamp(ctx);
      sheet(ctx, 34, 14, 172, 92);
      tableGrid(ctx, 44, 24, pass);
      if (pass < 2) {
        dashRow(ctx, 44, 58, 140);
        dashRow(ctx, 44, 66, 140);
      } else {
        scribbleRow(ctx, 44, 58, 140);
        scribbleRow(ctx, 44, 66, 140);
      }
      dashRow(ctx, 44, 78, 140);
      if (pass >= 2) scribbleRow(ctx, 44, 87, 140);
      else dashRow(ctx, 44, 87, 140);
      // accumulated red crosses (up to 3)
      for (let p = 0; p <= pass; p++) {
        cross(ctx, CROSS_POS[p][0], CROSS_POS[p][1], 7, PAL.red);
      }
      // red pen dips at the current pass position and leaves the cross
      const target = CROSS_POS[pass];
      const dp = local < 0.5 ? local * 2 : (1 - local) * 2;
      pen(
        ctx,
        target[0],
        lerp(target[1] - 34, target[1] - 5, dp),
        -Math.PI / 2 + 0.35 * (1 - dp),
        PAL.red
      );
      // 误差累积 counter ticks 1 -> 2 -> 3
      label(ctx, '误差累积 ' + (pass + 1), 40, 130, 13, PAL.red);
      label(ctx, '试卷', 36, 10, 9, PAL.muted);
    };

    const tick = (now: number) => {
      render(now);
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

    if (reduced) {
      render(t0);
      canvas.classList.add('is-ready');
      return () => {};
    }
    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroOld;
