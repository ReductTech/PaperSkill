import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

interface CoreStep {
  id: string;
  label: string;
  action: string;
  detail: string;
}

interface CoreLine {
  id: 'where' | 'when';
  title: string;
  question: string;
  colorLabel: string;
  summary: string;
  steps: CoreStep[];
}

const LINES: CoreLine[] = [
  {
    id: 'where',
    title: '看哪里',
    question: '有限的视觉预算该花在哪些 patch？',
    colorLabel: '视觉计算分配',
    summary: 'Codec 提供变化线索，Importance S 完成排序，Top-k 按预算保留 patch，Shared 3D RoPE 再把原始时空坐标带进 Mage-ViT。',
    steps: [
      { id: 'codec', label: 'Codec 信号', action: '找到变化', detail: '复用 HEVC 已有的运动与残差信号，先定位哪里移动、哪里没有被预测解释。' },
      { id: 'importance', label: 'Importance S', action: '形成排序', detail: '把 codec 的编码代价变成 patch-level 排序依据；分数高表示更值得保留，不表示已经理解语义。' },
      { id: 'topk', label: 'Top-k Selection', action: '按预算筛选', detail: '给定视觉预算 B，只保留排名靠前的 patch，把计算集中到变化更强的位置。' },
      { id: 'rope', label: '3D RoPE + Mage-ViT', action: '保住坐标并编码', detail: '稀疏 patch 仍携带原始 (t,x,y)，再由 Mage-ViT 编码；稀疏不等于时空失序。' },
    ],
  },
  {
    id: 'when',
    title: '什么时候说',
    question: '连续视频一直进来，何时才启动语言生成？',
    colorLabel: '流式响应决策',
    summary: 'EPFE 融合新片段，M_per 递归保存感知摘要，Cognition Gate 决定 SILENT 或 SPEAK；只有 SPEAK 后，Local N-window 才交给 Qwen 生成。',
    steps: [
      { id: 'epfe', label: 'EPFE', action: '融合新证据', detail: '每来一段视频，EPFE 把当前视觉特征与上一轮感知记忆融合。' },
      { id: 'memory', label: '感知记忆 M_per', action: '递归更新状态', detail: 'M_per 保存持续更新的感知摘要，供下一轮判断；它不是让 Qwen 无限读取的完整历史。' },
      { id: 'gate', label: 'Cognition Gate', action: '决定是否开口', detail: 'Gate 读取当前状态，输出 SILENT 或 SPEAK；沉默时仍继续更新感知记忆。' },
      { id: 'local', label: 'Local Window + Qwen', action: '触发局部生成', detail: '只有 SPEAK 后，最近 N 段局部窗口才进入 Qwen，支持当前回答。' },
    ],
  },
];

export const CoreLinesExplainer: React.FC<WidgetProps> = () => {
  const [lineId, setLineId] = useState<CoreLine['id']>('where');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const line = LINES.find((candidate) => candidate.id === lineId)!;
  const active = line.steps[index];

  useEffect(() => {
    if (!playing) return;
    if (index >= line.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((current) => current + 1), 2500);
    return () => window.clearTimeout(timer);
  }, [playing, index, line.steps.length]);

  const chooseLine = (nextId: CoreLine['id']) => {
    setPlaying(false);
    setLineId(nextId);
    setIndex(0);
  };

  const move = (nextIndex: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(line.steps.length - 1, nextIndex)));
  };

  const play = () => {
    setIndex(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(line.steps.length - 1);
      setPlaying(false);
      return;
    }
    setPlaying(true);
  };

  return (
    <div className={'mvl-widget mvl-core-review tone-' + lineId}>
      <div className="mvl-core-line-choice" role="tablist" aria-label="选择要复述的核心主线">
        {LINES.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={candidate.id === lineId}
            className={candidate.id === lineId ? 'active' : ''}
            onClick={() => chooseLine(candidate.id)}
          >
            <span>{candidate.title}</span>
            <small>{candidate.question}</small>
          </button>
        ))}
      </div>

      <header className="mvl-core-line-head">
        <div>
          <span>{line.colorLabel}</span>
          <h4>{line.title}：{line.question}</h4>
        </div>
        <b>{index + 1} / {line.steps.length}</b>
      </header>

      <div className="mvl-core-road" aria-label={line.title + '机制顺序'}>
        {line.steps.map((step, stepIndex) => (
          <React.Fragment key={step.id}>
            {stepIndex > 0 ? <span className={stepIndex <= index ? 'passed' : ''} aria-hidden="true">→</span> : null}
            <button
              type="button"
              aria-current={stepIndex === index ? 'step' : undefined}
              className={(stepIndex === index ? 'active ' : '') + (stepIndex < index ? 'done' : '')}
              onClick={() => move(stepIndex)}
            >
              <i>{stepIndex + 1}</i>
              <b>{step.label}</b>
              <small>{step.action}</small>
            </button>
          </React.Fragment>
        ))}
      </div>

      <section className="mvl-core-focus" aria-live="polite">
        <div className="mvl-core-focus-index">{index + 1}</div>
        <div>
          <span>{active.action}</span>
          <h4>{active.label}</h4>
          <p>{active.detail}</p>
        </div>
      </section>

      <div className="mvl-core-review-controls">
        <button type="button" className="tiny ghost" disabled={index === 0} onClick={() => move(index - 1)}>上一步</button>
        <button type="button" className="tiny" disabled={index === line.steps.length - 1} onClick={() => move(index + 1)}>下一步</button>
        <button type="button" className="tiny ghost" disabled={playing} onClick={play}>{playing ? '正在讲解…' : '自动讲解本主线'}</button>
      </div>

      <div className="mvl-core-summary">
        <strong>一句话复述</strong>
        <p>{line.summary}</p>
      </div>
    </div>
  );
};
