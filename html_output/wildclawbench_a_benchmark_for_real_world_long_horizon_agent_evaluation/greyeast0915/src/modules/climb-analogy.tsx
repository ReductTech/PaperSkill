import React, { useEffect, useRef } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawHikerSprite, drawMountainSprite, getClimbSprites } from './climb-sprites';

const W = 560;
const H = 140;
const C = { bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', ink: '#21324a', muted: '#68778f' };

function drawHold(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.route, r = 7) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, r + 2, r, -0.25, 0, Math.PI * 2); ctx.fill();
}

function drawRope(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color = C.blue, width = 3) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}

function drawTraveler(ctx: CanvasRenderingContext2D, x: number, y: number, _pose = 0, alpha = 1) {
  drawHikerSprite(ctx, x, y + 24, 48, 60, alpha);
}

function drawRouteCard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.route; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, 70, 52, 5); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
  [12, 24, 36].forEach((dy, i) => { ctx.beginPath(); ctx.moveTo(x + 10, y + dy); ctx.lineTo(x + 56 - i * 6, y + dy); ctx.stroke(); });
}

function drawScene(ctx: CanvasRenderingContext2D, chapter: number, t: number) {
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  drawMountainSprite(ctx, 18, 13, 524, 116, 0.26);
  ctx.strokeStyle = 'rgba(118,144,106,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 114); ctx.bezierCurveTo(160, 65, 330, 115, 505, 34); ctx.stroke();
  const wave = Math.sin(t * Math.PI * 2);

  if (chapter === 1) {
    const p = (t % 1); const x = 80 + 388 * p; const y = 111 - 70 * p + Math.sin(p * Math.PI * 4) * 13;
    const trailSteps = Math.max(2, Math.ceil(p * 32));
    const trail: Array<[number, number]> = [];
    for (let i = 0; i < trailSteps; i += 1) {
      const q = p * (i / (trailSteps - 1));
      trail.push([80 + 388 * q, 111 - 70 * q + Math.sin(q * Math.PI * 4) * 13]);
    }
    drawRope(ctx, trail, C.route); drawHold(ctx, 493, 29, C.green, 9); drawTraveler(ctx, x, y, wave * 2);
  } else if (chapter === 2) {
    drawRouteCard(ctx, 335, 48); drawHold(ctx, 486, 28, C.green, 9); drawTraveler(ctx, 270 + wave * 3, 94, 1);
  } else if (chapter === 3) {
    const hy = 77 + wave * 15; drawHold(ctx, 320, hy, C.orange, 9); drawTraveler(ctx, 250, 95, wave); ctx.strokeStyle = C.purple; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(320, 45); ctx.lineTo(320, 108); ctx.stroke(); ctx.setLineDash([]);
  } else if (chapter === 4) {
    const colors = [C.blue, C.red, C.purple, C.orange, C.dark, C.route];
    colors.forEach((color, i) => { ctx.strokeStyle = color; ctx.lineWidth = i === 2 ? 4 : 2; ctx.beginPath(); ctx.moveTo(75, 119); ctx.quadraticCurveTo(220 + i * 12, 35 + i * 11, 482, 28); ctx.stroke(); });
    drawHold(ctx, 495, 26, C.green, 9); drawTraveler(ctx, 125 + clamp(t, 0, 1) * 35, 101 - clamp(t, 0, 1) * 14, wave);
  } else if (chapter === 5) {
    const p = clamp(t, 0, 1);
    const x = 130 + p * 310;
    const y = 108 - p * 66 + Math.sin(p * Math.PI * 3) * 7;
    drawRope(ctx, [[72, 124], [205, 112], [350, 72], [480, 24], [x + 4, y + 10]], C.blue, 4);
    ctx.strokeStyle = C.route; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(72, 124, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(480, 24, 11, 0, Math.PI * 2); ctx.stroke();
    drawTraveler(ctx, x, y, wave * 2);
  } else if (chapter === 6) {
    drawHold(ctx, 360, 55, C.green, 12); drawTraveler(ctx, 290 + wave * 3, 92, -2); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(360, 55, 18 + wave * 2, 0, Math.PI * 2); ctx.stroke();
  } else if (chapter === 7) {
    drawHold(ctx, 486, 25, C.green, 9); drawTraveler(ctx, 370, 59, 0, 0.35); const p = clamp(t, 0, 1); drawTraveler(ctx, 105 + p * 340, 112 - p * 74, wave);
  } else if (chapter === 8) {
    drawRope(ctx, [[80, 125], [250, 82], [475, 27]], t < .5 ? C.blue : C.purple); drawHold(ctx, 490, 24, C.green, 9); drawTraveler(ctx, 250 + wave * 20, 83 - Math.abs(wave) * 10, wave);
  } else if (chapter === 9) {
    drawHold(ctx, 388, 54, C.green, 9); drawTraveler(ctx, 315 + wave * 6, 82, wave * 3); ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(270, 104, 12, 0, Math.PI * 2); ctx.fill();
  } else if (chapter === 10) {
    drawHold(ctx, 472, 31, C.green, 9); drawTraveler(ctx, 420, 60, wave); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(455, 58); ctx.lineTo(455, 21); ctx.stroke(); ctx.fillStyle = C.green; ctx.beginPath(); ctx.moveTo(456, 21); ctx.lineTo(492, 31); ctx.lineTo(456, 40); ctx.closePath(); ctx.fill();
  } else {
    drawRouteCard(ctx, 78, 54); drawRouteCard(ctx, 402, 30);
    ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(152, 82); ctx.bezierCurveTo(230, 24, 350, 126, 404, 58); ctx.stroke(); ctx.setLineDash([]);
    drawHold(ctx, 492, 26, C.green, 9); drawTraveler(ctx, 270 + wave * 8, 88 - Math.abs(wave) * 8, wave);
  }
}

export const ClimbAnalogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const chapter = clamp(Number(chapterId.replace('chap-', '')) || 1, 1, 11);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    getClimbSprites();
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.height = 'auto'; let startedAt = performance.now();
    const tick = (now: number) => { drawScene(ctx, chapter, ((now - startedAt) % 2600) / 2600); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { startedAt = performance.now(); if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, [chapter]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`第 ${chapter} 章登山类比动画`} />;
};

export default ClimbAnalogy;
