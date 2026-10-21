import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10 类比卡：两条轨道上的拼图进度同时启动，左边停在半路，右边把图拼了出来。
// 纯自动循环，不接输入，不显示反馈栏。周期 3.0 秒。

const W = 560;
const H = 140;
const CYCLE = 3000;

const BG = '#f5f8f0';
const ENV = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const LINE = '#d7deea';
const INK = '#21324a';
const MUTED = '#68778f';
const FONT_L = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
const FONT_S = '18px "Segoe UI", "Microsoft YaHei", sans-serif';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = ENV;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.globalAlpha = clamp(alpha + 0.35, 0, 1);
  ctx.strokeStyle = ENV_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill: string; stroke: string; line: string; dashed: boolean; lines: number }
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  if (opts.dashed) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = opts.fill;
    ctx.fill();
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (opts.lines > 0) {
      ctx.strokeStyle = opts.line;
      ctx.lineWidth = 1;
      for (let i = 0; i < opts.lines; i++) {
        const ly = y + h * ((i + 1) / (opts.lines + 1));
        ctx.beginPath();
        ctx.moveTo(x + 9, ly);
        ctx.lineTo(x + w - 9, ly);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted: boolean
) {
  ctx.save();
  ctx.font = muted ? FONT_S : FONT_L;
  ctx.fillStyle = muted ? MUTED : INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  run: number,
  cells: number,
  color: string,
  done: boolean
) {
  const cw = w / cells;

  ctx.save();
  roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 9);
  ctx.lineWidth = 2;
  if (done) {
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = LINE;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  for (let i = 0; i < cells; i++) {
    const cx = x + i * cw;
    const p = clamp(run - i, 0, 1);
    if (p <= 0.001) {
      drawPiece(ctx, cx + 2, y + 2, cw - 4, h - 4, {
        fill: '#ffffff',
        stroke: LINE,
        line: LINE,
        dashed: true,
        lines: 0,
      });
    } else if (p >= 0.999) {
      drawPiece(ctx, cx + 2, y + 2, cw - 4, h - 4, {
        fill: color,
        stroke: color,
        line: 'rgba(255, 255, 255, 0.55)',
        dashed: false,
        lines: 1,
      });
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, y - 4, cw * p, h + 8);
      ctx.clip();
      drawPiece(ctx, cx + 2, y + 2, cw - 4, h - 4, {
        fill: color,
        stroke: color,
        line: 'rgba(255, 255, 255, 0.55)',
        dashed: false,
        lines: 1,
      });
      ctx.restore();
    }
  }

  const fx = x + clamp(run, 0, cells) * cw;
  if (run > 0.05 && run < cells - 0.05) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, fx - 2, y + h / 2 - 5, 10, 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function draw(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W, H);
  clearScene(ctx, W, H);
  drawBoard(ctx, 12, 8, W - 24, H - 16, 0.14);

  const tx = 46;
  const tw = 468;
  const cells = 12;
  const ch = 24;
  const ease = (v: number) => 1 - Math.pow(1 - clamp(v, 0, 1), 3);

  const runLeft = ease(t / 700) * 4;
  const runRight = ease(t / 1600) * 11;

  drawTrack(ctx, tx, 34, tw, ch, runLeft, cells, BLUE, false);
  drawTrack(ctx, tx, 96, tw, ch, runRight, cells, GREEN, true);

  drawSceneLabel(ctx, '停在半路', tx, 18, false);
  drawSceneLabel(ctx, '拼出来了', tx, 78, false);
}

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const now = performance.now();
      const dt = lastRef.current > 0 ? now - lastRef.current : 16;
      lastRef.current = now;
      tRef.current = (tRef.current + dt) % CYCLE;
      draw(ctx, tRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };

    const start = () => {
      if (rafRef.current === null) {
        lastRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana10;
