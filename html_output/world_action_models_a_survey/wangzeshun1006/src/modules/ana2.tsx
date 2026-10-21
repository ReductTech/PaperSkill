import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawSheetLabel,
  seeded,
  CONTOUR,
  ROUTE,
  AUX,
  EMPH,
  INK,
  LINE,
  MUTED,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana2 — 一个主体（铅笔沿山脊滑动）、一个动作（描同一座山）、一个目标（三个停点）。
// 先描满写实阴影，随后退回只留等高线，最后只盖一枚符号章；三个停点循环。

const W = 560;
const H = 140;
const DUR = 3300;

const SHEET_X = 100;
const SHEET_Y = 18;
const SHEET_W = 400;
const SHEET_H = 100;

const BASE_Y = 108;
const PEAK_Y = 52;
const CX = 300;
const HALF_W = 160;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

function ridgeY(x: number): number {
  if (x <= CX) return lerp(BASE_Y, PEAK_Y, clamp((x - (CX - HALF_W)) / HALF_W, 0, 1));
  return lerp(PEAK_Y, BASE_Y, clamp((x - CX) / HALF_W, 0, 1));
}

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = EMPH;
  ctx.beginPath();
  ctx.moveTo(-24, -3.5);
  ctx.lineTo(0, -3.5);
  ctx.lineTo(0, 3.5);
  ctx.lineTo(-24, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e6c37a';
  ctx.beginPath();
  ctx.moveTo(-24, -3.5);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-24, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // 稳定的写实阴影笔画（确定性）
    const rnd = seeded(71);
    const hatches: number[][] = [];
    for (let i = 0; i < 52; i++) {
      const y = lerp(PEAK_Y + 6, BASE_Y - 4, rnd());
      const hw = ((y - PEAK_Y) / (BASE_Y - PEAK_Y)) * HALF_W;
      const x = CX + (rnd() * 2 - 1) * hw * 0.82;
      hatches.push([x, y, 5 + rnd() * 6]);
    }

    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;

      clearField(ctx, W, H);
      drawSheet(ctx, SHEET_X, SHEET_Y, SHEET_W, SHEET_H, { border: CONTOUR });

      // 山体（底稿）
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(CX - HALF_W, BASE_Y);
      ctx.lineTo(CX, PEAK_Y);
      ctx.lineTo(CX + HALF_W, BASE_Y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(118,144,106,0.10)';
      ctx.fill();
      ctx.strokeStyle = CONTOUR;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 阶段：0-0.4 写实；0.4-0.72 等高线；0.72-1 符号章
      const phaseA = easeOutCubic(clamp(t / 0.32, 0, 1));
      const shadeA = t < 0.4 ? 1 : t < 0.5 ? 1 - (t - 0.4) / 0.1 : 0;
      const contourIn = t < 0.36 ? 0 : clamp((t - 0.36) / 0.12, 0, 1);
      const stampIn = t < 0.72 ? 0 : easeOutCubic(clamp((t - 0.72) / 0.16, 0, 1));

      // 铅笔位置：沿山脊左右往返
      let prg: number;
      if (t < 0.4) prg = clamp((t - 0.03) / 0.34, 0, 1);
      else if (t < 0.72) prg = 1 - clamp((t - 0.4) / 0.3, 0, 1);
      else prg = 0.5;
      const px = lerp(CX - HALF_W, CX + HALF_W, prg);
      const py = ridgeY(px);
      const slope = px < CX ? Math.atan2(PEAK_Y - BASE_Y, HALF_W) : Math.atan2(BASE_Y - PEAK_Y, HALF_W);

      // 写实阴影
      if (shadeA > 0.01) {
        ctx.save();
        ctx.globalAlpha = shadeA * 0.5;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.1;
        ctx.lineCap = 'round';
        for (const h of hatches) {
          ctx.beginPath();
          ctx.moveTo(h[0], h[1]);
          ctx.lineTo(h[0] - 3, h[1] + h[2]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 等高线
      if (contourIn > 0.01) {
        ctx.save();
        ctx.globalAlpha = contourIn * 0.95;
        ctx.strokeStyle = CONTOUR;
        ctx.lineWidth = 1.6;
        const lv = [66, 80, 94];
        for (let i = 0; i < lv.length; i++) {
          const y = lv[i];
          const hw = ((y - PEAK_Y) / (BASE_Y - PEAK_Y)) * HALF_W;
          ctx.beginPath();
          const steps = 16;
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const xx = lerp(CX - hw, CX + hw, u);
            const yy = y + Math.sin(u * Math.PI * 2 + i) * 3.2;
            if (s === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 已描出的山脊线
      const tx = lerp(CX - HALF_W, CX + HALF_W, t < 0.4 ? phaseA : 1);
      ctx.save();
      ctx.strokeStyle = ROUTE;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(CX - HALF_W, BASE_Y);
      const seg = 20;
      for (let s = 1; s <= seg; s++) {
        const xx = lerp(CX - HALF_W, tx, s / seg);
        ctx.lineTo(xx, ridgeY(xx));
      }
      ctx.stroke();
      ctx.restore();

      // 符号章
      if (stampIn > 0.01) {
        ctx.save();
        ctx.globalAlpha = stampIn;
        ctx.translate(CX, 86);
        ctx.scale(0.8 + 0.2 * stampIn, 0.8 + 0.2 * stampIn);
        ctx.strokeStyle = AUX;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.lineTo(0, -7);
        ctx.lineTo(8, 6);
        ctx.stroke();
        ctx.fillStyle = AUX;
        ctx.beginPath();
        ctx.arc(0, 6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 铅笔（移动主体）
      if (t < 0.74) drawPencil(ctx, px, py, slope + 0.35);

      // 当前停点标签（≤8 字）
      const stage = t < 0.4 ? '渲染' : t < 0.72 ? '等高线' : '符号章';
      const stageColor = t < 0.4 ? EMPH : t < 0.72 ? ROUTE : AUX;
      drawSheetLabel(ctx, stage, 16, 62, stageColor);
      ctx.save();
      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('同一座山', 16, 84);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, 60);
      ctx.lineTo(84, 60);
      ctx.stroke();
      ctx.restore();
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

export default Ana2;
