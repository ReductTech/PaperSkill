import React, { useState } from 'react';
import { C, fmt } from './tailorKit';
import './tailor.css';

type Row = { name: string; v: number };
type DS = {
  settings: string[];
  ours: { Last: number[]; Avg: number[] };
  best: { Last: Row[]; Avg: Row[] };
};

const DATA: Record<string, DS> = {
  CIFAR100: {
    settings: ['B0 Inc5', 'B0 Inc10', 'B0 Inc20', 'B50 Inc5', 'B50 Inc10'],
    ours: { Last: [79.26, 79.04, 79.24, 79.64, 79.36], Avg: [86.87, 86.19, 85.73, 85.03, 84.73] },
    best: {
      Last: [
        { name: 'PROOF', v: 76.13 },
        { name: 'PROOF', v: 76.29 },
        { name: 'DualPrompt', v: 77.47 },
        { name: 'ADAM', v: 76.94 },
        { name: 'SLCA', v: 79.92 },
      ],
      Avg: [
        { name: 'PROOF', v: 85.12 },
        { name: 'PROOF', v: 84.88 },
        { name: 'SLCA', v: 85.25 },
        { name: 'SLCA', v: 86.99 },
        { name: 'SLCA', v: 86.55 },
      ],
    },
  },
  ImageNet100: {
    settings: ['B0 Inc5', 'B0 Inc10', 'B0 Inc20', 'B50 Inc5', 'B50 Inc10'],
    ours: { Last: [79.87, 80.23, 80.1, 80.16, 80.22], Avg: [87.59, 87.51, 86.72, 86.53, 86.36] },
    best: {
      Last: [
        { name: 'ADAM', v: 75.72 },
        { name: 'ADAM', v: 76.4 },
        { name: 'ADAM', v: 77.08 },
        { name: 'ADAM', v: 78.58 },
        { name: 'ADAM', v: 78.58 },
      ],
      Avg: [
        { name: 'PROOF', v: 86.92 },
        { name: 'ADAM', v: 85.84 },
        { name: 'ADAM', v: 85.85 },
        { name: 'SLCA', v: 86.47 },
        { name: 'SLCA', v: 86.26 },
      ],
    },
  },
  ImageNetR: {
    settings: ['B0 Inc10', 'B0 Inc20', 'B0 Inc40', 'B100 Inc10', 'B100 Inc20'],
    ours: { Last: [79.62, 80.28, 80.18, 80.04, 80.35], Avg: [86.28, 85.58, 84.69, 84.12, 83.99] },
    best: {
      Last: [
        { name: 'PROOF', v: 77.25 },
        { name: 'PROOF', v: 77.05 },
        { name: 'SLCA', v: 79.1 },
        { name: 'SLCA', v: 78.57 },
        { name: 'SLCA', v: 79.67 },
      ],
      Avg: [
        { name: 'PROOF', v: 82.69 },
        { name: 'PROOF', v: 82.83 },
        { name: 'DualPrompt', v: 83.77 },
        { name: 'SLCA', v: 82.85 },
        { name: 'SLCA', v: 83.5 },
      ],
    },
  },
};

const NAMES: Record<string, string> = { CIFAR100: 'CIFAR100', ImageNet100: 'ImageNet100', ImageNetR: 'ImageNet-R' };

/** p10：三个数据集的实测 Last/Avg，与“该设置下最强的对比方法”对照。 */
export function RapfResults() {
  const [ds, setDs] = useState<keyof typeof DATA>('CIFAR100');
  const [metric, setMetric] = useState<'Last' | 'Avg'>('Last');

  const d = DATA[ds];
  const ours = d.ours[metric];
  const best = d.best[metric];
  const lo = Math.min(...ours, ...best.map((b) => b.v)) - 4;
  const hi = Math.max(...ours, ...best.map((b) => b.v)) + 2;
  const y = (v: number) => 400 - ((v - lo) / (hi - lo)) * 300;

  const wins = ours.filter((v, i) => v > best[i].v).length;

  return (
    <div className="tailor-page is-wide">
      <div className="tailor-row" style={{ marginBottom: 6 }}>
        {(Object.keys(DATA) as (keyof typeof DATA)[]).map((k) => (
          <button key={k} className={`tailor-btn ${ds === k ? 'is-on' : ''}`} onClick={() => setDs(k)}>
            {NAMES[k]}
          </button>
        ))}
        <span style={{ width: 24 }} />
        {(['Last', 'Avg'] as const).map((m) => (
          <button key={m} className={`tailor-btn ${metric === m ? 'is-accent is-on' : ''}`} onClick={() => setMetric(m)}>
            {m === 'Last' ? '末次精度 Last' : '平均精度 Avg'}
          </button>
        ))}
        <span className="tailor-chip" style={{ marginLeft: 'auto' }}>
          {wins}/5 个设置领先
        </span>
      </div>

      <svg viewBox="0 0 1420 460" role="img" aria-label={`${NAMES[ds]} ${metric} 对比`}>
        <rect x="0" y="0" width="1420" height="460" fill={C.bg} />
        <path d="M90 400 H1370" stroke={C.line} strokeWidth={2} />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = lo + (hi - lo) * f;
          return (
            <g key={f}>
              <path d={`M90 ${y(v)} H1370`} stroke={C.line} strokeWidth={1} opacity={0.6} strokeDasharray="6 8" />
              <text x={82} y={y(v) + 6} textAnchor="end" fontSize={18} fill={C.muted}>
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {d.settings.map((s, i) => {
          const gx = 150 + i * 240;
          const oy = y(ours[i]);
          const by = y(best[i].v);
          const better = ours[i] > best[i].v;
          return (
            <g key={s}>
              <rect x={gx - 24} y={oy} width={54} height={400 - oy} rx={6} fill={C.green} opacity={0.9} />
              <text x={gx + 3} y={oy - 10} textAnchor="middle" fontSize={19} fill={C.green} fontWeight={700}>
                {fmt(ours[i], 1)}
              </text>
              <rect x={gx + 40} y={by} width={54} height={400 - by} rx={6} fill={C.blue} opacity={0.55} />
              <text x={gx + 67} y={by - 10} textAnchor="middle" fontSize={19} fill={C.blue}>
                {fmt(best[i].v, 1)}
              </text>
              <text x={gx + 35} y={432} textAnchor="middle" fontSize={19} fill={C.ink}>
                {s}
              </text>
              <text x={gx + 35} y={456} textAnchor="middle" fontSize={16} fill={C.muted}>
                {best[i].name}
              </text>
              {!better ? (
                <text x={gx + 35} y={by - 36} textAnchor="middle" fontSize={16} fill={C.red}>
                  未领先
                </text>
              ) : null}
            </g>
          );
        })}

        <text x={90} y={40} fontSize={20} fill={C.muted}>
          {NAME_LABEL(metric)}（%），越高越好；蓝柱＝七个基线中的最高值，名称见柱下
        </text>
      </svg>
    </div>
  );
}

function NAME_LABEL(m: 'Last' | 'Avg') {
  return m === 'Last' ? '末次精度 Last' : '平均精度 Avg';
}
