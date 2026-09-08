import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { CanvasStage, PsSegmented, PsFeedback } from '../components/ps-controls';
import type { WidgetProps } from './registry';

const MODES = [
  { key: 'manip', label: '操纵', c: 8 },
  { key: 'nav', label: '导航', c: 3 },
  { key: 'ego', label: 'Egocentric', c: 6 },
] as const;

export const Scene2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const m = MODES[idx];

  useResponsiveCanvas(
    containerRef,
    canvasRef,
    280 / 560,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      const K = 12;
      const cellW = (w - 48) / K;
      for (let k = 0; k < K; k++) {
        const active = k < m.c;
        ctx.fillStyle = active ? C.green : C.border;
        ctx.fillRect(24 + k * cellW, h * 0.35, cellW - 4, h * 0.45);
      }
    },
    [idx]
  );

  return (
    <div>
      <p className="module-en-sub">统一张量接口 ≠ 统一物理动作语义</p>
      <CanvasStage aspectW={560} aspectH={280}>
        <div ref={containerRef} className="canvas-stage-inner">
          <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
        </div>
        <div className="canvas-stage-overlay" style={{ left: 16, top: 12, fontSize: 13, fontWeight: 600 }}>
          Y ∈ R<sup>H×K</sup> · c = embodiment-specific ({m.c})
        </div>
      </CanvasStage>
      <div className="ps-controls-row">
        <PsSegmented
          value={MODES[idx].key}
          onChange={(k) => setIdx(MODES.findIndex((x) => x.key === k))}
          options={MODES.map((x) => ({ value: x.key, label: x.label }))}
        />
      </div>
      <PsFeedback tone="good">
        {m.label}：native control convention 不同，但映射到同一张量接口 + mask M。
      </PsFeedback>
    </div>
  );
};
export default Scene2Mod1;
