import React, { useEffect, useMemo, useState } from 'react';
import {
  HideBadge,
  HideBar,
  HideKeyValue,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
} from './hide-kit';

type DatasetId = 'cifar100' | 'imagenet-r';
type PretrainId = 'sup21k' | 'ibot21k' | 'ibot1k' | 'dino1k' | 'moco1k';
type DetailView = 'cost' | 'limits';
type RaceState = 'idle' | 'running' | 'complete';

type ResultRow = {
  baseline: string;
  baselineValue: number;
  noCr: number;
  full: number;
};

const datasetOptions: Array<{ value: DatasetId; label: string; note?: string }> = [
  { value: 'cifar100', label: 'Split CIFAR-100', note: '100 个类别，拆成 10 个增量任务' },
  { value: 'imagenet-r', label: 'Split ImageNet-R', note: '200 个类别，拆成 10 个增量任务' },
];

const pretrainOptions: Array<{ value: PretrainId; label: string; note?: string }> = [
  { value: 'sup21k', label: 'Sup-21K', note: '监督预训练' },
  { value: 'ibot21k', label: 'iBOT-21K', note: '自监督预训练' },
  { value: 'ibot1k', label: 'iBOT-1K', note: '自监督预训练' },
  { value: 'dino1k', label: 'DINO-1K', note: '自监督预训练' },
  { value: 'moco1k', label: 'MoCo-1K', note: '自监督预训练' },
];

const results: Record<DatasetId, Record<PretrainId, ResultRow>> = {
  cifar100: {
    sup21k: { baseline: 'S-Prompt++', baselineValue: 88.81, noCr: 92.50, full: 92.61 },
    ibot21k: { baseline: 'CODA-Prompt', baselineValue: 80.83, noCr: 90.21, full: 93.02 },
    ibot1k: { baseline: 'CODA-Prompt', baselineValue: 79.11, noCr: 90.52, full: 93.48 },
    dino1k: { baseline: 'CODA-Prompt', baselineValue: 77.50, noCr: 88.93, full: 92.51 },
    moco1k: { baseline: 'DualPrompt', baselineValue: 77.77, noCr: 89.28, full: 91.57 },
  },
  'imagenet-r': {
    sup21k: { baseline: 'CODA-Prompt', baselineValue: 70.03, noCr: 74.89, full: 75.06 },
    ibot21k: { baseline: 'CODA-Prompt', baselineValue: 61.22, noCr: 70.44, full: 70.83 },
    ibot1k: { baseline: 'CODA-Prompt', baselineValue: 66.56, noCr: 70.66, full: 71.33 },
    dino1k: { baseline: 'CODA-Prompt', baselineValue: 63.15, noCr: 66.78, full: 68.11 },
    moco1k: { baseline: 'CODA-Prompt', baselineValue: 55.75, noCr: 63.59, full: 63.77 },
  },
};

const detailOptions: Array<{ value: DetailView; label: string; note?: string }> = [
  { value: 'cost', label: '显存与时间', note: '单卡 A100 的训练代价' },
  { value: 'limits', label: '适用边界', note: '论文作者给出的三条限制' },
];

export function HideCh10Results() {
  const [dataset, setDataset] = useState<DatasetId>('cifar100');
  const [pretrain, setPretrain] = useState<PretrainId>('sup21k');
  const [detailView, setDetailView] = useState<DetailView>('cost');
  const [raceState, setRaceState] = useState<RaceState>('idle');
  const [progress, setProgress] = useState(0);
  const [runToken, setRunToken] = useState(0);

  const result = results[dataset][pretrain];
  const datasetLabel = datasetOptions.find((option) => option.value === dataset)?.label ?? '';
  const pretrainLabel = pretrainOptions.find((option) => option.value === pretrain)?.label ?? '';
  const lead = useMemo(() => result.full - result.baselineValue, [result]);

  useEffect(() => {
    if (runToken === 0) return;

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setProgress(1);
      setRaceState('complete');
      return;
    }

    setProgress(0);
    setRaceState('running');
    const startedAt = performance.now();
    const duration = 1150;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setRaceState('complete');
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [runToken]);

  const resetRace = () => {
    setRunToken(0);
    setProgress(0);
    setRaceState('idle');
  };

  const selectDataset = (next: DatasetId) => {
    if (next === dataset) return;
    setDataset(next);
    resetRace();
  };

  const selectPretrain = (next: PretrainId) => {
    if (next === pretrain) return;
    setPretrain(next);
    resetRace();
  };

  const startVerification = () => {
    setProgress(0);
    setRaceState('running');
    setRunToken((current) => current + 1);
  };

  const shownValue = (value: number) => `${(value * progress).toFixed(2)}%`;
  const statusText =
    raceState === 'idle'
      ? '条件已选定，等待开始核对。'
      : raceState === 'running'
        ? `正在从零基线增长到 ${datasetLabel} · ${pretrainLabel} 的报告值。`
        : `核对完成：结果停在 Table 1 报告值，FAA 越高越好。`;

  return (
    <HideScene chapter="暗房架 10 · 终检台" cue="统一协议下，收益与代价一起核对" tone="green">
      <div className="hide-grid hide-ch10-layout">
        <HidePanel
          title="Table 1 · 最终 FAA 核对"
          meta="FAA ↑ · % · 3 seeds/splits"
          tone="green"
          className="hide-ch10-results-panel"
        >
          <div className="hide-ch10-selector-block">
            <div className="hide-ch10-selector-row">
              <span className="hide-ch10-selector-label">数据集</span>
              <HideSegment
                value={dataset}
                options={datasetOptions}
                onChange={selectDataset}
                label="选择持续学习数据集"
                className="hide-ch10-dataset-segment"
              />
            </div>
            <div className="hide-ch10-selector-row">
              <span className="hide-ch10-selector-label">预训练</span>
              <HideSegment
                value={pretrain}
                options={pretrainOptions}
                onChange={selectPretrain}
                label="选择预训练范式"
                className="hide-ch10-pretrain-segment"
              />
            </div>
          </div>

          <div className="hide-ch10-condition-strip">
            <div>
              <span>当前化学条件</span>
              <strong>{datasetLabel} · {pretrainLabel}</strong>
              <small>十任务类别增量学习 · 最终平均准确率</small>
            </div>
            <div className="hide-ch10-condition-badges">
              <HideBadge tone="green">ViT-B/16</HideBadge>
              <HideBadge tone="blue">3 次随机种子 / 任务划分</HideBadge>
            </div>
          </div>

          <div className="hide-ch10-race-head">
            <div>
              <span>结果赛道</span>
              <strong>最佳基线 → 未加 CR → 完整模型</strong>
            </div>
            <button
              type="button"
              className="hide-ch10-verify-button"
              onClick={startVerification}
              aria-busy={raceState === 'running'}
              aria-describedby="hide-ch10-race-status"
            >
              开始核对
            </button>
            <p id="hide-ch10-race-status" role="status" aria-live="polite">
              {statusText}
            </p>
          </div>

          <div
            className={raceState === 'complete' ? 'hide-ch10-result-bars hide-is-complete' : 'hide-ch10-result-bars'}
            role="list"
            aria-label={`${datasetLabel} 在 ${pretrainLabel} 下的 Table 1 结果核对`}
          >
            <div role="listitem">
              <HideBar
                label={`最佳基线 · ${result.baseline}`}
                value={result.baselineValue * progress}
                max={100}
                tone="blue"
                note={shownValue(result.baselineValue)}
              />
            </div>
            <div role="listitem">
              <HideBar
                label="HiDe-Prompt · 未加 CR（WTP+TII+TAP）"
                value={result.noCr * progress}
                max={100}
                tone="orange"
                note={shownValue(result.noCr)}
              />
            </div>
            <div role="listitem">
              <HideBar
                label="HiDe-Prompt · 完整模型（+CR）"
                value={result.full * progress}
                max={100}
                tone="green"
                note={shownValue(result.full)}
              />
            </div>
            <i className="hide-ch10-finish-line" aria-hidden="true" />
          </div>

          <div className="hide-ch10-result-summary">
            <HideMetric
              label="本次 FAA 领先"
              value={raceState === 'complete' ? `+${lead.toFixed(2)} 个百分点` : '等待核对'}
              tone="green"
              note={`完整模型 − ${result.baseline}`}
            />
            <HideMetric
              label="完整模型 FAA"
              value={raceState === 'complete' ? `${result.full.toFixed(2)}%` : '等待核对'}
              tone="blue"
              note={`${datasetLabel} · ${pretrainLabel}`}
            />
          </div>

          <HideNote title="统一协议" tone="green">
            ViT-B/16 主干，十任务 CIL；表中 FAA 为三次不同随机种子与任务划分的均值，
            FAA 越高越好。未加 CR 的数值对应 Table 3 的 WTP+TII+TAP。
          </HideNote>
        </HidePanel>

        <div className="hide-side-stack hide-ch10-side-stack">
          <HidePanel title="代价与适用边界" meta="同一协议之外的成本事实" tone="orange">
            <HideSegment
              value={detailView}
              options={detailOptions}
              onChange={setDetailView}
              label="切换代价或适用边界"
              className="hide-ch10-detail-segment"
            />

            {detailView === 'cost' ? (
              <div className="hide-ch10-cost-view">
                <div className="hide-ch10-cost-grid">
                  <HideMetric
                    label="显存 · Split CIFAR-100"
                    value="16141 MB"
                    tone="green"
                    note="HiDe-Prompt；CODA-Prompt 为 25325 MB"
                  />
                  <HideMetric
                    label="训练时间 · 单卡 A100"
                    value="2.80 h"
                    tone="orange"
                    note="HiDe-Prompt；CODA-Prompt 为 2.08 h"
                  />
                </div>
                <HideNote title="为什么显存更低，但时间更长？" tone="orange">
                  <strong>显存优势：</strong>
                  <br />• HiDe-Prompt 分别优化 WTP/TII/TAP，不需要端到端联合训练
                  <br />• CODA-Prompt 的加权提示汇总需要更大的中间激活缓存
                  <br /><br />
                  <strong>时间劣势：</strong>
                  <br />• 三个层级目标分别训练（WTP、TII、TAP + CR）
                  <br />• 每个任务需要采样伪表征（从类统计生成）
                  <br />• CODA-Prompt 端到端一次完成
                  <br /><br />
                  <strong>Trade-off：</strong>
                  <br />显存更省 → 可以用更小的 GPU 或更大的 batch
                  <br />时间稍长 → 但换来了显著更高的 FAA（+12-15 个百分点）
                </HideNote>
              </div>
            ) : (
              <div className="hide-ch10-limits-view">
                <HideKeyValue
                  label="1. 预训练前提"
                  value="假设有足够强的预训练"
                  note="需要能提供有意义表征的预训练模型；从零训练不适用"
                />
                <HideKeyValue
                  label="2. 主干范围"
                  value="主要适用于 Transformer"
                  note="提示机制依赖 Transformer 的序列拼接；CNN 需要其他适配方式"
                />
                <HideKeyValue
                  label="3. 知识更新"
                  value="冻结主干不能扩充预训练知识"
                  note="只更新提示与输出层；如果下游任务与预训练分布差异巨大，效果受限"
                />
                <HideNote title="这些限制意味着什么？" tone="purple">
                  <strong>适用场景：</strong>
                  <br />✅ 有强预训练模型（ViT、CLIP、DINOv2 等）
                  <br />✅ 下游任务与预训练分布不完全脱节
                  <br />✅ 追求参数高效（不想全量微调主干）
                  <br /><br />
                  <strong>不适用场景：</strong>
                  <br />❌ 从零开始训练（没有预训练知识可继承）
                  <br />❌ 下游任务与预训练完全无关（如医学影像用 ImageNet 预训练）
                  <br />❌ 非 Transformer 架构（ResNet、EfficientNet 等）
                </HideNote>
              </div>
            )}
          </HidePanel>

          <HideNote title="全表最大 FAA 领先" tone="purple">
            Split CIFAR-100 为 <b>+15.01 个百分点</b>，Split ImageNet-R 为
            <b>+9.61 个百分点</b>；这里是绝对百分点，不是相对百分比。
          </HideNote>
        </div>
      </div>
    </HideScene>
  );
}
