import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type SplitId = 'A' | 'B';
type Cell = {
  subject: number;
  trial: number;
};

type TestRecord = Cell & {
  label: 0 | 1;
  predicted: 0 | 1;
  correct: boolean;
};

const BLUE = '#245d87';
const GREEN = '#27815f';
const RED = '#bd4051';
const ORANGE = '#c47719';
const INK = '#17263b';
const MUTED = '#68788b';
const SUBJECTS = 4;
const TRIALS = 4;

const SPLITS: Record<SplitId, Cell[]> = {
  A: Array.from({ length: SUBJECTS }, (_, subject) => ({ subject, trial: subject })),
  B: Array.from({ length: SUBJECTS }, (_, subject) => ({ subject, trial: TRIALS - subject - 1 })),
};

function cellKey(subject: number, trial: number) {
  return `${subject}-${trial}`;
}

function modelPrediction(subject: number, trial: number): 0 | 1 {
  if (subject === trial) {
    return [0, 1, 0, 0][trial] as 0 | 1;
  }
  if (subject + trial === TRIALS - 1) {
    return [1, 1, 0, 0][subject] as 0 | 1;
  }
  return ((subject + trial * 2) % 3 === 0 ? 1 - (trial % 2) : trial % 2) as 0 | 1;
}

function buildRecords(split: SplitId): TestRecord[] {
  return SPLITS[split].map((cell) => {
    const label = (cell.trial % 2) as 0 | 1;
    const predicted = modelPrediction(cell.subject, cell.trial);
    return { ...cell, label, predicted, correct: label === predicted };
  });
}

function countOutcomes(records: TestRecord[]) {
  let tp = 0;
  let fn = 0;
  let fp = 0;
  let tn = 0;
  records.forEach((record) => {
    if (record.label === 1 && record.predicted === 1) tp += 1;
    if (record.label === 1 && record.predicted === 0) fn += 1;
    if (record.label === 0 && record.predicted === 1) fp += 1;
    if (record.label === 0 && record.predicted === 0) tn += 1;
  });
  const tpr = tp / Math.max(1, tp + fn);
  const tnr = tn / Math.max(1, tn + fp);
  return { tp, fn, fp, tn, tpr, tnr, ba: (tpr + tnr) / 2 };
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export const OmniLabSplit: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const width = mobile ? 360 : 920;
  const height = mobile ? 590 : 350;
  const [split, setSplit] = useState<SplitId>('A');

  const records = useMemo(() => buildRecords(split), [split]);
  const testKeys = useMemo(() => new Set(records.map((record) => cellKey(record.subject, record.trial))), [records]);
  const outcomes = useMemo(() => countOutcomes(records), [records]);

  const gridX = mobile ? 72 : 70;
  const gridY = mobile ? 80 : 68;
  const cellWidth = mobile ? 55 : 62;
  const cellHeight = mobile ? 46 : 50;
  const panelX = mobile ? 20 : 374;
  const panelY = mobile ? 294 : 48;
  const panelWidth = mobile ? 320 : 498;
  const panelHeight = 250;
  const chipGap = 6;
  const chipWidth = (panelWidth - 28 - chipGap * 3) / 4;
  const metricX = panelX + 14;
  const metricWidth = panelWidth - 28;

  const renderMetricBar = (label: string, value: number, y: number, color: string) => (
    <g>
      <text x={metricX} y={y + 8} fill={MUTED} fontSize={mobile ? '7' : '7.8'}>{label}</text>
      <rect x={metricX + (mobile ? 92 : 112)} y={y} width={metricWidth - (mobile ? 132 : 158)} height="9" rx="2" fill="#e4eaf0" />
      <rect x={metricX + (mobile ? 92 : 112)} y={y} width={(metricWidth - (mobile ? 132 : 158)) * value} height="9" rx="2" fill={color} style={{ transition: 'width 220ms ease' }} />
      <text x={metricX + metricWidth} y={y + 8} textAnchor="end" fill={color} fontSize="8.2" fontWeight="900">{percent(value)}</text>
    </g>
  );

  return (
    <div className="ob-split-lab" ref={ref}>
      <div className="ob-lab-head">
        <div>
          <span>FIXED SPLIT, DIFFERENT SCORE</span>
          <h5>同一模型换一份固定划分，测试结果怎样变化</h5>
        </div>
        <p>A 与 B 遵守同一种切分定义，只是随机种子生成的具体样本分配不同；两份实验都完整执行。</p>
      </div>

      <div className="ob-state-control" role="group" aria-label="选择固定数据划分">
        <button type="button" className={split === 'A' ? 'active' : ''} aria-pressed={split === 'A'} onClick={() => setSplit('A')}>固定划分 A</button>
        <button type="button" className={split === 'B' ? 'active' : ''} aria-pressed={split === 'B'} onClick={() => setSplit('B')}>固定划分 B</button>
      </div>

      <div className="ob-canvas-wrap">
        <svg
          className="ob-canvas is-static"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`固定划分 ${split} 下的训练测试样本、逐样本预测与 Balanced Accuracy`}
        >
          <rect x="0" y="0" width={width} height={height} fill="#f7f9fb" />
          <text x={mobile ? 20 : 42} y="27" fill={INK} fontSize="9" fontWeight="850">划分 {split} · 完整测试已提交</text>
          <text x={width - (mobile ? 20 : 42)} y="27" textAnchor="end" fill={GREEN} fontSize="8" fontWeight="850">同一模型 · 同一计分公式</text>

          <text x={mobile ? 20 : 42} y={gridY - 22} fill={INK} fontSize="9" fontWeight="850">同一样本池 · 4 人 × 4 次</text>
          <text x={mobile ? 340 : 326} y={gridY - 22} textAnchor="end" fill={MUTED} fontSize="7.5">蓝：训练　橙：测试</text>
          {Array.from({ length: TRIALS }, (_, trial) => (
            <text key={trial} x={gridX + trial * cellWidth + cellWidth / 2} y={gridY - 7} textAnchor="middle" fill={MUTED} fontSize="7">T{trial + 1}</text>
          ))}
          {Array.from({ length: SUBJECTS }, (_, subject) => (
            <g key={subject}>
              <text x={gridX - 8} y={gridY + subject * cellHeight + cellHeight / 2 + 3} textAnchor="end" fill={MUTED} fontSize="7.5" fontWeight="800">S{subject + 1}</text>
              {Array.from({ length: TRIALS }, (_, trial) => {
                const isTest = testKeys.has(cellKey(subject, trial));
                const x = gridX + trial * cellWidth;
                const y = gridY + subject * cellHeight;
                return (
                  <g key={trial}>
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellWidth - 3}
                      height={cellHeight - 3}
                      rx="3"
                      fill={isTest ? '#fff0dc' : '#e8f3fa'}
                      stroke={isTest ? '#d99d43' : '#c6d9e7'}
                      strokeWidth={isTest ? 1.7 : 1}
                      style={{ transition: 'fill 220ms ease, stroke 220ms ease' }}
                    />
                    {isTest && <text x={x + cellWidth / 2} y={y + cellHeight / 2 + 3} textAnchor="middle" fill={ORANGE} fontSize="7" fontWeight="900">测</text>}
                  </g>
                );
              })}
            </g>
          ))}

          <g>
            <rect x={panelX} y={panelY} width={panelWidth} height={panelHeight} rx="5" fill="#fff" stroke="#cfd9e2" strokeWidth="1.2" />
            <rect x={panelX} y={panelY} width={panelWidth} height="36" rx="5" fill="#eaf3f9" />
            <rect x={panelX} y={panelY + 31} width={panelWidth} height="5" fill="#eaf3f9" />
            <text x={panelX + 14} y={panelY + 23} fill={BLUE} fontSize="10.5" fontWeight="900">同一模型 M</text>
            <text x={panelX + panelWidth - 14} y={panelY + 23} textAnchor="end" fill={GREEN} fontSize="8" fontWeight="850">完整测试集 4 / 4</text>

            <text x={panelX + 14} y={panelY + 54} fill={INK} fontSize="8" fontWeight="850">逐样本预测</text>
            {records.map((record, index) => {
              const x = panelX + 14 + index * (chipWidth + chipGap);
              return (
                <g key={index}>
                  <rect x={x} y={panelY + 63} width={chipWidth} height="58" rx="3" fill={record.correct ? '#e9f4ef' : '#faecee'} stroke={record.correct ? '#afd2c2' : '#e1bbc1'} style={{ transition: 'fill 220ms ease, stroke 220ms ease' }} />
                  <text x={x + chipWidth / 2} y={panelY + 79} textAnchor="middle" fill={MUTED} fontSize={mobile ? '6' : '6.7'}>S{record.subject + 1} · T{record.trial + 1}</text>
                  <text x={x + chipWidth / 2} y={panelY + 98} textAnchor="middle" fill={INK} fontSize={mobile ? '6.5' : '7.2'} fontWeight="850">y{record.label} → ŷ{record.predicted}</text>
                  <text x={x + chipWidth / 2} y={panelY + 114} textAnchor="middle" fill={record.correct ? GREEN : RED} fontSize={mobile ? '6.2' : '6.8'} fontWeight="900">{record.correct ? '正确' : '错误'}</text>
                </g>
              );
            })}

            <line x1={panelX + 14} y1={panelY + 136} x2={panelX + panelWidth - 14} y2={panelY + 136} stroke="#dfe6ec" />
            <text x={metricX} y={panelY + 153} fill={INK} fontSize="8" fontWeight="850">同一计分公式</text>
            {renderMetricBar('正类召回 TPR', outcomes.tpr, panelY + 164, BLUE)}
            {renderMetricBar('负类召回 TNR', outcomes.tnr, panelY + 194, BLUE)}
            <text x={metricX} y={panelY + 232} fill={MUTED} fontSize={mobile ? '7' : '7.8'}>BA = (TPR + TNR) / 2</text>
            <text x={metricX + metricWidth} y={panelY + 234} textAnchor="end" fill={split === 'A' ? BLUE : ORANGE} fontSize={mobile ? '18' : '21'} fontWeight="900">{percent(outcomes.ba)}</text>
          </g>
        </svg>
      </div>

      <div className="ob-evidence-strip">
        <div><span>保持不变</span><b>数据池 · 模型 M · BA 公式</b></div>
        <div><span>唯一变化</span><b>训练/测试样本的固定分配</b></div>
        <div><span>直接结果</span><b>错误计数与最终分数改变</b></div>
      </div>
      <div className="ob-source-note">机制示意：样本、标签、预测与分数为教学构造。这里 A/B 是同一种切分定义下的两个随机实例。论文 §3 预先生成固定划分，并让所有模型在同一次独立运行中复用它。</div>
    </div>
  );
};
