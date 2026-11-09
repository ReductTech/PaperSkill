import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const METHODS = ['RRDB', 'IKC', 'ESRGAN', 'FSSR-DPED', 'FSSR-JPEG', 'RealSR-DPED', 'RealSR-JPEG', 'BSRNet', 'BSRGAN'];
const SHORT: Record<string, string> = {
  'FSSR-DPED': 'FSSR-DPED',
  'FSSR-JPEG': 'FSSR-JPEG',
  'RealSR-DPED': 'RealSR-DPED',
  'RealSR-JPEG': 'RealSR-JPEG',
};
const PSNR: Record<number, number[]> = {
  1: [30.89, 29.95, 28.16, 24.55, 22.71, 21.72, 27.35, 29.07, 27.30],
  2: [25.66, 27.35, 25.56, 25.81, 25.33, 26.29, 25.36, 27.76, 26.26],
  3: [26.70, 26.72, 26.21, 25.83, 23.25, 22.82, 26.72, 27.59, 26.28],
  4: [24.03, 24.01, 23.68, 23.62, 22.40, 22.97, 23.85, 25.67, 24.58],
};
const LPIPS: Record<number, number[]> = {
  1: [0.254, 0.263, 0.115, 0.240, 0.364, 0.312, 0.213, 0.331, 0.236],
  2: [0.542, 0.392, 0.526, 0.460, 0.399, 0.263, 0.479, 0.397, 0.284],
  3: [0.517, 0.504, 0.436, 0.392, 0.376, 0.379, 0.360, 0.419, 0.284],
  4: [0.659, 0.641, 0.599, 0.589, 0.597, 0.528, 0.589, 0.506, 0.361],
};
const TYPES = [
  { id: 1, label: 'I 双三次', short: 'Type I 双三次' },
  { id: 2, label: 'II 各向异性+最近邻×4', short: 'Type II' },
  { id: 3, label: 'III 两段下采样+JPEG', short: 'Type III' },
  { id: 4, label: 'IV 本文退化', short: 'Type IV 本文退化' },
];

export function Ch4Div2k4d(_props: WidgetProps) {
  const [type, setType] = useState(4);
  const [metric, setMetric] = useState<'psnr' | 'lpips'>('psnr');
  const values = metric === 'psnr' ? PSNR[type] : LPIPS[type];
  const best = metric === 'psnr' ? Math.max(...values) : Math.min(...values);
  const bestIndex = values.indexOf(best);
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => metric === 'psnr' ? b.value - a.value : a.value - b.value);
  const secondIndex = sorted[1].index;
  const max = metric === 'psnr' ? 32 : 0.7;
  const fmt = (value: number) => metric === 'psnr' ? value.toFixed(2) : value.toFixed(3);
  const typeName = TYPES[type - 1].short;
  const takeaway = type === 1
    ? `Type I 上双三次训练的 ${METHODS[bestIndex]} 领先；${METHODS[7]} 与 ${METHODS[8]} 并不是第一。`
    : metric === 'psnr'
      ? `${typeName}：${METHODS[bestIndex]} 的 PSNR 最高（${fmt(best)} dB），${METHODS[secondIndex]} 第二。`
      : `${typeName}：${METHODS[bestIndex]} 的 LPIPS 最低（${fmt(best)}），${METHODS[secondIndex]} 第二。`;

  return (
    <div className="bsr-ch4-div2k4d">
      <section className="bsr-div-chart">
        <div className="bsr-panel-head"><span>{typeName}</span><b>{metric === 'psnr' ? 'PSNR (dB) ↑' : 'LPIPS ↓'}</b></div>
        <div className="bsr-hbars">
          {METHODS.map((method, index) => (
            <div key={method} className={`bsr-hbar ${index === bestIndex ? 'is-best' : index === secondIndex ? 'is-second' : ''} ${method === 'BSRGAN' ? 'is-ours' : ''}`}>
              <span className="bsr-hbar-label">{SHORT[method] || method}</span>
              <div className="bsr-hbar-track">
                <i style={{ width: `${(values[index] / max) * 100}%` }} />
              </div>
              <b>{fmt(values[index])}</b>
            </div>
          ))}
        </div>
        <div className="bsr-axis"><span>0</span><span>{metric === 'psnr' ? '16' : '0.35'}</span><span>{metric === 'psnr' ? '32' : '0.70'}</span></div>
        <p className="bsr-note">数值取自论文表 1；PSNR 在 Y 通道计算，LPIPS 越低越好。柱条从 0 起，最优绿色、次优蓝色；论文未报告误差条。</p>
      </section>
      <aside className="bsr-div-side">
        <div className="bsr-toggle-row" role="group" aria-label="指标">
          <button className={metric === 'psnr' ? 'is-on' : ''} aria-pressed={metric === 'psnr'} onClick={() => setMetric('psnr')}>PSNR ↑</button>
          <button className={metric === 'lpips' ? 'is-on' : ''} aria-pressed={metric === 'lpips'} onClick={() => setMetric('lpips')}>LPIPS ↓</button>
        </div>
        <div className="bsr-type-list" role="group" aria-label="退化类型">
          {TYPES.map((t) => <button key={t.id} className={type === t.id ? 'is-on' : ''} aria-pressed={type === t.id} onClick={() => setType(t.id)}>{t.label}</button>)}
        </div>
        <div className={`bsr-best-card ${metric === 'psnr' ? 'is-blue' : 'is-green'}`}>
          <span>当前最优</span>
          <b>{METHODS[bestIndex]}</b>
          <em>{fmt(best)} {metric === 'psnr' ? 'dB' : ''}</em>
        </div>
        <p className="bsr-feedback is-blue">{takeaway}</p>
        <p className="bsr-note">先固定类型，再在同一指标内比较；不要混合 PSNR 与 LPIPS。</p>
      </aside>
    </div>
  );
}
