// Shared carpentry drawing kit for the FCOS tutorial.
// Imported by every other widget via `from './carpentry-kit'` (resolved in src/modules/).
// Also exports a trivial CarpentryKit component so it can be listed as a widget entry.
import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export interface KitProps {
  chapterId: string;
  moduleId: string;
}

export const palette = {
  bg: '#f5f8f0',
  envLight: '#b8c9a7',
  envDark: '#76906a',
  wood: '#e9dcc3',
  woodEdge: '#8a6d4b',
  tape: '#92400e',
  nail: '#27446e',
  good: '#228d5c',
  bad: '#c43f52',
  emphasis: '#f07e47',
  aux: '#7c3aed',
  ink: '#21324a',
  inkMuted: '#68778f',
  techBorder: '#d7deea',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = palette.envLight;
  ctx.fillRect(0, h - 26, w, 26);
  ctx.fillStyle = palette.envDark;
  ctx.fillRect(0, h - 26, w, 3);
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  edge: string = palette.woodEdge
): void {
  ctx.fillStyle = palette.wood;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(138,109,75,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gy = y + (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x + 6, gy);
    ctx.lineTo(x + w - 6, gy);
    ctx.stroke();
  }
}

export function drawCenterMark(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, color: string = palette.good): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0.08, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 12, y);
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x, y + 12);
  ctx.stroke();
  ctx.restore();
}

export function drawNail(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = palette.nail, r: number = 7): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r + 4, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawTapeLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, dashed = false): void {
  ctx.save();
  ctx.strokeStyle = palette.tape;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawTemplateFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = palette.bad,
  lw: number = 3
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
}

// Simple carpenter figure. pose: 'idle' | 'measure' | 'fit' | 'scrape'
export function drawCarpenter(ctx: CanvasRenderingContext2D, x: number, y: number, pose: string, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // legs
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(-8, 0);
  ctx.moveTo(0, -34);
  ctx.lineTo(8, 0);
  ctx.stroke();
  // body
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, -62);
  ctx.stroke();
  // head
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(2, -72, 9, 0, Math.PI * 2);
  ctx.fill();
  // hat
  ctx.fillStyle = palette.tape;
  ctx.fillRect(-9, -84, 22, 5);
  // arms by pose
  ctx.beginPath();
  if (pose === 'measure') {
    ctx.moveTo(0, -58);
    ctx.lineTo(26, -48);
    ctx.moveTo(0, -58);
    ctx.lineTo(-14, -44);
  } else if (pose === 'fit') {
    ctx.moveTo(0, -58);
    ctx.lineTo(24, -66);
    ctx.moveTo(0, -58);
    ctx.lineTo(-20, -50);
  } else if (pose === 'scrape') {
    ctx.moveTo(0, -58);
    ctx.lineTo(24, -40);
    ctx.moveTo(0, -58);
    ctx.lineTo(-12, -46);
  } else {
    ctx.moveTo(0, -58);
    ctx.lineTo(16, -40);
    ctx.moveTo(0, -58);
    ctx.lineTo(-16, -40);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = palette.ink;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: Array<[string, string]>, x: number, y: number): void {
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  items.slice(0, 3).forEach(([color, label], i) => {
    const iy = y + i * 18;
    ctx.fillStyle = color;
    ctx.fillRect(x, iy - 10, 12, 12);
    ctx.fillStyle = palette.inkMuted;
    ctx.fillText(label, x + 17, iy);
  });
}

/** Autoplay loop helper: draws with time t in [0,1), pauses off-screen, adds is-ready. */
export function useAutoLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void,
  periodMs = 3000
): void {
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, w, h);
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let ready = false;
    const render = (now: number) => {
      const t = reduced ? 0.35 : (now % periodMs) / periodMs;
      draw(ctx, t);
      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      if (!reduced) raf = requestAnimationFrame(render);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced) render(0);
      else raf = requestAnimationFrame(render);
    };
    const stop = () => cancelAnimationFrame(raf);
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, [canvasRef, w, h, draw, periodMs]);
}

export const CarpentryKit: React.FC<KitProps> = () => <span style={{ display: 'none' }} />;
