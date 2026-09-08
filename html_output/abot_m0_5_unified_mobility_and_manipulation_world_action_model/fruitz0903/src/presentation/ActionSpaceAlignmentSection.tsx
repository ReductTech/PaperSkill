import React, { useState } from "react";

type MotMode = "entangled" | "isolated" | "dmot";
type ActionStoryPhase = "ready" | "running" | "failed" | "success" | "robot" | "result";

function MythicHeroGlyph() {
  return (
    <g className="mythic-hero-motion">
      <ellipse className="mythic-shadow" cx="0" cy="55" rx="72" ry="14" />
      <g className="fire-wheels">
        <circle cx="-35" cy="38" r="28" /><circle cx="35" cy="38" r="28" />
        <path d="M-58 31q23-33 46 0M12 31q23-33 46 0" />
      </g>
      <path className="mythic-cape" d="M-24-76Q-88-33-70 30Q-32 8 3-18Z" />
      <path className="mythic-robe" d="M-30-66Q0-87 30-66L44 18Q0 37-44 18Z" />
      <circle className="mythic-head" cx="0" cy="-102" r="30" />
      <circle className="mythic-hair" cx="-31" cy="-126" r="15" /><circle className="mythic-hair" cx="31" cy="-126" r="15" />
      <path className="mythic-face" d="M-10-105h3M7-105h3M-8-91q8 7 16 0" />
      <path className="mythic-arm" d="M-25-56L-60-17M25-56L61-28" /><path className="mythic-leg" d="M-18 16L-35 40M18 16L35 40" />
      <g className="spear-rig"><path className="fire-spear" d="M54-33L145-112" /><path className="spear-head" d="M145-112l-28 7 16 18Z" /><path className="spear-ribbon" d="M69-46q14 25 33 3q-1 28 24 12" /></g>
    </g>
  );
}

function MythicBattlefield({ mode, phase }: { mode: MotMode; phase: ActionStoryPhase }) {
  return (
    <svg className="mythic-battlefield" viewBox="0 0 1200 675" role="img" aria-label="原创神话少年使用风火轮绕过障碍并用火尖枪击中目标的概念演示">
      <defs><linearGradient id="mythicSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f8fbfd" /><stop offset="1" stopColor="#e7eef3" /></linearGradient><linearGradient id="mythicGround" x1="0" x2="1"><stop offset="0" stopColor="#d9e6e5" /><stop offset="1" stopColor="#e9e2d8" /></linearGradient></defs>
      <rect width="1200" height="675" fill="url(#mythicSky)" /><circle className="mythic-sun" cx="1000" cy="128" r="92" />
      <path className="mythic-mountain far" d="M0 365Q150 220 300 365T610 350T920 360T1200 320V500H0Z" /><path className="mythic-mountain near" d="M0 420Q190 315 390 430T780 398T1200 414V520H0Z" /><path className="mythic-ground" d="M0 505H1200V675H0Z" fill="url(#mythicGround)" />
      <path className="battle-route" d="M205 500C365 470 420 356 575 350S800 440 1015 355" />
      <g className="mythic-obstacle"><path d="M525 520l35-155 50-41 44 35 42 161Z" /><path d="M560 365l31 35 35-57" /><text x="610" y="552">障碍</text></g>
      <g className="mythic-target"><circle cx="1035" cy="330" r="73" /><circle cx="1035" cy="330" r="45" /><circle cx="1035" cy="330" r="16" /><path d="M1035 247v-38M1035 451v-38M952 330h-38M1156 330h-38" /><text x="1035" y="430">任务目标</text></g>
      <g className="mythic-hero-anchor" transform="translate(205 485)"><MythicHeroGlyph /></g>
      {phase === "failed" && mode === "entangled" ? <g className="entangled-miss"><path d="M655 312Q820 175 1008 226" /><circle cx="1008" cy="226" r="22" /><path d="M995 213l26 26M1021 213l-26 26" /></g> : null}
      {phase === "failed" && mode === "isolated" ? <g className="isolated-miss"><path d="M786 370L1000 440" /><circle cx="1000" cy="440" r="22" /><path d="M987 427l26 26M1013 427l-26 26" /></g> : null}
      {phase === "success" ? <g className="coordinated-hit"><path d="M818 330L1018 330" /><circle cx="1035" cy="330" r="31" /><path d="M1021 330l10 11 22-25" /></g> : null}
    </svg>
  );
}

function StoryStrategy({ mode, phase }: { mode: MotMode; phase: ActionStoryPhase }) {
  if (mode === "entangled") return <div className="mythic-strategy entangled-strategy"><span>风火轮</span><i>＋</i><span>火尖枪</span><b>同一套招式</b><small>{phase === "failed" ? "Gradient Interference" : "所有动作，都用同一种本事学"}</small></div>;
  if (mode === "isolated") return <div className="mythic-strategy isolated-strategy"><span>风火轮 Expert</span><i>不交流</i><span>火尖枪 Expert</span><small>各自专业，却看不到对方的变化</small></div>;
  return <div className="mythic-strategy coordinated-strategy"><div><span>目标</span><span>障碍</span><span>当前位置</span><span>任务</span></div><b>一起看同一张战场地图</b><div><strong>风火轮 Expert</strong><i>Joint Attention</i><strong>火尖枪 Expert</strong></div><small>先一起看战场，再各自决定怎么做</small></div>;
}

function RobotActionMapping({ visible }: { visible: boolean }) {
  return (
    <div className={`action-robot-mapping ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="action-mapping-title"><b>从神话任务，映射回机器人</b><span>同一结构，不同载体</span></div>
      <svg viewBox="0 0 1200 675" role="img" aria-label="风火轮和火尖枪映射到机器人底盘与机械臂">
        <rect width="1200" height="675" fill="#f6f9fc" /><path className="action-map-floor" d="M0 485H1200V675H0Z" />
        <g className="mapped-robot" transform="translate(305 450)"><rect x="-125" y="-8" width="250" height="88" rx="35" /><circle cx="-76" cy="80" r="30" /><circle cx="76" cy="80" r="30" /><rect x="-67" y="-165" width="134" height="157" rx="31" /><circle cx="0" cy="-122" r="13" /><path d="M0-154L118-245L230-195" /><circle cx="118" cy="-245" r="20" /><path d="M220-207l31 23M220-183l31-23" /></g>
        <g className="mapped-target"><circle cx="980" cy="330" r="67" /><circle cx="980" cy="330" r="34" /><circle cx="980" cy="330" r="10" /></g>
        <g className="mapping-base-tag"><rect x="115" y="195" width="285" height="62" rx="19" /><text x="258" y="222">风火轮 → Robot Base</text><text x="258" y="245">Mobility · 低频 / 全局</text></g>
        <g className="mapping-arm-tag"><rect x="425" y="125" width="300" height="62" rx="19" /><text x="575" y="152">火尖枪 → Robot Arm</text><text x="575" y="175">Manipulation · 高频 / 局部</text></g>
        <g className="mapping-context"><rect x="720" y="118" width="365" height="72" rx="21" /><text x="903" y="147">战场 → Video + Latent Action + Task</text><text x="903" y="174">共享任务与场景信息</text></g>
        <g className="mapping-attention"><rect x="535" y="270" width="315" height="58" rx="29" /><text x="693" y="306">Joint Self-Attention · 商量</text></g>
        <path className="mapping-link" d="M400 226C500 223 555 255 615 278M725 176C760 210 755 236 742 270M690 329C620 374 520 396 405 408M695 329C760 371 827 395 890 410" />
        <g className="mapping-experts"><rect x="270" y="380" width="285" height="62" rx="18" /><rect x="800" y="380" width="285" height="62" rx="18" /><text x="413" y="405">Mobility FFN / Head</text><text x="413" y="428">底盘各自练本事</text><text x="943" y="405">Manipulation FFN / Head</text><text x="943" y="428">机械臂各自练本事</text></g>
      </svg>
      <strong>Attention 负责商量，Experts 负责各干各的。</strong>
    </div>
  );
}

function ActionResult({ visible }: { visible: boolean }) {
  return <div className={`action-result-layer ${visible ? "is-visible" : ""}`} aria-hidden={!visible}><div className="action-final-lines"><span><i>1</i>移动和操作，不是同一种动作规律</span><span><i>2</i>分工，不等于隔离</span><span><i>3</i>Attention 负责商量，Experts 负责各干各的</span></div><div className="action-ablation"><div><small>Modality-Level MoT</small><b>0.34</b></div><i>→</i><div><small>Action-Decoupled MoT</small><b>0.48</b></div><span>Selected RoboCasa365 Composite-Seen subset · paper ablation</span><p>把不同动作动力学真正拆开学习后，表现更好。</p></div><blockquote>Dual-Level MoT 的核心，是在共享信息的前提下，让异质动作真正各自专业化。</blockquote></div>;
}

function DualLevelPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return <div className={`dual-level-explainer ${open ? "is-open" : ""}`}><button onClick={onToggle} aria-expanded={open}>为什么叫 Dual-Level？<span>{open ? "−" : "+"}</span></button><div className="dual-level-panel" aria-hidden={!open}><article><b>Level 1 · Modality-Level</b><div><span>Video</span><span>Latent Action</span><span>Action</span></div><p>各自保留表示身份，共享 Transformer / attention 交换信息。</p></article><article><b>Level 2 · Action-Level</b><div><span>Mobility</span><span>Manipulation</span></div><p>各有 FFN / prediction head，仍通过 joint self-attention 协同。</p></article><strong>在“模态层”和“动作层”都做对齐。</strong></div></div>;
}

export function ActionSpaceAlignmentSection() {
  const [mode, setMode] = useState<MotMode>("entangled");
  const [phase, setPhase] = useState<ActionStoryPhase>("ready");
  const [dualOpen, setDualOpen] = useState(false);
  const selectMode = (next: MotMode) => { setMode(next); setPhase("ready"); setDualOpen(false); };
  const advance = () => {
    setDualOpen(false);
    if (phase === "result" || phase === "failed") return setPhase("ready");
    if (phase === "ready") return setPhase("running");
    if (phase === "running") return setPhase(mode === "dmot" ? "success" : "failed");
    if (phase === "success") return setPhase("robot");
    if (phase === "robot") setPhase("result");
  };
  const buttonLabel = phase === "ready" ? "试一次" : phase === "running" ? "查看结果" : phase === "success" ? "映射回机器人" : phase === "robot" ? "查看论文结果" : "Replay";
  const feedback = phase === "failed" ? mode === "entangled" ? "不同节奏挤进同一套招式，会互相拖累。" : "各自都很专业，但谁也不知道对方在干什么。" : phase === "success" ? "不是做同一件事，而是在同一任务下各自把事做好。" : "";

  return (
    <section id="screen-4" data-index={3} className="story-screen action-space-screen"><div className="screen-inner">
      <div className="section-kicker"><span>04</span>INNOVATION 2 · ACTION-SPACE ALIGNMENT</div><h2>风火轮和火尖枪，为什么不能学同一套招式？</h2><p className="action-space-subtitle">用“哪吒过关”看懂 Dual-Level MoT</p>
      <div className={`mythic-action-stage action-mode-${mode} action-phase-${phase}`}>
        <div className="mythic-mode-switch" role="group" aria-label="动作学习方式"><button className={mode === "entangled" ? "is-active" : ""} onClick={() => selectMode("entangled")}><b>一套招式</b><small>Entangled</small></button><button className={mode === "isolated" ? "is-active" : ""} onClick={() => selectMode("isolated")}><b>各打各的</b><small>Fully Isolated</small></button><button className={mode === "dmot" ? "is-active" : ""} onClick={() => selectMode("dmot")}><b>分工协作</b><small>Dual-Level MoT</small></button></div>
        <div className="mythic-task"><b>任务</b><span>先绕开障碍，再准确击中目标。</span></div><MythicBattlefield mode={mode} phase={phase} /><StoryStrategy mode={mode} phase={phase} />
        <div className={`mythic-feedback ${feedback ? "is-visible" : ""} ${phase === "success" ? "is-success" : ""}`} role="status">{feedback}</div><span className="action-concept-note">Conceptual analogy · 非实验模拟</span>
        <RobotActionMapping visible={phase === "robot"} /><ActionResult visible={phase === "result"} /><DualLevelPanel open={dualOpen} onToggle={() => setDualOpen((value) => !value)} />
      </div>
      <div className="action-stage-controls"><button className="run-button action-run" onClick={advance}><span>▶</span>{buttonLabel}</button><p className={phase === "result" ? "is-visible" : ""}>移动与操作要<b>分开学</b>，也要在同一任务里<b>一起看、一起商量</b>。</p></div>
    </div></section>
  );
}
