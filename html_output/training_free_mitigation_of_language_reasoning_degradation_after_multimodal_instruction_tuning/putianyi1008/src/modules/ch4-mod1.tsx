import React, { useState } from 'react';
import { C, stage, label, legend, num, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// Fixed magnitude profile of the task vector: 48 entries, sorted by rank so the
// top-K set is always the leftmost `keep` cells.
const MAG = [
  1.0, 0.95, 0.9, 0.86, 0.82, 0.78, 0.74, 0.71, 0.68, 0.65, 0.62, 0.59,
  0.56, 0.53, 0.51, 0.48, 0.46, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32,
  0.3, 0.28, 0.26, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.12, 0.1, 0.09,
  0.08, 0.07, 0.06, 0.05, 0.04, 0.035, 0.03, 0.025, 0.02, 0.015, 0.01, 0.006,
];

export const Ch4Mod1: React.FC = () => {
  const [k, setK] = useState(100);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '几乎没裁：语言与视觉的变化混在一起，偏移方向不纯。',
    c: 'bad',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const keep = Math.max(1, Math.round((48 * k) / 100));
    const zero = 200;
    const x0 = 90;
    const cell = 17;

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0 - 20, zero);
    ctx.lineTo(x0 + 48 * cell + 20, zero);
    ctx.stroke();

    for (let i = 0; i < 48; i++) {
      const kept = i < keep;
      const h = kept ? MAG[i] * 130 : 6;
      ctx.fillStyle = kept ? C.orange : C.axis;
      ctx.fillRect(x0 + i * cell, zero - h, cell - 5, h);
    }

    num(ctx, 90, 244, keep, C.orange);
    label(ctx, 90, 40, '裁剪后');
    label(ctx, 360, 40, '保留 K');
    legend(ctx, 640, 250, [
      ['保留', C.orange],
      ['裁剪', C.axis],
      ['零线', C.blue],
    ]);
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setK(v);
    if (v >= 80) {
      // not a failure, just an ineffective setting: emphasis colour, not red
      setFb({ t: '几乎没裁：语言与视觉的变化混在一起，偏移方向不纯。', c: '' });
    } else if (v >= 40) {
      setFb({
        t: '只留下最强的那些项——论文假设它们才是语言能力被改动的关键位置。',
        c: '',
      });
    } else {
      setFb({
        t: '裁得太狠：保留项已经覆盖不了主要的偏移幅度，信息会一起被削掉。',
        c: 'bad',
      });
    }
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          保留比例 K(%) <span className="val">{k}</span>
        </label>
        <input type="range" min={5} max={100} step={5} value={k} onChange={onChange} />
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        48 个格子的幅度是机制示意的固定序列，不是论文测量的权重值；K 越大保留的项越多。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch4Mod1;
