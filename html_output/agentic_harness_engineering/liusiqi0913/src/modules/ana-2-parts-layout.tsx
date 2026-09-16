import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-2-parts-layout — 三支柱（组件 / 经验 / 决策）汇入闭环
// 三条细流线汇聚后进入右侧环形回路，小点沿线流动并绕环运行（560x140，3s 循环）

const W = 560;
const H = 140;
const LOOP = 3000;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  steel: '#475569',
  blue: '#27446e',
  orange: '#f07e47',
};

const PILLARS = [
  { label: '组件', y: 22 },
  { label: '经验', y: 56 },
  { label: '决策', y: 90 },
];
const PX = 30;
const PW = 64;
const PH = 28;
const CONV = { x: 300, y: 70 };
const RING = { x: 425, y: 70, r: 48 };

export const AnaPartsLayout: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let startTs = 0;

    const ringLeft = RING.x - RING.r; // 377
    const segCirc = 2 * Math.PI * RING.r;

    const render = (now: number) => {
      if (!startTs) startTs = now;
      const t = ((now - startTs) % LOOP) / LOOP;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 流线：柱 → 汇聚点 → 圆环左端
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      for (const p of PILLARS) {
        const cy = p.y + PH / 2;
        ctx.beginPath();
        ctx.moveTo(PX + PW + 3, cy);
        ctx.lineTo(CONV.x, CONV.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(CONV.x, CONV.y);
      ctx.lineTo(ringLeft - 2, RING.y);
      ctx.stroke();

      // 环形回路 + 顶部箭头（顺时针）
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(RING.x, RING.y, RING.r, 0, Math.PI * 2);
      ctx.stroke();
      const ahX = RING.x;
      const ahY = RING.y - RING.r;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(ahX + 7, ahY);
      ctx.lineTo(ahX - 4, ahY - 5);
      ctx.lineTo(ahX - 4, ahY + 5);
      ctx.closePath();
      ctx.fill();

      // 支柱块（蓝底白字）
      for (const p of PILLARS) {
        ctx.beginPath();
        ctx.roundRect(PX, p.y, PW, PH, 6);
        ctx.fillStyle = C.blue;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, PX + PW / 2, p.y + PH / 2 + 4);
        ctx.textAlign = 'left';
      }

      // 三个流动小点：各自沿柱线 → 汇聚 → 绕环一周，相位错开
      for (let i = 0; i < 3; i++) {
        const cy = PILLARS[i].y + PH / 2;
        const x0 = PX + PW + 3;
        const seg1 = Math.hypot(CONV.x - x0, CONV.y - cy);
        const seg2 = ringLeft - 2 - CONV.x;
        const total = seg1 + seg2 + segCirc;
        const s = ((t + i / 3) % 1) * total;
        let dx: number;
        let dy: number;
        if (s < seg1) {
          const u = s / seg1;
          dx = x0 + (CONV.x - x0) * u;
          dy = cy + (CONV.y - cy) * u;
        } else if (s < seg1 + seg2) {
          const u = (s - seg1) / seg2;
          dx = CONV.x + (ringLeft - 2 - CONV.x) * u;
          dy = CONV.y;
        } else {
          const a = Math.PI + (s - seg1 - seg2) / RING.r;
          dx = RING.x + Math.cos(a) * RING.r;
          dy = RING.y + Math.sin(a) * RING.r;
        }
        ctx.save();
        ctx.shadowColor = C.orange;
        ctx.shadowBlur = 6;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fill();
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
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaPartsLayout;
