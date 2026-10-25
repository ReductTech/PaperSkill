import React, { useState } from 'react';
import { C, stage, num, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

const BANDS = [
  { key: '保守', tau: 18, color: C.purple },
  { key: '中等', tau: 30, color: C.orange },
  { key: '激进', tau: 50, color: C.blue },
];

const coverage = (k: number, tau: number) => 1 - Math.exp(-k / tau);

export const Ch8Mod1: React.FC = () => {
  const [kband, setKband] = useState(1);
  const [kcov, setKcov] = useState(60);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '覆盖率已经不错，但还没有饱和。',
    c: '',
  });

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const left = 110;
    const right = 880;
    const top = 46;
    const bottom = 224;

    const px = (k: number) => left + ((k - 10) / 90) * (right - left);
    const py = (v: number) => bottom - v * (bottom - top);

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();
    for (let g = 0; g <= 4; g++) {
      const y = py(g / 4);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    BANDS.forEach((b, i) => {
      const active = i === kband;
      ctx.globalAlpha = active ? 1 : 0.4;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = active ? 4 : 1.6;
      ctx.beginPath();
      for (let k = 10; k <= 100; k += 2) {
        const x = px(k);
        const y = py(coverage(k, b.tau));
        if (k === 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // current K cursor
    const cx = px(kcov);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top - 4);
    ctx.lineTo(cx, bottom + 4);
    ctx.stroke();
    const cy = py(coverage(kcov, BANDS[kband].tau));
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = C.orange;
    ctx.fill();

    num(ctx, 900, cy, coverage(kcov, BANDS[kband].tau), C.orange);
    label(ctx, left, 26, '覆盖率 %');
    legend(ctx, 380, 254, [
      ['保守', C.purple],
      ['中等', C.orange],
      ['激进', C.blue],
    ]);
  });

  const evaluate = (k: number, band: number) => {
    const cov = coverage(k, BANDS[band].tau);
    if (cov < 0.6) {
      setFb({
        t: '保留比例偏低：幅度覆盖率不足，裁剪掉的项里可能就包含语言能力相关的方向。',
        c: 'bad',
      });
    } else if (cov < 0.9) {
      setFb({ t: '覆盖率已经不错，但还没有饱和。', c: '' });
    } else {
      setFb({
        t: '覆盖率接近饱和——再增大 K 边际收益很小，但会引入更多视觉相关的变化。',
        c: 'good',
      });
    }
  };

  const pickBand = (i: number) => {
    setKband(i);
    evaluate(kcov, i);
    if (coverage(kcov, BANDS[i].tau) >= 0.6 && coverage(kcov, BANDS[i].tau) < 0.9) {
      setFb(
        i === 0
          ? { t: '保守档在很小的 K 下就能覆盖大部分幅度。', c: '' }
          : { t: '激进档要很大的 K 才覆盖同样的幅度，实际保留了更多项。', c: '' }
      );
    }
  };

  const onK = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setKcov(v);
    evaluate(v, kband);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {BANDS.map((b, i) => (
          <button key={b.key} className={i === kband ? 'chip active' : 'chip'} onClick={() => pickBand(i)}>
            {b.key}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          裁剪范围 K(%) <span className="val">{kcov}</span>
        </label>
        <input type="range" min={10} max={100} step={1} value={kcov} onChange={onK} />
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        三条覆盖率曲线是机制示意（覆盖率 = 1 − e^(−K/τ)，τ 取 18 / 30 / 50），不是论文数据；
        论文正文未给出 K 的具体取值，也未报告 K 的扫描结果。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch8Mod1;
