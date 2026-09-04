import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, localPoint, usePanelWidth, WavePath } from './omni-interaction-kit';

type Trial = {
  id: string;
  subject: string;
  label: 0 | 1;
  phase: number;
  p1: number;
  p2: number;
};

type Counts = {
  tp: number;
  fn: number;
  tn: number;
  fp: number;
  sensitivity: number | null;
  specificity: number | null;
  balancedAccuracy: number | null;
};

const BLUE = '#245d87';
const PURPLE = '#6756a3';
const GREEN = '#27815f';
const RED = '#bd4051';
const ORANGE = '#c47719';
const INK = '#17263b';
const MUTED = '#68788b';
const THRESHOLD = 0.5;

const TRIALS: Trial[] = [
  { id: '01', subject: 'S01', label: 0, phase: 0.2, p1: 0.18, p2: 0.62 },
  { id: '02', subject: 'S02', label: 1, phase: 0.9, p1: 0.83, p2: 0.71 },
  { id: '03', subject: 'S03', label: 0, phase: 1.6, p1: 0.58, p2: 0.34 },
  { id: '04', subject: 'S04', label: 1, phase: 2.3, p1: 0.77, p2: 0.42 },
  { id: '05', subject: 'S05', label: 0, phase: 3.0, p1: 0.29, p2: 0.22 },
  { id: '06', subject: 'S06', label: 1, phase: 3.7, p1: 0.46, p2: 0.68 },
  { id: '07', subject: 'S07', label: 0, phase: 4.4, p1: 0.36, p2: 0.57 },
  { id: '08', subject: 'S08', label: 1, phase: 5.1, p1: 0.69, p2: 0.81 },
];

function prediction(probability: number): 0 | 1 {
  return probability >= THRESHOLD ? 1 : 0;
}

function accumulate(count: number, key: 'p1' | 'p2'): Counts {
  const selected = TRIALS.slice(0, count);
  let tp = 0;
  let fn = 0;
  let tn = 0;
  let fp = 0;
  selected.forEach((trial) => {
    const predicted = prediction(trial[key]);
    if (trial.label === 1 && predicted === 1) tp += 1;
    if (trial.label === 1 && predicted === 0) fn += 1;
    if (trial.label === 0 && predicted === 0) tn += 1;
    if (trial.label === 0 && predicted === 1) fp += 1;
  });
  const sensitivity = tp + fn > 0 ? tp / (tp + fn) : null;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : null;
  const balancedAccuracy = sensitivity !== null && specificity !== null
    ? (sensitivity + specificity) / 2
    : null;
  return { tp, fn, tn, fp, sensitivity, specificity, balancedAccuracy };
}

function percent(value: number | null) {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

export const OmniLab2: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const width = mobile ? 360 : 920;
  const height = mobile ? 760 : 586;
  const railX = mobile ? 28 : 56;
  const railWidth = mobile ? 304 : 808;
  const [count, setCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const activeIndex = clamp(count === 0 ? 0 : count - 1, 0, TRIALS.length - 1);
  const active = TRIALS[activeIndex];
  const progressX = railX + (count / TRIALS.length) * railWidth;
  const counts = useMemo(() => ({
    m1: accumulate(count, 'p1'),
    m2: accumulate(count, 'p2'),
  }), [count]);

  const setFromPointer = (pointerX: number) => {
    const next = clamp(Math.round(((pointerX - railX) / railWidth) * TRIALS.length), 0, TRIALS.length);
    setCount(next);
  };

  const renderModel = (
    model: 'M₁' | 'M₂',
    probability: number,
    stats: Counts,
    x: number,
    y: number,
    panelWidth: number,
  ) => {
    const predicted = prediction(probability);
    const correct = predicted === active.label;
    const color = model === 'M₁' ? BLUE : PURPLE;
    const gaugeX = x + 16;
    const gaugeWidth = panelWidth - 32;
    const currentVisible = count > 0;
    const matrixCellWidth = (panelWidth - 38) / 4;
    return (
      <g opacity={currentVisible ? 1 : 0.48}>
        <rect x={x} y={y} width={panelWidth} height={mobile ? 286 : 254} rx="5" fill="#fff" stroke={currentVisible ? color : '#cfd8e1'} strokeWidth={currentVisible ? 1.8 : 1.2} />
        <rect x={x} y={y} width={panelWidth} height="38" rx="5" fill={model === 'M₁' ? '#e8f3fa' : '#f0edf8'} />
        <rect x={x} y={y + 33} width={panelWidth} height="5" fill={model === 'M₁' ? '#e8f3fa' : '#f0edf8'} />
        <text x={x + 14} y={y + 24} fill={color} fontSize="11" fontWeight="900">{model}</text>
        <text x={x + panelWidth - 14} y={y + 24} textAnchor="end" fill={MUTED} fontSize="8">输出 P(y=1)</text>

        <text x={gaugeX} y={y + 61} fill={INK} fontSize="9" fontWeight="800">当前试次概率</text>
        <rect x={gaugeX} y={y + 76} width={gaugeWidth} height="13" rx="3" fill="#e7edf2" />
        <rect x={gaugeX} y={y + 76} width={currentVisible ? gaugeWidth * probability : 0} height="13" rx="3" fill={color} />
        <line x1={gaugeX + gaugeWidth * THRESHOLD} y1={y + 69} x2={gaugeX + gaugeWidth * THRESHOLD} y2={y + 97} stroke={ORANGE} strokeWidth="2" />
        <text x={gaugeX} y={y + 106} fill={MUTED} fontSize="7">0</text>
        <text x={gaugeX + gaugeWidth * THRESHOLD} y={y + 106} textAnchor="middle" fill={ORANGE} fontSize="7" fontWeight="800">阈值 0.5</text>
        <text x={gaugeX + gaugeWidth} y={y + 106} textAnchor="end" fill={MUTED} fontSize="7">1</text>

        <rect x={gaugeX} y={y + 118} width={gaugeWidth} height="34" rx="4" fill={currentVisible ? (correct ? '#e8f4ef' : '#faecee') : '#f1f4f6'} />
        <text x={gaugeX + 10} y={y + 139} fill={currentVisible ? (correct ? GREEN : RED) : MUTED} fontSize="9" fontWeight="850">
          {currentVisible ? `P=${probability.toFixed(2)} → 预测 y=${predicted}` : '等待第一个试次'}
        </text>
        <text x={gaugeX + gaugeWidth - 10} y={y + 139} textAnchor="end" fill={currentVisible ? (correct ? GREEN : RED) : MUTED} fontSize="9" fontWeight="900">
          {currentVisible ? (correct ? '正确' : '错误') : '—'}
        </text>

        <text x={gaugeX} y={y + 173} fill={INK} fontSize="8.5" fontWeight="800">累计混淆计数</text>
        {(['TP', 'FN', 'TN', 'FP'] as const).map((label, index) => {
          const value = stats[label.toLowerCase() as 'tp' | 'fn' | 'tn' | 'fp'];
          const cellX = gaugeX + index * (matrixCellWidth + 2);
          const isGood = label === 'TP' || label === 'TN';
          return (
            <g key={label}>
              <rect x={cellX} y={y + 183} width={matrixCellWidth} height="37" rx="3" fill={isGood ? '#edf6f2' : '#fbf0f1'} stroke={isGood ? '#b8d8ca' : '#e4c2c7'} />
              <text x={cellX + matrixCellWidth / 2} y={y + 197} textAnchor="middle" fill={MUTED} fontSize="6.8" fontWeight="800">{label}</text>
              <text x={cellX + matrixCellWidth / 2} y={y + 214} textAnchor="middle" fill={isGood ? GREEN : RED} fontSize="12" fontWeight="900">{value}</text>
            </g>
          );
        })}

        <text x={gaugeX} y={y + 241} fill={MUTED} fontSize="7.5">Balanced Accuracy</text>
        <text x={gaugeX + gaugeWidth} y={y + 241} textAnchor="end" fill={stats.balancedAccuracy === null ? MUTED : color} fontSize="15" fontWeight="900">
          {percent(stats.balancedAccuracy)}
        </text>
        {mobile && (
          <text x={gaugeX} y={y + 264} fill={MUTED} fontSize="7.3">
            灵敏度 {percent(stats.sensitivity)} · 特异度 {percent(stats.specificity)}
          </text>
        )}
      </g>
    );
  };

  const modelY = mobile ? 322 : 268;
  const panelWidth = mobile ? 148 : 326;
  const model1X = mobile ? 24 : 98;
  const model2X = mobile ? 188 : 496;

  return (
    <div className="ob-score-lab" ref={ref}>
      <div className="ob-lab-head">
        <div>
          <span>SHARED EVALUATION LOOP</span>
          <h5>共同评测怎样逐例生成分数</h5>
        </div>
        <p>拖动唯一的评测游标；同一 EEG、标签、阈值和公式同时约束两个模型。</p>
      </div>

      <div className="ob-canvas-wrap">
        <svg
          className={`ob-canvas ${dragging ? 'is-dragging' : ''}`}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="拖动共同评测游标，让同一批 EEG 逐例进入两个模型并累计 Balanced Accuracy"
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            setFromPointer(localPoint(event, width, height).x);
          }}
          onPointerMove={(event) => {
            if (!dragging) return;
            setFromPointer(localPoint(event, width, height).x);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') setCount((current) => clamp(current + 1, 0, TRIALS.length));
            if (event.key === 'ArrowLeft') setCount((current) => clamp(current - 1, 0, TRIALS.length));
          }}
        >
          <rect x="0" y="0" width={width} height={height} fill="#f7f9fb" />
          <text x={railX} y="28" fill={INK} fontSize="10" fontWeight="850">共同测试序列 (xⱼ, yⱼ)</text>
          <text x={width - railX} y="28" textAnchor="end" fill={count === TRIALS.length ? GREEN : BLUE} fontSize="9" fontWeight="850">
            {count === 0 ? '尚未计分' : count === TRIALS.length ? '8 / 8 已完成' : `${count} / 8 已计分`}
          </text>
          <line x1={railX} y1="68" x2={railX + railWidth} y2="68" stroke="#cad5df" strokeWidth="4" strokeLinecap="round" />
          <line x1={railX} y1="68" x2={progressX} y2="68" stroke={count === TRIALS.length ? GREEN : BLUE} strokeWidth="4" strokeLinecap="round" />
          {TRIALS.map((trial, index) => {
            const x = railX + ((index + 1) / TRIALS.length) * railWidth;
            const complete = index < count;
            const current = index === activeIndex && count > 0;
            return (
              <g key={trial.id}>
                <circle cx={x} cy="68" r={current ? 9 : 6} fill={complete ? (trial.label ? ORANGE : BLUE) : '#fff'} stroke={complete ? '#fff' : '#aebbc7'} strokeWidth={current ? 3 : 1.5} />
                <text x={x} y="91" textAnchor="middle" fill={complete ? INK : MUTED} fontSize={mobile ? '6.5' : '7.5'}>{trial.id}</text>
              </g>
            );
          })}
          <g transform={`translate(${progressX}, 68)`}>
            <circle r="13" fill="#fff" stroke={count === TRIALS.length ? GREEN : BLUE} strokeWidth="3" />
            <path d="M -4 -3 v 6 M 0 -3 v 6 M 4 -3 v 6" stroke={count === TRIALS.length ? GREEN : BLUE} strokeWidth="1.2" />
          </g>
          <text x={railX} y="111" fill={MUTED} fontSize="8">向右拖动，试次才会进入累计分数</text>

          <g transform={`translate(${mobile ? 24 : 310}, 128)`}>
            <rect width={mobile ? 312 : 300} height="94" rx="5" fill="#fff" stroke={count > 0 ? BLUE : '#cfd8e1'} />
            <text x="14" y="21" fill={MUTED} fontSize="8" fontWeight="800">当前共同输入 · 试次 {active.id} · {active.subject}</text>
            <WavePath x={14} y={53} width={mobile ? 190 : 180} amp={16} phase={active.phase} color={count > 0 ? BLUE : '#9cabb9'} strokeWidth={1.7} />
            <rect x={mobile ? 230 : 216} y="34" width="56" height="38" rx="4" fill={active.label ? '#fff1dc' : '#e8f3fa'} />
            <text x={mobile ? 258 : 244} y="49" textAnchor="middle" fill={MUTED} fontSize="7">真实标签</text>
            <text x={mobile ? 258 : 244} y="65" textAnchor="middle" fill={active.label ? ORANGE : BLUE} fontSize="12" fontWeight="900">y={active.label}</text>
            <text x="14" y="84" fill={count > 0 ? GREEN : MUTED} fontSize="7.5">
              {count > 0 ? '同一份 xⱼ 与 yⱼ 已复制到两个模型分支' : '拖动上方游标，送入第一个试次'}
            </text>
          </g>

          <path d={mobile ? 'M 180 222 V 252 H 98 V 306 M 180 252 H 262 V 306' : 'M 460 222 V 242 H 261 V 258 M 460 242 H 659 V 258'} fill="none" stroke={count > 0 ? '#8aa3b7' : '#c8d2dc'} strokeWidth="1.6" />
          <polygon points={mobile ? '94,306 102,306 98,313' : '257,258 265,258 261,265'} fill={count > 0 ? '#8aa3b7' : '#c8d2dc'} />
          <polygon points={mobile ? '258,306 266,306 262,313' : '655,258 663,258 659,265'} fill={count > 0 ? '#8aa3b7' : '#c8d2dc'} />
          <rect x={mobile ? 132 : 405} y={mobile ? 239 : 229} width={mobile ? 96 : 110} height="24" rx="12" fill="#fff5e6" stroke="#dfb56f" />
          <text x={mobile ? 180 : 460} y={mobile ? 255 : 245} textAnchor="middle" fill={ORANGE} fontSize="8" fontWeight="850">共同阈值 0.5</text>

          {renderModel('M₁', active.p1, counts.m1, model1X, modelY, panelWidth)}
          {renderModel('M₂', active.p2, counts.m2, model2X, modelY, panelWidth)}

          {!mobile && (
            <g transform="translate(98, 536)">
              <rect width="724" height="34" rx="4" fill={count >= 2 ? '#e8f4ef' : '#f1f4f6'} stroke={count >= 2 ? '#9ac5b2' : '#d5dde5'} />
              <text x="14" y="21" fill={count >= 2 ? GREEN : MUTED} fontSize="9" fontWeight="800">
                {count >= 2
                  ? `共同公式：BA = (灵敏度 + 特异度) / 2　→　M₁ ${percent(counts.m1.balancedAccuracy)} · M₂ ${percent(counts.m2.balancedAccuracy)}`
                  : '至少完成一个正类和一个负类试次后，Balanced Accuracy 才有完整含义。'}
              </text>
            </g>
          )}
          {mobile && (
            <g transform="translate(24, 628)">
              <rect width="312" height="104" rx="5" fill={count >= 2 ? '#e8f4ef' : '#f1f4f6'} stroke={count >= 2 ? '#9ac5b2' : '#d5dde5'} />
              <text x="14" y="25" fill={count >= 2 ? GREEN : MUTED} fontSize="8.5" fontWeight="850">
                {count >= 2 ? '同一公式生成两个模型分数' : '先让正、负两类都进入评测'}
              </text>
              <text x="14" y="49" fill={INK} fontSize="8">BA = (灵敏度 + 特异度) / 2</text>
              <text x="14" y="75" fill={BLUE} fontSize="10" fontWeight="900">M₁ {percent(counts.m1.balancedAccuracy)}</text>
              <text x="112" y="75" fill={PURPLE} fontSize="10" fontWeight="900">M₂ {percent(counts.m2.balancedAccuracy)}</text>
              <text x="14" y="94" fill={MUTED} fontSize="7.2">同一批 xⱼ,yⱼ · 同一阈值 · 同一计分公式</text>
            </g>
          )}
        </svg>
      </div>

      <div className="ob-evidence-strip">
        <div><span>输入对齐</span><b>同一 EEG xⱼ · 同一真实标签 yⱼ</b></div>
        <div><span>判定对齐</span><b>概率统一按阈值 0.5 转为类别</b></div>
        <div><span>计分对齐</span><b>同一混淆计数 · 同一 BA 公式</b></div>
      </div>
      <div className="ob-source-note">机制示意：8 个试次与预测概率为教学构造。OmniEEG-Bench 的实际任务、标签和指标由任务协议固定。</div>
    </div>
  );
};
