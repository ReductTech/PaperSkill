import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比动画：两条布带从同一基线同时向右推进，旧方法逐渐落后并中途停顿，
// 本方法匀速到达；终点停顿后整体淡出复位，首尾无缝，自动循环。
const W = 560;
const H = 140;
const PERIOD = 4200;
const X0 = 70;
const X1 = 500;
const LANE_OLD = 52;
const LANE_NEW = 96;
const BAND_H = 22;

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawStatic = () => {
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
      // 起点基线与终点线
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, 40);
      ctx.lineTo(X0, 124);
      ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X1, 40);
      ctx.lineTo(X1, 124);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawBand = (laneY: number, prog: number, color: string, alpha: number, now: number) => {
      if (alpha <= 0.01) return;
      const end = lerp(X0, X1, prog);
      const len = Math.max(2, end - X0);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(X0, laneY, len, BAND_H);
      // 带面上的针脚纹理，极低对比度
      ctx.globalAlpha = alpha * 0.18;
      ctx.strokeStyle = '#f5f8f0';
      ctx.lineWidth = 1.5;
      for (let x = X0 + 12; x < end - 8; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x - 2, laneY + 6);
        ctx.lineTo(x + 2, laneY + BAND_H - 6);
        ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#21324a';
      ctx.fillRect(end - 3, laneY, 3, BAND_H);
      // 头部圆点带轻微脉动，身后留极淡拖影
      ctx.fillStyle = '#68778f';
      ctx.globalAlpha = alpha * 0.25;
      ctx.beginPath();
      ctx.arc(end - 10, laneY + BAND_H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(end, laneY + BAND_H / 2, 5 + Math.sin(now / 260) * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = (now: number) => {
      drawStatic();
      const t = (now % PERIOD) / PERIOD;
      const u = clamp(t / 0.7, 0, 1);

      // 旧方法：缓动推进 + 中途停顿 + 再缓动追赶
      let pOld: number;
      if (u < 0.4) pOld = easeInOutQuad(u / 0.4) * 0.55;
      else if (u < 0.55) pOld = 0.55;
      else pOld = 0.55 + easeInOutQuad((u - 0.55) / 0.45) * 0.33;
      // 本方法：匀速到达终点
      const pNew = u;
      const paused = u >= 0.4 && u < 0.55 && t < 0.7;

      const alpha = Math.min(clamp(t / 0.04, 0, 1), clamp(1 - (t - 0.82) / 0.12, 0, 1));

      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.fillText('旧方法', 8, 44);
      ctx.fillText('本方法', 8, 88);

      drawBand(LANE_OLD, clamp(pOld, 0, 1), '#c43f52', alpha, now);
      drawBand(LANE_NEW, clamp(pNew, 0, 1), '#228d5c', alpha, now);

      // 旧方法停顿时头部旁的暂停记号
      if (paused && alpha > 0.01) {
        const px = lerp(X0, X1, 0.55) + 12;
        ctx.save();
        ctx.globalAlpha = alpha * (0.5 + 0.3 * Math.sin(now / 240));
        ctx.fillStyle = '#68778f';
        ctx.fillRect(px, LANE_OLD + 5, 3, 12);
        ctx.fillRect(px + 6, LANE_OLD + 5, 3, 12);
        ctx.restore();
      }
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
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Ana10;
