import React, { useState } from "react";

type GoStoryPhase =
  | "ready"
  | "teacher1"
  | "teacher2"
  | "teacher3"
  | "teacherDone"
  | "deploy"
  | "gap"
  | "question"
  | "dreamA"
  | "dreamB"
  | "dreamReady"
  | "robust"
  | "robot"
  | "result";

const orderedPhases: GoStoryPhase[] = [
  "ready", "teacher1", "teacher2", "teacher3", "teacherDone", "deploy", "gap",
  "question", "dreamA", "dreamB", "dreamReady", "robust", "robot", "result",
];

function reached(phase: GoStoryPhase, target: GoStoryPhase) {
  return orderedPhases.indexOf(phase) >= orderedPhases.indexOf(target);
}

const grid = (n: number) => 94 + n * 53.5;

function Stone({ x, y, color, className = "" }: { x: number; y: number; color: "black" | "white"; className?: string }) {
  return <circle className={`go-stone is-${color} ${className}`} cx={grid(x)} cy={grid(y)} r="18" />;
}

function GoBoard({ phase }: { phase: GoStoryPhase }) {
  const teacher = ["teacher1", "teacher2", "teacher3", "teacherDone"].includes(phase);
  const deployment = ["deploy", "gap", "question"].includes(phase);
  const dreaming = ["dreamA", "dreamB", "dreamReady", "robust"].includes(phase);
  const teacherMoves = teacher ? Math.max(0, orderedPhases.indexOf(phase) - orderedPhases.indexOf("teacher1") + 1) : 0;

  return (
    <svg className="go-board" viewBox="0 0 620 620" role="img" aria-label="九路围棋棋盘，用标准棋谱、轻微偏差和自生成未来演示训练与部署条件错配">
      <rect className="go-board-surface" x="38" y="38" width="544" height="544" rx="28" />
      {Array.from({ length: 9 }, (_, index) => (
        <React.Fragment key={index}>
          <line className="go-grid-line" x1={grid(index)} x2={grid(index)} y1={grid(0)} y2={grid(8)} />
          <line className="go-grid-line" x1={grid(0)} x2={grid(8)} y1={grid(index)} y2={grid(index)} />
        </React.Fragment>
      ))}
      {[2, 4, 6].flatMap((x) => [2, 4, 6].map((y) => <circle key={`${x}-${y}`} className="go-star" cx={grid(x)} cy={grid(y)} r="4" />))}

      <Stone x={2} y={2} color="black" /><Stone x={6} y={6} color="white" />
      <Stone x={6} y={2} color="black" /><Stone x={2} y={6} color="white" />
      <Stone x={3} y={4} color="black" /><Stone x={4} y={3} color="white" />

      {teacherMoves >= 1 && <Stone x={5} y={3} color="black" className="is-new teacher-move" />}
      {teacherMoves >= 2 && <Stone x={5} y={4} color="white" className="is-new teacher-move" />}
      {teacherMoves >= 3 && <Stone x={4} y={5} color="black" className="is-new teacher-move" />}

      {deployment && <circle className="expected-position" cx={grid(5)} cy={grid(3)} r="27" />}
      {deployment && <text className="board-marker expected-label" x={grid(5) - 36} y={grid(3) - 31}>A · 棋谱</text>}
      {reached(phase, "gap") && !reached(phase, "dreamA") && <Stone x={5} y={4} color="black" className="is-new deviated-move" />}
      {reached(phase, "gap") && !reached(phase, "dreamA") && <text className="board-marker deviation-label" x={grid(5) + 24} y={grid(4) + 7}>B · 自己走的</text>}
      {reached(phase, "gap") && !reached(phase, "dreamA") && <path className="deviation-link" d={`M${grid(5)} ${grid(3) + 28}L${grid(5)} ${grid(4) - 27}`} />}

      {dreaming && <Stone x={5} y={4} color="black" className="deviated-move" />}
      {reached(phase, "dreamA") && dreaming && <g className="dreamed-board">
        <Stone x={4} y={5} color="white" className="dreamed-stone" />
        <Stone x={6} y={4} color="black" className="dreamed-stone" />
        <Stone x={3} y={5} color="white" className="dreamed-stone" />
        <path className="dreamed-halo" d={`M${grid(3) - 28} ${grid(5) + 38}Q${grid(5)} ${grid(6) + 30} ${grid(6) + 34} ${grid(4) + 32}`} />
      </g>}
      {reached(phase, "dreamB") && dreaming && <g className="action-response">
        <circle className="action-target-ring" cx={grid(4)} cy={grid(6)} r="29" />
        <path d={`M${grid(5)} ${grid(4) + 27}Q${grid(5)} ${grid(5) + 18} ${grid(4)} ${grid(6) - 31}`} />
        <text className="board-marker action-label" x={grid(4) - 38} y={grid(6) + 48}>从这里继续</text>
      </g>}
      {phase === "robust" && <Stone x={4} y={6} color="white" className="is-new robust-move" />}
    </svg>
  );
}

function RecordBook({ phase }: { phase: GoStoryPhase }) {
  const visible = ["ready", "teacher1", "teacher2", "teacher3", "teacherDone"].includes(phase);
  const current = phase.startsWith("teacher") ? Number(phase.replace("teacher", "")) || 3 : 0;
  return <div className={`go-record-book ${visible ? "is-visible" : ""}`} aria-hidden={!visible}><span>高手棋谱</span><b>STANDARD<br />GAME</b><div>{[1, 2, 3].map((step) => <i key={step} className={current >= step ? "is-checked" : ""}>{current >= step ? "✓" : step}</i>)}</div><small>每一步都给标准局面</small></div>;
}

function StatusStrip({ phase }: { phase: GoStoryPhase }) {
  const mode = reached(phase, "question") ? "dream" : reached(phase, "deploy") ? "deploy" : "train";
  return <div className="go-status-strip" role="status"><span className={mode === "train" ? "is-active" : ""}><i />训练模式</span><span className={mode === "deploy" ? "is-active" : ""}><i />实战模式</span><span className={mode === "dream" ? "is-active" : ""}><i />Dream Forcing</span></div>;
}

function StoryGuide({ phase }: { phase: GoStoryPhase }) {
  if (phase === "ready") return <div className="go-story-guide"><span>第一幕</span><h3>训练模式 · 跟着高手棋谱走</h3><p>点“开始”，看每一步是谁在摆好下一张棋盘。</p></div>;
  if (["teacher1", "teacher2", "teacher3"].includes(phase)) {
    const step = Number(phase.slice(-1));
    return <div className="go-story-guide"><span>训练模式</span><h3>第 {step} 步 · 标准局面</h3><p>每一步，都站在正确局面上学习下一步。</p><div className="guide-progress">{[1, 2, 3].map((n) => <i key={n} className={step >= n ? "is-on" : ""} />)}</div></div>;
  }
  if (phase === "teacherDone") return <div className="go-story-guide is-blue"><span>Teacher Forcing</span><h3>这样学起来当然轻松</h3><p>因为下一张棋盘，永远有人给标准答案。</p></div>;
  if (phase === "deploy") return <div className="go-story-guide"><span>第二幕</span><h3>真正上场</h3><p>现在，没有人替你摆好下一张标准棋盘了。</p></div>;
  if (phase === "gap") return <div className="go-story-guide is-orange"><span>Train–Test Distribution Gap</span><h3>只偏了一格，局面已经变了</h3><p>训练看标准棋局；实战面对自己刚走出的棋局。</p></div>;
  if (phase === "question") return <div className="go-story-guide is-question"><span>问题</span><h3>部署要从自己的棋局继续——</h3><p>那训练时，为什么不直接见见这种棋局？</p></div>;
  if (phase === "dreamA") return <div className="go-story-guide is-orange"><span>步骤 1</span><h3>先自己把后面的局面走出来</h3><p>半透明棋子是不完美、但更接近部署的 dreamed future。</p><small>Phase A · Generate dreamed future · ẑ, m̂</small></div>;
  if (phase === "dreamB") return <div className="go-story-guide is-green"><span>步骤 2</span><h3>再从这个局面学习下一步</h3><p>棋盘不重置，直接在 dreamed board 上训练动作预测。</p><small>Phase B · Predict action under dreamed future</small></div>;
  if (phase === "dreamReady") return <div className="go-story-guide is-green"><span>Dream Forcing</span><h3>不先把错误擦掉</h3><p>而是学会从自己的不完美局面继续做对。</p></div>;
  if (phase === "robust") return <div className="go-story-guide is-green"><span>再下一盘</span><h3>有偏差，仍能稳定继续</h3><p>不是保证永不犯错，而是提高面对自身预测误差时的稳健性。</p></div>;
  return <div className="go-story-guide"><span>完成</span><h3>从棋盘映射回机器人</h3></div>;
}

function RobotDreamMapping({ visible }: { visible: boolean }) {
  return <div className={`dream-robot-mapping ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
    <div className="dream-mapping-heading"><span>同一个结构，换回机器人</span><b>未来条件变了，动作模型要学会适应</b></div>
    <div className="dream-map-cards">
      <article className="map-gt"><div className="mini-book"><i /><i /><i /></div><b>围棋标准棋谱</b><span>Ground-Truth Future</span></article>
      <i className="mapping-arrow">→</i>
      <article className="map-dream"><div className="mini-board"><i /><i /><i /><i /></div><b>自己走出的棋局</b><span>Self-Dreamed Future</span></article>
      <i className="mapping-arrow">→</i>
      <article className="map-action"><div className="mini-robot"><i /><i /><i /></div><b>从当前局面继续</b><span>Action Prediction</span></article>
    </div>
    <blockquote>Teacher Forcing 看完美未来；Dream Forcing 学会面对自己生成的未来。</blockquote>
  </div>;
}

function DreamResult({ visible }: { visible: boolean }) {
  return <div className={`dream-result-layer ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
    <div className="dream-final-lines"><span><i>1</i>Teacher Forcing：一直看“标准答案的未来”</span><span><i>2</i>Dream Forcing：学会面对“自己生成的未来”</span><span><i>3</i>不要求永远正确，而是在不完美未来上继续行动</span></div>
    <div className="dream-ablation">
      <article><small>Shared checkpoint</small><b>67.55%</b></article>
      <article><small>Teacher Forcing +5k</small><b>66.78%</b></article>
      <article className="is-dream"><small>Dream Forcing +5k</small><b>70.56%</b></article>
      <span>RoboCasa365 Target Atomic-Seen · same warm start</span>
      <p>不是训练步数不够，而是训练条件需要对齐部署条件。</p>
    </div>
    <blockquote>Dream Forcing 的本质，是把动作模型训练时看到的条件，尽量对齐到部署时真正会看到的条件。</blockquote>
  </div>;
}

function PaperFormPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return <div className={`paper-form-explainer ${open ? "is-open" : ""}`}>
    <button onClick={onToggle} aria-expanded={open}>查看论文形式 <span>{open ? "−" : "+"}</span></button>
    <div className="paper-form-panel" aria-hidden={!open}>
      <article><b>Teacher Forcing</b><code>p(aₜ | zₜ₊₁, mₜ, ...)</code><small>条件：Ground-Truth Future</small></article>
      <article><b>Dream Forcing</b><code>p(aₜ | ẑₜ₊₁, m̂ₜ, ...)</code><small>条件：Self-Dreamed Future</small></article>
      <p>核心变化不是 Action 本身，而是 Action Prediction 所依赖的 Future Condition。</p>
    </div>
  </div>;
}

export function TrainTestAlignmentSection() {
  const [phase, setPhase] = useState<GoStoryPhase>("ready");
  const [paperOpen, setPaperOpen] = useState(false);

  const advance = () => {
    setPaperOpen(false);
    const index = orderedPhases.indexOf(phase);
    setPhase(phase === "result" ? "ready" : orderedPhases[Math.min(index + 1, orderedPhases.length - 1)]);
  };

  const buttonLabel: Record<GoStoryPhase, string> = {
    ready: "第 1 步：照棋谱落子",
    teacher1: "棋谱第 2 步",
    teacher2: "棋谱第 3 步",
    teacher3: "总结训练模式",
    teacherDone: "真正上场",
    deploy: "让模型自己走一步",
    gap: "为什么会这样？",
    question: "开始 Dream Forcing",
    dreamA: "下一步：在 dreamed board 上学习",
    dreamB: "总结两阶段",
    dreamReady: "再下一盘",
    robust: "映射回机器人",
    robot: "查看实验结果",
    result: "Replay",
  };

  return <section id="screen-5" data-index={4} className="story-screen train-test-screen"><div className="screen-inner">
    <div className="section-kicker"><span>05</span>INNOVATION 3 · TRAIN-TEST ALIGNMENT</div>
    <h2>只背高手棋谱，真上场还会下吗？</h2>
    <p className="train-test-subtitle">用一盘棋看懂 Dream Forcing</p>
    <div className={`go-training-stage go-phase-${phase}`}>
      <StatusStrip phase={phase} />
      <div className="go-board-zone"><GoBoard phase={phase} /><RecordBook phase={phase} /></div>
      <StoryGuide phase={phase} />
      <span className="go-analogy-note">Conceptual analogy · 不是强化学习 self-play</span>
      <RobotDreamMapping visible={phase === "robot"} />
      <DreamResult visible={phase === "result"} />
      <PaperFormPanel open={paperOpen} onToggle={() => setPaperOpen((value) => !value)} />
    </div>
    <div className="dream-stage-controls">
      <button className="run-button dream-run" onClick={advance}><span>▶</span>{buttonLabel[phase]}</button>
      <p className={phase === "result" ? "is-visible" : ""}>训练条件接近部署条件，动作模型才知道如何面对自己的未来。</p>
    </div>
  </div></section>;
}
