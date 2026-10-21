import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* 木工房共用绘图套件 */
export const V = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  board: '#e9dcc3',
  grain: '#d6c4a5',
};

export function startScene(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void,
  periodMs = 2800
): () => void {
  let ctx: CanvasRenderingContext2D;
  try {
    ctx = setupCanvas(canvas, w, h);
  } catch {
    return () => {};
  }
  let raf: number | null = null;
  const tick = () => {
    const t = (performance.now() % periodMs) / periodMs;
    draw(ctx, t);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const disconnect = observeCanvas(canvas, start, stop);
  return () => {
    stop();
    disconnect();
  };
}

export function field(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = V.bg;
  ctx.fillRect(0, 0, w, h);
}

export function bench(ctx: CanvasRenderingContext2D, w: number, h: number, y: number) {
  ctx.fillStyle = V.light;
  ctx.fillRect(0, y, w, h - y);
  ctx.strokeStyle = V.dark;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(w, y + 0.5);
  ctx.stroke();
}

export function plank(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  messy = false
) {
  ctx.fillStyle = V.board;
  ctx.strokeStyle = V.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = V.grain;
  ctx.lineWidth = 1.2;
  const rows = 4;
  for (let i = 1; i <= rows; i++) {
    const gy = y + (h * i) / (rows + 1);
    ctx.beginPath();
    ctx.moveTo(x + 8, gy);
    if (messy) {
      for (let k = 1; k <= 8; k++) {
        ctx.lineTo(x + 8 + (k * (w - 16)) / 8, gy + (k % 2 ? 3 : -3));
      }
    } else {
      ctx.bezierCurveTo(x + w * 0.33, gy - 3, x + w * 0.66, gy + 3, x + w - 8, gy);
    }
    ctx.stroke();
  }
}

export function ink(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color = V.orange) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

export function plane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s = 1,
  rot = 0,
  color = V.blue
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // 刨身
  ctx.fillStyle = '#cfae86';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-40, -13, 80, 26, 5);
  ctx.fill();
  ctx.stroke();
  // 刨刀
  ctx.fillStyle = '#eef3fa';
  ctx.strokeStyle = V.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5, -13);
  ctx.lineTo(5, -13);
  ctx.lineTo(1, 4);
  ctx.lineTo(-9, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 手柄
  ctx.fillStyle = V.wood;
  ctx.beginPath();
  ctx.arc(-30, -17, 6, 0, Math.PI * 2);
  ctx.fill();
  // 前端唇
  ctx.strokeStyle = V.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(24, 13);
  ctx.lineTo(40, 13);
  ctx.stroke();
  ctx.restore();
}

export function curl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();
}

export function ruler(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color = V.ink) {
  ctx.fillStyle = '#fdfcf7';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.rect(x, y, w, 18);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 8; i < w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + (i % 48 < 12 ? 10 : 6));
    ctx.stroke();
  }
}

/* 八章类比：同一组件按 chapterId 切场景 */
export const Ov2Analogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, 560, 140, (ctx, t) => {
      field(ctx, 560, 140);
      bench(ctx, 560, 140, 112);
      const n = chapterId.replace('chap-', '');
      if (n === '1') {
        plank(ctx, 40, 76, 480, 36, true);
        ink(ctx, 40, 520, 94, V.red);
        const x = 80 + t * 380;
        plane(ctx, x, 90, 1.05, Math.sin(t * Math.PI * 9) * 0.07, V.red);
        for (let i = 0; i < 3; i++) curl(ctx, x - 34 - i * 13, 72 - i * 4, 7 + i * 2, V.red, 0.7 - i * 0.18);
      } else if (n === '2') {
        plank(ctx, 40, 76, 480, 36);
        const drop = Math.min(1, t / 0.6);
        ctx.fillStyle = '#fdfcf7';
        ctx.strokeStyle = V.blue;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.rect(120, 8 + drop * 36, 320, 50);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = V.line;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(138, 20 + drop * 36 + i * 10);
          ctx.lineTo(300 + (i % 2) * 50, 20 + drop * 36 + i * 10);
          ctx.stroke();
        }
        if (t > 0.6) ink(ctx, 120, 440, 94, V.orange);
      } else if (n === '3') {
        plank(ctx, 40, 82, 480, 30);
        const slots = 6;
        const idx = Math.min(slots - 1, Math.floor(t * slots));
        for (let i = 0; i < slots; i++) {
          const yy = 18 + i * 11;
          ctx.strokeStyle = i === idx ? V.blue : V.line;
          ctx.lineWidth = i === idx ? 3 : 1.4;
          ctx.beginPath();
          ctx.moveTo(340, yy);
          ctx.lineTo(384, yy);
          ctx.stroke();
        }
        ctx.fillStyle = '#eef3fa';
        ctx.strokeStyle = V.blue;
        ctx.lineWidth = 1.8;
        const by = 18 + idx * 11;
        ctx.beginPath();
        ctx.moveTo(352, by - 14);
        ctx.lineTo(366, by - 14);
        ctx.lineTo(361, by);
        ctx.lineTo(347, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ink(ctx, 60, 310, 96, V.orange);
      } else if (n === '4') {
        plank(ctx, 40, 80, 480, 30);
        ink(ctx, 40, 300, 94, V.orange);
        const seg = Math.min(6, Math.floor(t * 7));
        const x = 60 + seg * 36;
        ruler(ctx, Math.min(x, 360), 66, 84, V.ink);
        for (let i = 0; i < 7; i++) {
          const on = i === seg;
          ctx.strokeStyle = on ? V.green : V.line;
          ctx.lineWidth = on ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(60 + i * 36, 112);
          ctx.lineTo(60 + i * 36, 120);
          ctx.stroke();
        }
      } else if (n === '5') {
        plank(ctx, 40, 78, 480, 32);
        ink(ctx, 60, 500, 94, V.orange);
        const seg = Math.min(2, Math.floor(t * 3));
        const local = (t * 3) % 1;
        const x = 90 + seg * 130 + local * 110;
        plane(ctx, x, 90, 0.95, 0, V.blue);
        curl(ctx, x - 32, 74, 9, V.green, 0.8 - local * 0.5);
        for (let i = 0; i < seg; i++) {
          ctx.fillStyle = '#f3e9d5';
          ctx.fillRect(84 + i * 130, 92, 118, 5);
        }
      } else if (n === '6') {
        plank(ctx, 40, 94, 480, 18);
        plane(ctx, 285, 98, 1.2, 0, V.blue);
        const drop = Math.min(1, t / 0.65);
        ctx.globalAlpha = drop;
        ctx.fillStyle = '#eef3fa';
        ctx.strokeStyle = V.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(272, 26 + drop * 46);
        ctx.lineTo(290, 26 + drop * 46);
        ctx.lineTo(285, 60 + drop * 46);
        ctx.lineTo(267, 60 + drop * 46);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (t > 0.72) {
          ctx.fillStyle = V.purple;
          ctx.beginPath();
          ctx.arc(308, 88, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (n === '7') {
        plank(ctx, 40, 84, 480, 26);
        const swap = Math.min(1, t * 1.5);
        ctx.fillStyle = swap > 0.5 ? '#eef3fa' : '#d9dee8';
        ctx.strokeStyle = swap > 0.5 ? V.purple : V.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(250, 62 - swap * 8);
        ctx.lineTo(276, 62 - swap * 8);
        ctx.lineTo(270, 82 - swap * 8);
        ctx.lineTo(244, 82 - swap * 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = V.line;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(288, 72);
        ctx.lineTo(288, 88);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        plank(ctx, 40, 80, 480, 28);
        ink(ctx, 40, 520, 94, V.orange);
        const x = 70 + clamp(t, 0, 1) * 300;
        ruler(ctx, x, 58, 96, V.ink);
        ctx.strokeStyle = x > 250 ? V.green : V.red;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x + 12, 76);
        ctx.lineTo(x + 84, 76);
        ctx.stroke();
      }
    });
  }, [chapterId]);

  return <canvas ref={ref} width={560} height={140} />;
};

export default Ov2Analogy;
