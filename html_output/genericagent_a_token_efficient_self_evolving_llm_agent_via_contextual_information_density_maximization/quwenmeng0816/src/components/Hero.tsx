import React, { useState } from 'react';
import type { Meta, HeroConfig } from '../types';

const contextParts = [
  { label: '过去的对话', value: 12, cls: 'history' },
  { label: '工具描述', value: 18, cls: 'tools' },
  { label: '网页内容', value: 35, cls: 'web' },
  { label: '中间过程', value: 20, cls: 'reasoning' },
  { label: '真正有用的信息', value: 15, cls: 'useful' },
];

export function Hero({
  meta,
  hero: _hero,
  onStart,
  started,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
  started: boolean;
}) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <section className="hero hero-story">
      <div className="hero-inner">
        <div className="hero-venue">GenericAgent · Interactive Paper</div>
        <h1>如果 Agent 越聪明，<br />却越来越“健忘”和“臃肿”，怎么办？</h1>
        <p className="hero-lead">长程任务会不断产生工具说明、网页内容、旧观察和执行日志。窗口越来越长，但真正决定下一步的信息反而越来越难找到。</p>

        <div className="problem-flow" aria-label="上下文爆炸过程">
          <div className="problem-node primary"><b>Task</b><small>完成一项长程任务</small></div>
          <span className="problem-arrow">↓</span>
          <div className="problem-node agent"><b>Agent</b><small>规划 · 调用 · 观察 · 再规划</small></div>
          <span className="problem-arrow">↓</span>
          <div className="tool-burst">
            {[1, 2, 3, 4, 5].map((n) => <span key={n}>Tool {n}</span>)}<span>…</span>
          </div>
          <span className="problem-arrow">↓</span>
          <div className="problem-consequences">
            <div><b>Context</b><span className="grow-bar"><i /></span><small>越来越长</small></div>
            <div><b>Tokens</b><span className="grow-bar tokens"><i /></span><small>越来越多</small></div>
            <div className="buried"><b>Signal</b><span>重要信息被淹没</span></div>
          </div>
        </div>

        <button className={`why-button ${whyOpen ? 'open' : ''}`} onClick={() => setWhyOpen((v) => !v)} aria-expanded={whyOpen}>
          {whyOpen ? '收起解释' : 'Why? 看看窗口里装了什么'} <span>↘</span>
        </button>

        {whyOpen ? (
          <div className="why-reveal">
            <div className="context-composition">
              <div className="context-composition-head"><span>Context</span><small>一次示意性的窗口剖面</small></div>
              {contextParts.map((part) => (
                <div className="context-part" key={part.label}>
                  <span>{part.label}</span>
                  <div><i className={part.cls} style={{ width: `${part.value}%` }} /></div>
                  <b>{part.value}%</b>
                </div>
              ))}
              <p>只有最后一部分直接服务于当前决策。比例用于解释概念，不是论文实验统计。</p>
            </div>
            <div className="hero-thesis">
              <div className="hero-thesis-label">THE PAPER'S ANSWER</div>
              <h2>GenericAgent</h2>
              <p>Maximize <strong>contextual information density</strong>.</p>
              <blockquote>The goal is not more context.<br />The goal is denser context.</blockquote>
            </div>
            <div className="hero-paper-meta">
              <span>{meta.titleEn}</span>
              <a href="https://arxiv.org/abs/2604.17091" target="_blank" rel="noopener noreferrer">{meta.venue} ↗</a>
            </div>
          </div>
        ) : null}

        {!started ? (
          <div className="chap-loader hero-start">
            <div className="chap-loader-hint">先理解问题，再沿着论文机制逐层探索</div>
            <button className="chap-loader-btn" onClick={onStart}>
              进入交互论文 <span className="chap-loader-arrow">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
