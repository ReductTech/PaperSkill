import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type InteractiveWidgetProps = WidgetProps & {
  mode?: string;
  guidedState?: string | number;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
};

const PIPELINE = [
  '结构输出',
  '渲染成图',
  '与源图比较',
  '定位并局部修正',
  '残余交专家',
];

export const RenderVerify: React.FC<InteractiveWidgetProps> = ({
  chapterId,
  moduleId,
  mode = 'explore',
  guidedState,
  onInteract,
  onStateChange,
}) => {
  const [comparePosition, setComparePosition] = useState(20);
  const [repaired, setRepaired] = useState(false);
  const inputId = `render-compare-${chapterId}-${moduleId}`;
  const feedbackId = `feedback-${chapterId}-${moduleId}`;

  useEffect(() => {
    if (guidedState === undefined) return;
    if (typeof guidedState === 'number') {
      setComparePosition(guidedState >= 1 ? 80 : 20);
      setRepaired(guidedState >= 2);
      return;
    }
    if (guidedState === 'repaired') {
      setComparePosition(80);
      setRepaired(true);
      return;
    }
    const match = guidedState.match(/^compare-p(\d{1,2})$/);
    if (match) {
      setComparePosition(Math.max(0, Math.min(100, Number(match[1]) * 10)));
      setRepaired(false);
    }
  }, [guidedState]);

  const mismatchVisible = comparePosition >= 45;

  const feedback = useMemo(() => {
    if (repaired) {
      return '教学示例已完成局部回正；真实流程中，自动修不好的残余样本才继续交给专家。';
    }
    if (mismatchVisible) {
      return '渲染结果的第二行明显偏离源图锚点：代码表面隐藏的结构错误已经变成可定位的视觉异常。';
    }
    return '向右拖动对比线，让模型渲染结果逐渐覆盖源图。';
  }, [mismatchVisible, repaired]);

  const changeComparison = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPosition = Number(event.target.value);
    setComparePosition(nextPosition);
    onInteract?.();
    onStateChange?.(`compare-p${Math.round(nextPosition / 10)}`);
  };

  const repairRegion = () => {
    setRepaired(true);
    onInteract?.();
    onStateChange?.('repaired');
  };

  return (
    <section
      className={`lab-root lab-render ${repaired ? 'is-repaired' : mismatchVisible ? 'has-mismatch' : 'is-comparing'}`}
      data-mode={mode}
      data-guided-state={guidedState}
      aria-label="Render-then-Verify 结构错误复检"
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">RENDER · COMPARE · REFINE</p>
          <h5>把结构错误放回视觉域</h5>
        </div>
        <div className="lab-tags" aria-label="内容标记">
          <span className="lab-tag lab-tag--demo">源码与错位均为教学示意</span>
          <span className="lab-tag lab-tag--fact">流程来自论文</span>
        </div>
      </header>

      <div className="lab-render__source">
        <div className="lab-render__source-head">
          <strong>结构序列</strong>
          <span>语法看似可通过</span>
        </div>
        <code>{'\\begin{aligned} S &= \\sum_i x_i \\\\ &= \\mu + \\epsilon \\end{aligned}'}</code>
      </div>

      <div
        className={`lab-compare ${repaired ? 'is-repaired' : ''}`}
        style={{ '--split': `${comparePosition}%` } as React.CSSProperties}
        aria-label={`源图与渲染图对比，渲染层覆盖 ${comparePosition}%`}
      >
        <article className="lab-compare__layer lab-compare__layer--source">
          <span>源图参考</span>
          <div className="lab-formula-sheet">
            <p>S = ∑ᵢ₌₁ⁿ xᵢ</p>
            <p>= μ + ε</p>
          </div>
        </article>
        <article className="lab-compare__layer lab-compare__layer--rendered">
          <span>模型渲染</span>
          <div className="lab-formula-sheet">
            <p>S = ∑ᵢ₌₁ⁿ xᵢ</p>
            <p className={repaired ? 'is-fixed' : 'is-shifted'}>= μ + ε</p>
          </div>
        </article>
        <span className="lab-compare__divider" aria-hidden="true">
          <i />
        </span>
        <span className="lab-render__error-marker" aria-hidden="true">
          <i />
          <b>{repaired ? 'REPAIRED' : 'STRUCTURE MISMATCH'}</b>
        </span>
        <span className="lab-render__repair-trace" aria-hidden="true" />
      </div>

      <div className="lab-range-control">
        <label htmlFor={inputId}>拖动对比线</label>
        <input
          id={inputId}
          type="range"
          min="0"
          max="100"
          step="1"
          value={comparePosition}
          onChange={changeComparison}
          aria-describedby={feedbackId}
        />
        <output htmlFor={inputId}>{comparePosition}%</output>
      </div>

      <ol className="lab-pipeline" aria-label="Judge-and-Refine 论文流程">
        {PIPELINE.map((step, index) => (
          <li
            key={step}
            className={
              index <= (repaired ? 3 : mismatchVisible ? 2 : 1)
                ? 'is-active'
                : index === 4
                  ? 'is-fallback'
                  : ''
            }
          >
            <span>{index + 1}</span>
            <b>{step}</b>
          </li>
        ))}
      </ol>

      <div className="lab-actions lab-actions--center">
        <button
          type="button"
          className="lab-primary-action"
          onClick={repairRegion}
          disabled={!mismatchVisible || repaired}
          aria-describedby={feedbackId}
        >
          {repaired ? '局部已回正' : '让 Qwen3-VL-235B 局部修正'}
        </button>
      </div>

      <p
        id={feedbackId}
        className={`lab-feedback ${repaired ? 'lab-feedback--good' : mismatchVisible ? 'lab-feedback--warn' : ''}`}
        aria-live="polite"
      >
        {feedback}
      </p>

      <p className="lab-boundary">
        论文事实：Qwen3-VL-235B 执行 judge/refine，自动流程后的残余样本由专家兜底；论文未披露修复成功率、阈值或总成本。
      </p>
    </section>
  );
};

export default RenderVerify;
