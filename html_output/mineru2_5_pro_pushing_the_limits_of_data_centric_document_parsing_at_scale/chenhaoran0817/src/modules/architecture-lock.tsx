import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type InteractiveWidgetProps = WidgetProps & {
  mode?: string;
  guidedState?: string | number;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
};

export const ArchitectureLock: React.FC<InteractiveWidgetProps> = ({
  chapterId,
  moduleId,
  mode = 'explore',
  guidedState,
  onInteract,
  onStateChange,
}) => {
  const [locked, setLocked] = useState(false);
  const feedbackId = `feedback-${chapterId}-${moduleId}`;

  useEffect(() => {
    if (guidedState === undefined) return;
    setLocked(
      typeof guidedState === 'number'
        ? guidedState >= 1
        : guidedState === 'locked' || guidedState === 'complete',
    );
  }, [guidedState]);

  const lockArchitecture = () => {
    setLocked(true);
    onInteract?.();
    onStateChange?.('locked');
  };

  return (
    <section
      className={`lab-root lab-architecture ${locked ? 'is-complete' : 'is-ready'}`}
      data-mode={mode}
      data-guided-state={guidedState}
      aria-label="固定架构对照实验"
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">CONTROLLED COMPARISON</p>
          <h5>先固定唯一变量：部署架构</h5>
        </div>
        <div className="lab-tags" aria-label="内容标记">
          <span className="lab-tag lab-tag--fact">论文事实</span>
          <span className="lab-tag lab-tag--boundary">结论有边界</span>
        </div>
      </header>

      <div className="lab-architecture__frame">
        <div className="lab-architecture__status" role="status">
          <span className="lab-status-dot" aria-hidden="true" />
          <strong>{locked ? '1.2B ARCH · LOCKED' : '1.2B ARCH · 待锁定'}</strong>
          <small>比较前后使用同一套粗到细架构</small>
        </div>

        <div className="motion-architecture-lock" aria-hidden="true">
          <span className="motion-architecture-lock__rail" />
          <span className="motion-architecture-lock__shackle" />
          <b>{locked ? 'CONTROL LOCKED' : 'LOCK THE CONTROL VARIABLE'}</b>
        </div>

        <ol className="lab-architecture__flow" aria-label="固定的模型结构">
          <li>
            <span>视觉编码</span>
            <strong>NaViT-675M</strong>
          </li>
          <li>
            <span>解析路径</span>
            <strong>整页 → 局部</strong>
          </li>
          <li>
            <span>语言解码</span>
            <strong>Qwen2-0.5B</strong>
          </li>
        </ol>

        <div className={`lab-score-reveal ${locked ? 'is-visible' : ''}`} aria-live="polite">
          {locked ? (
            <>
              <span className="motion-score-item motion-score-label">Full</span>
              <strong className="motion-score-item motion-score-before">92.98</strong>
              <i className="motion-score-item motion-score-arrow" aria-hidden="true">→</i>
              <strong className="motion-score-item motion-score-after">95.69</strong>
              <b className="motion-score-item motion-score-gain">+2.71</b>
            </>
          ) : (
            <p>锁定后再读取结果，避免把提升误归因于换模型。</p>
          )}
        </div>
      </div>

      <div className="lab-actions lab-actions--center">
        <button
          type="button"
          className="lab-primary-action"
          onClick={lockArchitecture}
          disabled={locked}
          aria-pressed={locked}
          aria-describedby={feedbackId}
        >
          {locked ? '架构已锁定' : '锁定同一 1.2B 架构'}
        </button>
      </div>

      <p
        id={feedbackId}
        className={`lab-feedback ${locked ? 'lab-feedback--good' : ''}`}
        aria-live="polite"
      >
        {locked
          ? '结论：固定这一架构时，完整数据工程与配套训练流程带来论文报告的 2.71 分端点提升。'
          : '先锁定架构，再判断剩余提升来自哪条路径。'}
      </p>

      <p className="lab-boundary">
        边界：该对照支持“固定架构下完整流程有效”，不证明架构永远不重要，也不能拆出单个数据组件的独立贡献。
      </p>
    </section>
  );
};

export default ArchitectureLock;
