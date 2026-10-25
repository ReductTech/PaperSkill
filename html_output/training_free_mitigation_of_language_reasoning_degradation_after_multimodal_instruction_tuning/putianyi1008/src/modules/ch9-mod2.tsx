import React, { useState } from 'react';
import { C, stage, meter, label, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

type Way = 'interleave' | 'textonly' | 'merge';

const COST: Record<Way, { train: number; data: number; hyper: number; active: string }> = {
  interleave: { train: 1, data: 1, hyper: 0.3, active: C.axis },
  textonly: { train: 1, data: 1, hyper: 0.3, active: C.axis },
  merge: { train: 0, data: 0, hyper: 0.9, active: C.orange },
};

// Row identities live in the DOM list below the canvas, so the Canvas keeps a
// single short label within the two-label / eight-character budget.
const ROW_NAMES = ['需要额外训练', '需要额外数据', '需要选择超参数'];

export const Ch9Mod2: React.FC = () => {
  const [way, setWay] = useState<Way>('merge');
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '论文的方案把训练与数据两项代价清零，代价转移到「需要自己选 α（以及未公开的 K）」。',
    c: 'good',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const c = COST[way];
    const barX = 150;
    const barW = 700;
    const rows = [
      { v: c.train, color: c.train === 0 ? C.green : c.active },
      { v: c.data, color: c.data === 0 ? C.green : c.active },
      { v: c.hyper, color: C.orange },
    ];

    rows.forEach((r, i) => {
      const y = 70 + i * 56;
      if (r.v === 0) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(barX, y + 14);
        ctx.lineTo(barX + barW, y + 14);
        ctx.stroke();
      } else {
        meter(ctx, barX, y, barW, 26, r.v, r.color, false);
      }
    });

    label(ctx, barX, 34, '代价构成');
  });

  const pick = (w: Way) => {
    setWay(w);
    setFb(
      w === 'merge'
        ? {
            t: '论文的方案把训练与数据两项代价清零，代价转移到「需要自己选 α（以及未公开的 K）」。',
            c: 'good',
          }
        : { t: '这些思路要在训练阶段引入新数据或新模块，代价落在训练与数据上。', c: '' }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {ROW_NAMES.map((n, i) => (
          <span key={n} className="step-tag">
            {n}
            {COST[way][(['train', 'data', 'hyper'] as const)[i]] === 0 ? '：不需要' : ''}
          </span>
        ))}
      </div>
      <div className="ctrl">
        <button className={way === 'interleave' ? 'chip active' : 'chip'} onClick={() => pick('interleave')}>
          加入交错图文数据
        </button>
        <button className={way === 'textonly' ? 'chip active' : 'chip'} onClick={() => pick('textonly')}>
          混入纯文本样本
        </button>
        <button className={way === 'merge' ? 'chip active' : 'chip'} onClick={() => pick('merge')}>
          本文：权重融合
        </button>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch9Mod2;
