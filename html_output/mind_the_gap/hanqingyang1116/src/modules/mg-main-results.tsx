import React, { useState } from 'react';
import { C, PageFrame } from './studioKit';
import './studio.css';

// Table 1 的 Exemplar 列是合并单元格：DR = PROOF/CLAP，FR = SLCA/RAPF，NR = L2P++ … MagMax 以及本文
const DATA: Record<string, { rapf: number; clap: number; magmax: number; ours: number }> = {
  'CIFAR-100': { rapf: 79.04, clap: 78.21, magmax: 79.0, ours: 80.57 },
  'ImageNet-R': { rapf: 80.28, clap: 79.98, magmax: 80.85, ours: 82.67 },
  'ImageNet-100': { rapf: 80.23, clap: 79.16, magmax: 75.92, ours: 78.38 },
  'ImageNet-1K': { rapf: 72.58, clap: 73.19, magmax: 71.31, ours: 73.68 },
  VTAB: { rapf: 82.31, clap: 89.67, magmax: 53.9, ours: 91.53 },
};
const NAMES = Object.keys(DATA);

/** p9：主结果（Table 1 的 Last 列）——五组、四法；MagMax 与本文同为无回放。 */
export function MgMainResults() {
  const [pick, setPick] = useState('ImageNet-100');
  const row = DATA[pick];
  const best = Math.max(row.rapf, row.clap, row.magmax, row.ours);
  const oursWin = row.ours >= best;
  const tone = oursWin ? 'ok' : 'warn';
  const feedback = oursWin
    ? `${pick}：Last ${row.ours.toFixed(2)}，四个方法里最高。`
    : `${pick}：Last ${row.ours.toFixed(2)}，低于用回放的 RAPF / CLAP；仍高于同为无回放的 MagMax。`;

  const y = (v: number) => 420 - ((v - 45) / 50) * 290;

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`${pick} 的 Last 准确率对比`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <text x={24} y={40} fontSize={21} fill={C.muted}>Last 准确率（%），越高越好；点的高度只由数值决定（纵轴从 45% 起）</text>
          <rect x={60} y={62} width={810} height={368} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />
          {[50, 60, 70, 80, 90].map((v) => (
            <g key={v}>
              <path d={`M70 ${y(v)} H862`} stroke={C.line} strokeWidth={1} opacity={0.8} />
              <text x={62} y={y(v) + 6} textAnchor="end" fontSize={16} fill={C.muted}>{v}</text>
            </g>
          ))}

          {NAMES.map((name, gi) => {
            const gx = 100 + gi * 152;
            const vals = [DATA[name].rapf, DATA[name].clap, DATA[name].magmax, DATA[name].ours];
            const active = pick === name;
            return (
              <g key={name} opacity={active ? 1 : 0.4}>
                {vals.map((v, i) => (
                  <g key={i}>
                    {/* 竖向引导线只到点为止，不表示面积 */}
                    <path d={`M${gx + i * 34 + 9} ${y(v)} V420`} stroke={i === 3 ? C.green : C.muted} strokeWidth={1.5} strokeDasharray="4 6" opacity={0.45} />
                    {i === 2 ? (
                      <circle cx={gx + i * 34 + 9} cy={y(v)} r={8} fill="#ffffff" stroke={C.muted} strokeWidth={3} />
                    ) : (
                      <circle cx={gx + i * 34 + 9} cy={y(v)} r={8} fill={i === 3 ? C.green : C.muted} />
                    )}
                  </g>
                ))}
                <text x={gx + 60} y={444} textAnchor="middle" fontSize={16} fill={active ? C.ink : C.muted} fontWeight={active ? 700 : 400}>
                  {name}
                </text>
              </g>
            );
          })}

          <g>
            <circle cx={98} cy={474} r={8} fill={C.muted} />
            <text x={114} y={480} fontSize={16} fill={C.muted}>RAPF / CLAP（用回放：FR / DR）</text>
            <circle cx={98} cy={500} r={8} fill="#ffffff" stroke={C.muted} strokeWidth={3} />
            <text x={114} y={506} fontSize={16} fill={C.muted}>MagMax（无回放，NR）</text>
            <circle cx={470} cy={474} r={8} fill={C.green} />
            <text x={486} y={480} fontSize={16} fill={C.muted}>MG-CLIP（无回放，NR）</text>
            <text x={470} y={506} fontSize={16} fill={C.muted}>每组自左向右：RAPF / CLAP / MagMax / MG-CLIP</text>
          </g>
          <text x={24} y={540} fontSize={19} fill={C.muted}>选一个数据集，看这一组谁最高</text>
        </svg>
      }
      side={
        <>
          <div className="studio-row">
            {NAMES.map((n) => (
              <button key={n} className={`studio-btn ${pick === n ? 'is-on' : ''}`} onClick={() => setPick(n)} aria-pressed={pick === n}>
                {n.replace('ImageNet', 'IN')}
              </button>
            ))}
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <table className="studio-table">
            <thead>
              <tr><th>方法</th><th>回放</th><th>Last</th></tr>
            </thead>
            <tbody>
              <tr><td>RAPF</td><td>FR</td><td>{row.rapf.toFixed(2)}</td></tr>
              <tr><td>CLAP</td><td>DR</td><td>{row.clap.toFixed(2)}</td></tr>
              <tr><td>MagMax</td><td>无</td><td>{row.magmax.toFixed(2)}</td></tr>
              <tr><td><b>MG-CLIP</b></td><td><b>无</b></td><td><b>{row.ours.toFixed(2)}</b></td></tr>
            </tbody>
          </table>
          <div className="studio-src">
            Table 1 的 Last 列，ViT-B/16、三种类顺序平均；除 VTAB（5 任务）外均为 10 任务。
            Exemplar 列按合并单元格读：DR = PROOF/CLAP，FR = SLCA/RAPF，NR 覆盖 L2P++ 至 MagMax 以及本文。
          </div>
        </>
      }
    />
  );
}
