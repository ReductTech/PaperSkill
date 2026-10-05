import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Table 1：Habitat-Sim fps 分组柱状图（SVG，零外部库）。悬停显示精确值 + 数据表视图切换。
const DATA = [
  { label: '128', r: [4093, 10592, 2050, 5223] },
  { label: '256', r: [1987, 3574, 1042, 1774] },
  { label: '512', r: [848, 2629, 423, 1348] },
];
const SERIES = ['RGB · 1进程', 'RGB · 5进程', 'RGB+depth · 1进程', 'RGB+depth · 5进程'];
const COLORS = ['#2563eb', '#1d4ed8', '#ea580c', '#c2410c'];
const MAX = 12000;

export const Table1Chart: React.FC<WidgetProps> = () => {
  const [hover, setHover] = useState<{ g: number; s: number } | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const W = 640, H = 320, padL = 56, padB = 34, padT = 16, padR = 12;
  const gW = (W - padL - padR) / DATA.length;
  const bW = gW / 4 * 0.62;
  const yFor = (v: number) => padT + (H - padT - padB) * (1 - v / MAX);

  return (
    <div className="dvc">
      <div className="dvc-tools">
        <button className={`tgl ${view === 'chart' ? 'active' : ''}`} onClick={() => setView('chart')}>图表</button>
        <button className={`tgl ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>数据表</button>
      </div>
      {view === 'chart' ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="dvc-svg" role="img" aria-label="Table 1 Habitat-Sim fps">
          {[0, 4000, 8000, 12000].map((v) => (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={yFor(v)} y2={yFor(v)} stroke="#e5e7eb" />
              <text x={padL - 8} y={yFor(v) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{v.toLocaleString()}</text>
            </g>
          ))}
          {DATA.map((g, gi) => (
            <g key={g.label}>
              {g.r.map((v, si) => {
                const x = padL + gi * gW + si * (gW / 4) + (gW / 4 - bW) / 2;
                const y = yFor(v);
                return (
                  <rect
                    key={si}
                    x={x}
                    y={y}
                    width={bW}
                    height={H - padT - padB - (y - padT)}
                    fill={COLORS[si]}
                    rx={2}
                    onMouseEnter={() => setHover({ g: gi, s: si })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>{SERIES[si]} / {g.label}：{v.toLocaleString()} fps</title>
                  </rect>
                );
              })}
              <text x={padL + gi * gW + gW / 2} y={H - 10} textAnchor="middle" fontSize="12" fill="#374151">{g.label}</text>
            </g>
          ))}
          <text x={(W + padL) / 2} y={H - 2} textAnchor="middle" fontSize="12" fill="#4b5563">分辨率</text>
          <text x={18} y={H / 2} fontSize="12" fill="#4b5563" transform="rotate(-90 18 160)">fps</text>
          <g>
            {SERIES.map((s, i) => {
              const x = padL + 10 + i * 0; // legend below via rects in footer
              void x;
              return null;
            })}
          </g>
          {hover ? (
            <text x={padL} y={padT - 4} fontSize="13" fontWeight="700" fill={COLORS[hover.s]}>
              {SERIES[hover.s]} / {DATA[hover.g].label}：{DATA[hover.g].r[hover.s].toLocaleString()} fps
            </text>
          ) : null}
        </svg>
      ) : (
        <table className="dvc-table">
          <thead><tr><th>配置</th>{DATA.map((g) => <th key={g.label}>{g.label}</th>)}</tr></thead>
          <tbody>
            {SERIES.map((s, si) => (
              <tr key={s}><td>{s}</td>{DATA.map((g, gi) => <td key={gi}>{g.r[si].toLocaleString()}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="dvc-legend">
        {SERIES.map((s, i) => (
          <span key={s} className="lg-item" style={{ color: COLORS[i] }}>■ {s}</span>
        ))}
      </div>
      <div className="feedback good">
        数据来源：Table 1, §3。RGB 单进程 128 分辨率 4,093 fps，五进程 10,592 fps——比旧模拟器快 2–3 个数量级。
      </div>
    </div>
  );
};

export default Table1Chart;
