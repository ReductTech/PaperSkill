import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFolder, drawSceneLabel, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: '新 token', note: '新 token 先进残差队列（FP16）。', color: KV.blue },
  { label: '进残差', note: 'Key 和 Value 都先追加到全精度残差。', color: KV.purple },
  { label: '攒满 R', note: '队列满 R 后，整组转量化。', color: KV.orange },
  { label: '转量化', note: 'Key 按 G 个 token 一组；Value 按 token 逐个。', color: KV.green },
];

export const M5Stream: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 130 + i * 250;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : KV.card;
      ctx.strokeStyle = active ? s.color : KV.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 80, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 30, 130, s.label, active ? s.color : KV.ink, 13);
    });
    const filled = [1, 3, 6, 6][stage];
    for (let i = 0; i < 6; i++) {
      drawFolder(ctx, 140 + i * 70, 170, 56, 44, { tone: i < filled ? (stage === 3 ? 'old' : 'normal') : 'normal' });
    }
    drawSceneLabel(ctx, 140, 164, stage === 3 ? '已转 2bit' : '残差队列（FP16）', stage === 3 ? KV.green : KV.purple, 12);
    drawSceneLabel(ctx, 130, 250, STEPS[stage].note, STEPS[stage].color, 13);
  }, W, H);

  const onClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 130) / 250);
    if (i >= 0 && i < STEPS.length) setStage(i);
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientX)}>
        <canvas id="cv-m5-stream" ref={ref} width={W} height={H} />
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

export default M5Stream;
