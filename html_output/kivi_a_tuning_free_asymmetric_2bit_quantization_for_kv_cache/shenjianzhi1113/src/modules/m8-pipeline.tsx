import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: 'prefill 计算', note: 'prefill：算 K/V，建量化缓存。', color: KV.blue },
  { label: '分组量化', note: 'Key 按列、Value 按行。', color: KV.blue },
  { label: 'decode 新 token', note: 'decode：新 token 进残差。', color: KV.green },
  { label: '残差满 R', note: '残差满 R：整组转 2bit。', color: KV.purple },
  { label: '两段注意力', note: '注意力：旧卷 + 桌面两段合并。', color: KV.green },
];

export const M8Pipeline: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 120 + i * 200;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : KV.card;
      ctx.strokeStyle = active ? s.color : KV.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 100, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 34, 158, s.label, active ? s.color : KV.ink, 12);
      if (i < 4) {
        ctx.strokeStyle = i < stage ? KV.green : KV.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 38, 100);
        ctx.lineTo(cx + 162, 100);
        ctx.stroke();
      }
    });
    ctx.fillStyle = 'rgba(47,93,138,0.06)';
    ctx.fillRect(40, 56, 380, 88);
    ctx.fillStyle = 'rgba(47,125,79,0.06)';
    ctx.fillRect(420, 56, 620, 88);
    drawSceneLabel(ctx, 120, 226, STEPS[stage].note, STEPS[stage].color, 13);
  }, W, H);

  const onClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 120) / 200);
    if (i >= 0 && i < STEPS.length) setStage(i);
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onClick(e.clientX)}>
        <canvas id="cv-m8-pipeline" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {STEPS.map((s, i) => (
          <button key={i} className={`chip ${stage === i ? 'selected' : ''}`} onClick={() => setStage(i)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage >= 3 ? 'good' : ''}`}>{STEPS[stage].note}</div>
    </div>
  );
};

export default M8Pipeline;
