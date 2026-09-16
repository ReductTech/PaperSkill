import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutBounce } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// Hero 两侧共用的对比画布：moduleId = 'old' 画越走越歪的缝线，
// moduleId = 'new' 画全程贴合基准线、并由闭环别针拉直的缝线。
// 两侧各自独立挂载，但使用同一时钟与同一 3.4s 周期。
const W = 540;
const H = 260;
const PERIOD = 3400;

const X_START = 40;
const X_END = 500;
const BASE_Y = 138;
const BAND_TOP = 96;
const BAND_H = 80;

export const HeroCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isNew = moduleId === 'new';

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const devAt = (x: number) => Math.pow(clamp((x - X_START) / (X_END - X_START), 0, 1), 1.5) * 34;

    const drawScene = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(20, BAND_TOP, W - 40, BAND_H);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(20, BAND_TOP + BAND_H, W - 40, 6);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(20, BAND_TOP, W - 40, BAND_H + 6);

      // 淡色基准线
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, BASE_Y);
      ctx.lineTo(W - 20, BASE_Y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawNeedle = (x: number, y: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 20, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawPoly = (from: number, to: number, offset: number, color: string) => {
      if (to <= from) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const steps = Math.max(2, Math.ceil((to - from) / 8));
      for (let i = 0; i <= steps; i++) {
        const x = lerp(from, to, i / steps);
        const y = BASE_Y + devAt(x) + offset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const drawLegend = (seamColor: string) => {
      const y = 232;
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(232, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('基准线', 262, y + 5);

      ctx.strokeStyle = seamColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(322, y);
      ctx.lineTo(346, y);
      ctx.stroke();
      ctx.fillText('缝线', 352, y + 5);

      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(404, y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('闭环', 416, y + 5);
    };

    const BREAK_P = (284 - X_START) / (X_END - X_START);
    let prevP = 0;
    let jitterStart = -1;
    let pinStart = -1;

    const render = (now: number) => {
      drawScene();
      const t = (now % PERIOD) / PERIOD;
      const p = easeInOutQuad(clamp(t / 0.8, 0, 1));
      const fade = clamp(t / 0.04, 0, 1) * (1 - clamp((t - 0.88) / 0.12, 0, 1));

      if (isNew) {
        if (prevP <= 0.45 && p > 0.45) pinStart = now;
        const xb = lerp(X_START, X_END, p);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(X_START, BASE_Y);
        ctx.lineTo(xb, BASE_Y);
        ctx.stroke();

        if (p > 0.45 && pinStart >= 0) {
          const pt = clamp((now - pinStart) / 450, 0, 1);
          const sc = easeOutBounce(pt);
          ctx.globalAlpha = fade * pt;
          ctx.beginPath();
          ctx.arc(270, BASE_Y, 11 * sc, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(270 - 11 * sc, BASE_Y);
          ctx.lineTo(270 + 11 * sc, BASE_Y);
          ctx.stroke();
          ctx.globalAlpha = fade;
        }

        drawNeedle(xb, BASE_Y, '#228d5c');
        ctx.restore();
        ctx.fillStyle = '#21324a';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('全程贴合', 40, 78);
        drawLegend('#228d5c');
      } else {
        if (prevP <= BREAK_P && p > BREAK_P) jitterStart = now;
        const jt = jitterStart >= 0 ? clamp((now - jitterStart) / 200, 0, 1) : 1;
        const jitter = jt < 1 ? Math.sin(now / 18) * 3.2 * (1 - jt) : 0;
        const xa = lerp(X_START, X_END, p);
        ctx.save();
        ctx.globalAlpha = fade;
        drawPoly(X_START, Math.min(xa, 262), 0, '#c43f52');
        if (xa > 284) drawPoly(284, xa, 22 + jitter, '#c43f52');

        const tipOffset = xa > 284 ? 22 + jitter : 0;
        drawNeedle(xa, BASE_Y + devAt(xa) + tipOffset, '#c43f52');
        ctx.restore();
        ctx.fillStyle = '#21324a';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('越走越歪', 40, 78);
        drawLegend('#c43f52');
      }
      prevP = p;
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
  }, [moduleId]);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default HeroCompare;
