import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch5Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = easeInOutQuad(((performance.now() - t0Ref.current) % 2600) / 2600);
    fillBg(ctx, W, H);
    ctx.fillStyle = C.orange;
    ctx.fillRect(96, 36, 88, 22);
    ctx.fillStyle = C.text; ctx.font = '9px sans-serif';
    ctx.fillText('robot_tag', 108, 51);
    ctx.fillStyle = C.blue;
    ctx.beginPath(); ctx.arc(56 + p * 120, 88, 10, 0, Math.PI * 2); ctx.fill();
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch5Analogy;
