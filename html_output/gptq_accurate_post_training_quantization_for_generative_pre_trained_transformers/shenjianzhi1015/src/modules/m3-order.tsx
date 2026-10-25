import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawBar, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;

export const M3Order: React.FC<WidgetProps> = () => {
  const [order, setOrder] = useState<'fixed' | 'greedy'>('fixed');
  const time = order === 'fixed' ? 1 : 1000; // relative
  const err = order === 'fixed' ? 1.0 : 0.97;

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    if (order === 'fixed') {
      drawPath(ctx, 40, 90, 8, 44, 10, (i) => ({ filled: true, highlight: i === 4 }));
    } else {
      const seq = [6, 1, 7, 3, 0, 5, 2, 4];
      seq.forEach((idx, k) => {
        drawPath(ctx, 40, 90, 8, 44, 10, (i) => ({ filled: k > 0, highlight: i === idx }));
        void idx;
      });
    }
    drawSceneLabel(ctx, 40, 78, order === 'fixed' ? '从一端依次铺' : '每次挑最软处', GQ.ink, 13);
    // right: time (log) and error bars
    const x0 = 600;
    const x1 = 1030;
    const logT = Math.log10(time) / 4;
    drawBar(ctx, x0, 80, x1 - x0, 22, Math.max(0.05, logT), order === 'fixed' ? GQ.green : GQ.red);
    drawBar(ctx, x0, 150, x1 - x0, 22, (err - 0.9) / 0.2, GQ.blue);
    drawSceneLabel(ctx, x0, 70, `用时 ${order === 'fixed' ? '1×' : '~1000×'}`, order === 'fixed' ? GQ.green : GQ.red, 13);
    drawSceneLabel(ctx, x0, 140, `误差 ${err.toFixed(2)}`, GQ.blue, 13);
    drawLegend(ctx, x0, 230, [
      { label: '用时', color: order === 'fixed' ? GQ.green : GQ.red },
      { label: '误差', color: GQ.blue },
    ]);
  }, W, H);

  const cls = order === 'fixed' ? 'good' : '';
  const text =
    order === 'fixed'
      ? '固定顺序：H⁻¹ 所有行共用，复杂度降到 O(max{d_row·d_col², d_col³})。'
      : '贪心顺序误差略低，但需要每行单独更新 H⁻¹，实践慢三个数量级。';

  return (
    <div>
      <canvas id="cv-m3-order" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${order === 'fixed' ? 'selected' : ''}`} onClick={() => setOrder('fixed')}>
          固定顺序
        </button>
        <button className={`chip ${order === 'greedy' ? 'selected' : ''}`} onClick={() => setOrder('greedy')}>
          贪心顺序
        </button>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M3Order;
