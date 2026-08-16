import { useEffect, useRef, useState } from 'react';
import { Term } from '../components/Glossary';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-labeling.css';

type Route = 'easy' | 'medium' | 'hard';

const ROUTES: readonly Route[] = ['easy', 'medium', 'hard'];
const ROUTE_LABEL: Record<Route, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function isRoute(value: string): value is Route {
  return ROUTES.includes(value as Route);
}

export function CmcvRoutingChallenge({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [revealed, setRevealed] = useState(false);
  const completed = useRef(false);

  useEffect(() => {
    if (restoredModuleState?.moduleId === 'cmcv-router' && isRoute(restoredModuleState.state)) {
      setRoute(restoredModuleState.state);
      setRevealed(true);
      return;
    }
    if (restoredModuleState?.moduleId === 'cmcv-trust' && restoredModuleState.state === 'consensus:correct') {
      setRoute('medium');
      setRevealed(true);
    }
  }, [restoredModuleState]);

  const chooseRoute = (next: Route) => {
    setRoute(next);
    setRevealed(true);
    onInteract('cmcv-router');
    onStateChange({ moduleId: 'cmcv-router', state: next });
    onInteract('cmcv-trust');
    onStateChange({ moduleId: 'cmcv-trust', state: 'consensus:correct' });
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  return <section className="cmcv-routing" aria-label="CMCV 样本分流挑战">
    <div className="cmcv-evidence-strip" aria-label="CMCV 证据关系">
      <article className="cmcv-evidence-strip__input">
        <strong>真实 PDF 输入</strong>
        <div className="cmcv-pdf-scan" role="img" aria-label="教学示意：PDF 页面被逐行扫描解析">
          <i /><i /><i className="short" /><i /><i className="short" /><i />
          <b className="cmcv-pdf-scan__beam" />
        </div>
      </article>
      <span className="cmcv-evidence-strip__arrow cmcv-evidence-strip__arrow--input" aria-hidden="true">→</span>
      <article className="cmcv-evidence-strip__gt" data-slot="gt" data-empty="true" aria-label="GT：不可用">
        <strong>GT：不可用</strong><span aria-hidden="true">?</span><small>未人工标注</small>
      </article>
      <span className="cmcv-evidence-strip__arrow cmcv-evidence-strip__arrow--target" aria-hidden="true">→</span>
      <article className="cmcv-output-card cmcv-output-card--target">
        <span className="source-tag teaching">教学示意</span><strong>目标输出 C</strong><code>Header → Revenue (2024)</code>
      </article>
      <span className="cmcv-relation-mark cmcv-relation-mark--neq" role="img" aria-label="C ≠ 外部共识">≠</span>
      <div className="cmcv-committee" aria-label="外部模型委员会">
        <article className="cmcv-output-card"><span className="source-tag teaching">教学示意</span><strong>外部模型 A</strong><code>Header → Revenue</code></article>
        <span className="cmcv-relation-mark" role="img" aria-label="A = B">=</span>
        <article className="cmcv-output-card"><span className="source-tag teaching">教学示意</span><strong>外部模型 B</strong><code>Header → Revenue</code></article>
      </div>
    </div>

    <div className="cmcv-routing__decision">
      <p className="cmcv-routing__legend"><Term id="cmcv">CMCV</Term> 判断：目标 C 不同，而两个外部输出相同，这是什么难度？术语：<Term id="easy">Easy</Term> · <Term id="medium">Medium</Term> · <Term id="hard">Hard</Term></p>
      <div className="cmcv-routing__choices" role="group" aria-label="预测样本难度">
        {ROUTES.map((candidate) => <button
          key={candidate}
          type="button"
          aria-pressed={route === candidate}
          onClick={() => chooseRoute(candidate)}
        >{ROUTE_LABEL[candidate]}</button>)}
      </div>
    </div>

    {revealed ? <div className="cmcv-routing__outcome" data-testid="cmcv-outcome" aria-live="polite">
      <div><strong>路由：Medium</strong><span>{route === 'medium' ? '判断正确' : `你选择了 ${route ? ROUTE_LABEL[route] : ''}；关系证据指向 Medium`}</span></div>
      <div><strong>标签来源：外部共识伪标签（非 GT）</strong><span><b>共识不等于真值</b>：A/B 也可能共同出错</span></div>
      <div><strong>训练去向：采用外部共识进入监督训练池</strong><span>目标 C 的差异暴露了模型缺口</span></div>
    </div> : null}

    <details className="cmcv-routing__evidence-note">
      <summary>来源与事实边界</summary>
      <p>输入小图为教学示意动画，仅表示“真实 PDF 进入解析”，不是真实样本截图；A / B / C 均为教学示意，不代表 MinerU2.5-Pro 的训练样本或 296 页 Hard 子集。</p>
    </details>
  </section>;
}

export default CmcvRoutingChallenge;
