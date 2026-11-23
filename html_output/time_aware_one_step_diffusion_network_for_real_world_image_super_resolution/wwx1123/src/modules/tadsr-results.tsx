import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Metric = 'qalign' | 'psnr';
type Dataset = 'realsr' | 'dreal';
const METHODS = ['StableSR', 'DiffBIR', 'SeeSR', 'SinSR', 'S3Diff', 'OSEDiff', 'PisaSR', 'TSDSR', 'AdcSR', 'TADSR'];
const DATA: Record<Dataset, Record<Metric, Record<string, number>>> = {
  realsr: {
    qalign: { StableSR: 3.2767, DiffBIR: 3.6313, SeeSR: 3.7190, SinSR: 3.1889, S3Diff: 3.6638, OSEDiff: 3.6915, PisaSR: 3.6355, TSDSR: 3.7748, AdcSR: 3.7749, TADSR: 3.9477 },
    psnr: { StableSR: 24.645, DiffBIR: 24.240, SeeSR: 25.149, SinSR: 28.345, S3Diff: 25.183, OSEDiff: 25.148, PisaSR: 25.503, TSDSR: 23.404, AdcSR: 25.469, TADSR: 25.166 },
  },
  dreal: {
    qalign: { StableSR: 3.0614, DiffBIR: 3.6011, SeeSR: 3.5882, SinSR: 3.0982, S3Diff: 3.6148, OSEDiff: 3.5450, PisaSR: 3.5838, TSDSR: 3.6928, AdcSR: 3.6520, TADSR: 3.7491 },
    psnr: { StableSR: 28.030, DiffBIR: 25.929, SeeSR: 28.073, SinSR: 28.345, S3Diff: 27.539, OSEDiff: 27.915, PisaSR: 28.318, TSDSR: 26.200, AdcSR: 28.099, TADSR: 28.387 },
  },
};

export function TadsrResults(_: WidgetProps) {
  const [metric, setMetric] = useState<Metric>('qalign');
  const [dataset, setDataset] = useState<Dataset>('realsr');
  const values = DATA[dataset][metric];
  const rows = [...METHODS].sort((a, b) => values[b] - values[a]);
  const best = rows[0];
  const max = Math.max(...rows.map(m => values[m]));
  const start = metric === 'qalign' ? 2.9 : 23;
  const top = max + (max - start) * 0.06;
  const scale = (v: number) => 170 + ((v - start) / (top - start)) * 620;
  const fmt = (v: number) => metric === 'qalign' ? v.toFixed(4) : v.toFixed(3);
  const title = dataset === 'realsr' ? 'RealSR' : 'DrealSR';

  return (
    <div className="studio-page tadsr-results">
      <div className="studio-card tadsr-results-main">
        <div className="studio-row" style={{ justifyContent: 'flex-end' }}>
          <div className="studio-row">
            <button className={`studio-btn ${metric === 'qalign' ? 'is-on' : ''}`} onClick={() => setMetric('qalign')}>QALIGN ↑</button>
            <button className={`studio-btn ${metric === 'psnr' ? 'is-on' : ''}`} onClick={() => setMetric('psnr')}>PSNR ↑</button>
            <button className={`studio-btn ${dataset === 'realsr' ? 'is-orange' : ''}`} onClick={() => setDataset('realsr')}>RealSR</button>
            <button className={`studio-btn ${dataset === 'dreal' ? 'is-orange' : ''}`} onClick={() => setDataset('dreal')}>DrealSR</button>
          </div>
        </div>
        <div className="tadsr-results-chart">
          <svg viewBox="0 0 920 400" role="img" aria-label={`${title} 上 ${metric === 'qalign' ? 'QALIGN' : 'PSNR'} 的十种方法比较`}>
            <line x1="168" y1="20" x2="168" y2="384" stroke="#d7deea" strokeWidth="2" />
            {rows.map((m, i) => {
              const y = 24 + i * 36;
              const fill = m === 'TADSR' ? '#228d5c' : m === best ? '#f07e47' : '#b9c6d6';
              return <g key={m}>
                <text x="154" y={y + 23} textAnchor="end" className="studio-axis">{m}</text>
                <line x1="170" y1={y + 14} x2="806" y2={y + 14} stroke="#eef2f7" strokeWidth="2" />
                <circle cx={scale(values[m])} cy={y + 14} r={m === 'TADSR' ? 10 : 8} fill={fill} stroke="#fff" strokeWidth="3" />
                <text x={scale(values[m]) + 16} y={y + 22} className="studio-value">{fmt(values[m])}</text>
              </g>;
            })}
          </svg>
        </div>
        <p className="studio-caption">数据：Table 1，{title}，主表配置 tₛ=500。点位置按同一指标刻度；不跨数据集比绝对分数。</p>
      </div>
      <div className="tadsr-results-side">
        <div className="tadsr-results-strip">
          <img src="./images/face-4.png" alt="人脸修复示例" />
          <img src="./images/sign-4.png" alt="文字与图案修复示例" />
          <img src="./images/flower-4.png" alt="花卉修复示例" />
        </div>
        <div className="tadsr-results-callout">{metric === 'qalign' ? `QALIGN：TADSR ${fmt(values.TADSR)}，${best === 'TADSR' ? '全场最高' : `最高为 ${best}`}` : `PSNR：TADSR ${fmt(values.TADSR)}，最高为 ${best} ${fmt(values[best])}`}</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="studio-text">QALIGN 衡量感知质量；PSNR 衡量像素保真。TADSR 主要赢在无参考指标，PSNR 与其他一步方法同档。</p>
          <p className="studio-text">“SOTA”必须带数据集和指标：在 {title} 上，{metric === 'qalign' ? 'TADSR 的 QALIGN 领先' : `PSNR 第一是 ${best}`}。</p>
          <p className="studio-feedback is-paper">先读箭头方向，再读协议；不要把不同数据集或不同指标混在一张结论里。</p>
        </div>
      </div>
    </div>
  );
}
