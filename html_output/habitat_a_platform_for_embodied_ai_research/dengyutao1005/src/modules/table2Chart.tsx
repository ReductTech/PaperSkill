import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Table 2 基线分组柱状图：传感器 × 数据集（Gibson/MP3D）× 指标（SPL/Succ）切换，Depth 高亮。
const ROWS = [
  { k: 'Blind', c: '#7c3aed', g: [0.42, 0.62], m: [0.25, 0.35] },
  { k: 'RGB', c: '#ea580c', g: [0.46, 0.64], m: [0.30, 0.42] },
  { k: 'Depth', c: '#16a34a', g: [0.79, 0.89], m: [0.54, 0.69] },
  { k: 'RGBD', c: '#dc2626', g: [0.70, 0.80], m: [0.42, 0.53] },
  { k: 'SLAM', c: '#6b7280', g: [0.51, 0.62], m: [0.39, 0.47] },
];
const W = 560, H = 300, padL = 40, padB = 32, padT = 16, padR = 14;
const MAX = 1.0;

export const Table2Chart: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<'SPL' | 'Succ'>('SPL');
  const [hover, setHover] = useState<{ r: number; c: number; v: number } | null>(null);
  const gW = (W - padL - padR) / ROWS.length;
  const bW = gW / 2 * 0.6;
  const yFor = (v: number) => padT + (H - padT - padB) * (1 - v / MAX);
  return (
    <div className="dvc">
      <div className="dvc-tools">
        <button className={`tgl ${metric === 'SPL' ? 'active' : ''}`} onClick={() => setMetric('SPL')}>SPL</button>
        <button className={`tgl ${metric === 'Succ' ? 'active' : ''}`} onClick={() => setMetric('Succ')}>Succ</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="dvc-svg" role="img" aria-label="Table 2 基线">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={yFor(v)} y2={yFor(v)} stroke="#eef1f5" />
            <text x={padL - 6} y={yFor(v) + 4} textAnchor="end" fontSize="10" fill="#9aa5b1">{v.toFixed(1)}</text>
          </g>
        ))}
        {ROWS.map((r, ri) => {
          const vals = metric === 'SPL' ? [r.g[0], r.m[0]] : [r.g[1], r.m[1]];
          return (
            <g key={r.k}>
              {[0, 1].map((ci) => {
                const x = padL + ri * gW + ci * (gW / 2) + (gW / 2 - bW) / 2;
                const y = yFor(vals[ci]);
                const isH = hover && hover.r === ri && hover.c === ci;
                return (
                  <rect key={ci} x={x} y={y} width={bW} height={H - padT - padB - (y - padT)}
                    fill={ci === 0 ? r.c : '#1f3a5f'} opacity={r.k === 'Depth' ? 1 : 0.85} rx={2}
                    stroke={isH ? '#21324a' : 'none'} strokeWidth={isH ? 2 : 0}
                    onMouseEnter={() => setHover({ r: ri, c: ci, v: vals[ci] })}
                    onMouseLeave={() => setHover(null)}>
                    <title>{r.k} / {ci === 0 ? 'Gibson' : 'MP3D'}：{vals[ci].toFixed(2)}</title>
                  </rect>
                );
              })}
              <text x={padL + ri * gW + gW / 2} y={H - 10} textAnchor="middle" fontSize="12" fontWeight={r.k === 'Depth' ? 700 : 400} fill="#374151">{r.k}</text>
            </g>
          );
        })}
        {hover ? (
          <text x={padL} y={padT - 4} fontSize="13" fontWeight="700" fill="#21324a">
            {ROWS[hover.r].k} / {hover.c === 0 ? 'Gibson' : 'MP3D'}：{metric} {hover.v.toFixed(2)}
          </text>
        ) : null}
      </svg>
      <div className="dvc-legend">
        <span style={{ color: '#2b4a6f' }}>■ Gibson</span>
        <span style={{ color: '#1f3a5f' }}>■ MP3D</span>
      </div>
      <div className="feedback good">
        数据来源：Table 2, §5。Depth RL(PPO) 最优（Gibson SPL 0.79 / Succ 0.89）；SLAM 作为基线 0.51/0.39。
      </div>
    </div>
  );
};

export default Table2Chart;
