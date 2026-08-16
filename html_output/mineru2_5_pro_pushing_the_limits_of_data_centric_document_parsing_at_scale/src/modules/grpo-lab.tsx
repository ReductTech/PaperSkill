import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { GlossaryText, Term } from '../components/Glossary';

type InteractiveWidgetProps = WidgetProps & {
  mode?: string;
  guidedState?: string | number;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
};

const METRICS = [
  { id: 'Edit Distance', slug: 'edit-distance', task: '文本', explanation: '比较字符序列与参考答案的距离' },
  { id: 'CDM', slug: 'cdm', task: '公式', explanation: '评价公式解析结果' },
  { id: 'TEDS', slug: 'teds', task: '表格', explanation: '评价表格结构与内容相似度' },
  { id: 'IoU', slug: 'iou', task: '版面', explanation: '评价预测区域与参考区域的重叠' },
] as const;

type MetricId = typeof METRICS[number]['id'];

const RANKINGS: Record<MetricId, readonly number[]> = {
  'Edit Distance': [3, 11, 6, 15, 1, 9, 13, 4, 16, 7, 2, 12, 8, 14, 5, 10],
  CDM: [8, 2, 14, 5, 12, 16, 6, 9, 1, 13, 4, 11, 7, 15, 3, 10],
  TEDS: [12, 4, 9, 1, 15, 7, 13, 5, 16, 2, 10, 14, 6, 11, 3, 8],
  IoU: [5, 13, 1, 10, 7, 16, 3, 12, 8, 14, 4, 11, 2, 9, 15, 6],
};

export const GrpoLab: React.FC<InteractiveWidgetProps> = ({
  chapterId,
  moduleId,
  mode = 'explore',
  guidedState,
  onInteract,
  onStateChange,
}) => {
  const [metric, setMetric] = useState<MetricId>('Edit Distance');
  const groupName = `grpo-metric-${chapterId}-${moduleId}`;
  const feedbackId = `feedback-${chapterId}-${moduleId}`;

  useEffect(() => {
    if (guidedState === undefined) return;
    const selected = typeof guidedState === 'number'
      ? METRICS[Math.max(0, Math.min(METRICS.length - 1, guidedState))]
      : METRICS.find((item) => guidedState === `metric-${item.slug}`) ?? METRICS[0];
    setMetric(selected.id);
  }, [guidedState]);

  const selectedMetric = METRICS.find((item) => item.id === metric) ?? METRICS[0];
  const ranking = useMemo(() => RANKINGS[metric], [metric]);

  const chooseMetric = (nextMetric: typeof METRICS[number]) => {
    setMetric(nextMetric.id);
    onInteract?.();
    onStateChange?.(`metric-${nextMetric.slug}`);
  };

  return (
    <section
      className="lab-root lab-grpo"
      data-mode={mode}
      data-guided-state={guidedState}
      data-metric={selectedMetric.slug}
      aria-label="GRPO 组内相对奖励实验"
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">GROUP-RELATIVE REWARD</p>
          <h5>同一道题生成 16 个候选，再按任务指标组内排序</h5>
        </div>
        <div className="lab-tags" aria-label="内容标记">
          <span className="lab-tag lab-tag--fact">论文事实 · G = 16</span>
          <span className="lab-tag lab-tag--demo">相对次序为教学示意</span>
        </div>
      </header>

      <div className="lab-inline-glossary" aria-label="点击解释图中训练术语">
        <span>图内解释</span>
        <Term id="grpo">GRPO</Term>
        <Term id="rollout">G = 16 Rollout</Term>
        <Term id="edit-distance">Edit Distance</Term>
        <Term id="cdm">CDM</Term>
        <Term id="teds">TEDS</Term>
        <Term id="iou">IoU</Term>
      </div>

      <fieldset className="lab-choice-group" aria-describedby={feedbackId}>
        <legend>切换任务奖励</legend>
        {METRICS.map((item) => {
          const inputId = `${groupName}-${item.slug}`;
          return (
            <label key={item.id} htmlFor={inputId} className={metric === item.id ? 'is-selected' : ''}>
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={item.id}
                checked={metric === item.id}
                onChange={() => chooseMetric(item)}
              />
              <strong>{item.id}</strong>
              <span>{item.task}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="lab-grpo__group">
        <div className="lab-grpo__group-head">
          <div>
            <span>当前任务</span>
            <strong>{selectedMetric.task}</strong>
          </div>
          <div>
            <span>rollout 数</span>
            <strong>16</strong>
          </div>
          <p className="lab-grpo__metric-explanation" key={metric}>{selectedMetric.explanation}</p>
        </div>

        <ol className="lab-rollouts" aria-label={`16 个候选按 ${metric} 从高到低排列`}>
          {ranking.map((candidate, index) => (
            <li
              key={candidate}
              className={index < 3 ? 'is-top' : index >= 13 ? 'is-low' : 'is-middle'}
              data-rank={index + 1}
              aria-label={`第 ${index + 1} 名，候选 C${String(candidate).padStart(2, '0')}`}
              style={{
                '--rollout-left': `${(index % 8) * 12.5}%`,
                '--rollout-top': `${Math.floor(index / 8) * 58}px`,
                '--rollout-left-mobile': `${(index % 4) * 25}%`,
                '--rollout-top-mobile': `${Math.floor(index / 4) * 54}px`,
                '--rollout-delay': `${index * 22}ms`,
              } as React.CSSProperties}
            >
              <span className="lab-rollout__dot" aria-hidden="true" />
              <b>#{index + 1}</b>
              <small>C{String(candidate).padStart(2, '0')}</small>
            </li>
          ))}
        </ol>

        <div className="lab-grpo__scale" aria-hidden="true">
          <span>组内较高</span>
          <i />
          <span>组内较低</span>
        </div>
      </div>

      <p id={feedbackId} className="lab-feedback lab-feedback--good" aria-live="polite">
        <GlossaryText text={`当前用 ${metric} 为${selectedMetric.task}候选提供组内相对反馈；排序只表示同组谁更好，不是跨样本的绝对分数。`} />
      </p>

      <p className="lab-boundary">
        <GlossaryText text="论文只固定每个样本 16 个 rollout；页面不允许修改 G，也不虚构奖励数值。奖励与最终指标接近，仍需警惕指标过拟合。" />
      </p>
    </section>
  );
};

export default GrpoLab;
