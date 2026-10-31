import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawGarment, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
type Mode = 'infer' | 'finetune';

export const M7Decomp: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('infer');
  const [decomp, setDecomp] = useState(0);
  const ok = mode === 'infer' ? true : decomp >= 2;

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const hard = mode === 'finetune' && decomp < 2;
    drawGarment(ctx, 80, 70, 130, 100, { big: hard });
    if (hard) {
      ctx.strokeStyle = LI.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 90);
      ctx.lineTo(190, 150);
      ctx.stroke();
    }
    drawSceneLabel(ctx, 80, 60, mode === 'infer' ? '推理' : '微调', LI.ink, 14);
    // curves
    const x0 = 420;
    const x1 = 1030;
    const y0 = 220;
    const y1 = 60;
    ctx.strokeStyle = LI.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    const px = (v: number) => x0 + (v / 10) * (x1 - x0);
    const py = (v: number) => y0 - (v / 100) * (y0 - y1);
    const curve = (vals: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const xx = px(i);
        const yy = py(v);
        if (i === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      });
      ctx.stroke();
    };
    curve([90, 93, 96, 98, 99, 99.2, 99.3], LI.blue);
    curve([70, 80, 88, 95, 98, 99, 99.2], LI.orange);
    ctx.strokeStyle = LI.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(2), y1);
    ctx.lineTo(px(2), y0);
    ctx.stroke();
    drawSceneLabel(ctx, px(2) + 6, y1 + 12, '2%', LI.green, 12);
    drawLegend(ctx, x0, 250, [
      { label: '推理', color: LI.blue },
      { label: '微调', color: LI.orange },
    ]);
  }, W, H);

  const cls = ok ? 'good' : 'bad';
  const text = ok
    ? mode === 'infer'
      ? '推理：0% 分解就够；FFN 8 位无损。'
      : '微调：2% 分解后恢复精度。'
    : '注意力线性层 8 位会掉点，至少 2% 维度要用 16 位。';

  return (
    <div>
      <canvas id="cv-m7-decomp" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'infer' ? 'selected' : ''}`} onClick={() => setMode('infer')}>
          推理
        </button>
        <button className={`chip ${mode === 'finetune' ? 'selected' : ''}`} onClick={() => setMode('finetune')}>
          微调
        </button>
      </div>
      <div className="ctrl">
        <label>
          分解比例 <span className="val">{decomp}%</span>
        </label>
        <input type="range" min={0} max={10} value={decomp} onChange={(e) => setDecomp(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M7Decomp;
