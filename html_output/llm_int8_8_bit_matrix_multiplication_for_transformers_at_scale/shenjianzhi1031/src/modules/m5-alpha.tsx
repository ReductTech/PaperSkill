import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawRuler, drawBar, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
const VALS = [58, 44, 37, 20, 12, 8, 5, 4, 3.5, 3, 2.8, 2.5, 2.2, 2, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];

export const M5Alpha: React.FC<WidgetProps> = () => {
  const [alpha, setAlpha] = useState(6);
  const outliers = VALS.filter((v) => v > alpha).length;
  const mem = outliers * 0.02;

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    for (let i = 0; i < 12; i++) {
      const big = VALS[i] > alpha;
      ctx.fillStyle = big ? LI.red : LI.cloth;
      ctx.strokeStyle = big ? LI.red : LI.clothEdge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(70 + (i % 6) * 60, 80 + Math.floor(i / 6) * 60, Math.min(24, 6 + VALS[i] / 3), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    drawRuler(ctx, 470, 50, 150, alpha / 12, { ok: alpha === 6 });
    drawSceneLabel(ctx, 500, 90, `α=${alpha}`, LI.orange, 15);
    drawSceneLabel(ctx, 500, 120, `挑出 ${outliers} 维`, outliers > 7 ? LI.red : LI.green, 13);
    drawBar(ctx, 650, 100, 360, 20, Math.min(1, outliers / 12), LI.purple);
    drawSceneLabel(ctx, 650, 90, `额外内存 ~${mem.toFixed(2)}%`, LI.purple, 12);
    drawLegend(ctx, 650, 220, [
      { label: '离群', color: LI.red },
      { label: '标准', color: LI.clothEdge },
    ]);
  }, W, H);

  const cls = alpha === 6 ? 'good' : alpha < 6 ? 'bad' : '';
  const text =
    alpha < 6
      ? '挑得更多，精度更稳，但额外开销变大。'
      : alpha > 6
      ? '挑得更少、更省，但可能开始掉点。'
      : '论文的默认阈值：精度恢复，额外内存约 0.1%。';

  return (
    <div>
      <canvas id="cv-m5-alpha" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {[4, 6, 8].map((a) => (
          <button key={a} className={`chip ${alpha === a ? 'selected' : ''}`} onClick={() => setAlpha(a)}>
            α = {a}
          </button>
        ))}
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M5Alpha;
