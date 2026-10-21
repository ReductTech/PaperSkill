import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比：攀岩者沿岩壁远离锚点移动，绳子（橙色二次曲线）被拉长、张力脉冲随距离增大，然后被拉回锚点方向。
// 3.4 s 循环；无控件、无重播提示、canvas 内不写字。
const W = 560;
const H = 140;
const LOOP_S = 3.4;

const COL = {
  bg: '#f5f8f0',
  rockLight: '#b8c9a7',
  rockDark: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
};

function roundedRect(
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

function drawClimber(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  color: string,
  handX: number,
  handY: number,
  leanPx: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hipY = footY - 46;
  const shY = hipY - 26;
  const shX = footX + leanPx;
  ctx.beginPath(); // legs
  ctx.moveTo(footX - 9, footY);
  ctx.lineTo(footX, hipY);
  ctx.lineTo(footX + 9, footY);
  ctx.stroke();
  ctx.beginPath(); // torso
  ctx.moveTo(footX, hipY);
  ctx.lineTo(shX, shY);
  ctx.stroke();
  ctx.beginPath(); // arm holding the rope
  ctx.moveTo(shX, shY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  ctx.beginPath(); // head
  ctx.arc(shX, shY - 12, 8, 0, Math.PI * 2);
  ctx.fill();
}

export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const startTs = performance.now();

    const render = (tSec: number) => {
      const t = tSec % LOOP_S;
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);
      // rock band
      ctx.fillStyle = COL.rockLight;
      ctx.fillRect(0, 48, W, H - 48);
      ctx.strokeStyle = COL.rockDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(W, 48);
      ctx.stroke();

      // 背景岩点（静态道具，属于岩壁环境）
      ctx.fillStyle = 'rgba(39, 68, 110, 0.3)';
      for (const h of [
        { x: 170, y: 118 },
        { x: 330, y: 92 },
        { x: 470, y: 116 },
      ]) {
        roundedRect(ctx, h.x - 8, h.y - 8, 16, 16, 4);
        ctx.fill();
      }

      // 相位：1.5 s 爬远 → 0.4 s 停在最远 → 1.5 s 被拉回
      let d = 0;
      let dir = 0;
      if (t < 1.5) {
        const p = t / 1.5;
        d = 320 * (1 - Math.pow(1 - p, 3));
        dir = 1;
      } else if (t < 1.9) {
        d = 320;
        dir = 0;
      } else {
        const p = (t - 1.9) / 1.5;
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        d = 320 * (1 - e);
        dir = -1;
      }

      const ax = 44;
      const ay = 96;
      const cx = 96 + d;
      const cy = 88;

      // 绳子：张力脉冲随距离增大
      const sag = clamp(34 - d * 0.05, 6, 34);
      const pulse = Math.sin(tSec * 13) * (1.1 + d * 0.03);
      const midY = (ay + cy) / 2 + sag + pulse;
      ctx.strokeStyle = COL.rope;
      ctx.lineWidth = 2.5 + d * 0.014;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + cx) / 2, midY, cx, cy);
      ctx.stroke();

      // 锚钉（三角 + 绿环）
      ctx.fillStyle = COL.ink;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 10);
      ctx.lineTo(ax - 6, ay + 4);
      ctx.lineTo(ax + 6, ay + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ax, ay, 10, 0, Math.PI * 2);
      ctx.stroke();

      // 攀岩者：向外爬身体前倾，被拉回时后仰
      const leanPx = dir === 1 ? 10 : dir === -1 ? -10 : 12;
      drawClimber(ctx, cx + 22, 118, COL.blue, cx - 4, cy - 4, leanPx);
    };

    let raf = 0;
    const tick = (now: number) => {
      render((now - startTs) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch4Ana;
