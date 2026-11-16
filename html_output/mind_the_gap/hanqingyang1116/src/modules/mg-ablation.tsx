import React, { useState } from 'react';
import { C, PageFrame } from './studioKit';
import './studio.css';

// Table 3 的 Avg / Last 为实测；neg 只有 Table 5 给了 Base（都不用）与 Ours（都开），
// Table 5 的 0.1719/0.1718 分别属于原始 CLIP 与 Distill，不是“只保/只补”组合。
const ROWS: { mgp: boolean; mgc: boolean; avg: number; last: number; neg: number | null; tag: string }[] = [
  { mgp: false, mgc: false, avg: 84.3, last: 72.74, neg: 0.0579, tag: '都不用' },
  { mgp: false, mgc: true, avg: 85.1, last: 74.58, neg: null, tag: '只补' },
  { mgp: true, mgc: false, avg: 86.73, last: 76.86, neg: null, tag: '只保' },
  { mgp: true, mgc: true, avg: 87.31, last: 78.38, neg: 0.152, tag: '都开' },
];

/** p11：消融——保持（MGP）与补偿（MGC）各管什么（Table 3 实测；neg 仅 Base 与 Ours 有值）。 */
export function MgAblation() {
  const [mgp, setMgp] = useState(true);
  const [mgc, setMgc] = useState(true);
  const row = ROWS.find((r) => r.mgp === mgp && r.mgc === mgc)!;

  const tone = !mgp && !mgc ? 'bad' : 'ok';
  const feedback = !mgp && !mgc
    ? '基线：间隙被拉开（neg 0.0579，Table 5 的 Base），Last 72.74。'
    : mgp && !mgc
    ? '只保：Last 76.86，单独贡献更大；论文没有给这个组合的 neg。'
    : !mgp && mgc
    ? '只补：补得动，但基线间隙已经很大，补回来的有限——74.58。'
    : '都开：一个稳住间隙、一个补回能力，78.38（neg 0.1520，Table 5 的 Ours）。';

  // 画布 900×560；卡片 70..860 × 74..430；绘图区 y：70% 在 396，80% 在 166
  const B = 396;
  const TOP = 166;
  const y = (v: number) => B - ((v - 70) / 10) * (B - TOP);

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`MGP ${mgp ? '开' : '关'}、MGC ${mgc ? '开' : '关'}：Avg ${row.avg}，Last ${row.last}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x={70} y={74} width={790} height={376} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />
          <text x={92} y={104} fontSize={18} fill={C.muted}>Last 准确率（%）；四条柱子对应 MGP / MGC 的四种组合</text>

          {[70, 72, 74, 76, 78, 80].map((v) => (
            <g key={v}>
              <path d={`M92 ${y(v)} H840`} stroke={C.line} strokeWidth={1} />
              <text x={84} y={y(v) + 5} textAnchor="end" fontSize={15} fill={C.muted}>{v}</text>
            </g>
          ))}

          {ROWS.map((r, i) => {
            const active = r.mgp === mgp && r.mgc === mgc;
            return (
              <g key={r.tag} opacity={active ? 1 : 0.4}>
                <rect x={150 + i * 180} y={y(r.last)} width={86} height={B - y(r.last)} rx={6} fill={active ? C.green : C.muted} />
                <text x={193 + i * 180} y={y(r.last) - 8} textAnchor="middle" fontSize={17} fontWeight={active ? 700 : 400} fill={active ? C.ink : C.muted}>
                  {r.last.toFixed(2)}
                </text>
                <text x={193 + i * 180} y={418} textAnchor="middle" fontSize={16} fill={active ? C.ink : C.muted}>
                  {r.tag}
                </text>
                <text x={193 + i * 180} y={440} textAnchor="middle" fontSize={13} fill={C.muted}>
                  Avg {r.avg.toFixed(2)}
                </text>
              </g>
            );
          })}

          <text x={24} y={528} fontSize={20} fill={C.muted}>开关两个部件：看 Last 与 Avg 一起怎么变</text>
        </svg>
      }
      side={
        <>
          <div className="studio-row">
            <button className={`studio-btn ${mgp ? 'is-on' : ''}`} onClick={() => setMgp(!mgp)} aria-pressed={mgp}>
              MGP 保持 {mgp ? '开' : '关'}
            </button>
            <button className={`studio-btn ${mgc ? 'is-on' : ''}`} onClick={() => setMgc(!mgc)} aria-pressed={mgc}>
              MGC 补偿 {mgc ? '开' : '关'}
            </button>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <table className="studio-table">
            <thead>
              <tr><th>组合</th><th>Avg</th><th>Last</th><th>neg</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.tag} style={r.avg === row.avg ? { fontWeight: 700 } : undefined}>
                  <td>{r.tag}</td>
                  <td>{r.avg.toFixed(2)}</td>
                  <td>{r.last.toFixed(2)}</td>
                  <td>{r.neg == null ? '—' : r.neg.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="studio-src">
            Table 3 四行 Avg / Last 为实测（ImageNet-100，基线为每任务 10 epoch 朴素微调）。
            neg 只有 Table 5 给了「Base = 0.0579」与「Ours = 0.1520」；Table 5 的 0.1719 是原始 CLIP、0.1718 是 Distill，
            都不属于「只保/只补」组合，故标「—」。
          </div>
        </>
      }
    />
  );
}
