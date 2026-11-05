import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
const STEPS = [
  { label: '读取/量化', note: '分组权重 + 逐 token 激活。', color: ZQ.blue },
  { label: 'LKD', note: 'W4/8 才需要；INT8 可跳过。', color: ZQ.purple },
  { label: '融合内核', note: 'CUTLASS + epilogue 反量化。', color: ZQ.green },
  { label: '部署', note: 'INT8 Tensor Core，端到端加速。', color: ZQ.green },
];

export const M8Pipeline: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    STEPS.forEach((s, i) => {
      const cx = 130 + i * 250;
      const active = i === stage;
      ctx.fillStyle = active ? s.color : ZQ.card;
      ctx.strokeStyle = active ? s.color : ZQ.border;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 100, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 30, 152, s.label, active ? s.color : ZQ.ink, 13);
      if (i < 3) {
        ctx.strokeStyle = i < stage ? ZQ.green : ZQ.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 36, 100);
        ctx.lineTo(cx + 214, 100);
        ctx.stroke();
      }
    });
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = ZQ.purple;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(380, 140);
    ctx.lineTo(380, 190);
    ctx.stroke();
    ctx.setLineDash([]);
    drawSceneLabel(ctx, 300, 206, '虚线：W4/8 可选分支', ZQ.purple, 12);
    drawSceneLabel(ctx, 130, 236, STEPS[stage].note, STEPS[stage].color, 13);
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
        <canvas id="cv-m8-pipeline" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {STEPS.map((s, i) => (
          <button key={i} className={`chip ${stage === i ? 'selected' : ''}`} onClick={() => setStage(i)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage >= 2 ? 'good' : stage === 1 ? '' : ''}`}>{STEPS[stage].note}</div>
    </div>
  );
};

export default M8Pipeline;
