import React, { useState } from "react";

type Stage =
  | "idle"
  | "future"
  | "directFail"
  | "latentReveal"
  | "controlReveal"
  | "success"
  | "robotMapping"
  | "result";

const stageOrder: Stage[] = ["idle", "future", "directFail", "latentReveal", "controlReveal", "success", "robotMapping", "result"];

function hasReached(stage: Stage, target: Stage) {
  return stageOrder.indexOf(stage) >= stageOrder.indexOf(target);
}

function GameAvatar({ ghost = false, future = false }: { ghost?: boolean; future?: boolean }) {
  return (
    <g className={`game-avatar ${ghost ? "is-ghost" : ""} ${future ? "is-future-avatar" : ""}`}>
      <ellipse className="avatar-shadow" cx="0" cy="4" rx="38" ry="9" />
      <rect className="avatar-body" x="-29" y="-67" width="58" height="54" rx="19" />
      <rect className="avatar-face" x="-20" y="-58" width="40" height="24" rx="11" />
      <circle className="avatar-eye" cx="-8" cy="-47" r="3" />
      <circle className="avatar-eye" cx="8" cy="-47" r="3" />
      <path className="avatar-leg" d="M-16-13v17M16-13v17" />
      <path className="avatar-arm" d="M-29-48l-14 18M29-48l14 18" />
      <rect className="avatar-core" x="-7" y="-31" width="14" height="10" rx="5" />
    </g>
  );
}

function PlatformGameStage({ stage }: { stage: Stage }) {
  const showLatent = hasReached(stage, "latentReveal") && stage !== "robotMapping" && stage !== "result";
  const showControl = hasReached(stage, "controlReveal") && stage !== "robotMapping" && stage !== "result";
  return (
    <>
      <svg className="platform-game-scene" viewBox="0 0 1200 675" role="img" aria-label="极简横版角色从左侧平台跳过深坑，到达右侧平台">
        <defs>
          <linearGradient id="gameSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#F7F5EF" /><stop offset="1" stopColor="#E9E6DE" /></linearGradient>
          <linearGradient id="pitShade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1E2B3F" /><stop offset="1" stopColor="#0F2036" /></linearGradient>
          <filter id="softGlow"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        <rect width="1200" height="675" fill="url(#gameSky)" />
        <circle cx="190" cy="150" r="95" fill="#E9EDF3" opacity=".62" />
        <circle cx="1010" cy="125" r="130" fill="#F1ECF6" opacity=".72" />
        <path className="game-horizon" d="M0 392Q180 334 355 383T715 365T1200 380V470H0Z" />
        <path className="game-platform" d="M0 450H460V675H0Z" />
        <path className="game-platform" d="M740 450H1200V675H740Z" />
        <path className="platform-top" d="M0 450H460M740 450H1200" />
        <rect className="game-pit" x="460" y="450" width="280" height="225" fill="url(#pitShade)" />
        <path className="pit-depth" d="M490 480h220M512 520h176M538 560h124" />
        <g className="current-avatar-anchor" transform="translate(270 445)"><GameAvatar /></g>
        <g className="future-avatar-anchor" transform="translate(930 445)"><GameAvatar ghost future /></g>
        <g className="current-state-label"><rect x="165" y="300" width="210" height="54" rx="27" /><text x="270" y="334">CURRENT · 当前</text></g>
        <g className="future-state-label"><rect x="825" y="280" width="250" height="78" rx="24" /><text x="950" y="313">FUTURE VIDEO · zₜ₊₁</text><text className="future-state-caption" x="950" y="341">我知道未来会到哪里</text></g>
        {stage === "directFail" ? <g className="fall-marker"><circle cx="600" cy="548" r="34" /><path d="M585 533l30 30M615 533l-30 30" /></g> : null}
        {stage === "success" ? <g className="landing-check"><circle cx="930" cy="438" r="46" /><path d="M909 438l15 15 31-34" /></g> : null}
      </svg>
      <MotionIntentOverlay visible={showLatent} />
      <ControlTimeline visible={showControl} />
    </>
  );
}

function MotionIntentOverlay({ visible }: { visible: boolean }) {
  const tokens = ["起跳趋势", "向前运动", "越过高点", "落地趋势"];
  return (
    <div className={`motion-intent-overlay ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="latent-identity"><b>mₜ</b><span>Frame-level Latent Action</span><small>从视觉变化中抽出“怎样发生”</small></div>
      <div className="motion-intent-ribbon">
        {tokens.map((token, index) => <React.Fragment key={token}><span>{token}</span>{index < tokens.length - 1 ? <i>→</i> : null}</React.Fragment>)}
      </div>
      <div className="zm-meaning"><span><b>zₜ₊₁</b> 未来是什么状态</span><i>↓</i><span><b>mₜ</b> 状态怎样变化</span></div>
    </div>
  );
}

function ControlTimeline({ visible }: { visible: boolean }) {
  const rows = [
    ["RIGHT", "100%"],
    ["JUMP", "28%"],
    ["HOLD", "58%"],
    ["RELEASE", "12%"],
  ];
  return (
    <div className={`controller-timeline ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="timeline-head"><b>Controller Timeline · aₜ</b><span>Conceptual control visualization</span></div>
      <div className="timeline-grid">
        {rows.map(([label, width], index) => <React.Fragment key={label}><b>{label}</b><div><i style={{ width, marginLeft: index === 1 ? "16%" : index === 2 ? "24%" : index === 3 ? "73%" : 0 }} /></div></React.Fragment>)}
      </div>
      <strong>未来画面很稀疏，执行控制却必须逐步输出。</strong>
    </div>
  );
}

function RobotMappingStage({ visible }: { visible: boolean }) {
  return (
    <div className={`robot-mapping-stage ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="mapping-title"><span>那机器人抓杯子呢？</span><b>同一座桥，从游戏映射回论文</b></div>
      <svg viewBox="0 0 1200 675" role="img" aria-label="机器人从当前状态通过潜在动作和细粒度控制完成抓杯">
        <rect width="1200" height="675" fill="#F7F5EF" />
        <path className="robot-table" d="M0 470H1200V675H0Z" />
        <g className="robot-current" transform="translate(245 425)">
          <rect x="-105" y="-8" width="210" height="78" rx="30" /><circle cx="-64" cy="70" r="27" /><circle cx="64" cy="70" r="27" />
          <rect x="-58" y="-150" width="116" height="145" rx="28" /><circle cx="0" cy="-112" r="12" />
          <path d="M0-145L95-220L184-166" /><circle cx="95" cy="-220" r="18" /><path d="M175-177l28 21M175-156l28-21" />
        </g>
        <g className="robot-cup-current"><path d="M506 398h72l-8 82h-56Z" /><path d="M578 418q42 0 31 42q-5 18-34 11" /></g>
        <g className="robot-future" transform="translate(940 425)">
          <rect x="-105" y="-8" width="210" height="78" rx="30" /><circle cx="-64" cy="70" r="27" /><circle cx="64" cy="70" r="27" />
          <rect x="-58" y="-150" width="116" height="145" rx="28" /><circle cx="0" cy="-112" r="12" />
          <path d="M0-145L-75-265L-150-225" /><circle cx="-75" cy="-265" r="18" /><path d="M-163-236l26 21M-163-215l26-21" />
          <g className="lifted-cup"><path d="M-205-270h55l-6 63h-43Z" /><path d="M-150-255q31 0 24 31q-4 14-25 9" /></g>
        </g>
        <g className="robot-z-label"><rect x="800" y="165" width="290" height="60" rx="30" /><text x="945" y="203">zₜ₊₁ · 未来杯子被拿起</text></g>
        <g className="robot-m-bridge"><path d="M450 320C570 245 660 245 770 320" /><circle cx="500" cy="291" r="13" /><circle cx="610" cy="263" r="13" /><circle cx="720" cy="291" r="13" /><text x="610" y="235">mₜ · 局部视觉变化</text></g>
        <g className="robot-a-ticks">{Array.from({ length: 18 }, (_, index) => <rect key={index} x={455 + index * 18} y="365" width="9" height={index % 3 === 0 ? 42 : 28} rx="4" />)}<text x="610" y="438">aₜ · 细粒度执行</text></g>
      </svg>
    </div>
  );
}

function AblationReveal({ visible }: { visible: boolean }) {
  return (
    <div className={`temporal-result-layer ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="density-layers" aria-label="z 粗、m 中、a 细的三层时间密度">
        <div><b>zₜ₊₁</b><span className="sparse-dots"><i /><i /></span><em>看到未来 · 粗</em></div>
        <div><b>mₜ</b><span className="middle-ribbon"><i /><i /><i /><i /></span><em>理解变化 · 中</em></div>
        <div><b>aₜ</b><span className="dense-ticks">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</span><em>真正执行 · 细</em></div>
      </div>
      <div className="ablation-reveal">
        <div><span>Direct Video → Action</span><b>87.60</b></div>
        <i>→</i>
        <div><span>3-Stage with Latent Action</span><b>94.00</b></div>
        <small>RoboTwin 2.0 (Clean) · Success Rate</small>
        <p>“中间桥梁”也在论文消融中带来明显提升。</p>
      </div>
    </div>
  );
}

function ConceptTooltip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className={`concept-tooltip ${open ? "is-open" : ""}`}>
      <button onClick={onToggle} aria-label="查看类比说明">i</button>
      <p>类比说明：运动提示只帮助理解。论文中的 mₜ 是从局部视觉状态变化抽象的 frame-level latent representation，不是显式轨迹、额外视频帧或最终控制。</p>
    </div>
  );
}

export function TemporalAlignmentSection() {
  const [stage, setStage] = useState<Stage>("idle");
  const [tipOpen, setTipOpen] = useState(false);
  const advance = () => {
    setTipOpen(false);
    const index = stageOrder.indexOf(stage);
    setStage(stage === "result" ? "idle" : stageOrder[Math.min(index + 1, stageOrder.length - 1)]);
  };

  const showRobot = stage === "robotMapping";
  const showResult = stage === "result";
  const buttonLabel: Record<Stage, string> = {
    idle: "第 1 步：只看未来",
    future: "下一步：尝试直接跳",
    directFail: "下一步：加入 Latent Action",
    latentReveal: "下一步：展开连续控制",
    controlReveal: "下一步：完成跳跃",
    success: "映射回机器人",
    robotMapping: "查看论文消融",
    result: "Replay",
  };

  return (
    <section id="screen-3" data-index={2} className="story-screen temporal-alignment-screen">
      <div className="screen-inner">
        <div className="section-kicker"><span>03</span>INNOVATION 1 · TEMPORAL ALIGNMENT</div>
        <h2>看到终点，不代表知道怎么跳过去</h2>
        <p className="temporal-subtitle">用一次“横版游戏过坑”看懂 Latent Action</p>

        <div className={`temporal-game-stage temporal-stage-${stage}`}>
          <PlatformGameStage stage={stage} />
          <RobotMappingStage visible={showRobot} />
          <AblationReveal visible={showResult} />
          <div className="temporal-question">
            {stage === "idle" || stage === "future" ? <b>只知道最后到了对岸，你知道这一跳该怎么完成吗？</b> : null}
            {stage === "directFail" ? <><b>“知道终点” ≠ “知道怎么运动”</b><span>Conceptual analogy · 用于解释时间粒度错配</span></> : null}
            {stage === "latentReveal" ? <><b>缺了一层什么？</b><span>论文称之为 Temporal Granularity Mismatch</span></> : null}
            {stage === "success" ? <b className="success-copy">z 看未来，m 看变化，a 去执行。</b> : null}
          </div>
          {(hasReached(stage, "latentReveal") && !showResult) ? <ConceptTooltip open={tipOpen} onToggle={() => setTipOpen((value) => !value)} /> : null}
        </div>

        <div className="temporal-stage-controls">
          <button className="run-button temporal-run" onClick={advance}>{buttonLabel[stage]}<span>▶</span></button>
          <p className={showResult ? "is-visible" : ""}><b>Latent Action 不是“多加一层”</b>，而是给粗视频和细控制找到正确的中间尺度。</p>
        </div>

        <button className={`temporal-next-hook ${showResult ? "is-visible" : ""}`} onClick={() => document.getElementById("screen-4")?.scrollIntoView({ behavior: "smooth" })}>
          <span className="next-controllers"><i>MOVE</i><i>INTERACT</i></span>
          <b>如果“移动”和“操作”不是一种动作，还该塞给同一个控制器吗？</b>
          <small>Next · Dual-Level MoT →</small>
        </button>
      </div>
    </section>
  );
}
