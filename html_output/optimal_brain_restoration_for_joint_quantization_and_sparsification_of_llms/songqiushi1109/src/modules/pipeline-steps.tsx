import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback } from './obrKit';
import { SymbolHint } from '../components/SymbolHint';

// ch3：OBR 四步 pipeline。Ŵ = quant( prune( rotate(W) ) + ΔW^OBR )。
const BASE = [
  [6.2, 0.4, 3.1, -0.3, 2.2, -4.5, 0.6, 1.1],
  [1.5, 5.0, -0.5, 2.8, 0.2, 3.6, -1.4, 4.0],
];
const ROTATED = [
  [1.4, -1.1, 1.9, 0.9, 1.2, -1.6, 1.0, 1.3],
  [0.8, 1.7, -1.3, 1.5, 0.7, 1.1, -0.9, 1.6],
];
// 剪掉幅值最小的 4 个元素（下标按行展开）
const PRUNE_FLAT = [1, 3, 6, 12]; // 0.4, -0.3, 0.6, -0.5
const COMP = 0.9; // ΔW 补偿示意幅度

const STEPS = [
  { id: 0, label: '旋转 rotate', tone: 'purple' as const },
  { id: 1, label: '剪枝 prune', tone: 'red' as const },
  { id: 2, label: '加补偿 +ΔW', tone: 'green' as const },
  { id: 3, label: '量化 quant', tone: 'blue' as const },
];

function matrixAt(step: number): { rows: number[][]; states: string[][] } {
  const src = step === 0 ? BASE : ROTATED;
  const rows = src.map((r) => [...r]);
  const states = rows.map((r) => r.map(() => 'none'));
  if (step >= 1) {
    PRUNE_FLAT.forEach((fi) => {
      const r = Math.floor(fi / 8), c = fi % 8;
      rows[r][c] = 0;
      states[r][c] = 'red';
    });
  }
  if (step >= 2) {
    rows.forEach((r, ri) => r.forEach((v, ci) => {
      if (states[ri][ci] !== 'red') {
        rows[ri][ci] = v + COMP;
        states[ri][ci] = 'green';
      }
    }));
  }
  if (step >= 3) {
    rows.forEach((r, ri) => r.forEach((v, ci) => {
      if (states[ri][ci] !== 'red') {
        rows[ri][ci] = Math.round(v);
        states[ri][ci] = 'blue';
      }
    }));
  }
  return { rows, states };
}

const TIPS = [
  '先复用 QuaRot / SpinQuant / FlatQuant 的旋转，摊平 outlier，让“该剪哪本”更清楚。',
  '按幅值剪掉最不重要的一批权重，引入稀疏（默认 50%）。',
  '核心一步：把剪掉的权重信息以 ΔW 补偿加回未剪枝的元素上，同时兼顾剪枝与量化误差。',
  '最后量化到低比特码本，得到 W4A4KV4 + 稀疏的紧凑模型。',
];

export function PipelineSteps(_props: WidgetProps) {
  const [step, setStep] = useState(2);
  const { rows, states } = matrixAt(step);
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel">
        <div className="obr-heading">Ŵ = quant( prune( rotate(W) ) + ΔW )</div>
        <svg viewBox="0 0 720 360" width="720" height="360" role="img" aria-label="权重矩阵在四步 pipeline 中的变化">
          {rows.map((row, ri) =>
            row.map((v, ci) => {
              const s = states[ri][ci];
              const on = s !== 'none';
              const fill = on
                ? (s === 'red' ? '#c43f52' : s === 'green' ? '#228d5c' : '#27446e')
                : '#fbfcfe';
              const x = 60 + ci * 78, y = 50 + ri * 110, cell = 64;
              const txt = Math.abs(v) < 0.005 ? '0' : Number(v.toFixed(1)).toString();
              return (
                <g key={`${ri}-${ci}`}>
                  <rect x={x} y={y} width={cell} height={cell} rx={10} fill={fill}
                    stroke={on ? 'transparent' : '#d7deea'} strokeWidth={2} />
                  <text x={x + cell / 2} y={y + cell / 2 + 8} textAnchor="middle" fontSize={18}
                    fill={on ? '#ffffff' : '#68778f'} fontWeight={700}
                    fontFamily="Cascadia Code, Consolas, monospace">{txt}</text>
                  {s === 'green' && <text x={x + cell / 2} y={y - 6} textAnchor="middle" fontSize={15} fill="#228d5c">+Δ</text>}
                  {s === 'red' && <text x={x + cell / 2} y={y - 6} textAnchor="middle" fontSize={15} fill="#c43f52">×</text>}
                </g>
              );
            })
          )}
        </svg>
        <div className="obr-note">矩阵与补偿幅度为示意；真实补偿由闭式解逐行计算。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">四步走</div>
        <div className="obr-steps">
          {STEPS.map((s) => (
            <button key={s.id} type="button"
              className={`obr-step-btn ${step === s.id ? 'is-active' : ''} tone-${s.tone}`}
              onClick={() => setStep(s.id)}>
              <span>{s.id + 1}</span><b>{s.label}</b>
            </button>
          ))}
        </div>
        <p className="obr-body">{TIPS[step]}</p>
        <Feedback tone={step === 2 ? 'green' : 'blue'}>
          {step === 2
            ? '补偿 ΔW 同时吸收“剪枝误差 + 量化误差”，是 OBR 区别于 GPTQ / SparseGPT 的关键。'
            : `当前步骤：${STEPS[step].label}`}
        </Feedback>
        <p className="obr-body muted">
          <SymbolHint meaning="W：权重矩阵。"><i>W</i></SymbolHint>
          {' → '}
          <SymbolHint meaning="rotate：旋转变换，摊平 outlier。"><i>R</i>(<i>W</i>)</SymbolHint>
          {' → '}
          <SymbolHint meaning="prune：剪枝，引入稀疏。"><i>P</i>(·)</SymbolHint>
          {' → '}
          <SymbolHint meaning="ΔW：最优脑修复补偿项。">+Δ<i>W</i></SymbolHint>
          {' → '}
          <SymbolHint meaning="quant：量化到低比特。"><i>Q</i>(·)</SymbolHint>
        </p>
      </div>
    </div>
  );
}
