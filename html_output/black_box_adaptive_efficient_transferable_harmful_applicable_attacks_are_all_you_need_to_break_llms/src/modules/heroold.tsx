import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const C = {
  bg: '#f5f8f0', envL: '#b8c9a7', envD: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

function drawScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.envL;
  ctx.fillRect(0, H - 36, W, 36);
}

function drawSafe(ctx: CanvasRenderingContext2D, x: number, y: number, open: number) {
  ctx.fillStyle = C.envD;
  ctx.fillRect(x, y, 90, 110);
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 90, 110);
  const door = 70 * (1 - open);
  ctx.fillStyle = C.blue;
  ctx.fillRect(x + 10, y + 15, door, 80);
  ctx.beginPath();
  ctx.arc(x + 55, y + 55, 10, 0, Math.PI * 2);
  ctx.fillStyle = C.orange;
  ctx.fill();
}

function drawPick(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(48, -6);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.fillRect(-8, -6, 14, 12);
  ctx.restore();
}

function drawDial(ctx: CanvasRenderingContext2D, x: number, y: number, v: number, label: string) {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = v > 0.7 ? C.red : v > 0.4 ? C.orange : C.green;
  ctx.beginPath();
  ctx.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText(label, x - 22, y + 48);
  ctx.fillText(v.toFixed(2), x - 14, y + 5);
}


export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, 244, 130); } catch { return; }
    const tick = () => {
      tRef.current += 0.03; const t = tRef.current;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 244, 130);
      ctx.fillStyle = C.envL; ctx.fillRect(0, 108, 244, 22);
      // stuck pick
      ctx.fillStyle = C.envD; ctx.fillRect(140, 20, 70, 88);
      ctx.fillStyle = C.red; ctx.fillRect(150, 30, 50, 68);
      const x = 50 + 6 * Math.sin(t * 4);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x + 40, 62); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '11px sans-serif'; ctx.fillText('旧攻击：缺口明显', 20, 18);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={244} height={130} />;
};
export default HeroOld;
