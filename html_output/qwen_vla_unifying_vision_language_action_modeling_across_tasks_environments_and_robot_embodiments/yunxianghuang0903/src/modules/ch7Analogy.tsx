import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch7Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const s = Math.floor(((performance.now() - t0Ref.current) % 4000) / 1000);
    fillBg(ctx, W, H);
    ['T2A', 'CPT', 'SFT', 'RL'].forEach((l, i) => {
      ctx.fillStyle = i <= s ? C.green : C.border;
      ctx.fillRect(18 + i * 54, 58, 48, 42);
      ctx.fillStyle = i <= s ? '#fff' : C.muted;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(l, 42 + i * 54, 84);
    });
    ctx.textAlign = 'left';
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch7Analogy;
