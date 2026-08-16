import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;
const PATH = [
  { x: 24, y: 98 }, { x: 58, y: 72 }, { x: 96, y: 88 },
  { x: 132, y: 48 }, { x: 168, y: 62 }, { x: 206, y: 28 },
];

export const Ch6Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const elapsed = (performance.now() - t0Ref.current) % 5400;
    const stepMs = 900;
    let stepIdx = Math.min(Math.floor(elapsed / stepMs), PATH.length - 2);
    let local = (elapsed % stepMs) / stepMs;
    if (elapsed >= stepMs * (PATH.length - 1)) { stepIdx = PATH.length - 1; local = 1; }
    const progress = clamp((stepIdx + local) / (PATH.length - 1), 0, 1);

    fillBg(ctx, W, H);
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke(); ctx.setLineDash([]);

    PATH.forEach((pt, i) => {
      ctx.fillStyle = i <= stepIdx ? C.green : C.border;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill();
    });

    const seg = clamp(stepIdx, 0, PATH.length - 2);
    const a = PATH[seg]; const b = PATH[seg + 1];
    const t = stepIdx >= PATH.length - 1 ? 1 : easeInOutQuad(local);
    const gx = a.x + (b.x - a.x) * t;
    const gy = a.y + (b.y - a.y) * t;
    ctx.fillStyle = C.blue;
    ctx.beginPath(); ctx.arc(gx, gy - 12, 8, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = C.text; ctx.font = '10px sans-serif';
    ctx.fillText(`τ: 1 → 0  进度 ${Math.round(progress * 100)}%`, 8, 14);
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback">类比流匹配：从 τ=1 噪声逐步积分到 τ=0 干净动作块。</div>
    </div>
  );
};
export default Ch6Analogy;
