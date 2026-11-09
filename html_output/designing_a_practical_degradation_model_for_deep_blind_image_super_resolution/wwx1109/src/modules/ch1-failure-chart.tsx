import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const TYPES = [
  { id: 1, label: 'I 双三次', short: 'I' },
  { id: 2, label: 'II 各向异性+最近邻×4', short: 'II' },
  { id: 3, label: 'III 两段下采样+JPEG', short: 'III' },
  { id: 4, label: 'IV 本文退化', short: 'IV' },
] as const;

const METHODS = [
  { key: 'RRDB', color: '#c43f52', note: '双三次训练' },
  { key: 'ESRGAN', color: '#f07e47', note: '双三次训练' },
  { key: 'BSRNet', color: '#27446e', note: '本文退化训练' },
  { key: 'BSRGAN', color: '#228d5c', note: '本文退化训练' },
] as const;

const PSNR: Record<number, number[]> = {
  1: [30.89, 28.16, 29.07, 27.30],
  2: [25.66, 25.56, 27.76, 26.26],
  3: [26.70, 26.21, 27.59, 26.28],
  4: [24.03, 23.68, 25.67, 24.58],
};
const LPIPS: Record<number, number[]> = {
  1: [0.254, 0.115, 0.331, 0.236],
  2: [0.542, 0.526, 0.397, 0.284],
  3: [0.517, 0.436, 0.419, 0.284],
  4: [0.659, 0.599, 0.506, 0.361],
};

export function Ch1FailureChart(_props: WidgetProps) {
  const [type, setType] = useState<number>(1);
  const [metric, setMetric] = useState<'psnr' | 'lpips'>('psnr');
  const values = metric === 'psnr' ? PSNR[type] : LPIPS[type];
  const series = [1, 2, 3, 4].map((t) => metric === 'psnr' ? PSNR[t] : LPIPS[t]);
  const bestIndex = values.indexOf(metric === 'psnr' ? Math.max(...values) : Math.min(...values));
  const W = 980;
  const H = 400;
  const left = 58;
  const right = 22;
  const top = 46;
  const bottom = 56;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const domain = metric === 'psnr' ? [20, 32] : [0, 0.7];
  const y = (v: number) => top + plotH - ((v - domain[0]) / (domain[1] - domain[0])) * plotH;
  const xs = [0, 1, 2, 3].map((i) => left + (plotW / 8) * (i * 2 + 1));
  const ticks = metric === 'psnr' ? [20, 24, 28, 32] : [0, 0.2, 0.4, 0.6, 0.8].filter((v) => v <= domain[1]);
  const fmt = (v: number) => metric === 'psnr' ? v.toFixed(2) : v.toFixed(3);
  const best = METHODS[bestIndex];
  const rr = values[0];
  const bs = values[2];
  const bsg = values[3];
  const feedback = metric === 'psnr'
    ? type === 1
      ? `Type I：${best.key} 的 PSNR 最高（${fmt(values[bestIndex])} dB），双三次训练在这里领先。`
      : `Type ${type}：${best.key} 最高（${fmt(values[bestIndex])} dB）；RRDB 仅 ${fmt(rr)} dB，双三次训练掉点。`
    : type === 1
      ? `Type I：${best.key} 的 LPIPS 最低（${fmt(values[bestIndex])}），非双三次退化时排序会变。`
      : `Type ${type}：${best.key} 最低（${fmt(values[bestIndex])}）；BSRGAN ${fmt(bsg)}，RRDB ${fmt(rr)}。`;

  return (
    <div className="bsr-ch1-failure">
      <div className="bsr-ch1-chart">
        <div className="bsr-legend" aria-label="方法图例">
          {METHODS.map((m) => (
            <span key={m.key} className="bsr-legend-item">
              <i style={{ background: m.color }} />
              {m.key}
              <em>{m.note}</em>
            </span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`DIV2K4D 上四种方法的 ${metric === 'psnr' ? 'PSNR' : 'LPIPS'} 对比`}>
          <rect x={left + (type - 1) * (plotW / 4)} y={top} width={plotW / 4} height={plotH} fill="#eef3fb" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="#d7deea" strokeWidth="1" />
              <text x={left - 12} y={y(t) + 8} textAnchor="end" fontSize="24" fill="#68778f">{metric === 'psnr' ? t : t.toFixed(1)}</text>
            </g>
          ))}
          <line x1={left} x2={left} y1={top} y2={top + plotH} stroke="#9fb0c8" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <line x1={xs[i]} x2={xs[i]} y1={top} y2={top + plotH} stroke="#e8edf5" strokeWidth="1" strokeDasharray="4 8" />
              <text x={xs[i]} y={H - 18} textAnchor="middle" fontSize="24" fill={i + 1 === type ? '#27446e' : '#68778f'}>{TYPES[i].short}</text>
            </g>
          ))}
          {METHODS.map((m, mi) => (
            <g key={m.key}>
              <polyline
                points={xs.map((x, i) => `${x},${y(series[i][mi])}`).join(' ')}
                fill="none"
                stroke={m.color}
                strokeWidth={mi === bestIndex ? 5 : 3}
                strokeLinecap="round"
                opacity={0.9}
              />
              {xs.map((x, i) => (
                <circle key={i} cx={x} cy={y(series[i][mi])} r={i + 1 === type ? 9 : 6} fill="#fff" stroke={m.color} strokeWidth={i + 1 === type ? 5 : 3} />
              ))}
            </g>
          ))}
          {xs.map((x, i) => i + 1 === type && (
            <g key={`labels-${i}`}>
              {METHODS.map((m, mi) => (
                <text key={m.key} x={x + 12} y={y(values[mi]) - 10} fontSize="22" fill={m.color} fontWeight="700">{fmt(values[mi])}</text>
              ))}
            </g>
          ))}
        </svg>
      </div>
      <aside className="bsr-ch1-side">
        <div className="bsr-toggle-row" role="group" aria-label="指标">
          <button className={metric === 'psnr' ? 'is-on' : ''} aria-pressed={metric === 'psnr'} onClick={() => setMetric('psnr')}>PSNR ↑</button>
          <button className={metric === 'lpips' ? 'is-on' : ''} aria-pressed={metric === 'lpips'} onClick={() => setMetric('lpips')}>LPIPS ↓</button>
        </div>
        <div className="bsr-type-list" role="group" aria-label="退化类型">
          {TYPES.map((t) => (
            <button key={t.id} className={type === t.id ? 'is-on' : ''} aria-pressed={type === t.id} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bsr-problem-solution">
          <div className="bsr-problem"><span>既有问题：</span>RRDB/ESRGAN 按双三次训练，遇到真实退化掉点。</div>
          <div className="bsr-solution"><span>本文解法：</span>扩大算子家族并随机打乱，训练 BSRNet/BSRGAN。</div>
        </div>
        <p className={`bsr-feedback ${metric === 'psnr' ? 'is-blue' : 'is-orange'}`}>{feedback}</p>
        <p className="bsr-note">表 1；PSNR 在 Y 通道；LPIPS 越低越好。</p>
      </aside>
    </div>
  );
}
