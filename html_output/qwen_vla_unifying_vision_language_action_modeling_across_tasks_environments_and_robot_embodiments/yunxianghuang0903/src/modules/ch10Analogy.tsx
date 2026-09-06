import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch10Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = easeInOutQuad(((performance.now() - t0Ref.current) % 3000) / 3000);
    fillBg(ctx, W, H);
    [0.98, 0.74, 0.86, 0.69].forEach((v, i) => {
      const h = v * 70 * Math.min(1, p * 1.2);
      ctx.fillStyle = C.green;
      ctx.fillRect(28 + i * 50, 108 - h, 38, h);
    });
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch10Analogy;
