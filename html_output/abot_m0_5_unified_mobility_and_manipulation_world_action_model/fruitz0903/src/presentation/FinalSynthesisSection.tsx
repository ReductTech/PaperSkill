import React, { useState } from "react";

type SynthesisPhase = "idle" | "recall1" | "recall2" | "recall3" | "unlocking" | "flow" | "final";

const phaseOrder: SynthesisPhase[] = ["idle", "recall1", "recall2", "recall3", "unlocking", "flow", "final"];
const hasReached = (phase: SynthesisPhase, target: SynthesisPhase) => phaseOrder.indexOf(phase) >= phaseOrder.indexOf(target);

const keyData = [
  {
    id: 1,
    kind: "temporal",
    title: "Temporal Alignment",
    copy: "把粗粒度未来视频，翻译成可供控制读取的中间运动语义。",
    tag: "Video → m → Control",
    mismatch: "视频粒度 ↔ 控制粒度",
  },
  {
    id: 2,
    kind: "action",
    title: "Action-Space Alignment",
    copy: "让移动和操作各自专业化，同时保持共享任务语义。",
    tag: "Mobility ⇄ Manipulation",
    mismatch: "移动动力学 ↔ 操作动力学",
  },
  {
    id: 3,
    kind: "train",
    title: "Train-Test Alignment",
    copy: "让动作模型训练时见过部署时真正会面对的未来条件。",
    tag: "Train Context → Deploy Context",
    mismatch: "训练条件 ↔ 部署条件",
  },
] as const;

function MinimalKey({ kind }: { kind: string }) {
  return <svg className={`summary-key-icon key-${kind}`} viewBox="0 0 80 34" aria-hidden="true"><circle cx="18" cy="17" r="10" /><circle cx="18" cy="17" r="3" /><path d="M28 17H68M54 17v8M63 17v5" /></svg>;
}

function RecallVignette({ phase }: { phase: SynthesisPhase }) {
  const active = phase === "recall1" || phase === "recall2" || phase === "recall3";
  return <div className={`recall-vignette ${active ? "is-visible" : ""} recall-${phase}`} aria-hidden={!active}>
    {phase === "recall1" ? <>
      <span>Scene 03 · 跳坑</span>
      <svg viewBox="0 0 300 145"><rect className="recall-platform" x="18" y="92" width="95" height="20" rx="5" /><rect className="recall-platform" x="190" y="92" width="95" height="20" rx="5" /><path className="recall-latent-arc" d="M75 84Q145 4 225 84" /><circle className="recall-avatar" cx="75" cy="76" r="13" /><circle className="recall-avatar ghost" cx="225" cy="76" r="13" /><text x="150" y="134">知道终点 ≠ 知道怎么过去</text></svg>
    </> : null}
    {phase === "recall2" ? <>
      <span>Scene 04 · 分工协作</span>
      <svg viewBox="0 0 300 145"><g className="recall-hero" transform="translate(145 72)"><circle cx="0" cy="-34" r="16" /><path d="M-17-16Q0-29 17-16L24 24Q0 34-24 24Z" /><circle className="recall-wheel" cx="-25" cy="30" r="17" /><circle className="recall-wheel" cx="25" cy="30" r="17" /><path className="recall-spear" d="M18-10L88-59" /><path className="recall-spear-head" d="M88-59l-18 3 10 12Z" /></g><text x="150" y="134">风火轮分工 · 火尖枪协作</text></svg>
    </> : null}
    {phase === "recall3" ? <>
      <span>Scene 05 · 自己的棋局</span>
      <svg viewBox="0 0 300 145"><g className="recall-board">{[0,1,2,3,4].map((n)=><React.Fragment key={n}><line x1={85+n*31} x2={85+n*31} y1="18" y2="118" /><line x1="85" x2="209" y1={18+n*25} y2={18+n*25} /></React.Fragment>)}<circle className="recall-stone-black" cx="116" cy="43" r="9" /><circle className="recall-stone-white" cx="178" cy="68" r="9" /><circle className="recall-gt" cx="147" cy="68" r="14" /><circle className="recall-dream" cx="147" cy="93" r="10" /><path d="M147 82V84" /></g><text x="150" y="136">标准棋谱 → 自己走出的未来</text></svg>
    </> : null}
  </div>;
}

function CausalChain({ phase }: { phase: SynthesisPhase }) {
  const nodes = ["Current Observation", "Future Video z", "Latent Action m", "Mobility + Manipulation", "Robot Action", "New Observation"];
  return <div className={`summary-chain ${hasReached(phase, "flow") ? "is-flowing" : ""}`}>
    <div className="chain-label"><span>CAUSAL CHAIN</span><b>从看见未来，到真实行动</b></div>
    <div className="chain-nodes">
      {nodes.map((node, index) => <React.Fragment key={node}><div className={`chain-node chain-node-${index}`}><i />{node}</div>{index < nodes.length - 1 ? <span className="chain-link"><i /></span> : null}</React.Fragment>)}
    </div>
    <svg className="chain-loop-arrow" viewBox="0 0 150 252" aria-hidden="true"><path d="M118 233C145 183 143 64 113 20C83-24 22 12 26 53" /><path d="M15 42l11 12 13-9" /></svg>
    <RecallVignette phase={phase} />
  </div>;
}

function AlignmentLock({ phase }: { phase: SynthesisPhase }) {
  const open = hasReached(phase, "flow");
  return <div className={`alignment-lock ${hasReached(phase, "unlocking") ? "is-unlocking" : ""} ${open ? "is-open" : ""}`}>
    <span>同一把锁</span>
    <div className="lock-graphic">
      <i className="lock-shackle" />
      <div className="lock-body"><b>ALIGNMENT</b><small>结构性错配</small><div>{keyData.map((key) => <i key={key.id} className={`slot slot-${key.id} ${hasReached(phase, `recall${key.id}` as SynthesisPhase) ? "is-filled" : ""}`} />)}</div></div>
    </div>
    <p>世界预测 → 运动抽象<br />→ 真实控制 → 部署条件</p>
  </div>;
}

function KeyCards({ phase }: { phase: SynthesisPhase }) {
  const activeId = phase === "recall1" ? 1 : phase === "recall2" ? 2 : phase === "recall3" ? 3 : 0;
  return <div className="summary-key-cards">
    {keyData.map((key) => {
      const used = hasReached(phase, `recall${key.id}` as SynthesisPhase);
      return <article key={key.id} className={`summary-key-card ${key.kind} ${activeId === key.id ? "is-active" : ""} ${used ? "is-used" : ""}`}>
        <MinimalKey kind={key.kind} />
        <div><small>钥匙 {key.id}</small><b>{key.title}</b><p>{key.copy}</p><span>{key.tag}</span></div>
        <em>对齐：{key.mismatch}</em>
      </article>;
    })}
  </div>;
}

function ClosingSummary({ visible }: { visible: boolean }) {
  return <div className={`summary-closing ${visible ? "is-visible" : ""}`}>
    <div className="closing-rhythm"><span>Predict the future.</span><span>Understand the motion.</span><span>Act under your own predictions.</span></div>
    <div className="closing-meaning"><b>先想象未来，再理解运动，并学会在自己想象的未来上行动。</b><p>关键不是增加三个独立模块，而是在“世界预测—运动抽象—真实控制—部署条件”这条因果链上完成三次对齐。</p></div>
    <blockquote>这篇论文的核心不是更大的模型，<strong>而是更少的错配。</strong></blockquote>
    <small>ABot-M0.5 的本质，是用三次 alignment 修复世界模型与移动操作控制之间的结构性错配。</small>
  </div>;
}

export function FinalSynthesisSection() {
  const [phase, setPhase] = useState<SynthesisPhase>("idle");
  const advance = () => {
    const index = phaseOrder.indexOf(phase);
    setPhase(phase === "final" ? "idle" : phaseOrder[Math.min(index + 1, phaseOrder.length - 1)]);
  };
  const buttonLabel: Record<SynthesisPhase, string> = { idle: "开始收束", recall1: "下一把钥匙", recall2: "下一把钥匙", recall3: "打开对齐之锁", unlocking: "点亮因果链", flow: "查看最终总结", final: "Replay" };
  return <section id="screen-6" data-index={5} className="story-screen final-synthesis-screen"><div className="screen-inner">
    <div className="section-kicker"><span>06</span>ONE IDEA</div>
    <h2>三个创新，其实都在开同一把锁：对齐</h2>
    <p className="final-synthesis-subtitle">这篇论文不是多加三个模块，而是在同一条链路上修正三种错配。</p>
    <div className={`final-synthesis-stage synthesis-phase-${phase}`}>
      <div className="summary-workspace"><CausalChain phase={phase} /><AlignmentLock phase={phase} /><KeyCards phase={phase} /></div>
      <ClosingSummary visible={phase === "final"} />
      <div className={`unlock-statement ${hasReached(phase, "flow") && phase !== "final" ? "is-visible" : ""}`}>ABot-M0.5 让“看见未来、理解运动、输出控制、部署执行”在同一条链上真正对齐。</div>
    </div>
    <div className="synthesis-controls"><button className="run-button synthesis-run" onClick={advance}><span>▶</span>{buttonLabel[phase]}</button></div>
  </div></section>;
}
