import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { GlossaryText, Term } from '../components/Glossary';

type InteractiveWidgetProps = WidgetProps & {
  mode?: string;
  guidedState?: string | number;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
};

const STAGES = [
  {
    id: 'stage-1',
    label: 'Stage 1',
    title: '先建立广覆盖',
    value: '65.5M',
    unit: 'Easy / Medium 跨任务样本',
    detail: '先覆盖文本、公式、表格与版面等解析任务。',
  },
  {
    id: 'stage-2',
    label: 'Stage 2',
    title: '再专修困难样本',
    value: '3.9M',
    unit: '总训练样本',
    detail: '其中包含 192K 专家验证 Hard；与 replay 数据一起训练。',
  },
  {
    id: 'stage-3',
    label: 'Stage 3',
    title: '最后对齐任务奖励',
    value: '192K',
    unit: '高质量样本 · GRPO',
    detail: '固定 G=16，并按各解析任务的评价指标提供奖励。',
  },
] as const;

export const StageTraining: React.FC<InteractiveWidgetProps> = ({
  chapterId,
  moduleId,
  mode = 'explore',
  guidedState,
  onInteract,
  onStateChange,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [replayEnabled, setReplayEnabled] = useState(false);
  const replayId = `replay-${chapterId}-${moduleId}`;
  const feedbackId = `feedback-${chapterId}-${moduleId}`;

  useEffect(() => {
    if (guidedState === undefined) return;
    const numericStep = typeof guidedState === 'number'
      ? guidedState
      : Math.max(0, Number(guidedState.match(/^stage-(\d)/)?.[1] ?? 1) - 1);
    const nextStep = Math.max(0, Math.min(STAGES.length - 1, numericStep));
    setActiveStep(nextStep);
    setReplayEnabled(
      typeof guidedState === 'string'
        ? guidedState.endsWith('replay-on')
        : nextStep >= 1,
    );
  }, [guidedState]);

  const feedback = useMemo(() => {
    if (activeStep === 0) {
      return 'Stage 1 用 65.5M Easy / Medium 跨任务样本先建立广泛覆盖。';
    }
    if (!replayEnabled) {
      return '定性教学示意：若只追加难例而不回放旧数据，已有能力的遗忘风险会上升；论文在 Stage 2 使用 replay。';
    }
    if (activeStep === 1) {
      return 'Stage 2 的 3.9M 是总量，其中包含 192K 专家验证 Hard；replay 用于抑制遗忘。';
    }
    return 'Stage 3 在 192K 高质量样本上用 GRPO 对齐任务奖励；下一模块会固定展示每组 16 个 rollout。';
  }, [activeStep, replayEnabled]);

  const goToStep = (nextStep: number) => {
    const clamped = Math.max(0, Math.min(STAGES.length - 1, nextStep));
    setActiveStep(clamped);
    if (clamped === 0) setReplayEnabled(false);
    onInteract?.();
    onStateChange?.(`stage-${clamped + 1}${clamped > 0 && replayEnabled ? '-replay-on' : ''}`);
  };

  const toggleReplay = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setReplayEnabled(enabled);
    onInteract?.();
    onStateChange?.(`stage-${activeStep + 1}-replay-${enabled ? 'on' : 'off'}`);
  };

  return (
    <section
      className={`train-root train-root--stage-${activeStep + 1} ${replayEnabled ? 'has-replay' : 'no-replay'}`}
      data-mode={mode}
      data-guided-state={guidedState}
      data-stage={activeStep + 1}
      data-replay={replayEnabled ? 'on' : 'off'}
      style={{ '--train-progress': `${activeStep * 50}%` } as React.CSSProperties}
      aria-label="MinerU2.5-Pro 三阶段训练"
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">CURRICULUM · REPLAY · GRPO</p>
          <h5>不同质量的数据，承担不同训练职责</h5>
        </div>
        <div className="lab-tags" aria-label="内容标记">
          <span className="lab-tag lab-tag--fact">规模为论文事实</span>
          <span className="lab-tag lab-tag--demo">Replay 效果仅定性示意</span>
        </div>
      </header>

      <div className="lab-inline-glossary" aria-label="点击解释图中训练术语">
        <span>图内解释</span>
        <Term id="sft">SFT</Term>
        <Term id="replay">Replay</Term>
        <Term id="grpo">GRPO</Term>
        <Term id="hard">Hard</Term>
      </div>

      <div className="train-progress">
        <span>当前进度：{activeStep + 1} / 3</span>
        <progress value={activeStep + 1} max={3}>
          {activeStep + 1} / 3
        </progress>
      </div>

      <div className="train-motion-flow" aria-hidden="true">
        <span className="train-motion-flow__track"><i /></span>
        <span className="train-motion-flow__node train-motion-flow__node--1">1</span>
        <span className="train-motion-flow__node train-motion-flow__node--2">2</span>
        <span className="train-motion-flow__node train-motion-flow__node--3">3</span>
        <span className="train-motion-flow__packet" />
        <span className="train-motion-flow__replay"><i />REPLAY</span>
      </div>

      <ol className="train-stages" aria-label="三阶段训练路径">
        {STAGES.map((stage, index) => (
          <li
            key={stage.id}
            className={index === activeStep ? 'is-current' : index < activeStep ? 'is-complete' : 'is-pending'}
            aria-current={index === activeStep ? 'step' : undefined}
          >
            <span className="train-stage__index">{index + 1}</span>
            <small>{stage.label}</small>
            <h6>{stage.title}</h6>
            <strong>{stage.value}</strong>
            <b><GlossaryText text={stage.unit} /></b>
            <p><GlossaryText text={stage.detail} /></p>
          </li>
        ))}
      </ol>

      <div className={`train-replay ${replayEnabled ? 'is-on' : 'is-off'}`}>
        <div>
          <strong>Replay 旧能力回放</strong>
          <small>{activeStep === 0 ? '进入 Stage 2 后启用' : '与困难样本一起训练'}</small>
        </div>
        <label className="lab-switch" htmlFor={replayId}>
          <input
            id={replayId}
            type="checkbox"
            checked={replayEnabled}
            disabled={activeStep === 0}
            onChange={toggleReplay}
            aria-describedby={feedbackId}
          />
          <span>{replayEnabled ? '已开启' : '未开启'}</span>
        </label>
      </div>

      <div className="train-stepper" aria-label="切换训练阶段">
        <button
          type="button"
          onClick={() => goToStep(activeStep - 1)}
          disabled={activeStep === 0}
        >
          ← 上一阶段
        </button>
        <strong>{STAGES[activeStep].label}</strong>
        <button
          type="button"
          className="lab-primary-action"
          onClick={() => goToStep(activeStep + 1)}
          disabled={activeStep === STAGES.length - 1}
        >
          {activeStep === STAGES.length - 1 ? '三阶段已完成' : '下一阶段 →'}
        </button>
      </div>

      <p
        id={feedbackId}
        className={`lab-feedback ${activeStep === 2 && replayEnabled ? 'lab-feedback--good' : !replayEnabled && activeStep > 0 ? 'lab-feedback--warn' : ''}`}
        aria-live="polite"
      >
        <GlossaryText text={feedback} />
      </p>

      <p className="lab-boundary">
        <GlossaryText text="口径提醒：65.5M 是 Stage 1 跨任务样本；3.9M 是 Stage 2 总量并包含 192K Hard；Stage 3 使用 192K 高质量样本。三者不能相互替换。" />
      </p>
    </section>
  );
};

export default StageTraining;
