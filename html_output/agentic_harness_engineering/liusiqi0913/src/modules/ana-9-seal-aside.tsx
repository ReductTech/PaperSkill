import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 analogy — 四次关键迭代：iter 2 / 5 / 6 / 8 四张卡片依次翻入，
// 每张卡片内红色失败符号变为绿色修复符号，底部标注修复所在的组件层。
// 560x140, autoplay, 4s loop.

const W = 560;
const H = 140;
const LOOP = 4000;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
};

interface Milestone {
  iter: string;
  layer: string;
}
const CARDS: Milestone[] = [
  { iter: 'iter 2', layer: '提示词+工具' },
  { iter: 'iter 5', layer: '提示词+工具' },
  { iter: 'iter 6', layer: '中间件' },
  { iter: 'iter 8', layer: '工具+中间件' },
];

const CARD_W = 122;
const CARD_H = 94;
const GAP = 12;
const X0 = (W - (CARDS.length * CARD_W + (CARDS.length - 1) * GAP)) / 2;
const CARD_Y = 12;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const AnaSealAside: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (((now % LOOP) + LOOP) % LOOP) / LOOP;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      CARDS.forEach((card, i) => {
        // 每张卡片在 t = i*0.2 开始翻入，历时 0.1；随后内部符号在接下来 0.15 内转变
        const enter = easeOutCubic(clamp((t - i * 0.2) / 0.1, 0, 1));
        if (enter <= 0) return;
        const morph = clamp((t - (i * 0.2 + 0.1)) / 0.15, 0, 1);

        const cx = X0 + i * (CARD_W + GAP) + CARD_W / 2;
        const cy = CARD_Y + CARD_H / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, Math.max(0.02, enter)); // 纵向翻入
        ctx.translate(-cx, -cy);

        // 卡面
        ctx.fillStyle = C.panel;
        roundRect(ctx, cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 8);
        ctx.fill();
        ctx.strokeStyle = morph >= 1 ? C.green : C.border;
        ctx.lineWidth = morph >= 1 ? 2.5 : 2;
        ctx.stroke();

        // 顶部迭代标签
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillStyle = C.blue;
        ctx.textAlign = 'center';
        ctx.fillText(card.iter, cx, cy - CARD_H / 2 + 18);

        // 中部符号区：红 ✕ → 绿 ✓
        const gy = cy - 2;
        // 红 ✕（随 morph 淡出）
        if (morph < 1) {
          ctx.globalAlpha = 1 - morph;
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - 8, gy - 8);
          ctx.lineTo(cx + 8, gy + 8);
          ctx.moveTo(cx + 8, gy - 8);
          ctx.lineTo(cx - 8, gy + 8);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // 过渡小箭头
        if (morph > 0.15 && morph < 0.85) {
          ctx.globalAlpha = Math.sin(((morph - 0.15) / 0.7) * Math.PI);
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 2, gy + 16);
          ctx.lineTo(cx + 8, gy + 16);
          ctx.moveTo(cx + 4, gy + 12);
          ctx.lineTo(cx + 8, gy + 16);
          ctx.lineTo(cx + 4, gy + 20);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // 绿 ✓（随 morph 弹入）
        if (morph > 0.3) {
          const pop = easeOutCubic(clamp((morph - 0.3) / 0.5, 0, 1));
          ctx.save();
          ctx.translate(cx, gy);
          ctx.scale(pop, pop);
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-8, 0.5);
          ctx.lineTo(-2.5, 7);
          ctx.lineTo(9, -7);
          ctx.stroke();
          ctx.restore();
        }

        // 底部组件层标签
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText(card.layer, cx, cy + CARD_H / 2 - 10);
        ctx.textAlign = 'left';
        ctx.restore();
      });

      // 图例（2 项）
      const ly = 128;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(218, ly - 8);
      ctx.lineTo(226, ly);
      ctx.moveTo(226, ly - 8);
      ctx.lineTo(218, ly);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText('失败', 232, ly);
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(278, ly - 4);
      ctx.lineTo(282, ly - 1);
      ctx.lineTo(290, ly - 9);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText('修复', 296, ly);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaSealAside;
