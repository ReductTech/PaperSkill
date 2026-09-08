import React, { useState } from 'react';
import type { Meta } from '../types';

const learnedTraits = ['写作风格', '规划习惯', '偏好结构', '知识组织'];

export function Hero({ meta, onStart, started }: { meta: Meta; onStart: () => void; started: boolean }) {
  const [learned, setLearned] = useState(0);
  const complete = learned === learnedTraits.length;
  return <section className="hero-v2 hero-v5">
    <div className="hero-copy"><div className="hero-kicker">渐进式认知外化（GCE）</div><h1>如果 AI 已经越来越懂你，<br/>它什么时候不再只是工具？</h1><p className="hero-subtitle">从“认知建模”到“构成认知”</p><p className="hero-meta-line">{meta.authors} · {meta.venue}</p></div>
    <div className={`hero-causal-stage learned-${learned}`}>
      <svg viewBox="0 0 1100 330" role="img" aria-label="人的行为痕迹持续进入 AI，但认知边界保持不动">
        <defs><marker id="heroArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z"/></marker></defs>
        <rect className="hero-human-zone" x="30" y="24" width="565" height="274" rx="18"/>
        <text className="hero-zone-title human" x="55" y="53">人的现实认知活动</text>
        <g className="hero-small-person" transform="translate(105 165)"><circle cy="-34" r="13"/><path d="M0 -20 V34 M0 -7 L-28 15 M0 -7 L28 15 M0 34 L-20 66 M0 34 L20 66"/></g>
        <g className="hero-plan-board" transform="translate(200 88)"><rect width="270" height="155" rx="8"/><text x="20" y="30">今天的实际决定</text><text x="20" y="64">1. 比较可行方案</text><text x="20" y="94">2. 按风险与偏好权衡</text><text x="20" y="124">3. 作出决定并承担后果</text></g>
        <path className="hero-action-link" d="M137 164 C165 150 178 145 200 145" markerEnd="url(#heroArrow)"/>
        <line className="hero-boundary-line" x1="620" y1="22" x2="620" y2="304"/>
        <text className="hero-boundary-name" x="620" y="16" textAnchor="middle">认知边界</text>
        <text className="hero-boundary-state" x="620" y="324" textAnchor="middle">{complete ? '仍未移动' : '保持原位'}</text>
        <g className="hero-ai-workstation" transform="translate(745 84)"><rect width="245" height="145" rx="10"/><rect x="18" y="18" width="209" height="88" rx="4"/><path d="M45 47 H190 M45 68 H170 M45 89 H202"/><path d="M92 145 L78 174 H168 L154 145"/><text x="122" y="201" textAnchor="middle">个性化 AI 模型</text></g>
        {learnedTraits.map((trait, index) => <g key={trait} className={`hero-trace trace-${index} ${index < learned ? 'visible' : ''}`}>
          <path d={`M470 ${105 + index * 34} C555 ${105 + index * 34}, 670 ${105 + index * 34}, 745 ${117 + index * 22}`} markerEnd="url(#heroArrow)"/>
          <circle r="6"><animateMotion dur="1.8s" begin={`${index * .2}s`} repeatCount="indefinite" path={`M470 ${105 + index * 34} C555 ${105 + index * 34}, 670 ${105 + index * 34}, 745 ${117 + index * 22}`}/></circle>
          <text x="505" y={97 + index * 34}>{trait}</text>
        </g>)}
      </svg>
      <div className="hero-proof-strip"><div><span>发生了什么</span><strong>行为痕迹进入 AI，模型越来越会预测你</strong></div><div className="not-equal">≠</div><div><span>尚未发生什么</span><strong>AI 还没有改变现实行动，也没有接收行动后果</strong></div></div>
    </div>
    <div className="hero-discovery" aria-live="polite">
      {!complete ? <><div className="hero-instruction"><span>当前实验</span><strong>让 AI 依次学习四类行为痕迹</strong><p>盯住中间的竖直边界：数据会穿过去，但边界本身不会跟着数据移动。</p></div><button className="primary-action" onClick={() => setLearned(v => Math.min(v + 1, learnedTraits.length))}>传入下一类行为痕迹 <span>{learned + 1} / 4</span></button></> : <><p className="hero-question">AI 已经学会四类规律，为什么边界仍然不动？</p><p className="hero-answer">因为“关于你的模型”还没有进入你的现实决策因果回路。后面的教程要寻找：什么证据才足以让这条边界真的向外移动。</p>{!started ? <button className="primary-action" onClick={onStart}>开始寻找边界移动的条件 <span>→</span></button> : null}</>}
    </div>
  </section>;
}
