import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawSurveyor,
  drawPin,
  drawSheetLabel,
  ROUTE,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
  CONTOUR,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana6 — 图纸怎么交出去。一个主体（交付中的图纸）沿一条交付线移动，四种节奏循环：
// 一次交全 / 分段交付 / 单步交付 / 随行更新。无控件、无反馈条。示意节奏，不代表论文数值。

const W = 560;
const H = 140;
const DUR = 3200;

const PHASES = [
  { name: '一次交全', n: 1, color: ROUTE },
  { name: '分段交付', n: 3, color: ROUTE },
  { name: '单步交付', n: 5, color: EMPH },
  { name: '随行更新', n: 5, color: AUX },
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function miniSheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = '#fbfaf3';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = CONTOUR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.24, x + w * 0.8, y + h * 0.66);
  ctx.stroke();
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;
      const seg = 1 / 4;
      const pi = clamp(Math.floor(t / seg), 0, 3);
      const lt = clamp((t - pi * seg) / seg, 0, 1);
      const phase = PHASES[pi];

      // 该阶段第 k 个交付槽的进度与已完成数量
      const n = phase.n;
      const slot = 1 / n;
      const k = Math.min(n - 1, Math.floor(lt / slot));
      const sl = (lt - k * slot) / slot;
      const cross = easeOutCubic(clamp(sl / 0.62, 0, 1));
      const delivered = Math.min(n, k + (cross >= 1 ? 1 : 0));

      clearField(ctx, W, H);

      // 左：正在绘制的图幅
      drawSheet(ctx, 24, 30, 150, 80);
      drawContours(ctx, 24, 30, 150, 80, 11, CONTOUR, 3);
      if (pi === 3) {
        // 随行更新：图上多画一笔，表示现场加注
        ctx.strokeStyle = AUX;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(60, 86);
        ctx.quadraticCurveTo(96, 48 + cross * 10, 150, 74);
        ctx.stroke();
      }
      drawSurveyor(ctx, 78, 116, 0.9, INK, 'draw');

      // 交付线（虚线）
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(190, 84);
      ctx.lineTo(398, 84);
      ctx.stroke();
      ctx.restore();

      // 已交付的图叠在旅人一侧（一次交全用大图，其余用小图）
      if (pi === 0) {
        if (delivered >= 1) miniSheet(ctx, 386, 48, 42, 30, phase.color);
      } else {
        for (let j = 0; j < delivered; j++) {
          miniSheet(ctx, 400 + (j % 2) * 3, 62 - j * 9, 24, 16, phase.color);
        }
      }

      // 移动主体：正在交付的那张图
      if (cross < 1) {
        const mx = lerp(190, 396, cross);
        const my = 72 - Math.sin(cross * Math.PI) * 18;
        const mw = pi === 0 ? 42 : 24;
        const mh = pi === 0 ? 30 : 16;
        miniSheet(ctx, mx - mw / 2, my - mh / 2, mw, mh, phase.color);
      }

      // 随行更新：旅人的口述小注回流到测绘员
      if (pi === 3 && cross < 1) {
        const nx = lerp(398, 190, cross);
        ctx.strokeStyle = AUX;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(nx, 96, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 旅人：路线桩 + 记号高亮
      drawPin(ctx, 428, 92, pi === 3 ? AUX : EMPH, true);

      drawSheetLabel(ctx, phase.name, 24, 20, phase.color);
      drawSheetLabel(ctx, '旅人', 428, 20, MUTED);
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
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

export default Ana6;
