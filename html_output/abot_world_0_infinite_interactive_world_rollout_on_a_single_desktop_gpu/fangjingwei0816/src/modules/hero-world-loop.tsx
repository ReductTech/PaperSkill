import React, { useEffect, useState } from 'react';

const LOOP_MS = 850;
const LOOP_STEPS = 8;

export function HeroWorldLoop() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setPhase((current) => (current + 1) % LOOP_STEPS), LOOP_MS);
    return () => window.clearInterval(timer);
  }, []);

  const active = (from: number, to = from) => phase >= from && phase <= to;

  return (
    <div className="hero-loop-system" data-testid="hero-world-loop" data-phase={phase}>
      <svg className="hero-loop-svg" viewBox="0 0 1060 306" role="img" aria-labelledby="hero-loop-title hero-loop-desc">
        <title id="hero-loop-title">用户动作驱动生成世界，并把生成结果写回历史形成闭环</title>
        <desc id="hero-loop-desc">WASD 动作进入世界模型，模型生成下一时刻，新结果加入 History，并重新作为下一轮输入。第二轮中出现轻微误差提示。</desc>
        <defs>
          <linearGradient id="heroHistoryGradient" x1="0" x2="1">
            <stop offset="0" stopColor="#dce8f7" />
            <stop offset="1" stopColor="#eef5ff" />
          </linearGradient>
          <linearGradient id="heroWorldGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#edf4fb" />
            <stop offset="1" stopColor="#f7fbf7" />
          </linearGradient>
          <marker id="heroArrowBlue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#27446e" />
          </marker>
          <marker id="heroArrowOrange" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#d97706" />
          </marker>
          <marker id="heroArrowPurple" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#7c3aed" />
          </marker>
          <marker id="heroArrowGreen" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#16a34a" />
          </marker>
        </defs>

        <g className={`hero-action-input ${active(0, 1) ? 'is-active' : ''}`}>
          <text x="78" y="42" className="loop-node-title">用户动作</text>
          <rect x="40" y="58" width="48" height="42" rx="7" className={`hero-key ${active(0, 1) ? 'is-lit' : ''}`} />
          <text x="64" y="85" textAnchor="middle" className="hero-key-label">W</text>
          <rect x="20" y="107" width="42" height="38" rx="6" className="hero-key" />
          <rect x="67" y="107" width="42" height="38" rx="6" className="hero-key" />
          <rect x="114" y="107" width="42" height="38" rx="6" className="hero-key" />
          <text x="41" y="132" textAnchor="middle" className="hero-key-label">A</text>
          <text x="88" y="132" textAnchor="middle" className="hero-key-label">S</text>
          <text x="135" y="132" textAnchor="middle" className="hero-key-label">D</text>
          <text x="88" y="169" textAnchor="middle" className="loop-node-caption">Action · 怎么动</text>
        </g>

        <path d="M166 104 C214 104 225 104 270 104" className={`loop-edge action-edge ${active(1, 2) ? 'is-active' : ''}`} markerEnd="url(#heroArrowOrange)" />
        <text x="216" y="91" textAnchor="middle" className="loop-edge-label action-label">动作条件</text>

        <g className={`hero-world-node ${active(2, 5) ? 'is-active' : ''}`}>
          <rect x="282" y="32" width="324" height="194" rx="16" className="world-frame" />
          <text x="444" y="61" textAnchor="middle" className="loop-node-title">持续生成的世界</text>
          <rect x="304" y="76" width="280" height="122" rx="9" fill="url(#heroWorldGradient)" className="world-screen" />
          <path d="M304 151 C360 126 404 155 455 132 C507 108 540 131 584 116" className="world-horizon" />
          <g className={`identity-visual-link ${active(7) ? 'is-active' : ''}`}>
            <text x="318" y="95">Identity Memory</text>
            <path d="M399 92 C418 92 429 104 436 116" markerEnd="url(#heroArrowPurple)" />
          </g>
          <g className={`world-subject ${active(7) ? 'identity-held' : ''}`}>
            <circle cx={phase >= 2 ? 446 : 420} cy="128" r="11" />
            <path d={phase >= 2 ? 'M446 139 L446 171 M431 151 L461 151 M446 171 L434 188 M446 171 L458 188' : 'M420 139 L420 171 M405 151 L435 151 M420 171 L408 188 M420 171 L432 188'} />
          </g>
          <text x="444" y="218" textAnchor="middle" className="world-status">根据动作向前推进一块</text>
        </g>

        <path d="M606 91 C650 72 674 67 714 67" className={`loop-edge generation-edge ${active(2, 3) ? 'is-active' : ''}`} markerEnd="url(#heroArrowBlue)" />
        <g className={`next-chunk ${active(2, 3) ? 'is-active' : ''}`}>
          <text x="824" y="34" textAnchor="middle" className="loop-node-title">生成下一时刻</text>
          <rect x="724" y="47" width="200" height="74" rx="10" />
          <path d="M738 100 L778 76 L814 96 L850 70 L910 104" />
          <circle cx="824" cy="82" r="8" />
        </g>

        <path d="M824 122 L824 157" className={`loop-edge history-write ${active(3, 4) ? 'is-active' : ''}`} markerEnd="url(#heroArrowBlue)" />
        <text x="846" y="146" className="loop-edge-label">写回</text>

        <g className={`history-node ${active(3, 7) ? 'is-active' : ''}`}>
          <text x="824" y="178" textAnchor="middle" className="loop-node-title history-title">History</text>
          <rect x="686" y="188" width="278" height="76" rx="12" className="history-frame" />
          <rect x="704" y="207" width="48" height="38" rx="6" className="history-token" />
          <rect x="758" y="207" width="48" height="38" rx="6" className="history-token" />
          <rect x="812" y="207" width="48" height="38" rx="6" className="history-token" />
          <g className={`new-history-token ${active(3, 7) ? 'has-entered' : ''}`}>
            <rect x="866" y="207" width="76" height="38" rx="6" />
            <text x="904" y="231" textAnchor="middle">新结果</text>
          </g>
          <g className={`history-error ${active(5) ? 'is-visible' : ''}`} aria-label="第二轮自滚动中的轻微误差示意">
            <circle cx="925" cy="216" r="4" />
            <path d="M914 238 l8 -7 l7 8" />
          </g>
        </g>

        <path d="M686 239 C642 284 470 290 397 236" className={`loop-edge feedback-edge ${active(4, 6) ? 'is-active' : ''}`} markerEnd="url(#heroArrowBlue)" />
        <text x="538" y="278" textAnchor="middle" className="loop-edge-label feedback-label">History 再次成为下一轮输入 ↺</text>
        <g className={`longforcing-visual-link ${active(6) ? 'is-active' : ''}`}>
          <text x="690" y="298">LongForcing</text>
          <path d="M680 289 C651 280 635 269 618 258" markerEnd="url(#heroArrowGreen)" />
        </g>

        <g className={`loop-risk ${active(5) ? 'is-active' : ''}`}>
          <circle cx="994" cy="218" r="5" />
          <text x="985" y="241" textAnchor="end">第二轮：误差也会被喂回</text>
        </g>
      </svg>

      <p className="hero-loop-insight"><strong>真正的长期难点：</strong>模型会不断吃回自己生成的结果。<span>机制示意，非论文定量实验数据。</span></p>

      <div className="hero-mechanism-row" aria-label="围绕闭环的三个核心机制">
        <button type="button" className={`hero-mechanism action ${active(0, 2) ? 'is-active' : ''}`} onClick={() => setPhase(1)}>
          <strong>Action</strong><span>怎么动</span><small>WASD → 生成世界</small>
        </button>
        <button type="button" className={`hero-mechanism identity ${active(7) ? 'is-active' : ''}`} onClick={() => setPhase(7)}>
          <strong>Identity Memory</strong><span>我是谁</span><small>长期保留角色身份线索</small>
        </button>
        <button type="button" className={`hero-mechanism longforcing ${active(6) ? 'is-active' : ''}`} onClick={() => setPhase(6)}>
          <strong>LongForcing</strong><span>适应长期自滚动</span><small>训练长期 self-rollout 分布</small>
        </button>
        <div className="hero-data-foundation" aria-label="三源训练数据：游戏、仿真和互联网视频">
          <span>三源训练数据</span><strong>Game · Simulation · Internet Video</strong><i aria-hidden="true">↓</i>
        </div>
        <div className="hero-convergence" aria-label="三项机制共同作用于 ABot-World-0"><span>共同作用于</span><strong>ABot-World-0</strong></div>
      </div>
    </div>
  );
}
