import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: 'prefill', note: 'prefill：建 KV，首 token 留 FP16。', color: KQ.blue },
  { label: 'Key 压缩', note: 'Key：Pre-RoPE 按通道压。', color: KQ.blue },
  { label: 'Value 压缩', note: 'Value：按 token 在线压。', color: KQ.green },
  { label: 'decode 增量', note: 'decode：新 token 增量压。', color: KQ.green },
  { label: '取用合并', note: '取用：稠密 + 稀疏 + 按需 RoPE。', color: KQ.purple },
];

export const M8Pipeline: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 120 + i * 200;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : KQ.card;
      ctx.strokeStyle = active ? s.color : KQ.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 100, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 34, 158, s.label, active ? s.color : KQ.ink, 12);
      if (i < 4) {
        ctx.strokeStyle = i < stage ? KQ.green : KQ.border;
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
