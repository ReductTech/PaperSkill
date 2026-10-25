import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;
const STAGES = [
  { label: '准备 H⁻¹', note: '先用 Cholesky 处理 H⁻¹，得到稳定的逐列信息。' },
  { label: '进入块 i', note: '进入块 i，逐列把权重化到格点。' },
  { label: '逐列量化', note: '把每列的量化误差累积成 E。' },
  { label: '块末更新', note: '块末用 E 与 H⁻¹ 整体更新剩余列，继续下一块。' },
];

export const M8Algo: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STAGES.forEach((s, i) => {
      const cx = 150 + i * 240;
      const active = i === stage;
      ctx.fillStyle = i <= stage ? (i === 3 ? GQ.green : GQ.card) : GQ.card;
      ctx.strokeStyle = active ? GQ.orange : GQ.blue;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 100, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 34, 152, s.label, active ? GQ.orange : GQ.ink, 12);
      if (i < 3) {
        ctx.strokeStyle = i < stage ? GQ.green : GQ.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 32, 100);
        ctx.lineTo(cx + 208, 100);
        ctx.stroke();
      }
    });
    drawBar(ctx, 150, 200, 780, 22, (stage + 1) / 4, stage === 3 ? GQ.green : GQ.blue);
    drawSceneLabel(ctx, 150, 192, `进度 ${stage + 1}/4`, GQ.muted, 13);
  }, W, H);

  const onCanvasClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 150) / 240);
    if (i >= 0 && i < STAGES.length) setStage(i);
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientX)}>
        <canvas id="cv-m8-algo" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {STAGES.map((s, i) => (
          <button key={i} className={`chip ${stage === i ? 'selected' : ''}`} onClick={() => setStage(i)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="feedback">{STAGES[stage].note}</div>
    </div>
  );
};

export default M8Algo;
