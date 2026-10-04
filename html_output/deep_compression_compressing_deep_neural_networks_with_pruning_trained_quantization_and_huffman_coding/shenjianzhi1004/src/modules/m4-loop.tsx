import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPhotoTile, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;

const STEPS = [
  { kept: 1.0, err: 42.78, label: '训练' },
  { kept: 0.11, err: 46.0, label: '剪枝' },
  { kept: 0.11, err: 42.78, label: '重训练' },
  { kept: 0.11, err: 42.78, label: '再剪一轮' },
];

const FEEDBACK = [
  { text: '正常训练完成：连接 100%，top-1 误差 42.78%。', cls: '' },
  { text: '删掉小权重后连接只剩 11%，误差会先上升，这就是需要补救的信号。', cls: 'bad' },
  { text: '对剩余稀疏连接重训练，误差回到 42.78%，连接数仍是 11%。', cls: 'good' },
  { text: '可以重复「剪枝 → 重训练」，继续逼近 9× 的压缩。', cls: 'good' },
];

export const M4Loop: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPhotoTile(ctx, 60, 90, 120, 100, { blur: step === 1 });
    // sparse grid
    const gx = 360;
    const gy = 60;
    const cell = 12;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const idx = r * 16 + c;
        const keep = (idx * 7) % 100 < cur.kept * 100;
        ctx.fillStyle = keep ? DC.blue : DC.border;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell - 2, cell - 2);
      }
    }
    drawSceneLabel(ctx, gx, gy - 8, '连接', DC.ink, 13);
    // error curve
    const x0 = 620;
    const x1 = 1040;
    const y0 = 230;
    const y1 = 70;
    ctx.strokeStyle = DC.border;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.strokeStyle = DC.route;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    STEPS.forEach((s, i) => {
      const xx = x0 + (i / (STEPS.length - 1)) * (x1 - x0);
      const yy = y0 - ((s.err - 40) / 10) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();
    const px = x0 + (step / (STEPS.length - 1)) * (x1 - x0);
    const py = y0 - ((cur.err - 40) / 10) * (y0 - y1);
    ctx.fillStyle = step === 1 ? DC.red : DC.green;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    drawLegend(ctx, x0, 262, [
      { label: '误差', color: DC.route },
      { label: '当前', color: step === 1 ? DC.red : DC.green },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m4-loop" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步 · {cur.label}
        </span>
        <button className="tiny" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>
          下一步 →
        </button>
        <button className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${FEEDBACK[step].cls}`}>{FEEDBACK[step].text}</div>
    </div>
  );
};

export default M4Loop;
