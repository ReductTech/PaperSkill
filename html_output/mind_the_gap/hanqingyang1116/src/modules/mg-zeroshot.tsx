import React, { useState } from 'react';
import { C, PageFrame } from './studioKit';
import './studio.css';

// Table 2 全表（CIFAR-100 上做完类增量后，在三个独立集合上测零样本）
type Method = 'clip' | 'proof' | 'rapf' | 'clap' | 'moe' | 'magmax' | 'ours';
const ORDER: Method[] = ['clip', 'proof', 'rapf', 'clap', 'moe', 'magmax', 'ours'];
const DATA: Record<Method, { name: string; food: number; pets: number; in1k: number; avg: number; tag: string }> = {
  clip: { name: '原始 CLIP', food: 85.14, pets: 87.6, in1k: 64.44, avg: 79.06, tag: '未训练' },
  proof: { name: 'PROOF', food: 9.75, pets: 22.81, in1k: 11.18, avg: 14.58, tag: '回放' },
  rapf: { name: 'RAPF', food: 17.18, pets: 28.56, in1k: 15.2, avg: 20.31, tag: '回放' },
  clap: { name: 'CLAP', food: 80.82, pets: 74.68, in1k: 56.04, avg: 70.51, tag: '回放' },
  moe: { name: 'MOE4CL', food: 82.85, pets: 84.06, in1k: 66.02, avg: 77.64, tag: '回放' },
  magmax: { name: 'MagMax', food: 81.67, pets: 85.96, in1k: 66.44, avg: 78.02, tag: '回放' },
  ours: { name: 'MG-CLIP', food: 85.7, pets: 88.17, in1k: 67.29, avg: 80.39, tag: '无回放' },
};

/** p10：零样本还在不在——同一段录音拿去认没见过的集合（Table 2 全表，7 个方法）。 */
export function MgZeroshot() {
  const [m, setM] = useState<Method>('ours');
  const d = DATA[m];
  const tone = m === 'ours' ? 'ok' : m === 'clip' ? 'plain' : m === 'clap' || m === 'moe' || m === 'magmax' ? 'warn' : 'bad';
  const feedback =
    m === 'ours'
      ? '三个集合都不低于原始 CLIP（Avg 80.39，全表最高）。'
      : m === 'clip'
      ? '没做任何下游训练的参照：Avg 79.06。本方法 80.39 比它略高——所以 CLIP 不是上界。'
      : m === 'proof' || m === 'rapf'
      ? `回放方法在这三个集合上崩得最厉害（Avg ${d.avg.toFixed(2)}）：贴死下游就失去零样本。`
      : m === 'clap'
      ? 'CLAP 掉得比原模型多（70.51）：回放把表征往 CIFAR-100 上拉。'
      : `${d.name} 略低于原模型（Avg ${d.avg.toFixed(2)}）。`;

  // 画布 900×560；卡片 60..860 × 74..430；横轴 0–100%：220..830
  const L = 220;
  const R = 830;
  const x = (v: number) => L + (v / 100) * (R - L);

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`${d.name} 的零样本 Avg ${d.avg}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <text x={24} y={40} fontSize={21} fill={C.muted}>零样本 Avg（%）：只在 CIFAR-100 上做过类增量，再测没见过的集合</text>
          <rect x={60} y={62} width={800} height={368} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />

          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <path d={`M${x(v)} 96 V400`} stroke={C.line} strokeWidth={1} opacity={0.85} />
              <text x={x(v)} y={418} textAnchor="middle" fontSize={14} fill={C.muted}>{v}</text>
            </g>
          ))}

          {ORDER.map((k, i) => {
            const item = DATA[k];
            const active = k === m;
            const cy = 112 + i * 41;
            return (
              <g key={k} opacity={active ? 1 : 0.5}>
                <text x={200} y={cy + 6} textAnchor="end" fontSize={17} fill={active ? C.ink : C.muted} fontWeight={active ? 700 : 400}>
                  {item.name}
                </text>
                <path d={`M${L} ${cy} H${x(item.avg)}`} stroke={k === 'ours' ? C.green : C.muted} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
                <circle cx={x(item.avg)} cy={cy} r={active ? 9 : 7} fill={k === 'ours' ? C.green : k === 'clip' ? C.blue : C.muted} />
                <text x={x(item.avg) + 16} y={cy + 6} fontSize={17} fill={active ? C.ink : C.muted} fontWeight={active ? 700 : 400}>
                  {item.avg.toFixed(2)}
                </text>
              </g>
            );
          })}

          <text x={60} y={452} fontSize={15} fill={C.muted}>横轴为 Avg（三集合平均），越高越好；只测了这三个集合，不能外推到所有零样本任务</text>
        </svg>
      }
      side={
        <>
          <div className="studio-row">
            {ORDER.map((k) => (
              <button key={k} className={`studio-btn ${m === k ? 'is-on' : ''}`} onClick={() => setM(k)} aria-pressed={m === k}>
                {DATA[k].name}
              </button>
            ))}
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <table className="studio-table">
            <thead>
              <tr><th>方法</th><th>Food</th><th>Pets</th><th>IN-1K</th><th>Avg</th></tr>
            </thead>
            <tbody>
              {ORDER.map((k) => (
                <tr key={k} style={k === m ? { fontWeight: 700 } : undefined}>
                  <td>{DATA[k].name}</td>
                  <td>{DATA[k].food.toFixed(1)}</td>
                  <td>{DATA[k].pets.toFixed(1)}</td>
                  <td>{DATA[k].in1k.toFixed(1)}</td>
                  <td>{DATA[k].avg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
    />
  );
}
