import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: '量化融合', note: '把 min/max 与量化塞进 LayerNorm/GeLU/bias。', color: ZQ.blue, ms: 40 },
  { label: 'INT8 GEMM', note: 'CUTLASS 按 batch/seq 选 tile。', color: ZQ.purple, ms: 25 },
  { label: '反量化融合', note: 'epilogue 用权重/激活缩放把 INT32 写回 FP16。', color: ZQ.green, ms: 15 },
  { label: 'CUDA Graph', note: '小模型减少 kernel 启动开销。', color: ZQ.green, ms: 8 },
];

export const M6Kernel: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 120 + i * 250;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : ZQ.card;
      ctx.strokeStyle = active ? s.color : ZQ.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.fillRect(cx - 82, 66, 164, 62);
      ctx.strokeRect(cx - 82, 66, 164, 62);
      drawSceneLabel(ctx, cx - 66, 102, s.label, active ? ZQ.card : ZQ.ink, 13);
      if (i < 3) {
        ctx.strokeStyle = i < stage ? ZQ.green : ZQ.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 84, 97);
        ctx.lineTo(cx + 164, 97);
        ctx.stroke();
      }
    });
    drawBar(ctx, 120, 182, 840, 16, STEPS[stage].ms / 40, STEPS[stage].color);
    drawSceneLabel(ctx, 120, 174, `相对延迟 ${STEPS[stage].ms}`, STEPS[stage].color, 12);
    drawSceneLabel(ctx, 120, 234, STEPS[stage].note, STEPS[stage].color, 13);
  }, W, H);

  const onClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 120) / 250);
    if (i >= 0 && i < STEPS.length) setStage(i);
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientX)}>
        <canvas id="cv-m6-kernel" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {STEPS.map((s, i) => (
          <button key={i} className={`chip ${stage === i ? 'selected' : ''}`} onClick={() => setStage(i)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage === 3 ? 'good' : ''}`}>{STEPS[stage].note}</div>
    </div>
  );
};

export default M6Kernel;
