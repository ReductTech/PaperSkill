import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import { C } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 480;
const H = 270;
const T = 2600;

const TASKS = ['深度', '对应', '位姿', '物体'];
const STACKS = [
  ['深度编码器', 'DPT解码', '多损失'],
  ['匹配网络', '多尺度对齐', '复杂损失'],
  ['多任务头', '重增强', '位姿回归'],
  ['区域编码器', '专用模块', '架构改动'],
];

/** 传统方法：同一布局下，切任务时整条流水线拆掉重建 */
export const HeroOld: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const tick = (now: number) => {
      const u = (now % T) / T;
      const phase = Math.floor(now / T) % 4;
      const next = (phase + 1) % 4;

      // 0–0.38 拆；0.38–0.72 装；其余静止
      let out = 0;
      let inn = 1;
      let showNext = false;
      if (u < 0.38) {
        out = easeInOutQuad(u / 0.38);
        inn = 0;
      } else if (u < 0.72) {
        out = 1;
        inn = easeInOutQuad((u - 0.38) / 0.34);
        showNext = true;
      } else {
        showNext = true;
        inn = 1;
      }

      const stack = showNext && inn > 0.01 ? STACKS[next] : STACKS[phase];
      const taskName = showNext && inn > 0.5 ? TASKS[next] : TASKS[phase];

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.quiet;
      ctx.fillRect(0, 0, W, H);

      // 任务徽章
      ctx.fillStyle = '#fde8eb';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.fillRect(160, 18, 160, 32);
      ctx.strokeRect(160, 18, 160, 32);
      centerText(ctx, '任务 · ' + taskName, 240, 34, C.red, 14);

      // 输入 → 堆栈 → 输出（布局与右侧对齐）
      roundBox(ctx, 24, 110, 70, 56, '#fff', C.red);
      centerText(ctx, '输入', 59, 138, C.red, 13);

      arrow(ctx, 100, 138, 128, 138, C.red);

      // 三段专用模块
      for (let i = 0; i < 3; i++) {
        const bx = 136 + i * 78;
        const by = 100;
        let dx = 0;
        let dy = 0;
        let a = 1;
        let rot = 0;
        if (u < 0.38) {
          dx = (i - 1) * 70 * out;
          dy = -50 * out;
          rot = (i - 1) * 0.5 * out;
          a = 1 - out * 0.9;
        } else if (u < 0.72) {
          dy = (1 - inn) * 60;
          a = inn;
        }
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(bx + 34 + dx, by + 36 + dy);
        ctx.rotate(rot);
        roundBox(ctx, -34, -36, 68, 72, '#fde8eb', C.red);
        centerWrap(ctx, stack[i], 0, 0, 60, C.red, 11);
        ctx.restore();
      }

      arrow(ctx, 378, 138, 400, 138, C.red);
      roundBox(ctx, 404, 110, 52, 56, '#fff', C.red);
      centerText(ctx, '输出', 430, 138, C.red, 12);

      // 强调：整栈在变
      if (u > 0.1 && u < 0.72) {
        ctx.globalAlpha = Math.sin(Math.min(u, 0.72) * Math.PI / 0.72);
        centerText(ctx, '整栈重建', 240, 210, C.orange, 13);
        ctx.globalAlpha = 1;
      }

      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

function roundBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string, stroke: string,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6, y2 - 4);
  ctx.lineTo(x2 - 6, y2 + 4);
  ctx.closePath();
  ctx.fill();
}

function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function centerWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (ctx.measureText(text).width <= maxW || text.length <= 4) {
    ctx.fillText(text, cx, cy);
  } else {
    const mid = Math.ceil(text.length / 2);
    ctx.fillText(text.slice(0, mid), cx, cy - 8);
    ctx.fillText(text.slice(mid), cx, cy + 8);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export default HeroOld;
