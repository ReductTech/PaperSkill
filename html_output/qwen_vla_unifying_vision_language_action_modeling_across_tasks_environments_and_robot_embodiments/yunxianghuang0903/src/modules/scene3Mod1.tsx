import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { CanvasStage, PsChip, PsFeedback } from '../components/ps-controls';
import type { WidgetProps } from './registry';

const EMB = [
  { id: 'widowx', label: 'WidowX', c: 5 },
  { id: 'aloha', label: 'ALOHA', c: 6 },
  { id: 'nav', label: 'Navigation', c: 3 },
];

export const Scene3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const e = EMB[idx];

  useResponsiveCanvas(
    containerRef,
    canvasRef,
    240 / 560,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      const cx = w * 0.5;
      const cy = h * 0.42;
      ctx.fillStyle = C.blue;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      const K = 10;
      for (let k = 0; k < K; k++) {
        ctx.fillStyle = k < e.c ? C.green : C.border;
        ctx.fillRect(w * 0.12 + k * (w * 0.76 / K), h * 0.72, w * 0.76 / K - 4, h * 0.18);
      }
    },
    [idx]
  );

  return (
    <div>
      <CanvasStage aspectW={560} aspectH={240}>
        <div ref={containerRef} className="canvas-stage-inner">
          <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
          <div className="hero-core-label">Qwen-VLA</div>
        </div>
      </CanvasStage>
      <div className="ps-controls-row">
        {EMB.map((item, i) => (
          <PsChip key={item.id} selected={idx === i} onClick={() => setIdx(i)}>
            {item.label}
          </PsChip>
        ))}
      </div>
      <div className="hero-prompt-chip" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
        Embodiment Prompt · {e.label} · c = embodiment-specific
      </div>
      <PsFeedback tone="good">共享模型结构不变；换 prompt，换控制语义。</PsFeedback>
    </div>
  );
};
export default Scene3Mod1;
