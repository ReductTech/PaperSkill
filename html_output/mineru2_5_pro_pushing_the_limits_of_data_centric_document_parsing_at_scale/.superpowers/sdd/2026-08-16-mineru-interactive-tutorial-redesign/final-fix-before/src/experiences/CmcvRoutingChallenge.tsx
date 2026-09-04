import { useEffect, useRef, useState } from 'react';
import { PaperMedia } from '../components/PaperMedia';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-labeling.css';

type Route = 'easy' | 'medium' | 'hard';

const routeCopy: Record<Route, { title: string; labelSource: string; destination: string }> = {
  easy: { title: 'Easy', labelSource: '目标与外部答案可直接核对', destination: '进入高置信训练池' },
  medium: { title: 'Medium', labelSource: '可靠外部答案', destination: '送入待审训练池' },
  hard: { title: 'Hard', labelSource: '外部答案彼此分歧', destination: '保留给困难样本审查' },
};

export function CmcvRoutingChallenge({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [consensusBoundary, setConsensusBoundary] = useState(false);
  const completed = useRef(false);

  useEffect(() => {
    if (restoredModuleState?.moduleId === 'cmcv-router' && ['easy', 'medium', 'hard'].includes(restoredModuleState.state)) {
      setRoute(restoredModuleState.state as Route);
      setConsensusBoundary(false);
    }
    if (restoredModuleState?.moduleId === 'cmcv-trust' && restoredModuleState.state === 'consensus:correct') {
      setRoute('medium');
      setConsensusBoundary(true);
    }
  }, [restoredModuleState]);

  const chooseRoute = (next: Route) => {
    setRoute(next);
    onInteract('cmcv-router');
    onStateChange({ moduleId: 'cmcv-router', state: next });
    setConsensusBoundary(true);
    onInteract('cmcv-trust');
    onStateChange({ moduleId: 'cmcv-trust', state: 'consensus:correct' });
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  const selected = route ? routeCopy[route] : null;
  const correct = route === 'medium';
  return <section className="cmcv-routing" aria-label="CMCV 样本分流挑战">
    <header className="cmcv-routing__header">
      <div><span className="source-tag paper">论文原图节选</span><h3>把同一份样本送入恰当的置信通道</h3></div>
      <p>原页只作为输入锚点；A / B / C 都是教学示意。</p>
    </header>

    <div className="cmcv-routing__board">
      <PaperMedia assetId="omni-output" cropId="originalPdf" label="论文原图节选" caption="OmniDocBench 原页裁图仅用于提供文档输入锚点。" className="cmcv-routing__anchor" />
      <div className="cmcv-routing__outputs" aria-label="教学示意输出">
        <article><span className="source-tag teaching">教学示意</span><strong>目标输出 C</strong><code>Header → Revenue (2024)</code></article>
        <article><span className="source-tag teaching">教学示意</span><strong>外部模型 A</strong><code>Header → Revenue</code></article>
        <article><span className="source-tag teaching">教学示意</span><strong>外部模型 B</strong><code>Header → Revenue</code></article>
      </div>
      <p className="cmcv-routing__relation" role="status"><strong>两个外部模型一致</strong>，但目标输出 C 与它们不同。</p>
    </div>

    <div className="cmcv-routing__synthetic" aria-label="教学示意：合成分流与反馈">
      <span className="source-tag teaching">教学示意：合成分流与反馈</span>
      <div className="cmcv-routing__lanes" role="group" aria-label="选择样本通道">
      {(['easy', 'medium', 'hard'] as const).map((lane) => <article
        key={lane}
        className="cmcv-lane"
        data-testid={`cmcv-lane-${lane}`}
        data-active={route === lane}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); chooseRoute(lane); }}
      >
        <h4>{routeCopy[lane].title}</h4>
        <p>{lane === 'medium' ? '外部答案一致，且与目标有待解释的差异。' : lane === 'easy' ? '目标与外部答案一致。' : '外部答案之间不一致。'}</p>
        {route === lane ? <p className="cmcv-lane__detail"><span>标签来源：{routeCopy[lane].labelSource}</span><span>训练去向：{routeCopy[lane].destination}</span></p> : null}
        <button type="button" onClick={() => chooseRoute(lane)}>送入 {routeCopy[lane].title}</button>
      </article>)}
      <div className="cmcv-token-wrap">
        <span data-testid="cmcv-sample-token" className={`cmcv-token ${route ? `cmcv-token--${route}` : ''}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', 'cmcv-sample')}>样本令牌</span>
      </div>
      </div>

      {selected ? <div className="cmcv-routing__outcome" data-correct={correct} aria-live="polite">
      <strong>{correct ? 'Medium 是这份教学样本的分流结果。' : `${selected.title} 不匹配这份教学样本。`}</strong>
      {correct ? <span><b>{selected.labelSource}</b>：外部 A 与外部 B 一致。训练去向：{selected.destination}。</span> : <span>目标输出与外部 A、外部 B 都不同；外部 A 与外部 B 相同，因此它们的关系是“外部一致、目标不一致”，应送入 Medium。</span>}
      </div> : null}
    </div>

    {consensusBoundary ? <aside className="cmcv-routing__boundary"><strong>共识不等于真值</strong><span>两个外部模型的相同输出只是代理信号；它们也可能共同遗漏同一个结构错误。</span></aside> : null}
    <p className="experience-boundary">事实边界：此挑战用合成的输出关系说明 CMCV 分流，不把 OmniDocBench 页面或教学答案当作 MinerU2.5-Pro 的真实训练记录。</p>
  </section>;
}

export default CmcvRoutingChallenge;
