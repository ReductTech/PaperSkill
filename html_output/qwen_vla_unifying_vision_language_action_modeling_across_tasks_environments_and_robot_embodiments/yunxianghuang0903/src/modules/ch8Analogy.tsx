import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch8Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = easeInOutQuad(((performance.now() - t0Ref.current) % 2500) / 2500);
    fillBg(ctx, W, H);
    ctx.fillStyle = C.blue; ctx.fillRect(24, 48, 52, 38);
    ctx.fillStyle = C.green; ctx.fillRect(118, 48 + p * 18, 52, 38);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(76, 67); ctx.lineTo(118, 67 + p * 18); ctx.stroke();
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch8Analogy;
