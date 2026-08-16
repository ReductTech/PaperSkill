import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch4Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = 1 - easeInOutQuad(((performance.now() - t0Ref.current) % 3000) / 3000);
    fillBg(ctx, W, H);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(16, 88);
    for (let i = 0; i < 18; i++) ctx.lineTo(16 + i * 12, 88 + Math.sin(i * 0.9) * 14);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(16, 88); ctx.lineTo(16 + p * 200, 88 - p * 42); ctx.stroke();
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch4Analogy;
