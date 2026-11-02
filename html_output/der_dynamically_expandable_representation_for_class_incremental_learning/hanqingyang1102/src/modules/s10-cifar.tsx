import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Proto = 'B0' | 'B50';

const DATA: Record<Proto, { steps: number[]; methods: { name: string; v: number[]; s: number[] }[] }> = {
  B0: {
    steps: [5, 10, 20, 50],
    methods: [
      { name: 'iCaRL', v: [71.14, 65.27, 61.20, 56.08], s: [0.34, 1.02, 0.83, 0.83] },
      { name: 'UCIR', v: [62.77, 58.66, 58.17, 56.86], s: [0.82, 0.71, 0.30, 3.74] },
      { name: 'BiC', v: [73.10, 68.80, 66.48, 62.09], s: [0.55, 1.20, 0.32, 0.85] },
      { name: 'WA', v: [72.81, 69.46, 67.33, 64.32], s: [0.28, 0.29, 0.15, 0.28] },
      { name: 'PODNet', v: [66.70, 58.03, 53.97, 51.19], s: [0.64, 1.27, 0.85, 1.02] },
      { name: 'DER（本文）', v: [75.55, 74.64, 73.98, 72.05], s: [0.65, 0.28, 0.36, 0.55] },
    ],
  },
  B50: {
    steps: [2, 5, 10],
    methods: [
      { name: 'iCaRL', v: [71.33, 65.06, 58.59], s: [0.35, 0.53, 0.95] },
      { name: 'UCIR', v: [67.21, 64.28, 59.92], s: [0.35, 0.19, 2.40] },
      { name: 'BiC', v: [72.47, 66.62, 60.25], s: [0.99, 0.45, 0.34] },
      { name: 'WA', v: [71.43, 64.01, 57.86], s: [0.65, 1.62, 0.81] },
      { name: 'PODNet', v: [71.30, 67.25, 64.04], s: [0.46, 0.27, 0.43] },
      { name: 'DER（本文）', v: [74.57, 72.60, 72.45], s: [0.42, 0.78, 0.76] },
    ],
  },
};

export function S10Cifar(_props: WidgetProps) {
  const [proto, setProto] = useState<Proto>('B0');
  const table = DATA[proto];
  const [step, setStep] = useState(proto === 'B0' ? 50 : 10);
  const idx = Math.max(0, table.steps.indexOf(step));

  const X0 = 240, X1 = 1380, lo = 50, hi = 80;
  const x = (v: number) => X0 + ((v - lo) / (hi - lo)) * (X1 - X0);

  return (
    <div className="der-page">
      <div className="der-col" style={{ height: '100%', padding: '16px 28px', boxSizing: 'border-box', gap: 8 }}>
        <div className="der-row der-spread">
          <div className="der-row" style={{ gap: 12 }}>
            {(['B0', 'B50'] as Proto[]).map(p => (
              <button key={p} className={`der-chip ${proto === p ? 'is-on' : ''}`}
                onClick={() => { setProto(p); setStep(p === 'B0' ? 50 : 10); }} aria-pressed={proto === p}>
                CIFAR100-{p}
              </button>
            ))}
            <span className="der-note-sm">{`ResNet-18 · ${proto === 'B0' ? '从 0 类起步，记忆 2000 例' : '从 50 类起步，每类 20 例'}`}</span>
          </div>
          <div className="der-row" style={{ gap: 8 }}>
            {table.steps.map(n => (
              <button key={n} className={`der-chip ${step === n ? 'is-accent is-on' : ''}`}
                onClick={() => setStep(n)} aria-pressed={step === n}>{n} 步</button>
            ))}
          </div>
        </div>

        <svg viewBox="0 0 1450 400" style={{ width: '100%', flex: 1 }} role="img"
          aria-label={`CIFAR100-${proto} ${step} 步的平均增量准确率`}>
          {[50, 60, 70, 80].map(v => (
            <g key={v}>
              <line x1={x(v)} y1="26" x2={x(v)} y2="352" stroke="#ece2d1" strokeWidth="1.3" />
              <text x={x(v)} y="378" textAnchor="middle" fontSize="20" fill="#68778f">{v}%</text>
            </g>
          ))}

          {table.methods.map((m, i) => {
            const y = 40 + i * 52;
            const v = m.v[idx];
            const sd = m.s[idx];
            const ours = i === table.methods.length - 1;
            return (
              <g key={m.name}>
                <text x="220" y={y + 22} textAnchor="end" fontSize="23" fontWeight={ours ? 750 : 500}
                  fill={ours ? '#1b6b47' : '#3b4a61'}>{m.name}</text>
                <rect x={x(lo)} y={y} width={x(v) - x(lo)} height="30" rx="6"
                  fill={ours ? '#228d5c' : '#9fb6d4'} opacity={ours ? 1 : .78} />
                <line x1={x(v - sd)} y1={y + 15} x2={x(v + sd)} y2={y + 15} stroke="#21324a" strokeWidth="2.4" />
                <line x1={x(v - sd)} y1={y + 8} x2={x(v - sd)} y2={y + 22} stroke="#21324a" strokeWidth="2.4" />
                <line x1={x(v + sd)} y1={y + 8} x2={x(v + sd)} y2={y + 22} stroke="#21324a" strokeWidth="2.4" />
                <text x={x(v + sd) + 12} y={y + 22} fontSize="21" fontWeight="700"
                  fill={ours ? '#1b6b47' : '#3b4a61'}>{v.toFixed(2)}</text>
              </g>
            );
          })}
          <line x1={x(lo)} y1="26" x2={x(lo)} y2="352" stroke="#d7deea" strokeWidth="2" />
        </svg>

        <div className="der-row der-spread" style={{ borderTop: '1px solid #ece2d1', paddingTop: 8 }}>
          <span className="der-p">三次运行均值 ± 标准差；RPSNet 未报告 20/50 步，故不列入。</span>
          <span className="der-p der-good">{proto === 'B0' ? '50 步：72.05 vs WA 64.32（+7.73）' : '10 步：72.45 vs PODNet 64.04（+8.41）'}</span>
        </div>
      </div>
    </div>
  );
}
