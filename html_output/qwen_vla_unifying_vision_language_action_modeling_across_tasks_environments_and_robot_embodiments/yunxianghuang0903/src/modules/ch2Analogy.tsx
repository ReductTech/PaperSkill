import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244; const H = 130;

export const Ch2Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);
  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = easeInOutQuad(((performance.now() - t0Ref.current) % 2500) / 2500);
    fillBg(ctx, W, H);
    ctx.fillStyle = C.env;
    ctx.fillRect(130, 28, 88, 58);
    ctx.fillStyle = C.text;
    ctx.font = '9px sans-serif';
    ctx.fillText('视觉场景', 148, 48);
    ctx.fillStyle = C.blue;
    ctx.fillRect(24, 48 + p * 12, 56, 34);
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText('指令', 38, 68);
  }, []);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch2Analogy;
