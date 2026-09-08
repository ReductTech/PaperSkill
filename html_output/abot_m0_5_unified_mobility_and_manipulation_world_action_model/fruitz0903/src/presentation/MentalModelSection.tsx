import React, { useState } from "react";

type Phase = "idle" | "future" | "temporal" | "action" | "train" | "complete";

const phaseRank: Record<Phase, number> = { idle: 0, future: 1, temporal: 2, action: 3, train: 4, complete: 5 };

function ShuttleGlyph({ ghost = false }: { ghost?: boolean }) {
  return (
    <g className={ghost ? "shuttle-glyph is-ghost" : "shuttle-glyph"}>
      <path d="M0 0L-28-16M0 0L-32 0M0 0L-28 16" />
      <path d="M-28-16Q-39 0-28 16" />
      <ellipse cx="7" cy="0" rx="10" ry="8" />
    </g>
  );
}

function BadmintonRobot({ active }: { active: boolean }) {
  return <g className={`badminton-robot ${active ? "is-active" : ""}`}>
    <ellipse className="robot-shadow" cx="312" cy="524" rx="102" ry="19" />
    <g className="robot-feet">
      <path d="M286 442L258 511L220 523" /><path d="M334 442L360 506L405 516" />
      <path className="foot-step-arrow" d="M212 548Q310 579 424 541" />
    </g>
    <rect className="robot-torso" x="267" y="326" width="94" height="125" rx="28" />
    <circle className="robot-head" cx="314" cy="284" r="42" />
    <path className="robot-visor" d="M286 282Q314 261 343 282Q337 306 314 307Q290 305 286 282Z" />
    <path className="robot-balance-arm" d="M280 352L218 390L183 371" />
    <g className="robot-racket-arm">
      <path d="M349 352L420 311L472 276" />
      <line className="racket-handle" x1="465" y1="283" x2="503" y2="238" />
      <ellipse className="racket-head" cx="526" cy="210" rx="39" ry="55" transform="rotate(38 526 210)" />
      <path className="racket-grid" d="M495 183L552 231M487 204L542 248M515 158L559 204M500 250L553 170M486 225L541 153" />
    </g>
    <circle className="shared-target" cx="474" cy="275" r="15" />
  </g>;
}

function BadmintonStage({ phase }: { phase: Phase }) {
  const rank = phaseRank[phase];
  const showDream = phase === "train" || phase === "complete";
  return (
    <svg className="badminton-scene" viewBox="0 0 1200 620" role="img" aria-label="机器人打羽毛球演示高速时序、手脚分工和训练部署条件错配">
      <defs>
        <linearGradient id="courtField" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#F7F5EF" /><stop offset="1" stopColor="#E7E5DE" /></linearGradient>
        <marker id="courtArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" /></marker>
      </defs>
      <rect width="1200" height="620" fill="url(#courtField)" />
      <path className="court-floor" d="M52 548L219 167H981L1148 548Z" />
      <path className="court-line" d="M113 510H1087M202 313H998M341 548L423 167M859 548L777 167M600 548V167" />
      <g className="court-net"><line x1="600" y1="214" x2="600" y2="525" /><path d="M600 248H1115M600 267H1106M600 286H1098M600 305H1090M600 324H1082M600 343H1074M600 362H1066M600 381H1058M600 400H1050M600 419H1042M600 438H1034M600 457H1026M600 476H1018M600 495H1010" /><path d="M620 248V516M650 248V511M680 248V506M710 248V501M740 248V496M770 248V491M800 248V486M830 248V481M860 248V476M890 248V471M920 248V466M950 248V461M980 248V456" /></g>
      <text className="court-label" x="72" y="584">机器人半场</text><text className="court-label goal-label" x="936" y="584">目标落点</text>
      <circle className="landing-target" cx="940" cy="405" r="54" /><circle className="landing-target-core" cx="940" cy="405" r="13" />

      {rank >= 1 ? <g className="badminton-future-layer" aria-label="高速来球的未来视觉状态">
        <path className="incoming-path" d="M1060 188Q780 80 474 275" />
        <g transform="translate(1018 174) rotate(190)"><ShuttleGlyph ghost /><text x="-10" y="-28">t+1</text></g>
        <g transform="translate(850 142) rotate(202)"><ShuttleGlyph ghost /><text x="-10" y="-28">t+2</text></g>
        <g transform="translate(674 178) rotate(216)"><ShuttleGlyph ghost /><text x="-10" y="-28">t+3</text></g>
        <g transform="translate(506 260) rotate(225)"><ShuttleGlyph /><text x="-10" y="-31">击球窗口</text></g>
      </g> : <g className="idle-shuttle" transform="translate(1008 180) rotate(190)"><ShuttleGlyph /></g>}

      {rank >= 2 ? <g className="badminton-temporal-layer" aria-label="视频采样和连续控制之间的时间粒度错配">
        <path className="motion-ribbon" d="M1018 174Q760 91 506 260" />
        <g className="video-samples"><circle cx="1018" cy="174" r="9" /><circle cx="850" cy="142" r="9" /><circle cx="674" cy="178" r="9" /></g>
        <g className="control-ticks">{Array.from({ length: 9 }).map((_, i) => <line key={i} x1={444 + i * 12} y1={312 - i * 7} x2={451 + i * 12} y2={324 - i * 7} />)}</g>
        <text className="sample-caption" x="750" y="108">少量视觉帧 z</text><text className="control-caption" x="394" y="355">连续微动作 m → a</text>
      </g> : null}

      {phase === "action" || phase === "complete" ? <g className="badminton-action-cues">
        <path className="feet-cue" markerEnd="url(#courtArrow)" d="M190 528Q300 558 416 520" /><text x="205" y="492">脚：追到击球位</text>
        <path className="arm-cue" markerEnd="url(#courtArrow)" d="M382 341Q448 260 519 222" /><text x="388" y="219">手：对准并挥拍</text>
      </g> : null}

      {showDream ? <g className="badminton-dream-layer" aria-label="理想未来与自生成未来的差异">
        <path className="gt-return-path" d="M520 244Q744 92 978 394" /><path className="dream-return-path" d="M520 255Q760 123 936 414" />
        <g className="wind-cue"><path markerEnd="url(#courtArrow)" d="M620 266Q675 274 724 311" /><text x="615" y="252">风 / 触球偏差</text></g>
        <g transform="translate(936 414) rotate(72)"><ShuttleGlyph /></g>
        <text className="gt-path-label" x="650" y="128">标准未来</text><text className="dream-path-label" x="694" y="335">自己生成的未来</text>
      </g> : null}

      <BadmintonRobot active={rank >= 3} />
      <g className="opponent-hint"><circle cx="1060" cy="310" r="26" /><path d="M1060 336L1060 421M1060 360L1018 390M1060 360L1101 328M1060 421L1034 478M1060 421L1088 478" /></g>
      <text className="badminton-goal" x="755" y="535">共同目标：接到球，打到对面</text>
    </svg>
  );
}

function ActionAlignmentLayer({ visible }: { visible: boolean }) {
  return <div className={`mental-action-alignment ${visible ? "is-visible" : ""}`} aria-hidden={!visible}><span>Innovation 2 · 脚和手不是一种动力学</span><b>共同看同一条球路 / Joint Attention</b><div><strong>Mobility Expert<small>脚步追到击球位</small></strong><i>⇄</i><strong>Manipulation Expert<small>手臂对准并挥拍</small></strong></div></div>;
}

function TrainTestAlignmentLayer({ visible }: { visible: boolean }) {
  return <div className={`mental-train-alignment ${visible ? "is-visible" : ""}`} aria-hidden={!visible}><span>Innovation 3 · 风和触球偏差会让未来离开标准轨迹</span><div><strong>训练：GT Future</strong><i>→</i><strong>部署：Self-Dreamed Future</strong></div><b>不是预知所有扰动，而是学会从自己生成的未来继续行动</b></div>;
}

function MathDetailDrawer() {
  return (
    <details className="mental-math-detail">
      <summary>查看数学形式</summary>
      <div><code>z<sub>t+1</sub> → m<sub>t</sub> → a<sub>t</sub></code><p><b>Temporal</b>：Video → m → Control</p><p><b>Action-Space</b>：Mobility ⇄ Manipulation</p><p><b>Train-Test</b>：GT Future → Self-Dreamed Future</p><span>一条因果链上的三次 alignment</span></div>
    </details>
  );
}

export function MentalModelSection() {
  const [phase, setPhase] = useState<Phase>("idle");
  const nextPhase: Record<Phase, Phase> = { idle: "future", future: "temporal", temporal: "action", action: "train", train: "complete", complete: "idle" };
  const advance = () => setPhase((current) => nextPhase[current]);
  const reset = () => setPhase("idle");

  return (
    <section id="screen-2" data-index="1" className="story-screen mental-model-screen">
      <div className="screen-inner">
        <div className="section-kicker"><span>02</span>THE MENTAL MODEL</div>
        <h2>机器人要接住一次高速来球，中间要做三次对齐</h2>
        <p className="mental-subtitle">用一次羽毛球回合，看懂 <b>Temporal · Action-Space · Train-Test</b></p>

        <div className={`racing-mental-stage badminton-mental-stage phase-${phase}`}>
          <div className="mental-scene-wrap"><BadmintonStage phase={phase} /></div>
          {phase === "temporal" ? <div className="motion-question">几帧球路，够生成一整套连续击球动作吗？</div> : null}
          <ActionAlignmentLayer visible={phase === "action"} />
          <TrainTestAlignmentLayer visible={phase === "train"} />
          {phase === "temporal" ? <div className="conceptual-analogy-note">紫色轨迹表示中间运动语义 m：它把少量视觉状态接到连续控制，但不是最终控制指令。</div> : null}
          {phase === "complete" ? <div className="mental-final-mapping"><span><b className="m-color">①</b>看准时机</span><i>→</i><span><b className="a-color">②</b>手脚协作</span><i>→</i><span><b className="dream-color">③</b>偏差后继续</span></div> : null}
        </div>

        <div className="mental-controls">
          <button
            className="run-button mental-run"
            onClick={advance}
          >
            {phase === "idle" ? "第 1 步：看未来" : phase === "future" ? "Innovation 1：时间对齐" : phase === "temporal" ? "Innovation 2：动作对齐" : phase === "action" ? "Innovation 3：训练部署对齐" : phase === "train" ? "合并三次对齐" : "Replay"}<span>▶</span>
          </button>
          <button className="mental-reset" onClick={reset}>Reset</button>
        </div>

        <p className="mental-takeaway">同一个回球目标：<b className="m-color">Temporal</b> 管时机，<b className="a-color">Action-Space</b> 管手脚分工，<b className="dream-color">Train-Test</b> 管预测偏差后的继续行动。</p>
        <div className="mental-footer-row"><MathDetailDrawer /><button className="mental-next" onClick={() => document.getElementById("screen-3")?.scrollIntoView({ behavior: "smooth" })}>下一页：先展开 Innovation 1 · Temporal Alignment</button></div>
      </div>
    </section>
  );
}
