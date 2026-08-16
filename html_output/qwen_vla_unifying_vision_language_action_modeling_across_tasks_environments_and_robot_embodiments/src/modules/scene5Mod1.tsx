import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { CanvasStage, PsChip, PsFeedback } from '../components/ps-controls';
import type { WidgetProps } from './registry';

const STAGES = [
  { id: 't2a', label: 'T2A' },
  { id: 'cpt', label: 'CPT' },
  { id: 'sft', label: 'SFT' },
  { id: 'rl', label: 'RL' },
];

export const Scene5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);

  useResponsiveCanvas(
    containerRef,
    canvasRef,
    260 / 560,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      STAGES.forEach((s, i) => {
        const x = w * 0.08 + i * (w * 0.22);
        const on = i === idx;
        ctx.fillStyle = on ? C.blue : '#e8ecf0';
        ctx.fillRect(x, h * 0.25, w * 0.18, h * 0.35);
        ctx.strokeStyle = on ? C.blue : C.border;
        ctx.lineWidth = on ? 2.5 : 1;
        ctx.strokeRect(x, h * 0.25, w * 0.18, h * 0.35);
        if (i < STAGES.length - 1) {
          ctx.strokeStyle = C.muted;
          ctx.beginPath();
          ctx.moveTo(x + w * 0.18, h * 0.42);
          ctx.lineTo(x + w * 0.22, h * 0.42);
          ctx.stroke();
        }
      });
      const vlmOn = idx >= 1;
      const ditOn = true;
      ctx.fillStyle = vlmOn ? C.blue : C.border;
      ctx.fillRect(w * 0.15, h * 0.68, w * 0.3, h * 0.12);
      ctx.fillStyle = ditOn ? C.green : C.border;
      ctx.fillRect(w * 0.55, h * 0.68, w * 0.3, h * 0.12);
    },
    [idx]
  );

  return (
    <div>
      <CanvasStage aspectW={560} aspectH={260}>
        <div ref={containerRef} className="canvas-stage-inner">
          <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
        </div>
        <div className="canvas-stage-overlay" style={{ left: '15%', bottom: 8, fontSize: 12, fontWeight: 600 }}>VLM</div>
        <div className="canvas-stage-overlay" style={{ left: '55%', bottom: 8, fontSize: 12, fontWeight: 600 }}>DiT</div>
      </CanvasStage>
      <div className="ps-controls-row">
        {STAGES.map((s, i) => (
          <PsChip key={s.id} selected={idx === i} onClick={() => setIdx(i)}>
            {s.label}
          </PsChip>
        ))}
      </div>
      <PsFeedback tone="good">
        {idx === 0 && 'T2A：VLM frozen，无图像，只训练 DiT。'}
        {idx === 1 && 'CPT：VLM + DiT unfreeze，加入视觉 grounding。'}
        {idx === 2 && 'SFT：高质量 demonstration，task specialization。'}
        {idx === 3 && 'RL：rollouts ONLY in SimplerEnv。'}
      </PsFeedback>
    </div>
  );
};
export default Scene5Mod1;
