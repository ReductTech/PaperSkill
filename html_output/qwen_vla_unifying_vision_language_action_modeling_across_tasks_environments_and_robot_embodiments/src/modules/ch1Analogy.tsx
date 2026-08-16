import React, { useRef } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import { easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ch1Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef(0);

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    if (!t0Ref.current) t0Ref.current = performance.now();
    const p = easeInOutQuad(((performance.now() - t0Ref.current) % 3000) / 3000);
    fillBg(ctx, W, H);
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(36 + p * 24, 62, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.text;
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('导游', 24, 88);
    const maps: [number, number, string][] = [[58, 38, C.red], [118, 82, C.red], [178, 44, C.red]];
    maps.forEach(([x, y, c]) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 44, 32);
      ctx.fillStyle = '#fff8f8';
      ctx.fillRect(x + 2, y + 2, 40, 28);
    });
    ctx.fillStyle = C.muted;
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('三张互不连通的地图', 52, 118);
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
export default Ch1Analogy;
