import React, { useEffect, useState } from 'react';
import {
  HideBadge,
  HideFigure,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
} from './hide-kit';

type AnalysisDataset = 'cifar' | 'imagenet';
type AnalysisPretraining = 'sup21k' | 'ibot21k' | 'ibot1k' | 'dino1k' | 'moco1k';

type StageTuple = readonly [number, number, number, number, number, number];
type DatasetRows = Record<AnalysisPretraining, StageTuple>;

const DATASET_OPTIONS: Array<{ value: AnalysisDataset; label: string }> = [
  { value: 'cifar', label: 'Split CIFAR-100' },
  { value: 'imagenet', label: 'Split ImageNet-R' },
];

const PRETRAINING_OPTIONS: Array<{ value: AnalysisPretraining; label: string; note: string }> = [
  { value: 'sup21k', label: 'Sup-21K', note: '监督预训练' },
  { value: 'ibot21k', label: 'iBOT-21K', note: 'iBOT 21K 预训练' },
  { value: 'ibot1k', label: 'iBOT-1K', note: 'iBOT 1K 预训练' },
  { value: 'dino1k', label: 'DINO-1K', note: 'DINO 1K 预训练' },
  { value: 'moco1k', label: 'MoCo-1K', note: 'MoCo 1K 预训练' },
];

const STAGES = [
  {
    label: 'Naive',
    target: '顺序单头起点',
    copy: '仅保留顺序提示调优的单头起点，作为后续逐级加入目标的参照。',
    tone: 'neutral' as const,
  },
  {
    label: 'WTP',
    target: '当前提示 pₜ 与输出层 ψ',
    copy: '任务内预测先让当前任务提示和类别输出层形成显式任务内分类器。',
    tone: 'blue' as const,
  },
  {
    label: '+TII',
    target: '任务头 ω + 未受提示统计',
    copy: '任务身份推断用平衡采样的未受提示伪表征训练 ω，但此时全类组合尚未加入。',
    tone: 'blue' as const,
  },
  {
    label: '+TAP',
    target: '共享输出层 ψ + 受提示统计',
    copy: '任务自适应预测让全部已见类的受提示伪表征直接进入共享输出层。',
    tone: 'orange' as const,
  },
  {
    label: '+TII+TAP',
    target: 'ω 与 ψ 的层级闭环',
    copy: '任务身份和全类预测共同参与组合，WTP+TII 的收益才在 Table 3 中充分释放。',
    tone: 'orange' as const,
  },
  {
    label: '+CR',
    target: 'WTP 表示空间 + 旧类兼容',
    copy: '对比正则约束当前受提示表征与旧类统计兼容，叠加在完整的层级目标上。',
    tone: 'purple' as const,
  },
] as const;

const TABLE_3: Record<AnalysisDataset, DatasetRows> = {
  cifar: {
    sup21k: [85.11, 87.86, 88.05, 89.85, 92.5, 92.61],
    ibot21k: [73.05, 78.86, 80.77, 84.23, 90.21, 93.02],
    ibot1k: [72.2, 75.93, 78.9, 86.04, 90.52, 93.48],
    dino1k: [73.74, 75.15, 76.27, 84.76, 88.93, 92.51],
    moco1k: [75.67, 77.15, 77.78, 85.17, 89.28, 91.57],
  },
  imagenet: {
    sup21k: [60.22, 71.57, 73.76, 72.57, 74.89, 75.06],
    ibot21k: [48.0, 55.16, 55.19, 60.01, 70.44, 70.83],
    ibot1k: [53.68, 60.86, 61.22, 67.13, 70.66, 71.33],
    dino1k: [54.33, 57.61, 58.41, 64.26, 66.78, 68.11],
    moco1k: [48.77, 53.21, 53.08, 58.36, 63.59, 63.77],
  },
};

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} pt`;
}

export function HideCh9Analysis() {
  const [dataset, setDataset] = useState<AnalysisDataset>('cifar');
  const [pretraining, setPretraining] = useState<AnalysisPretraining>('ibot1k');
  const [stage, setStage] = useState(3);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const nextStage = Number(event.key) - 1;
      if (Number.isInteger(nextStage) && nextStage >= 0 && nextStage < STAGES.length) {
        event.preventDefault();
        setStage(nextStage);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const values = TABLE_3[dataset][pretraining];
  const current = values[stage];
  const previousDelta = stage === 0 ? null : current - values[stage - 1];
  const totalGain = current - values[0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const floor = Math.max(0, Math.floor((min - 2) / 5) * 5);
  const ceiling = Math.min(100, Math.ceil((max + 2) / 5) * 5);
  const chartSpan = Math.max(1, ceiling - floor);
  const datasetLabel = DATASET_OPTIONS.find((option) => option.value === dataset)?.label ?? dataset;
  const pretrainingLabel = PRETRAINING_OPTIONS.find((option) => option.value === pretraining)?.label ?? pretraining;
  const currentStage = STAGES[stage];

  return (
    <HideScene chapter="暗房架 09 · 机制检验" cue="逐级加入，逐格显影" tone="orange">
      <div className="hide-grid hide-ch9-analysis-layout">
        <HidePanel
          title="Table 3 · 逐级消融接触条"
          meta="FAA (%) · higher is better"
          tone="orange"
          className="hide-ch9-analysis-board"
        >
          <div className="hide-ch9-analysis-selectors">
            <div className="hide-ch9-selector">
              <span>数据集</span>
              <HideSegment
                value={dataset}
                onChange={setDataset}
                label="选择消融数据集"
                options={DATASET_OPTIONS}
              />
            </div>
            <div className="hide-ch9-selector">
              <span>预训练范式</span>
              <HideSegment
                value={pretraining}
                onChange={setPretraining}
                label="选择预训练范式"
                options={PRETRAINING_OPTIONS}
              />
            </div>
          </div>

          <div
            className="hide-ch9-analysis-chart"
            role="group"
            aria-label={`${datasetLabel} ${pretrainingLabel} 逐级消融 FAA`}
          >
            {STAGES.map((item, index) => {
              const value = values[index];
              const height = Math.max(10, Math.min(92, (value - floor) / chartSpan * 100));
              return (
                <button
                  key={item.label}
                  type="button"
                  className={index === stage ? 'hide-ch9-analysis-column is-active' : 'hide-ch9-analysis-column'}
                  aria-pressed={index === stage}
                  aria-label={`第 ${index + 1} 档 ${item.label}，FAA ${value.toFixed(2)}%`}
                  onClick={() => setStage(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <i>
                    <b style={{ height: `${height}%` }} />
                  </i>
                  <strong>{value.toFixed(2)}</strong>
                  <small>{item.label}</small>
                </button>
              );
            })}
          </div>

          <div className="hide-ch9-analysis-scale" aria-hidden="true">
            <span>{floor}%</span>
            <i />
            <span>{ceiling}%</span>
          </div>

          <HideNote title="为什么不能只读 +TII" tone="purple">
            Table 3 中，显式任务身份还需要 TAP 的全类组合才能充分兑现。以 iBOT-1K 的 Split CIFAR-100
            为例：Naive 72.20，WTP 75.93，+TII 78.90，+TAP 86.04，+TII+TAP 90.52，+CR 93.48。
          </HideNote>
        </HidePanel>

        <div className="hide-side-stack hide-ch9-analysis-side">
          <HidePanel
            title={currentStage.label}
            meta={`条件卡 · 按键 1-6`}
            tone={currentStage.tone}
            className="hide-ch9-current-card"
          >
            <div className="hide-ch9-condition-badges">
              <HideBadge tone="blue">{datasetLabel}</HideBadge>
              <HideBadge tone="neutral">{pretrainingLabel}</HideBadge>
            </div>
            <div className="hide-metric-pair">
              <HideMetric label="当前 FAA" value={`${current.toFixed(2)}%`} tone={currentStage.tone} note="高优" />
              <HideMetric
                label="相对上一档"
                value={previousDelta === null ? '起点' : signed(previousDelta)}
                tone={previousDelta !== null && previousDelta < 0 ? 'red' : 'green'}
                note="百分点"
              />
            </div>
            <div className="hide-ch9-total-gain">
              <span>相对 Naive</span>
              <strong>{signed(totalGain)}</strong>
              <small>Table 3 报告的 FAA 差值</small>
            </div>
            <div className="hide-ch9-stage-target">
              <span>当前加入</span>
              <strong>{currentStage.target}</strong>
              <p>{currentStage.copy}</p>
            </div>
          </HidePanel>

          <HidePanel title="Figure 4 · 任务身份证据" meta="(a)(b) 定性面板" tone="purple">
            <div className="hide-ch9-figure-pair">
              <HideFigure
                src="./images/fig4-wtp.png"
                alt="Figure 4(a) WTP qualitative panel"
                caption="Fig.4(a) · 定性对照"
                tone="blue"
                className="hide-ch9-source-figure"
              />
              <HideFigure
                src="./images/fig4-tii.png"
                alt="Figure 4(b) task identity inference qualitative panel"
                caption="Fig.4(b) · 定性对照"
                tone="purple"
                className="hide-ch9-source-figure"
              />
            </div>
            <HideNote title="67.74% 的口径" tone="red">
              Figure 4 中显式 TII 的最高读数为 <strong>67.74%</strong>，含义是
              <strong>任务身份推断准确率</strong>，不是最终全类准确率，也不能替代 Table 3 的 FAA。
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
