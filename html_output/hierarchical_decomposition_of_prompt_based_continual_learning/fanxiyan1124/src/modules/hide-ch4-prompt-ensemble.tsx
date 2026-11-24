import React, { useRef, useState } from 'react';
import {
  HideBadge,
  HideFormula,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSymbol,
} from './hide-kit';

const ALPHA_MIN = 0;
const ALPHA_MAX = 0.6;
const ALPHA_STEP = 0.01;
const DEFAULT_ALPHA = 0.1;
const TASK_COUNT = 5;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function HideCh4PromptEnsemble() {
  const [alpha, setAlpha] = useState(DEFAULT_ALPHA);
  const [taskIndex, setTaskIndex] = useState(2);
  const [dragging, setDragging] = useState(false);
  const exposureRef = useRef<HTMLDivElement>(null);

  const task = taskIndex + 1;
  const isFirstTask = task === 1;
  const oldPromptCount = Math.max(0, task - 1);
  const oldShare = isFirstTask ? 0 : alpha;
  const currentShare = 1 - oldShare;
  const previousTask = Math.max(1, task - 1);
  const handlePosition = alpha / ALPHA_MAX * 100;
  const oldTrackPosition = oldShare / ALPHA_MAX * 100;

  const updateAlpha = (next: number) => {
    setAlpha(Number(clamp(next, ALPHA_MIN, ALPHA_MAX).toFixed(2)));
  };

  const scrubAlpha = (clientX: number) => {
    const rect = exposureRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateAlpha((clientX - rect.left) / rect.width * ALPHA_MAX);
  };

  const receipt = isFirstTask
    ? 't=1 边界：当前提示 e₁ 直接作为首任务提示，不执行旧提示平均。'
    : alpha === 0
      ? `t=${task} 边界：旧提示权重为 0，最终只保留 e${task}；参数起点仍继承 e${previousTask}。`
      : alpha < 0.18
        ? `t=${task}：当前曝光 ${percent(currentShare)} 主导显影，旧提示仅占 ${percent(oldShare)}，提供轻量迁移。`
        : alpha < 0.36
          ? `t=${task}：旧提示合计 ${percent(oldShare)}，当前曝光 ${percent(currentShare)}；混合中已能明显看到旧纹理。`
          : `t=${task}：旧提示合计 ${percent(oldShare)}，超过当前曝光 ${percent(currentShare)}；这是用于观察边界的教学设置。`;

  return (
    <HideScene
      chapter="暗房架 04 · 提示曝光台"
      cue={isFirstTask ? '首任务直接使用 e₁' : '当前曝光与旧曝光共用一束光'}
      tone="orange"
    >
      <div className="hide-grid hide-ch4-layout">
        <HidePanel
          title="冻结提示柜与当前曝光"
          meta={`t=${task} · α=${alpha.toFixed(2)}`}
          tone="orange"
          className="hide-ch4-cabinet-panel"
        >
          <div className="hide-ch4-cabinet">
            <div className="hide-ch4-cabinet-heading">
              <div>
                <HideBadge tone="neutral">提示柜</HideBadge>
                <strong>{oldPromptCount} 条旧提示冻结</strong>
              </div>
              <span>点击任务卷切换序号</span>
            </div>

            <div className="hide-ch4-task-rail" role="group" aria-label="选择任务序号">
              {Array.from({ length: TASK_COUNT }, (_, index) => {
                const status = index < taskIndex ? '冻结' : index === taskIndex ? '当前' : '未到';
                return (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'hide-ch4-task-strip',
                      index < taskIndex ? 'hide-is-frozen' : '',
                      index === taskIndex ? 'hide-is-current' : '',
                      index > taskIndex ? 'hide-is-future' : '',
                    ].filter(Boolean).join(' ')}
                    aria-pressed={index === taskIndex}
                    aria-label={`切换到任务 ${index + 1}，当前状态 ${status}`}
                    onClick={() => setTaskIndex(index)}
                  >
                    <span>{`T${index + 1}`}</span>
                    <i aria-hidden="true" />
                    <small>{status}</small>
                  </button>
                );
              })}
            </div>

            <div className="hide-ch4-mixing-bench">
              <div className="hide-ch4-bench-heading">
                <span>旧曝光汇总</span>
                <span>当前负片</span>
                <span>混合后提示</span>
              </div>
              <div className="hide-ch4-light-path" aria-label={`旧提示占 ${percent(oldShare)}，当前提示占 ${percent(currentShare)}`}>
                <div className="hide-ch4-old-light" style={{ width: `${percent(oldShare)}` }}>
                  <span>{isFirstTask ? '无旧曝光' : `α Σ eᵢ · ${percent(oldShare)}`}</span>
                </div>
                <div className="hide-ch4-current-light" style={{ width: `${percent(currentShare)}` }}>
                  <span>{`(1−α)e${task} · ${percent(currentShare)}`}</span>
                </div>
                <div className="hide-ch4-mixed-print">
                  <b>{`p${task}`}</b>
                  <small>送入当前任务</small>
                </div>
              </div>
              <div className="hide-ch4-share-ruler" aria-hidden="true">
                <span style={{ width: `${percent(oldShare)}` }} />
                <i style={{ left: `${percent(oldShare)}` }} />
              </div>
            </div>

            <div
              ref={exposureRef}
              className={[
                'hide-ch4-exposure-strip',
                dragging ? 'hide-is-dragging' : '',
              ].filter(Boolean).join(' ')}
              role="slider"
              tabIndex={0}
              aria-label="拖动当前曝光条，调节旧提示与当前提示的混合比例"
              aria-orientation="horizontal"
              aria-valuemin={ALPHA_MIN}
              aria-valuemax={ALPHA_MAX}
              aria-valuenow={alpha}
              aria-valuetext={`alpha ${alpha.toFixed(2)}，旧提示占 ${percent(oldShare)}`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(true);
                scrubAlpha(event.clientX);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  scrubAlpha(event.clientX);
                }
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                setDragging(false);
              }}
              onPointerCancel={() => setDragging(false)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  updateAlpha(alpha - ALPHA_STEP);
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  updateAlpha(alpha + ALPHA_STEP);
                }
                if (event.key === 'PageDown') {
                  event.preventDefault();
                  updateAlpha(alpha - 0.1);
                }
                if (event.key === 'PageUp') {
                  event.preventDefault();
                  updateAlpha(alpha + 0.1);
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  updateAlpha(ALPHA_MIN);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  updateAlpha(ALPHA_MAX);
                }
              }}
            >
              <div className="hide-ch4-exposure-track" aria-hidden="true">
                <span className="hide-ch4-track-old" style={{ width: `${oldTrackPosition}%` }} />
                <b className="hide-ch4-exposure-handle" style={{ left: `${handlePosition}%` }}>
                  {alpha.toFixed(2)}
                </b>
              </div>
              <div className="hide-ch4-exposure-ticks" aria-hidden="true">
                <span>0</span>
                <span>0.1</span>
                <span>0.2</span>
                <span>0.3</span>
                <span>0.4</span>
                <span>0.5</span>
                <span>0.6</span>
              </div>
            </div>
          </div>

          <div className="hide-ch4-initializer" aria-label="提示参数初始化与混合的关系">
            <div>
              <span>上一提示</span>
              <strong>{isFirstTask ? '无' : `e${previousTask}`}</strong>
              <small>{isFirstTask ? '首任务无继承' : '参数起点'}</small>
            </div>
            <i aria-hidden="true" />
            <div>
              <span>初始副本</span>
              <strong>{isFirstTask ? 'pe₁ = e₁' : `pe${task} ← e${previousTask}`}</strong>
              <small>{isFirstTask ? '直接学习' : '先继承，后学习'}</small>
            </div>
            <i aria-hidden="true" />
            <div className="hide-is-output">
              <span>集成结果</span>
              <strong>{`p${task}`}</strong>
              <small>当前任务显影</small>
            </div>
          </div>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel title="混合份额" meta="界面范围 0.00–0.60" tone="blue">
            <div className="hide-metric-pair hide-ch4-metrics">
              <HideMetric
                label="旧提示"
                value={isFirstTask ? '无' : `${oldPromptCount} 条`}
                tone="neutral"
                note={isFirstTask ? '首任务边界' : '全部冻结'}
              />
              <HideMetric
                label="当前曝光"
                value={percent(currentShare)}
                tone="green"
                note={`1−α${isFirstTask ? ' 的直达规则' : ''}`}
              />
              <HideMetric
                label="继承曝光"
                value={isFirstTask ? '不适用' : percent(oldShare)}
                tone={oldShare > 0.36 ? 'orange' : 'blue'}
                note={isFirstTask ? 'p₁=e₁' : 'α 汇总旧提示'}
              />
            </div>

            <label className="hide-range-label hide-ch4-alpha-label" htmlFor="hide-ch4-alpha">
              <span>提示集成系数 <HideSymbol symbol="α" meaning="旧提示汇总在当前提示中的权重" /></span>
              <strong>{alpha.toFixed(2)}</strong>
            </label>
            <input
              id="hide-ch4-alpha"
              className="hide-ch4-alpha-input"
              type="range"
              min={ALPHA_MIN}
              max={ALPHA_MAX}
              step={ALPHA_STEP}
              value={alpha}
              aria-valuetext={`alpha ${alpha.toFixed(2)}`}
              onChange={(event) => updateAlpha(Number(event.target.value))}
            />
            <div className="hide-ch4-report-setting">
              <HideBadge tone="orange">主实验 α=0.1</HideBadge>
              <span>拖到更大值只用于观察教学边界</span>
            </div>
          </HidePanel>

          <HidePanel title="集成回执" meta={`t=${task}`} tone={alpha > 0.36 ? 'orange' : 'green'}>
            <div className="hide-ch4-receipt" role="status" aria-live="polite">
              <span>{isFirstTask ? '首任务' : '已合并'}</span>
              <p>{receipt}</p>
            </div>
            <HideFormula
              lead="提示集成"
              note={<>旧项从 <HideSymbol symbol="i=1" meaning="第一条已见任务提示" /> 汇总到 <HideSymbol symbol="t−1" meaning="紧邻当前任务的上一提示" />；当前项始终保留。</>}
            >
              <HideSymbol symbol="pₜ" meaning="第 t 个任务最终使用的集成提示" />
              {' = '}
              <HideSymbol symbol="α" meaning="旧提示汇总权重，主实验取 0.1" />
              {' Σ'}
              <HideSymbol symbol="eᵢ" meaning="第 i 个任务的冻结提示" />
              {' + (1−'}
              <HideSymbol symbol="α" meaning="当前提示保留份额由 1 减 alpha 得到" />
              {') '}
              <HideSymbol symbol="eₜ" meaning="当前任务正在学习的提示" />
            </HideFormula>
            <HideNote title="继承与集成是两件事" tone="blue">
              <HideSymbol symbol="peₜ" meaning="当前提示的初始副本" /> 先把参数起点设为
              <HideSymbol symbol="eₜ₋₁" meaning="上一任务已经学好的提示" />；随后才按公式把全部旧提示与当前提示混合。
              首任务没有旧项，直接使用 <HideSymbol symbol="e₁" meaning="第一个任务的提示" />。
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
