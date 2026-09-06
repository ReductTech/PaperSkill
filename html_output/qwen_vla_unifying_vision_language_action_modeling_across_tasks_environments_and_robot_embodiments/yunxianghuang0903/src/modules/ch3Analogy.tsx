import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch3Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = easeInOutQuad(((performance.now() - t0Ref.current) % 2800) / 2800);
    fillBg(ctx, W, H);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(18, 98); ctx.lineTo(18 + p * 200, 98 - p * 48); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = '10px sans-serif';
    ctx.fillText('同一行程 · 不同交通工具', 48, 118);
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch3Analogy;
