import { useState } from 'react';
import type { WidgetProps } from './registry';

type FailureMode = 'all-pass' | 'explore-fail' | 'rescue-fail' | 'return-fail';
type StageState = 'success' | 'failed' | 'locked';

const stages = ['搜索', '救援', '返回', '交接'] as const;
const controls: Array<{ id: FailureMode; label: string }> = [
  { id: 'all-pass', label: '全部通过' },
  { id: 'explore-fail', label: '搜索失败' },
  { id: 'rescue-fail', label: '救援失败' },
  { id: 'return-fail', label: '返回失败' },
];

const firstFailure: Record<FailureMode, number> = {
  'all-pass': -1,
  'explore-fail': 0,
  'rescue-fail': 1,
  'return-fail': 2,
};

const feedback: Record<FailureMode, string> = {
  'all-pass': '四个阶段连续成立，完整任务才能到达最终交接。',
  'explore-fail': '搜索阶段首先失败：目标没有被发现，后续阶段没有可继续的任务状态。',
  'rescue-fail': '救援阶段首先失败：即使已找到目标，返回与交接仍无法发生。',
  'return-fail': '返回阶段首先失败：搜索与救援成功，也不等于能够完成最终交接。',
};

function stateFor(mode: FailureMode, index: number): StageState {
  const failure = firstFailure[mode];
  if (failure === -1 || index < failure) return 'success';
  if (index === failure) return 'failed';
  return 'locked';
}

const stateLabel: Record<StageState, string> = {
  success: '成功',
  failed: '失败',
  locked: '锁定 / 未到达',
};

export function BenchmarkGap(_: WidgetProps) {
  const [mode, setMode] = useState<FailureMode>('explore-fail');

  return (
    <div className="benchmark-gap">
      <section className="benchmark-local" aria-labelledby="local-benchmark-title">
        <div className="benchmark-kicker">01 · 局部问题</div>
        <h5 id="local-benchmark-title">已有基准在测什么？</h5>
        <div className="benchmark-card-grid">
          <article>
            <span className="benchmark-card-icon">↗</span>
            <strong>VLN</strong>
            <p>遵循导航指令</p>
            <small>按指令完成导航</small>
          </article>
          <article>
            <span className="benchmark-card-icon">◎</span>
            <strong>操作交互</strong>
            <p>完成局部交互</p>
            <small>在局部环境中交互</small>
          </article>
          <article>
            <span className="benchmark-card-icon">⌖</span>
            <strong>户外导航</strong>
            <p>到达已知目的地</p>
            <small>到达已知目的地</small>
          </article>
        </div>
        <p className="benchmark-summary">它们分别回答不同的局部问题，并不是“无效的测试”。</p>
      </section>

      <section className="benchmark-sequence" aria-labelledby="sequence-title">
        <div className="benchmark-kicker">02 · 顺序组合</div>
        <h5 id="sequence-title">一旦串起来，前一步会改变后一步是否还能发生</h5>
        <div className="sequence-strip" aria-label="搜索、救援、返回、交接顺序任务链">
          {stages.map((stage, index) => (
            <div className="sequence-item" key={stage}>
              <span>{index + 1}</span>
              <strong>{stage}</strong>
              {index < stages.length - 1 ? <b aria-hidden="true">→</b> : null}
            </div>
          ))}
        </div>
        <p>这里的问题不只是“是否会做每一步”，而是：前一步失败后，后面的任务还能不能继续成立？</p>
      </section>

      <section className="cascade-demo" aria-labelledby="cascade-title">
        <div className="cascade-heading">
          <div>
            <div className="benchmark-kicker">03 · 级联失败</div>
            <h5 id="cascade-title">选择第一个失败阶段</h5>
          </div>
        </div>
        <div className="cascade-controls" role="group" aria-label="选择第一个失败阶段">
          {controls.map((control) => (
            <button
              key={control.id}
              type="button"
              className={mode === control.id ? 'selected' : ''}
              aria-pressed={mode === control.id}
              onClick={() => setMode(control.id)}
            >
              {control.label}
            </button>
          ))}
        </div>
        <div className="cascade-stage-grid" aria-live="polite">
          {stages.map((stage, index) => {
            const state = stateFor(mode, index);
            return (
              <div className={`cascade-stage ${state}`} key={stage}>
                <span className="cascade-state-icon">{state === 'success' ? '✓' : state === 'failed' ? '×' : '—'}</span>
                <strong>{stage}</strong>
                <small>{stateLabel[state]}</small>
              </div>
            );
          })}
        </div>
        <div className={`cascade-feedback ${mode === 'all-pass' ? 'success' : 'failure'}`} aria-live="polite">
          {feedback[mode]}
        </div>
      </section>

    </div>
  );
}
