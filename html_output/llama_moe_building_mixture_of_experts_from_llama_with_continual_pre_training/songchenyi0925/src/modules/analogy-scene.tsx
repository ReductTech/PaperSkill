import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const WOOD = '#92400e';

function stage(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7'; ctx.fillRect(0, 104, W, 36);
  ctx.strokeStyle = WOOD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 104); ctx.lineTo(W - 18, 104); ctx.stroke();
}

function stand(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, outline = false) {
  ctx.fillStyle = color; ctx.fillRect(x - 7, y - 18, 14, 28);
  ctx.strokeStyle = outline ? color : '#d7deea'; ctx.lineWidth = outline ? 3 : 1; ctx.strokeRect(x - 7, y - 18, 14, 28);
  ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, y + 26); ctx.stroke();
}

function baton(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color = BLUE) {
  const x2 = x + Math.cos(angle) * 34;
  const y2 = y + Math.sin(angle) * 34;
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
}

function route(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, active = true) {
  ctx.strokeStyle = active ? color : '#d7deea'; ctx.lineWidth = active ? 3 : 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, y1 - 24, x2, y2); ctx.stroke();
}

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chapter = Number(chapterId.replace('chap-', '')) || 1;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const started = performance.now();
    let raf: number | null = null;
    const frame = (now: number) => {
      const t = ((now - started) / 3000) % 1;
      stage(ctx);
      const phase = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
      if (chapter === 1) {
        for (let i = 0; i < 8; i++) stand(ctx, 90 + i * 28, 88, i < 6 ? '#d7deea' : GREEN, i < 6);
        baton(ctx, lerp(84, 376, phase), 36, -0.2, chapterId > 'chap-1' ? GREEN : RED);
      } else if (chapter === 2) {
        for (let i = 0; i < 3; i++) { ctx.strokeStyle = ['#27446e','#d97706','#228d5c'][i]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(84, 48 + i * 26); ctx.lineTo(466, 48 + i * 26); ctx.stroke(); }
        baton(ctx, lerp(90, 450, phase), 36, 0.35, ORANGE);
      } else if (chapter === 3) {
        ctx.fillStyle = '#d7deea'; ctx.fillRect(60, 48, 420, 42);
        const split = clamp(phase, 0, 1);
        for (let i = 0; i < 8; i++) { const x = 60 + i * 52.5; ctx.fillStyle = i < Math.round(split * 8) ? GREEN : '#e7ecef'; ctx.fillRect(x + 2, 50, 48, 38); }
        baton(ctx, lerp(64, 478, phase), 32, 0.1, BLUE);
      } else if (chapter === 4) {
        for (let i = 0; i < 8; i++) stand(ctx, 80 + i * 54, 88, [1,5].includes(i) ? GREEN : '#d7deea', [1,5].includes(i));
        baton(ctx, 80 + 54 * Math.round(phase * 7), 34, -0.1, GREEN);
      } else if (chapter === 5) {
        const colors = [BLUE, GREEN, PURPLE, ORANGE];
        for (let i = 0; i < 4; i++) { ctx.fillStyle = colors[i]; ctx.globalAlpha = 0.18; ctx.fillRect(42 + i * 126, 34, 108, 62); ctx.globalAlpha = 1; ctx.strokeStyle = colors[i]; ctx.lineWidth = 2; ctx.strokeRect(42 + i * 126, 34, 108, 62); }
        baton(ctx, lerp(88, 440, phase), 28, 0.25, colors[Math.min(3, Math.floor(phase * 4))]);
      } else if (chapter === 6) {
        ctx.strokeStyle = '#21324a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(116, 78, 27, -Math.PI * 0.7, Math.PI * 0.7); ctx.stroke();
        const a = -2.15 + phase * 1.4; ctx.strokeStyle = ORANGE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(116, 78); ctx.lineTo(116 + Math.cos(a) * 24, 78 + Math.sin(a) * 24); ctx.stroke();
        for (let i = 0; i < 8; i++) stand(ctx, 238 + i * 34, 92, i % 4 === 0 ? GREEN : '#d7deea', i % 4 === 0);
      } else if (chapter === 7) {
        ctx.strokeStyle = '#21324a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(86, 112); ctx.lineTo(86, 34); ctx.stroke();
        const a = -1.15 + phase * 0.8; baton(ctx, 86, 112, a, BLUE);
        for (let i = 0; i < 4; i++) { const x = 250 + i * 60; ctx.fillStyle = i === 1 ? GREEN : '#d7deea'; ctx.fillRect(x - 12, 104 - phase * (12 + i * 8), 24, 12 + phase * (12 + i * 8)); }
      } else if (chapter === 8) {
        const comps = ['#d7deea', BLUE, GREEN, ORANGE];
        for (let i = 0; i < 4; i++) { ctx.fillStyle = comps[i]; ctx.fillRect(74 + i * 108, 56, 86, 38); ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 1; ctx.strokeRect(74 + i * 108, 56, 86, 38); }
        route(ctx, 117, 94, 443, 94, GREEN); baton(ctx, lerp(106, 430, phase), 32, 0.2, GREEN);
      } else if (chapter === 9) {
        for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const active = c === Math.floor(phase * 7); ctx.fillStyle = active ? PURPLE : '#e7ecef'; ctx.fillRect(70 + c * 48, 30 + r * 20, 42, 14); }
        ctx.fillStyle = 'rgba(217,119,6,0.22)'; ctx.beginPath(); ctx.arc(70 + phase * 336, 36 + phase * 60, 24, 0, Math.PI * 2); ctx.fill();
        baton(ctx, 70 + phase * 336, 20 + phase * 60, 0.7, ORANGE);
      } else {
        const xs = [0, 1, 2, 3];
        xs.forEach((i) => { const y = 32 + i * 22; ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(66, y); ctx.lineTo(500, y); ctx.stroke(); });
        baton(ctx, 68 + easeOut(phase) * 410, 30, 0.15, GREEN);
        ctx.fillStyle = GREEN; ctx.fillRect(66 + easeOut(phase) * 390, 78, 36, 20);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (raf === null) raf = requestAnimationFrame(frame); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapter]);
  return <canvas ref={ref} width={W} height={H} />;
};
export default AnalogyScene;
