import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: '读微缩', note: '从显存取 2bit 数据。', color: KV.blue, traffic: 100 },
  { label: '解压融合', note: '在 tile 级边解压边乘。', color: KV.green, traffic: 45 },
  { label: '矩阵乘', note: '不再单独写回 FP16。', color: KV.green, traffic: 30 },
  { label: '写回', note: '只写结果。', color: KV.green, traffic: 18 },
];

export const M6Kernel: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 120 + i * 250;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : KV.card;
      ctx.strokeStyle = active ? s.color : KV.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.fillRect(cx - 82, 62, 164, 60);
      ctx.strokeRect(cx - 82, 62, 164, 60);
      drawSceneLabel(ctx, cx - 64, 98, s.label, active ? KV.card : KV.ink, 13);
      if (i < 3) {
        ctx.strokeStyle = i < stage ? KV.green : KV.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 84, 92);
        ctx.lineTo(cx + 164, 92);
        ctx.stroke();
      }
    });
    drawBar(ctx, 120, 170, 840, 16, STEPS[stage].traffic / 100, STEPS[stage].color);
    drawSceneLabel(ctx, 120, 162, `显存搬运 ${STEPS[stage].traffic}%`, STEPS[stage].color, 12);
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
