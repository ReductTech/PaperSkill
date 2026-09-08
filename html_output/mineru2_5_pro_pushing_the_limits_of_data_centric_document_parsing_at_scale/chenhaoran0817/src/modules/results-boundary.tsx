import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type InteractiveWidgetProps = WidgetProps & {
  mode?: string;
  guidedState?: string | number;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
};

type EvidenceView = 'base' | 'hard' | 'boundary';

const VIEWS: Array<{ id: EvidenceView; label: string }> = [
  { id: 'base', label: 'Base 对比' },
  { id: 'hard', label: 'Hard 对比' },
  { id: 'boundary', label: '结论边界' },
];

const ABLATION = [
  { id: 's0', label: '固定架构基线', score: '92.98', gain: '起点' },
  { id: 's1', label: '+ Stage 1', score: '94.29', gain: '+1.31' },
  { id: 's2', label: '+ Stage 2', score: '95.25', gain: '+0.96' },
  { id: 's3', label: '+ Stage 3', score: '95.69', gain: '+0.45' },
] as const;

export const ResultsBoundary: React.FC<InteractiveWidgetProps> = ({
  chapterId,
  moduleId,
  mode = 'explore',
  guidedState,
  onInteract,
  onStateChange,
}) => {
  const [view, setView] = useState<EvidenceView>('base');
  const groupName = `result-view-${chapterId}-${moduleId}`;
  const feedbackId = `feedback-${chapterId}-${moduleId}`;

  useEffect(() => {
    if (guidedState === undefined) return;
    const selected = typeof guidedState === 'number'
      ? VIEWS[Math.max(0, Math.min(VIEWS.length - 1, guidedState))]
      : VIEWS.find((item) => guidedState === `view-${item.id}`) ?? VIEWS[0];
    setView(selected.id);
  }, [guidedState]);

  const feedback = useMemo(() => {
    if (view === 'base') {
      return 'Base 上 MinerU2.5-Pro 为 96.12，低于该表最佳值 96.19；优势并非来自简单题全面第一。';
    }
    if (view === 'hard') {
      return '按 v2 主文口径，Hard 为 94.08，比较项 GLM-OCR / PaddleOCR-VL-1.5 为 92.01，对应 +2.07；排名口径另见附录与研究者注。';
    }
    return '最稳妥的结论是：固定 1.2B 架构时，完整数据工程与配套训练策略是一条有效提升路径。';
  }, [view]);

  const chooseView = (nextView: EvidenceView) => {
    setView(nextView);
    onInteract?.();
    onStateChange?.(`view-${nextView}`);
  };

  return (
    <section
      className={`result-root result-root--${view}`}
      data-mode={mode}
      data-guided-state={guidedState}
      aria-label="实验结果与证据边界"
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">RESULTS · CLAIM BOUNDARY</p>
          <h5>先看增益，再决定论文真正证明了什么</h5>
        </div>
        <div className="lab-tags" aria-label="内容标记">
          <span className="lab-tag lab-tag--fact">论文报告值</span>
          <span className="lab-tag lab-tag--boundary">研究者复核</span>
        </div>
      </header>

      <div className="result-waterfall" aria-label="Full 阶段级消融瀑布">
        <div className="result-waterfall__headline">
          <span>Full · 固定同一 1.2B 架构</span>
          <strong>+2.71</strong>
        </div>
        <ol key={`waterfall-${view}-${String(guidedState ?? 'explore')}`} className="result-waterfall__bars">
          {ABLATION.map((step) => (
            <li key={step.id} className={`result-waterfall__step result-waterfall__step--${step.id}`}>
              <span>{step.gain}</span>
              <div className="result-waterfall__bar">
                <strong>{step.score}</strong>
              </div>
              <small>{step.label}</small>
            </li>
          ))}
        </ol>
        <p>
          端点：95.69 − 92.98 = <strong>2.71</strong>；分段报告 1.31 + 0.96 + 0.45 = <strong>2.72</strong>，差异来自四舍五入。
        </p>
      </div>

      <fieldset className="result-switch" aria-describedby={feedbackId}>
        <legend>切换证据视角</legend>
        {VIEWS.map((item) => {
          const inputId = `${groupName}-${item.id}`;
          return (
            <label key={item.id} htmlFor={inputId} className={view === item.id ? 'is-selected' : ''}>
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={item.id}
                checked={view === item.id}
                onChange={() => chooseView(item.id)}
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="result-evidence" data-view={view} aria-live="polite">
        {view === 'base' ? (
          <section className="result-comparison result-comparison--base">
            <header><span>Base</span><strong>Pro 并非第一</strong></header>
            <div>
              <article>
                <span>MinerU2.5-Pro</span>
                <strong>96.12</strong>
              </article>
              <i aria-hidden="true">vs</i>
              <article>
                <span>该表最佳值</span>
                <strong>96.19</strong>
              </article>
            </div>
            <p>先保留反例：数据中心流程并未让模型在 Base 上成为绝对第一。</p>
          </section>
        ) : null}

        {view === 'hard' ? (
          <section className="result-comparison result-comparison--hard">
            <header><span>Hard · v2 主文口径</span><strong>困难集拉开差距</strong></header>
            <div>
              <article>
                <span>MinerU2.5-Pro</span>
                <strong>94.08</strong>
              </article>
              <i aria-hidden="true">vs</i>
              <article>
                <span>v2 主文比较项（GLM-OCR / PaddleOCR-VL-1.5）</span>
                <strong>92.01</strong>
              </article>
            </div>
            <p className="result-margin">主文报告领先 +2.07</p>
          </section>
        ) : null}

        {view === 'boundary' ? (
          <section className="result-claims" aria-label="结论归类">
            <article className="result-claim result-claim--verified">
              <span>已验证</span>
              <strong>组合路径有效</strong>
              <p>固定 1.2B 架构时，完整数据工程与三阶段训练带来端点提升。</p>
            </article>
            <article className="result-claim result-claim--unknown">
              <span>未验证</span>
              <strong>单组件因果贡献</strong>
              <p>现有阶段级消融不能分别归因于 DDAS、CMCV 或 Judge-and-Refine。</p>
            </article>
            <article className="result-claim result-claim--next">
              <span>下一步</span>
              <strong>语义、泛化与成本</strong>
              <p>继续验证语义等价、高层文档关系、模型池偏置以及完整数据生产成本。</p>
            </article>
          </section>
        ) : null}
      </div>

      <aside className="result-research-note">
        <strong>研究者注 · v2 内部口径不一致</strong>
        <p>
          v2 主文使用 94.08 对 92.01，并写作领先 +2.07；同一 v2 的附录 Table 8
          又列出 PaddleOCR-VL 为 92.48，对应领先 +1.60。页面并列保留两种口径，不替论文擅自消解差异。
        </p>
      </aside>

      <p
        id={feedbackId}
        className={`lab-feedback ${view === 'hard' || view === 'boundary' ? 'lab-feedback--good' : ''}`}
        aria-live="polite"
      >
        {feedback}
      </p>
    </section>
  );
};

export default ResultsBoundary;
