import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Analogy card: one component, branches on chapterId to draw the 10 jigsaw scenes.
// Each scene = one subject + one verb + one goal, at 560x140.

const W = 560;
const H = 140;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(0, H - 24, W, 2);
}

function piece(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - s / 2, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function hand(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, -4, -27, 8, 24, 4);
  ctx.fill();
  ctx.restore();
}

function cover(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#7c3aed';
  roundRect(ctx, -w / 2, -h / 2, w, h, 3);
  ctx.fill();
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, chapterId: string, p: number) {
  clearScene(ctx);
  if (chapterId === 'chap-1') {
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 44, 200, 72, 6);
    ctx.stroke();
    piece(ctx, 74, 80, 26, '#27446e');
    ctx.strokeStyle = '#228d5c';
    ctx.setLineDash([5, 4]);
    roundRect(ctx, 156, 56, 40, 38, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    const jx = 280 + 9 * Math.sin(p * Math.PI * 2);
    const jy = 70 + 6 * Math.sin(p * Math.PI * 2 * 1.7);
    piece(ctx, jx, jy, 30, '#c43f52');
    hand(ctx, jx + 18, jy - 34, 0.2);
    ctx.strokeStyle = '#c43f52';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W - 40, 30);
    ctx.lineTo(W - 22, 48);
    ctx.moveTo(W - 22, 30);
    ctx.lineTo(W - 40, 48);
    ctx.stroke();
  } else if (chapterId === 'chap-2') {
    ctx.fillStyle = '#27446e';
    roundRect(ctx, 40, 30, 150, 90, 4);
    ctx.fill();
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(40, 30, 150, 34);
    ctx.strokeStyle = '#76906a';
    ctx.lineWidth = 2;
    const cut = p < 0.5 ? p * 2 : 2 - p * 2;
    ctx.beginPath();
    ctx.moveTo(40 + cut * 150, 30);
    ctx.lineTo(40 + cut * 150, 120);
    ctx.moveTo(40, 30 + cut * 90);
    ctx.lineTo(190, 30 + cut * 90);
    ctx.stroke();
    const off = 3 * Math.sin(p * Math.PI);
    piece(ctx, 260 + off, 76, 30, '#27446e');
    piece(ctx, 300 - off, 76, 30, '#27446e');
    hand(ctx, 40 + cut * 150, 132, 1.4);
  } else if (chapterId === 'chap-3') {
    piece(ctx, 120, 78, 28, '#27446e');
    cover(ctx, 460, 52, 56, 56, 0.18);
    ctx.strokeStyle = '#76906a';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 78);
    ctx.lineTo(430, 60);
    ctx.moveTo(190, 78);
    ctx.lineTo(430, 60);
    ctx.stroke();
    ctx.setLineDash([]);
    const settle = clamp((p - 0.3) / 0.7, 0, 1);
    piece(ctx, 210 + settle * 90, 78, 30, settle > 0.6 ? '#228d5c' : '#f07e47');
  } else if (chapterId === 'chap-4') {
    ctx.strokeStyle = '#228d5c';
    ctx.setLineDash([5, 4]);
    roundRect(ctx, 210, 66, 42, 40, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    const down = clamp((p - 0.2) / 0.6, 0, 1);
    piece(ctx, 231, 40 + down * 46, 30, down > 0.6 ? '#228d5c' : '#c43f52');
    hand(ctx, 231, 40 + down * 46 - 26, 0);
  } else if (chapterId === 'chap-5') {
    const flip = clamp((p - 0.2) / 0.5, 0, 1);
    cover(ctx, 250, 70, 60, 60, (1 - flip) * 1.4);
    if (flip > 0.5) piece(ctx, 360, 70, 26, '#27446e');
    hand(ctx, 250, 40, -0.3 + flip * 0.8);
  } else if (chapterId === 'chap-6') {
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 54, 250, 44, 5);
    ctx.stroke();
    const n = 5;
    const cur = Math.floor(p * n);
    for (let i = 0; i < n; i++) {
      const x = 66 + i * 46;
      if (i < cur) piece(ctx, x, 76, 24, '#27446e');
      else if (i === cur) piece(ctx, x, 76, 24, '#f07e47');
      else {
        ctx.strokeStyle = '#d7deea';
        roundRect(ctx, x - 12, 64, 24, 24, 3);
        ctx.stroke();
      }
    }
    hand(ctx, 66 + cur * 46, 40, 0);
  } else if (chapterId === 'chap-7') {
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(280, 112);
    ctx.lineTo(280, 52);
    ctx.stroke();
    const tilt = 0.35 * Math.sin(p * Math.PI * 2);
    ctx.save();
    ctx.translate(280, 52);
    ctx.rotate(tilt);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.lineTo(80, 0);
    ctx.stroke();
    piece(ctx, -80, 16, 24, '#76906a');
    piece(ctx, 80, 16, 24, '#f07e47');
    ctx.restore();
    hand(ctx, 280, 30, 0);
  } else if (chapterId === 'chap-8') {
    cover(ctx, 200, 60, 52, 52, 0);
    piece(ctx, 330, 60, 26, '#27446e');
    const slide = clamp((p - 0.2) / 0.6, 0, 1);
    hand(ctx, 200 - 30 + slide * 40, 40, 0);
  } else if (chapterId === 'chap-9') {
    piece(ctx, 130, 70, 26, '#27446e');
    ctx.strokeStyle = '#228d5c';
    ctx.setLineDash([5, 4]);
    roundRect(ctx, 300, 56, 40, 40, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    const zip = clamp((p - 0.4) / 0.4, 0, 1);
    piece(ctx, 320, 20 + zip * 52, 28, '#228d5c');
    if (p < 0.4) hand(ctx, 130, 42, -0.6);
    else hand(ctx, 320, 20 + zip * 52 - 26, 0);
  } else {
    const fill = clamp((p - 0.25) / 0.55, 0, 1);
    ctx.strokeStyle = fill > 0.9 ? '#228d5c' : '#d7deea';
    ctx.lineWidth = 3;
    roundRect(ctx, 40, 44, 220, 72, 6);
    ctx.stroke();
    piece(ctx, 74, 80, 26, '#27446e');
    piece(ctx, 128, 80, 26, '#27446e');
    piece(ctx, 182, 80, 26, '#27446e');
    piece(ctx, 236, 80, 26, '#27446e');
    piece(ctx, 128, 44, 26, '#27446e');
    piece(ctx, 182, 44, 26, '#27446e');
    const fx = 236;
    const fy = 44;
    piece(ctx, fx, fy - (1 - fill) * 40, 26, fill > 0.9 ? '#228d5c' : '#f07e47');
    if (fill < 0.95) hand(ctx, fx, fy - (1 - fill) * 40 - 24, 0);
  }
}

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
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
    const render = (now: number) => {
      const p = (now % 3000) / 3000;
      drawScene(ctx, chapterId, p);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(performance.now());
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
  }, [chapterId]);

  return <canvas id={`cv-${chapterId}-ana`} ref={canvasRef} width={W} height={H} />;
};

export default AnalogyScene;
