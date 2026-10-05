import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const scene = {
  field: '#f5f8f0', paper: '#ffffff', light: '#b8c9a7', dark: '#76906a',
  support: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#f07e47', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = scene.field;
  ctx.fillRect(0, 0, w, h);
}

export function drawSetting(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = scene.light;
  ctx.fillRect(x + 6, y + 7, w, h);
  ctx.fillStyle = scene.paper;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = scene.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clarity: number, color = scene.green) {
  const trace = (dx: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.78);
    ctx.lineTo(x + w * 0.18, y + h * 0.59);
    ctx.lineTo(x + w * 0.32, y + h * 0.67);
    ctx.lineTo(x + w * 0.55, y + h * 0.25);
    ctx.lineTo(x + w * 0.73, y + h * 0.55);
    ctx.lineTo(x + w, y + h * 0.38);
    ctx.lineTo(x + w + dx, y + h);
  };
  if (clarity < 0.75) {
    ctx.strokeStyle = scene.red;
    ctx.globalAlpha = 0.16 + (1 - clarity) * 0.18;
    ctx.lineWidth = 15 * (1 - clarity) + 4;
    trace(0); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 + clarity * 2;
  trace(0); ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.75, y + h * 0.23, 8, 0, Math.PI * 2);
  ctx.fillStyle = scene.orange;
  ctx.fill();
}

export function drawSubject(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle = 0, color = scene.blue) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = scene.support;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, r - 7, 0.25, Math.PI * 1.72); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawSupport(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = scene.support;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
}

export function drawSceneLabel(ctx: CanvasRenderingContext2D, value: string, x: number, y: number) {
  ctx.fillStyle = scene.text;
  ctx.font = '16px sans-serif';
  ctx.fillText(value, x, y);
}

export function drawLegend(ctx: CanvasRenderingContext2D, entries: { color: string; label: string }[], x: number, y: number) {
  ctx.font = '14px sans-serif';
  entries.slice(0, 3).forEach((item, index) => {
    const dx = x + index * 105;
    ctx.fillStyle = item.color; ctx.fillRect(dx, y - 10, 10, 10);
    ctx.fillStyle = scene.muted; ctx.fillText(item.label, dx + 15, y);
  });
}

export const PhotoScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 140);
    let frame = 0;
    let raf = 0;
    const chapter = Number(chapterId.replace('chap-', '')) || 0;
    const old = chapterId === 'hero' && moduleId === 'old';
    const tick = () => {
      const phase = (Math.sin(frame / 44) + 1) / 2;
      clearScene(ctx, 560, 140);
      drawSupport(ctx, 18, 115, 526);
      drawSetting(ctx, 193, 13, 335, 97);
      const clarity = old ? 0.2 : chapter === 1 ? 0.22 : 0.54 + phase * 0.36;
      drawTarget(ctx, 215, 23, 290, 70, clarity, old || chapter === 1 ? scene.red : scene.green);
      if (chapter === 2) {
        ctx.strokeStyle = scene.orange; ctx.lineWidth = 3;
        ctx.strokeRect(285 + phase * 80, 37, 56, 50);
      } else if (chapter === 6) {
        ctx.strokeStyle = scene.green; ctx.lineWidth = 3;
        ctx.strokeRect(190, 10, 341, 103);
      } else {
        drawSubject(ctx, 98 + (chapter === 3 ? phase * 13 : 0), 65, 38, (chapter === 4 || chapter === 5 ? phase : 0.15) * 0.7, old ? scene.red : scene.blue);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      frame += 1;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const disconnect = observeCanvas(canvas, tick, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId, moduleId]);
  return <canvas ref={canvasRef} width={560} height={140} aria-label="同一照片的清晰度变化示意" />;
};
