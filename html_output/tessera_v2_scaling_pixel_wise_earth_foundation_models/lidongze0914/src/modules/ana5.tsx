import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const CYCLE = 3000;
const X0 = 56;
const TUBE_Y = 64;
const SCALE_Y = 104;
const BUCKETS = [16, 32, 48, 64, 80, 96];
const K = 40;
const LOCK = 48;

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 22, W, 22);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 22);
  ctx.lineTo(W, H - 22);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D, count: number): void {
  let s = 31;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 16 + (s / 233280) * (W - 32);
    s = (s * 9301 + 49297) % 233280;
    const y = 12 + (s / 233280) * 38;
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

const tubeLen = (pos: number): number => map(pos, 16, 96, 70, 420);
const posX = (pos: number): number => X0 + tubeLen(pos);

function renderScene(ctx: CanvasRenderingContext2D, now: number): void {
  const p = (now % CYCLE) / CYCLE;
  let pos = 16;
  let fillN = 0;
  let locked = false;
  if (p < 0.1) {
    pos = 16;
  } else if (p < 0.58) {
    const t = clamp((p - 0.1) / 0.48, 0, 1);
    const seg = Math.min(1, Math.floor(t * 2));
    const local = clamp(t * 2 - seg, 0, 1);
    pos = lerp(16 + seg * 16, 16 + (seg + 1) * 16, easeOutCubic(local));
  } else if (p < 0.9) {
    pos = LOCK;
    locked = true;
    fillN = Math.floor(clamp((p - 0.58) / 0.18, 0, 1) * 8);
  } else {
    pos = lerp(LOCK, 16, easeOutCubic((p - 0.9) / 0.1));
  }

  clearScene(ctx);
  drawSky(ctx, 7);

  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, SCALE_Y);
  ctx.lineTo(520, SCALE_Y);
  ctx.stroke();

  const nearest = clamp(16 * Math.round(pos / 16), 16, 96);
  BUCKETS.forEach((b) => {
    const x = posX(b);
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, SCALE_Y - 6);
    ctx.lineTo(x, SCALE_Y + 6);
    ctx.stroke();
    if (!locked && p < 0.58 && b === nearest && b < K) {
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, SCALE_Y, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (locked && b === LOCK) {
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, SCALE_Y, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  if (fillN > 0) {
    ctx.fillStyle = '#228d5c';
    for (let i = 0; i < fillN; i += 1) {
      ctx.fillRect(posX(LOCK) - 12 - i * 7, SCALE_Y - 3, 5, 6);
    }
  }

  const hx = X0 + tubeLen(pos);
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X0, TUBE_Y - 10);
  ctx.lineTo(hx, TUBE_Y - 10);
  ctx.lineTo(hx, TUBE_Y + 10);
  ctx.lineTo(X0, TUBE_Y + 10);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(X0, TUBE_Y - 16);
  ctx.lineTo(X0, TUBE_Y + 16);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,126,71,0.25)';
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hx, TUBE_Y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(39,68,110,0.12)';
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.fillRect(478, 24, 46, 46);
  ctx.strokeRect(478, 24, 46, 46);
  ctx.fillStyle = '#21324a';
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('40', 501, 54);
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
    const tick = () => {
      renderScene(ctx, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      aria-label="伸缩镜筒逐格拉长并锁进最小卡位的动画"
    />
  );
};

export default Ana5;
