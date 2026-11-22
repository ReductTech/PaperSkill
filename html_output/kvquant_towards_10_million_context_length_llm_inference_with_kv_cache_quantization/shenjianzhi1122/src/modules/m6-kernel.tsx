import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: '压缩', note: '4bit 索引 + 稀疏离群。', color: KQ.blue, lat: 100 },
  { label: 'LUT 反量化', note: '按索引查 FP16 表。', color: KQ.green, lat: 62 },
  { label: '稠密+稀疏', note: 'CSR/CSC，平衡分配到线程。', color: KQ.green, lat: 44 },
  { label: '融合 RoPE', note: '取用时才旋转，省一次搬运。', color: KQ.green, lat: 38 },
];

export const M6Kernel: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 120 + i * 250;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : KQ.card;
      ctx.strokeStyle = active ? s.color : KQ.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.fillRect(cx - 82, 62, 164, 60);
      ctx.strokeRect(cx - 82, 62, 164, 60);
      drawSceneLabel(ctx, cx - 62, 98, s.label, active ? KQ.card : KQ.ink, 13);
      if (i < 3) {
        ctx.strokeStyle = i < stage ? KQ.green : KQ.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 84, 92);
        ctx.lineTo(cx + 164, 92);
        ctx.stroke();
      }
    });
    drawBar(ctx, 120, 170, 840, 16, STEPS[stage].lat / 100, STEPS[stage].color);
    drawSceneLabel(ctx, 120, 162, `相对延迟 ${STEPS[stage].lat}`, STEPS[stage].color, 12);
    drawSceneLabel(ctx, 120, 228, STEPS[stage].note, STEPS[stage].color, 13);
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
      <div className={`feedback ${stage > 0 ? 'good' : ''}`}>{STEPS[stage].note}</div>
    </div>
  );
};

export default M6Kernel;
