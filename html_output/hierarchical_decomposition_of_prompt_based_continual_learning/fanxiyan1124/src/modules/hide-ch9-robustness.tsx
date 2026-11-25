import React, { useEffect, useState } from 'react';
import {
  HideBadge,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
} from './hide-kit';

type RobustnessDataset = 'cifar' | 'imagenet';
type RobustnessPretraining = 'ibot1k' | 'dino1k';

type LambdaTuple = readonly [number, number, number, number];
type RobustnessSeries = { wtp: LambdaTuple; full: LambdaTuple };

const LAMBDAS = [0, 0.001, 0.01, 0.1] as const;

const DATASET_OPTIONS: Array<{ value: RobustnessDataset; label: string }> = [
  { value: 'cifar', label: 'Split CIFAR-100' },
  { value: 'imagenet', label: 'Split ImageNet-R' },
];

const PRETRAINING_OPTIONS: Array<{ value: RobustnessPretraining; label: string; note: string }> = [
  { value: 'ibot1k', label: 'iBOT-1K', note: 'iBOT 1K 预训练' },
  { value: 'dino1k', label: 'DINO-1K', note: 'DINO 1K 预训练' },
];

const TABLE_4: Record<RobustnessDataset, Record<RobustnessPretraining, RobustnessSeries>> = {
  cifar: {
    ibot1k: {
      wtp: [75.13, 72.75, 72.53, 71.53],
      full: [90.15, 91.18, 91.6, 93.35],
    },
    dino1k: {
      wtp: [74.99, 73.23, 72.74, 70.87],
      full: [88.97, 90.06, 90.54, 92.61],
    },
  },
  imagenet: {
    ibot1k: {
      wtp: [61.47, 61.17, 61.07, 59.52],
      full: [70.97, 71.25, 71.57, 71.71],
    },
    dino1k: {
      wtp: [57.71, 58.23, 57.35, 56.37],
      full: [66.88, 67.42, 68.13, 68.21],
    },
  },
};

function formatLambda(value: number) {
  return value === 0 ? '0' : String(value);
}

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} pt`;
}

function direction(value: number) {
  if (value > 0) return '上升';
  if (value < 0) return '下降';
  return '持平';
}

export function HideCh9Robustness() {
  const [dataset, setDataset] = useState<RobustnessDataset>('cifar');
  const [pretraining, setPretraining] = useState<RobustnessPretraining>('ibot1k');
  const [lambdaIndex, setLambdaIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      if (motion.matches) setPlaying(false);
    };
    syncMotion();
    motion.addEventListener?.('change', syncMotion);
    return () => motion.removeEventListener?.('change', syncMotion);
  }, []);

  useEffect(() => {
    if (!playing || hoverPaused) return;
    const interval = window.setInterval(() => {
      setLambdaIndex((index) => (index + 1) % LAMBDAS.length);
    }, 1600);
    return () => window.clearInterval(interval);
  }, [hoverPaused, playing]);

  const series = TABLE_4[dataset][pretraining];
  const currentLambda = LAMBDAS[lambdaIndex];
  const currentWtp = series.wtp[lambdaIndex];
  const currentFull = series.full[lambdaIndex];
  const wtpEndpointDelta = series.wtp[series.wtp.length - 1] - series.wtp[0];
  const fullEndpointDelta = series.full[series.full.length - 1] - series.full[0];
  const datasetLabel = DATASET_OPTIONS.find((option) => option.value === dataset)?.label ?? dataset;
  const pretrainingLabel = PRETRAINING_OPTIONS.find((option) => option.value === pretraining)?.label ?? pretraining;
  const playbackState = hoverPaused && playing ? '悬停暂停' : playing ? '自动扫档' : '手动档位';

  return (
    <HideScene chapter="暗房架 09 · λ 检验条" cue="一格一档，松开继续显影" tone="purple">
      <div className="hide-grid hide-ch9-robustness-layout">
        <HidePanel
          title="Table 4 · λ 检验条"
          meta="FAA (%) · 仅 WTP 与完整模型"
          tone="purple"
          className="hide-ch9-robustness-board"
        >
          <div className="hide-ch9-robustness-selectors">
            <div className="hide-ch9-selector">
              <span>数据集</span>
              <HideSegment
                value={dataset}
                onChange={setDataset}
                label="选择稳健性数据集"
                options={DATASET_OPTIONS}
              />
            </div>
            <div className="hide-ch9-selector">
              <span>预训练范式</span>
              <HideSegment
                value={pretraining}
                onChange={setPretraining}
                label="选择稳健性预训练范式"
                options={PRETRAINING_OPTIONS}
              />
            </div>
          </div>

          <div className="hide-ch9-transport">
            <button
              type="button"
              className={playing ? 'hide-ch9-playback is-playing' : 'hide-ch9-playback'}
              aria-pressed={playing}
              onClick={() => setPlaying((value) => !value)}
            >
              <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
              {playing ? '暂停扫档' : '继续扫档'}
            </button>
            <div className="hide-ch9-transport-status" aria-live="polite">
              <HideBadge tone={playing && !hoverPaused ? 'purple' : 'neutral'}>{playbackState}</HideBadge>
              <span>λ = {formatLambda(currentLambda)}</span>
            </div>
          </div>

          <div
            className="hide-ch9-lambda-strip"
            role="group"
            aria-label="λ 检验条，悬停暂停，点击固定档位"
            onMouseEnter={() => setHoverPaused(true)}
            onMouseLeave={() => setHoverPaused(false)}
            onClick={() => setPlaying(false)}
          >
            {LAMBDAS.map((lambda, index) => (
              <button
                key={lambda}
                type="button"
                className={index === lambdaIndex ? 'hide-ch9-lambda-cell is-active' : 'hide-ch9-lambda-cell'}
                aria-pressed={index === lambdaIndex}
                aria-label={`选择 λ=${formatLambda(lambda)}，仅 WTP ${series.wtp[index].toFixed(2)}%，完整模型 ${series.full[index].toFixed(2)}%`}
                onClick={() => {
                  setLambdaIndex(index);
                  setPlaying(false);
                }}
              >
                <span>λ</span>
                <strong>{formatLambda(lambda)}</strong>
                <i>
                  <b style={{ height: `${series.wtp[index]}%` }} />
                  <em style={{ height: `${series.full[index]}%` }} />
                </i>
                <small>{index === lambdaIndex ? '当前检验' : `第 ${index + 1} 档`}</small>
              </button>
            ))}
          </div>

          <HideNote title="CR 强度的方向差" tone="purple">
            在该 Table 4 设置中，更强的 CR 可能压低仅 WTP 的单层表现，却让显式任务身份与全类预测组成的完整层级模型继续获益。
            因此不能只凭 WTP-only 的走向判断 CR 是否有用。
          </HideNote>
        </HidePanel>

        <div className="hide-side-stack hide-ch9-robustness-side">
          <HidePanel
            title="同档位的两条读数"
            meta={`${datasetLabel} · ${pretrainingLabel}`}
            tone="blue"
            className="hide-ch9-robustness-readout"
          >
            <div className="hide-ch9-lambda-current" aria-live="polite">
              <span>当前检验档</span>
              <strong>λ = {formatLambda(currentLambda)}</strong>
              <small>Table 4 报告值</small>
            </div>

            <div className="hide-ch9-comparison-row is-wtp">
              <div className="hide-ch9-comparison-heading">
                <HideBadge tone="red">仅 WTP</HideBadge>
                <strong>{currentWtp.toFixed(2)}%</strong>
              </div>
              <div
                className="hide-ch9-comparison-track"
                role="img"
                aria-label={`仅 WTP FAA ${currentWtp.toFixed(2)}%`}
              >
                <i style={{ width: `${currentWtp}%` }} />
              </div>
            </div>

            <div className="hide-ch9-comparison-row is-full">
              <div className="hide-ch9-comparison-heading">
                <HideBadge tone="green">完整 HiDe-Prompt</HideBadge>
                <strong>{currentFull.toFixed(2)}%</strong>
              </div>
              <div
                className="hide-ch9-comparison-track"
                role="img"
                aria-label={`完整模型 FAA ${currentFull.toFixed(2)}%`}
              >
                <i style={{ width: `${currentFull}%` }} />
              </div>
            </div>

            <div className="hide-metric-pair">
              <HideMetric
                label="仅 WTP · λ 0 → 0.1"
                value={`${direction(wtpEndpointDelta)} ${signed(wtpEndpointDelta)}`}
                tone="red"
                note="端点差"
              />
              <HideMetric
                label="完整模型 · λ 0 → 0.1"
                value={`${direction(fullEndpointDelta)} ${signed(fullEndpointDelta)}`}
                tone="green"
                note="端点差"
              />
            </div>
          </HidePanel>

          <HidePanel title="怎样读这条检验条" meta="CR 的兼容性取舍" tone="orange">
            <div className="hide-ch9-tradeoff">
              <div>
                <span>仅 WTP</span>
                <strong>任务内特异性承压</strong>
                <p>单层分类器直接暴露较强 CR 对任务内决策边界的影响。</p>
              </div>
              <div>
                <span>完整层级</span>
                <strong>跨任务兼容获益</strong>
                <p>TII 与 TAP 参与组合后，兼容旧类的表征可转化为更高 FAA。</p>
              </div>
            </div>
            <HideNote title="结论边界" tone="red">
              上述方向来自 Table 4 对 iBOT-1K、DINO-1K 的报告，不应外推成“CR 对所有单层模型都更差”或“λ 越大永远越好”。
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
