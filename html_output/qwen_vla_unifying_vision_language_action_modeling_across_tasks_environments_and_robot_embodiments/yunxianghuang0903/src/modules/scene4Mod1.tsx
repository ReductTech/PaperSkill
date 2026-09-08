import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { CanvasStage, PsChip, PsFeedback } from '../components/ps-controls';
import type { WidgetProps } from './registry';

type Part = 'input' | 'vlm' | 'concat' | 'dit' | 'action';
const PARTS: { id: Part; label: string }[] = [
  { id: 'input', label: '输入' },
  { id: 'vlm', label: 'VLM' },
  { id: 'concat', label: '拼接' },
  { id: 'dit', label: 'DiT' },
  { id: 'action', label: '输出' },
];

export const Scene4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [part, setPart] = useState<Part>('vlm');

  useResponsiveCanvas(
    containerRef,
    canvasRef,
    280 / 580,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      const boxes = [
        { id: 'input', x: 0.06, y: 0.2, ww: 0.14, hh: 0.25, color: C.env },
        { id: 'vlm', x: 0.24, y: 0.15, ww: 0.18, hh: 0.32, color: C.blue },
        { id: 'concat', x: 0.46, y: 0.22, ww: 0.1, hh: 0.18, color: C.orange },
        { id: 'dit', x: 0.58, y: 0.12, ww: 0.2, hh: 0.38, color: C.green },
        { id: 'action', x: 0.82, y: 0.25, ww: 0.12, hh: 0.22, color: C.purple },
      ];
      boxes.forEach((b) => {
        const on = part === b.id;
        ctx.globalAlpha = on ? 1 : 0.35;
        ctx.fillStyle = b.color;
        ctx.fillRect(w * b.x, h * b.y, w * b.ww, h * b.hh);
        ctx.globalAlpha = 1;
        if (on) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 3;
          ctx.strokeRect(w * b.x, h * b.y, w * b.ww, h * b.hh);
        }
      });
      ctx.strokeStyle = C.route;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.32);
      ctx.lineTo(w * 0.24, h * 0.32);
      ctx.moveTo(w * 0.42, h * 0.32);
      ctx.lineTo(w * 0.46, h * 0.32);
      ctx.moveTo(w * 0.56, h * 0.32);
      ctx.lineTo(w * 0.58, h * 0.32);
      ctx.moveTo(w * 0.78, h * 0.35);
      ctx.lineTo(w * 0.82, h * 0.35);
      ctx.stroke();
    },
    [part]
  );

  return (
    <div>
      <CanvasStage aspectW={580} aspectH={280}>
        <div ref={containerRef} className="canvas-stage-inner">
          <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
        </div>
      </CanvasStage>
      <div className="ps-controls-row">
        {PARTS.map((p) => (
          <PsChip key={p.id} selected={part === p.id} onClick={() => setPart(p.id)}>
            {p.label}
          </PsChip>
        ))}
      </div>
      <PsFeedback tone="good">Qwen3.5-4B VLM → hidden states + noisy action → ~1.15B DiT → clean action chunk。</PsFeedback>
    </div>
  );
};
export default Scene4Mod1;
