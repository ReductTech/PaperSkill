import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: '拆分', note: '按 α=6 把离群维度分到 O。', color: LI.blue },
  { label: '16 位乘', note: '只算 O，量很小。', color: LI.purple },
  { label: '8 位乘', note: '算其余 99.9%。', color: LI.green },
  { label: '累加', note: '两路结果在 16 位相加。', color: LI.green },
];

export const M8Flow: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 140 + i * 250;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : LI.card;
      ctx.strokeStyle = active ? s.color : LI.blue;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 100, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 26, 152, s.label, active ? s.color : LI.ink, 13);
      if (i < 3) {
        ctx.strokeStyle = i < stage ? LI.green : LI.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 34, 100);
        ctx.lineTo(cx + 216, 100);
        ctx.stroke();
      }
    });
    drawSceneLabel(ctx, 140, 210, STEPS[stage].note, STEPS[stage].color, 14);
  }, W, H);

  const onCanvasClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 140) / 250);
    if (i >= 0 && i < STEPS.length) setStage(i);
  };

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientX)}>
        <canvas id="cv-m8-flow" ref={ref} width={W} height={H} />
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

export default M8Flow;
