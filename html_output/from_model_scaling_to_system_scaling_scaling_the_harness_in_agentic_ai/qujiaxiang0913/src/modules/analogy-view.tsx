import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawSea,
  drawTower,
  drawLamp,
  drawBeam,
  drawShip,
  drawLogbook,
  drawSceneLabel,
} from './lighthouseKit';

// Shared analogy widget for every chapter's "Analogy card". One <AnalogyView>
// draws all ten lighthouse-keeping scenes; the thin analogy-N.tsx wrappers pick
// which scene to show. All drawing comes from ./lighthouseKit so the palette,
// line weights and metaphor stay identical across chapters.

const W = 560;
const H = 140;
const LAMP_X = 56;
const LAMP_Y = 78;
const SEA_Y = 96;

// Per-chapter loop period (seconds), all within the 2.4–3.6s contract.
const PERIODS: Record<number, number> = {
  1: 3.0,
  2: 3.0,
  3: 3.2,
  4: 3.4,
  5: 3.0,
  6: 3.2,
  7: 3.2,
  8: 3.4,
  9: 3.2,
  10: 3.4,
};

function gauss(x: number, mu: number, s: number): number {
  const d = x - mu;
  return Math.exp(-(d * d) / (2 * s * s));
}

// ---- Scene 1: lamp is on, beam slowly swings, ship only lit while swept ----
function drawScene1(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  drawSea(ctx, w, h, SEA_Y);
  drawTower(ctx, LAMP_X, 134, 66);
  const angle = 0.145 + 0.32 * Math.sin(2 * Math.PI * t);
  const spread = 0.22;
  const reach = 300;
  drawBeam(ctx, LAMP_X, LAMP_Y, angle, spread, reach);
  drawLamp(ctx, LAMP_X, LAMP_Y, 0.9);
  const shipX = 330;
  const shipY = 118;
  const shipAngle = Math.atan2(shipY - LAMP_Y, shipX - LAMP_X);
  const lit = Math.abs(angle - shipAngle) < spread / 2;
  drawShip(ctx, shipX, shipY, lit ? 'lit' : 'dark');
  drawSceneLabel(ctx, 12, 16, '灯≠船');
}

// ---- Scene 2: lens rotates, beam narrows then widens; narrow reaches farther ----
function drawScene2(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  drawSea(ctx, w, h, SEA_Y);
  drawTower(ctx, LAMP_X, 134, 66);
  const aim = 0.145;
  const narrow = (1 + Math.cos(2 * Math.PI * t)) / 2; // 1 at cycle start
  const spread = 0.62 - 0.46 * narrow;
  const reach = 170 + 170 * narrow;
  drawBeam(ctx, LAMP_X, LAMP_Y, aim, spread, reach);
  drawLamp(ctx, LAMP_X, LAMP_Y, 0.9);
  const shipX = 330;
  const shipY = 118;
  const lit = reach >= 270;
  drawShip(ctx, shipX, shipY, lit ? 'lit' : 'dark');
  drawSceneLabel(ctx, 12, 16, '透镜聚光');
}

// ---- Scene 3: beam sweeps left→right, ship lit only while crossed ----
function drawScene3(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  drawSea(ctx, w, h, SEA_Y);
  drawTower(ctx, LAMP_X, 134, 66);
  const angle = lerp(-0.05, 0.62, t);
  const spread = 0.2;
  const reach = 360;
  drawBeam(ctx, LAMP_X, LAMP_Y, angle, spread, reach);
  drawLamp(ctx, LAMP_X, LAMP_Y, 0.9);
  const shipX = 330;
  const shipY = 118;
  const shipAngle = Math.atan2(shipY - LAMP_Y, shipX - LAMP_X);
  const lit = Math.abs(angle - shipAngle) < spread / 2;
  drawShip(ctx, shipX, shipY, lit ? 'lit' : 'dark');
  drawSceneLabel(ctx, 12, 16, '曝光≠看见');
}

// ---- Scene 4: six widgets fade in left→right and float up slightly ----
function drawWidget(ctx: CanvasRenderingContext2D, cx: number, cy: number, i: number): void {
  switch (i) {
    case 0:
      drawLamp(ctx, cx, cy, 0.8);
      break;
    case 1: // lens
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 6, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 2: // logbook
      drawLogbook(ctx, cx - 22, cy - 22, 44, 44, 3);
      break;
    case 3: // signal table
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.fillRect(cx - 20, cy - 22, 40, 44);
      ctx.strokeRect(cx - 20, cy - 22, 40, 44);
      ctx.fillStyle = C.aux;
      ctx.fillRect(cx - 14, cy - 14, 6, 6);
      ctx.fillRect(cx - 2, cy - 14, 6, 6);
      ctx.fillRect(cx - 14, cy - 2, 6, 6);
      break;
    case 4: // duty sheet
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.fillRect(cx - 22, cy - 24, 44, 48);
      ctx.strokeRect(cx - 22, cy - 24, 44, 48);
      ctx.strokeStyle = C.line;
      for (let r = 0; r < 4; r++) {
        const yy = cy - 16 + r * 10;
        ctx.beginPath();
        ctx.moveTo(cx - 16, yy);
        ctx.lineTo(cx + 16, yy);
        ctx.stroke();
      }
      break;
    case 5: // checker
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.fillRect(cx - 20, cy - 22, 40, 44);
      ctx.strokeRect(cx - 20, cy - 22, 40, 44);
      ctx.strokeStyle = C.hit;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx - 2, cy + 8);
      ctx.lineTo(cx + 12, cy - 10);
      ctx.stroke();
      break;
  }
}

function drawScene4(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number): void {
  const baseY = 84;
  for (let i = 0; i < 6; i++) {
    const a = clamp(t * 6 - i, 0, 1);
    const alpha = easeOutCubic(a);
    const floatY = -(1 - alpha) * 10;
    const x = 30 + i * 88;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawWidget(ctx, x, baseY + floatY, i);
    ctx.restore();
  }
  drawSceneLabel(ctx, 12, 16, '六部件');
}

// ---- Scene 5: logbook opens, a red strike grows across one row ----
function drawScene5(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number): void {
  const open = easeOutCubic(clamp(t / 0.5, 0, 1));
  ctx.save();
  ctx.translate(285, 80);
  ctx.rotate(-0.12 * (1 - open));
  ctx.translate(-285, -80);
  const lx = 220;
  const ly = 40;
  const lw = 130;
  const lh = 84;
  drawLogbook(ctx, lx, ly, lw, lh, 4, -1);
  const gap = lh / (4 + 1);
  const strikeY = ly + gap * 2 - 6;
  const tw = lw * 0.62;
  const p = easeOutCubic(clamp(t / 0.7, 0, 1));
  ctx.strokeStyle = C.miss;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(lx + 12, strikeY);
  ctx.lineTo(lx + 12 + tw * p, strikeY);
  ctx.stroke();
  ctx.restore();
  drawSceneLabel(ctx, 12, 16, '写≠可信');
}

// ---- Scene 6: marker moves between log row and chart; chart shows a mismatch ----
function drawScene6(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number): void {
  const lx = 24;
  const ly = 46;
  const lw = 86;
  const lh = 72;
  drawLogbook(ctx, lx, ly, lw, lh, 3);
  const cx0 = 372;
  const cy0 = 36;
  const cw = 160;
  const ch = 92;
  ctx.fillStyle = C.seaShallow;
  ctx.fillRect(cx0, cy0, cw, ch);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx0, cy0, cw, ch);
  // consistent green marker
  ctx.fillStyle = C.hit;
  ctx.beginPath();
  ctx.arc(cx0 + 40, cy0 + 30, 5, 0, Math.PI * 2);
  ctx.fill();
  const m = (1 + Math.sin(2 * Math.PI * t)) / 2; // 0..1, marker travels log→chart
  const markerX = lerp(lx + lw + 10, cx0 - 6, m);
  const markerY = 78;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
  ctx.fill();
  // shallow-water mismatch marker appears as the marker reaches the chart
  const showMismatch = clamp((m - 0.6) / 0.4, 0, 1);
  if (showMismatch > 0) {
    ctx.save();
    ctx.globalAlpha = showMismatch;
    ctx.strokeStyle = C.mark;
    ctx.fillStyle = C.mark;
    ctx.lineWidth = 2;
    const smx = cx0 + 120;
    const smy = cy0 + 58;
    ctx.beginPath();
    ctx.arc(smx, smy, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(smx - 9, smy + 9);
    ctx.lineTo(smx + 9, smy + 9);
    ctx.stroke();
    ctx.restore();
  }
  drawSceneLabel(ctx, 12, 16, '用时再核');
}

// ---- Scene 7: signal lamp raised & blinks twice; far sea flashes back once ----
function drawScene7(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  drawSea(ctx, w, h, SEA_Y);
  const postX = 110;
  const lift = clamp(t / 0.2, 0, 1) * 22;
  const lampY = 112 - lift;
  ctx.strokeStyle = C.tower;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(postX, 130);
  ctx.lineTo(postX, lampY + 8);
  ctx.stroke();
  const blink = Math.max(gauss(t, 0.3, 0.04), gauss(t, 0.52, 0.04));
  const intensity = 0.3 + 0.7 * blink;
  drawLamp(ctx, postX, lampY, intensity);
  const flash = gauss(t, 0.74, 0.05);
  if (flash > 0.02) {
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = C.beam;
    ctx.beginPath();
    ctx.arc(470, 100, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = flash * 0.4;
    ctx.beginPath();
    ctx.arc(470, 100, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawSceneLabel(ctx, 12, 16, '发出收回');
}

// ---- Scene 8: a highlight line sweeps down a duty sheet, then wraps to top ----
function drawScene8(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number): void {
  const sx = 150;
  const sy = 22;
  const sw = 260;
  const sh = 104;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeRect(sx, sy, sw, sh);
  const rows = 7;
  const gap = sh / rows;
  for (let r = 0; r < rows; r++) {
    const yy = sy + gap * r;
    ctx.strokeStyle = C.line;
    ctx.beginPath();
    ctx.moveTo(sx + 8, yy);
    ctx.lineTo(sx + sw - 8, yy);
    ctx.stroke();
  }
  const hy = sy + t * sh;
  ctx.strokeStyle = C.mark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx + 4, hy);
  ctx.lineTo(sx + sw - 4, hy);
  ctx.stroke();
  drawSceneLabel(ctx, 12, 16, '一整夜');
}

// ---- Scene 9: three handbooks; the middle one slides out and turns a page ----
function drawBook(ctx: CanvasRenderingContext2D, cx: number, cy: number, kind: number, pageA = 0): void {
  const bw = 64;
  const bh = 80;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - bh / 2);
  ctx.lineTo(cx - 6, cy + bh / 2);
  ctx.stroke();
  if (kind === 1 && pageA > 0) {
    ctx.save();
    ctx.translate(cx - 6, cy - bh / 2 + 6);
    ctx.rotate(pageA);
    ctx.fillStyle = 'rgba(240,126,71,0.25)';
    ctx.fillRect(0, 0, bw / 2 - 4, bh - 12);
    ctx.strokeStyle = C.mark;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, bw / 2 - 4, bh - 12);
    ctx.restore();
  }
}

function drawScene9(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number): void {
  const slide = Math.sin(Math.PI * t) * 36;
  const pageA = clamp(Math.sin(Math.PI * t), 0, 1) * (Math.PI * 0.7);
  const ys = 82;
  drawBook(ctx, 130, ys, 0);
  drawBook(ctx, 450, ys, 0);
  ctx.save();
  ctx.translate(slide, -slide * 0.3);
  drawBook(ctx, 290, ys, 1, pageA);
  ctx.restore();
  drawSceneLabel(ctx, 12, 16, '三种写法');
}

// ---- Scene 10: a record sheet on the wall; two curves grow into place ----
function drawCurve(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  baseY: number,
  p: number,
  color: string,
  phase: number
): void {
  const endX = x0 + (x1 - x0) * p;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const tt = i / steps;
    const fx = x0 + (x1 - x0) * tt;
    if (fx > endX) break;
    const y = baseY + Math.sin(tt * Math.PI * 2 + phase) * 8 * (1 - tt * 0.3);
    if (i === 0) ctx.moveTo(fx, y);
    else ctx.lineTo(fx, y);
  }
  ctx.stroke();
}

function drawScene10(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number): void {
  const px = 120;
  const py = 18;
  const pw = 320;
  const ph = 104;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeRect(px, py, pw, ph);
  const p = easeOutCubic(t);
  const x0 = px + 24;
  const x1 = px + pw - 24;
  const midY = py + ph / 2;
  drawCurve(ctx, x0, x1, midY - 6, p, C.ink, 0.0);
  drawCurve(ctx, x0, x1, midY + 18, p, C.inkMuted, 0.4);
  drawSceneLabel(ctx, 12, 16, '纵向评测');
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, scene: number, t: number): void {
  clearScene(ctx, w, h);
  switch (scene) {
    case 1:
      drawScene1(ctx, w, h, t);
      break;
    case 2:
      drawScene2(ctx, w, h, t);
      break;
    case 3:
      drawScene3(ctx, w, h, t);
      break;
    case 4:
      drawScene4(ctx, w, h, t);
      break;
    case 5:
      drawScene5(ctx, w, h, t);
      break;
    case 6:
      drawScene6(ctx, w, h, t);
      break;
    case 7:
      drawScene7(ctx, w, h, t);
      break;
    case 8:
      drawScene8(ctx, w, h, t);
      break;
    case 9:
      drawScene9(ctx, w, h, t);
      break;
    case 10:
      drawScene10(ctx, w, h, t);
      break;
    default:
      clearScene(ctx, w, h);
      break;
  }
}

export const AnalogyView: React.FC<WidgetProps & { scene?: number }> = ({ scene = 1 }) => {
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
    const s = scene || 1;
    const period = PERIODS[s] ?? 3.0;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = () => {
      if (rafRef.current) return;
      const begin = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - begin) / 1000;
        const phase = (elapsed % period) / period;
        drawScene(ctx, W, H, s, phase);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    if (reduced) {
      drawScene(ctx, W, H, s, 0.4);
      canvas.classList.add('is-ready');
      return () => {};
    }

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [scene]);

  return <canvas id={`analogy-cv-${scene}`} ref={canvasRef} width={W} height={H} />;
};

export default AnalogyView;
