import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;

export const M4Pick: React.FC<WidgetProps> = () => {
  const [pick, setPick] = useState<'fixed' | 'minErr'>('fixed');
  const finalErr = pick === 'fixed' ? 0.20 : 0.17;

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    if (pick === 'fixed') {
      drawPath(ctx, 40, 80, 8, 44, 10, (i) => ({ filled: true, highlight: i === 3 }));
    } else {
      drawPath(ctx, 40, 80, 8, 44, 10, (i) => ({ filled: true, highlight: i === 0 }));
    }
    drawSceneLabel(ctx, 40, 68, pick === 'fixed' ? '从左到右' : '先挑误差最小', GQ.ink, 13);
    // error curve
    const x0 = 600;
    const x1 = 1030;
    const y0 = 230;
    const y1 = 70;
    ctx.strokeStyle = GQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.strokeStyle = pick === 'fixed' ? GQ.green : GQ.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const xx = x0 + (i / 100) * (x1 - x0);
      const e = 1 - (1 - finalErr) * (i / 100);
      const yy = y0 - (e / 1.05) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    drawSceneLabel(ctx, x0, y0 + 22, '已铺进度 →', GQ.muted, 12);
    drawSceneLabel(ctx, x0, y0 - 6, `终值 ${finalErr.toFixed(2)}`, pick === 'fixed' ? GQ.green : GQ.blue, 13);
    drawLegend(ctx, x0, 250, [{ label: '单层误差', color: pick === 'fixed' ? GQ.green : GQ.blue }]);
  }, W, H);

  const text =
    pick === 'fixed'
      ? '固定顺序：单层误差几乎一样，却能共享 H⁻¹。'
      : '挑误差最小：单层误差略低，但要用贪心顺序、代价高得多。';

  return (
    <div>
      <canvas id="cv-m4-pick" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${pick === 'fixed' ? 'selected' : ''}`} onClick={() => setPick('fixed')}>
          固定顺序
        </button>
        <button className={`chip ${pick === 'minErr' ? 'selected' : ''}`} onClick={() => setPick('minErr')}>
          挑误差最小
        </button>
      </div>
      <div className={`feedback ${pick === 'fixed' ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M4Pick;
