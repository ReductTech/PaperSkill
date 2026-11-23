import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Metric = 'psnr' | 'musiq' | 'clipiqa' | 'topiq';
type Dataset = 'realsr' | 'dreal';
const METHODS = ['Baseline', 'w/o TAE', 'w/o TAVSD', 'Full'];
const DATA: Record<Dataset, Record<Metric, number[]>> = {
  realsr: {
    psnr: [24.39, 24.89, 24.84, 25.16],
    musiq: [70.22, 70.08, 70.96, 71.18],
    clipiqa: [.6751, .6857, .6930, .7283],
    topiq: [.6391, .6466, .6553, .7082],
  },
  dreal: {
    psnr: [27.45, 27.95, 28.03, 28.39],
    musiq: [65.90, 65.95, 66.95, 67.02],
    clipiqa: [.6887, .7030, .7015, .7398],
    topiq: [.6275, .6396, .6373, .6758],
  },
};
const LABEL: Record<Metric, string> = { psnr: 'PSNR ↑', musiq: 'MUSIQ ↑', clipiqa: 'CLIPIQA ↑', topiq: 'TOPIQ ↑' };

export function TadsrAblation(_: WidgetProps) {
  const [metric, setMetric] = useState<Metric>('psnr');
  const [dataset, setDataset] = useState<Dataset>('realsr');
  const vals = DATA[dataset][metric];
  const max = Math.max(...vals), min = Math.min(...vals);
  const floor = metric === 'psnr' ? 23.5 : metric === 'musiq' ? 64 : metric === 'clipiqa' ? 0.62 : 0.60;
  const top = metric === 'psnr' ? 25.6 : metric === 'musiq' ? 71.8 : metric === 'clipiqa' ? 0.75 : 0.72;
  const y = (v: number) => 246 - ((v - floor) / (top - floor)) * 196;
  const fmt = (v: number) => metric === 'psnr' ? v.toFixed(2) : metric === 'musiq' ? v.toFixed(2) : v.toFixed(4);
  const name = dataset === 'realsr' ? 'RealSR' : 'DrealSR';

  return (
    <div className="studio-page tadsr-ablation">
      <div className="tadsr-ablation-main">
        <img src="./images/fig7_ablation.png" alt="论文 Fig.7：去掉 TAE 或 TAVSD 后鹦鹉修复结果的视觉对比" />
        <div className="studio-card tadsr-ablation-chart" style={{ padding: '8px 10px' }}>
          <svg viewBox="0 0 860 300" role="img" aria-label={`${name} 上 ${LABEL[metric]} 的消融比较`}>
            <line x1="70" y1="254" x2="830" y2="254" stroke="#d7deea" strokeWidth="2" />
            <line x1="70" y1="34" x2="70" y2="254" stroke="#d7deea" strokeWidth="2" />
            {[0, 1, 2, 3, 4].map(k => {
              const v = floor + (top - floor) * k / 4;
              return <g key={k}><line x1="70" y1={y(v)} x2="830" y2={y(v)} stroke="#eef2f7" strokeWidth="1" /><text x="62" y={y(v) + 8} textAnchor="end" className="studio-axis">{metric === 'psnr' || metric === 'musiq' ? v.toFixed(1) : v.toFixed(2)}</text></g>;
            })}
            {vals.map((v, i) => {
              const x = 132 + i * 178;
              const h = 254 - y(v);
              const color = i === 3 ? '#228d5c' : i === 0 ? '#f07e47' : '#7c3aed';
              return <g key={METHODS[i]}>
                <line x1={x + 46} y1="254" x2={x + 46} y2={y(v)} stroke={color} strokeWidth="4" opacity=".5" />
                <circle cx={x + 46} cy={y(v)} r="11" fill={color} stroke="#fff" strokeWidth="3" />
                <text x={x + 46} y={y(v) - 18} textAnchor="middle" className="studio-value">{fmt(v)}</text>
                <text x={x + 46} y="278" textAnchor="middle" className="studio-axis">{METHODS[i]}</text>
              </g>;
            })}
          </svg>
        </div>
      </div>
      <div className="tadsr-ablation-side">
        <p className="studio-heading">消融：TAE 与 TAVSD 都不能少</p>
        <div className="studio-row">
          <button className={`studio-btn ${dataset === 'realsr' ? 'is-orange' : ''}`} onClick={() => setDataset('realsr')}>RealSR</button>
          <button className={`studio-btn ${dataset === 'dreal' ? 'is-orange' : ''}`} onClick={() => setDataset('dreal')}>DrealSR</button>
        </div>
        <div className="studio-row">
          {(['psnr', 'musiq', 'clipiqa', 'topiq'] as Metric[]).map(m => <button key={m} className={`studio-btn ${metric === m ? 'is-on' : ''}`} onClick={() => setMetric(m)}>{LABEL[m].replace(' ↑', '')}</button>)}
        </div>
        <div className="studio-card tadsr-ablation-defs">
          <p><b>Baseline：</b>原 VAE 编码器 + 普通 VSD。</p>
          <p><b>w/o TAE：</b>去掉时间感知编码器，档位不再改写底稿。</p>
          <p><b>w/o TAVSD：</b>去掉时间步映射，老师档位与学生脱钩。</p>
          <p><b>Full：</b>TAE + TAVSD，即 TADSR。</p>
        </div>
        <p className="studio-feedback is-good">Table 2：Full 在所列四项指标上均为最高；两个部件各有贡献。</p>
        <p className="studio-caption">Fig.7 为定性对比；点图来自 Table 2。只做同数据集、同指标比较。</p>
      </div>
    </div>
  );
}
