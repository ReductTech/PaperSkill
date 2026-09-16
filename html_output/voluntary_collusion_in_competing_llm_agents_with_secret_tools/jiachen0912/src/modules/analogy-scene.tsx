import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// One analogy card animation per chapter (card-table-night theme). 560x140,
// one subject + one verb + one goal, looping ~3s. chapterId selects the scene.

const W = 560;
const H = 140;
const FELT = '#b8c9a7';
const FELT_DARK = '#76906a';
const RED = '#c43f52';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const GOLD = '#d97706';
const MUTED = '#68778f';

function table(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = FELT;
  ctx.fillRect(0, H * 0.66, W, H * 0.34);
  ctx.strokeStyle = FELT_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.66);
  ctx.lineTo(W, H * 0.66);
  ctx.stroke();
}

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = '#ffffff', label = '') {
  ctx.fillStyle = color;
  ctx.strokeStyle = FELT_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();
  if (label) {
    ctx.fillStyle = '#21324a';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
    ctx.textAlign = 'left';
  }
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = FELT_DARK;
  ctx.lineWidth = 2;
  ctx.stroke();
}

type SceneFn = (ctx: CanvasRenderingContext2D, k: number) => void;

const scenes: Record<string, SceneFn> = {
  'chap-1': (ctx, k) => {
    const x = W * 0.62 - k * 130;
    const y = H * 0.3 + k * (H * 0.5 - H * 0.3);
    card(ctx, x, y, 40, 56, '#ffffff', '密');
    ctx.fillStyle = RED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('标着“不公平”的牌，被推到桌下', 16, H - 10);
  },
  'chap-2': (ctx, k) => {
    const w = Math.abs(Math.cos(k * Math.PI)) * 40 + 4;
    const x = W / 2 - w / 2;
    card(ctx, x, H * 0.32, w, 56, k < 0.5 ? BLUE : GREEN, k < 0.5 ? '欺骗' : '资源');
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('一张牌的两副面孔：欺骗与共享', 16, H - 10);
  },
  'chap-3': (ctx, k) => {
    const x = W * 0.3 + k * 80;
    card(ctx, x, H * 0.3, 44, 60, '#ffffff', '');
    ctx.fillStyle = RED;
    ctx.fillRect(x + 4, H * 0.3 + 44, 36, 13);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('不公平', x + 22, H * 0.3 + 53);
    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('看得见的“不公平”，挡不住的手', 16, H - 10);
  },
  'chap-4': (ctx, k) => {
    const grow = 0.4 + 0.5 * k;
    const shrink = 0.9 - 0.4 * k;
    chip(ctx, W * 0.3, H * 0.55, 8, GREEN);
    chip(ctx, W * 0.3, H * 0.42, 8, GREEN);
    chip(ctx, W * 0.3, H * 0.3, 8 * grow, GREEN);
    chip(ctx, W * 0.7, H * 0.52, 8 * shrink, RED);
    chip(ctx, W * 0.7, H * 0.4, 8 * shrink, RED);
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('赢家筹码升、输家筹码降', 16, H - 10);
  },
  'chap-5': (ctx, k) => {
    const x = W * 0.2 + k * 200;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, H * 0.42, 34, 20);
    ctx.strokeStyle = FELT_DARK;
    ctx.strokeRect(x, H * 0.42, 34, 20);
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('桌下递出的纸条', 16, H - 10);
  },
  'chap-6': (ctx, k) => {
    const reach = Math.sin(k * Math.PI * 2) * 0.5 + 0.5;
    const x = W * 0.5 - reach * 40;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(x, H * 0.4, 12, 0, Math.PI * 2);
    ctx.fill();
    card(ctx, W * 0.6, H * 0.34, 40, 56, '#ffffff', '');
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('伸向牌的手：接受还是推开', 16, H - 10);
  },
  'chap-7': (ctx, k) => {
    const y = H * 0.6 - k * H * 0.42;
    ctx.strokeStyle = FELT_DARK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.4, H * 0.62);
    ctx.lineTo(W * 0.4, H * 0.18);
    ctx.stroke();
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.moveTo(W * 0.4, y - 8);
    ctx.lineTo(W * 0.36, y);
    ctx.lineTo(W * 0.4, y + 8);
    ctx.lineTo(W * 0.44, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('记分牌上的爬升', 16, H - 10);
  },
  'chap-8': (ctx, k) => {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const ang = (i - (n - 1) / 2) * (0.14 + 0.3 * k);
      const x = W / 2 + Math.sin(ang) * (26 * i + 10);
      const y = H * 0.5 - Math.cos(ang) * 34 + i * 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      card(ctx, -16, -26, 32, 52, '#ffffff', '');
      ctx.restore();
    }
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('摊开的牌面：逐项检验', 16, H - 10);
  },
  'chap-9': (ctx, k) => {
    card(ctx, W * 0.4, H * 0.3, 44, 60, '#ffffff', '');
    const ly = H * 0.3 - 10 - k * 20;
    ctx.fillStyle = RED;
    ctx.fillRect(W * 0.4 + 4, ly, 36, 13);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('不公平', W * 0.4 + 22, ly + 10);
    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('撕掉标签，牌还是那张牌', 16, H - 10);
  },
  'chap-10': (ctx, k) => {
    const rates = [0.35, 0.55, 0.75, 0.98];
    const colors = [RED, BLUE, ORANGE, GREEN];
    rates.forEach((r, i) => {
      const x = W * 0.2 + i * 40;
      const h = 8 + r * 34 * k;
      chip(ctx, x, H * 0.58 - h, 8, colors[i]);
    });
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('四叠筹码的比赛', 16, H - 10);
  },
};

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const scene = scenes[chapterId] || scenes['chap-1'];
    const render = (time: number) => {
      table(ctx);
      const t = (time / 1000) % 3.0;
      scene(ctx, t / 3.0);
    };
    let rafId = 0;
    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return <canvas id={`cv-${chapterId}-ana`} ref={canvasRef} width={W} height={H} />;
};

export default AnalogyScene;
