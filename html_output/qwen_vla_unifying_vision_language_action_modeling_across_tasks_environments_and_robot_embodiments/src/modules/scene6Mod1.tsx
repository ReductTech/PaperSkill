import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { CanvasStage, PsChip, PsFeedback } from '../components/ps-controls';
import type { WidgetProps } from './registry';

const CLAIMS = [
  { id: 'a', label: '通才 vs 专用', title: 'LIBERO 97.9 · Simpler 73.7 · RoboTwin 86.1/87.2' },
  { id: 'b', label: 'OOD', title: 'Qwen-VLA-aloha w/ pretrain 76.9%（非 Instruct）' },
  { id: 'c', label: '迁移', title: 'R2R OSR 69.0 · DOMINO SR 26.6' },
  { id: 'l', label: '局限', title: '数据规模 · objective trade-offs · 长时部署' },
];

export const Scene6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const c = CLAIMS[idx];

  useResponsiveCanvas(
    containerRef,
    canvasRef,
    280 / 560,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      const tone = idx === 3 ? C.red : C.blue;
      ctx.fillStyle = tone;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(w * 0.08, h * 0.15, w * 0.84, h * 0.7);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = tone;
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.08, h * 0.15, w * 0.84, h * 0.7);
      if (idx === 0) {
        const bars = [0.98, 0.74, 0.86, 0.87];
        bars.forEach((v, i) => {
          ctx.fillStyle = C.green;
          ctx.fillRect(w * 0.14 + i * (w * 0.18), h * 0.72 - v * h * 0.4, w * 0.12, v * h * 0.4);
        });
      }
    },
    [idx]
  );

  return (
    <div>
      <CanvasStage aspectW={560} aspectH={280}>
        <div ref={containerRef} className="canvas-stage-inner">
          <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
        </div>
        <div
          className="canvas-stage-overlay"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', fontWeight: 600, fontSize: 14, maxWidth: '80%' }}
        >
          {c.title}
        </div>
      </CanvasStage>
      <div className="ps-controls-row">
        {CLAIMS.map((item, i) => (
          <PsChip key={item.id} selected={idx === i} onClick={() => setIdx(i)}>
            {item.label}
          </PsChip>
        ))}
      </div>
      <PsFeedback tone={idx === 3 ? 'bad' : 'good'}>{c.label}：{c.title}</PsFeedback>
    </div>
  );
};
export default Scene6Mod1;
