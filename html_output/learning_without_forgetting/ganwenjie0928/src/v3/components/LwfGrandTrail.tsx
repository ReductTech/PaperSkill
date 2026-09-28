import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "../../shared/foundation/accessibility/useReducedMotion";
import type { LwfChapterId } from "../data/chapters";
import { grandTrailEdges, grandTrailSteps, jointTrainingSubsteps } from "../data/grand-trail";

const nodePositions = [
  { row: 1, column: 1 }, { row: 1, column: 2 }, { row: 1, column: 3 },
  { row: 2, column: 3 }, { row: 2, column: 2 }, { row: 2, column: 1 },
  { row: 3, column: 1 }, { row: 3, column: 2 }, { row: 3, column: 3 },
];

const actorDetails: Record<string, { label: string; className: string }> = {
  model: { label: "Modelₜ · ready", className: "is-model" },
  "old-data-locked": { label: "旧数据 · unavailable", className: "is-locked" },
  "new-task": { label: "Task t+1 · current data", className: "is-task" },
  "teacher-frozen": { label: "Teacherₜ · FROZEN", className: "is-teacher" },
  "student-active": { label: "Student · ACTIVE", className: "is-student" },
  "old-response": { label: "Yₒ · response target", className: "is-response" },
  "new-head": { label: "θₙ · new head", className: "is-student" },
  "shared-frozen": { label: "θₛ · FROZEN", className: "is-frozen" },
  "old-head-frozen": { label: "θₒ · FROZEN", className: "is-frozen" },
  "new-head-active": { label: "θₙ · ACTIVE", className: "is-student" },
  "old-loss": { label: "L_old", className: "is-objective" },
  "new-loss": { label: "L_new", className: "is-objective" },
  gradient: { label: "gradient · θₒ / θₙ → θₛ", className: "is-gradient" },
  "student-updated": { label: "Studentₜ₊₁ · updated", className: "is-student" },
  optimizer: { label: "Optimizer Step", className: "is-model" },
  "model-next": { label: "Modelₜ₊₁", className: "is-model" },
  "teacher-next": { label: "Teacherₜ₊₁ · next stage", className: "is-teacher" },
  "next-task": { label: "Task t+2", className: "is-task" },
};

function tokenLabel(stepId: string) {
  if (stepId === "old-model" || stepId === "new-task") return "Modelₜ";
  if (stepId === "teacher-student-split") return "Modelₜ · handoff";
  if (stepId === "generate-responses") return "Student · ACTIVE";
  if (stepId === "add-head") return "Student + θₙ";
  if (stepId === "warm-up") return "θₙ · WARM-UP";
  if (stepId === "joint-training") return "Student · JOINT TRAINING";
  if (stepId === "update") return "Updated Studentₜ₊₁";
  return "Modelₜ₊₁";
}

function GrandTrailMiniVisual({ stepId }: { stepId: string }) {
  if (stepId === "old-model") return <div className="v3-grand-mini v3-grand-mini-model"><b>Modelₜ</b><span>θₛ + θₒ</span><small>LOCKED OLD DATA</small></div>;
  if (stepId === "new-task") return <div className="v3-grand-mini v3-grand-mini-input"><span>Xₙ</span><span>Yₙ</span><small>current task only</small></div>;
  if (stepId === "teacher-student-split") return <div className="v3-grand-mini v3-grand-mini-split"><span>Modelₜ</span><i aria-hidden="true">↙</i><b>Teacherₜ <small>FROZEN</small></b><i aria-hidden="true">↘</i><strong>Student <small>ACTIVE</small></strong></div>;
  if (stepId === "generate-responses") return <div className="v3-grand-mini v3-grand-mini-response"><span>Xₙ</span><i aria-hidden="true">→</i><b>Teacherₜ</b><i aria-hidden="true">→</i><strong>Yₒ</strong><small>enters Student context</small></div>;
  if (stepId === "add-head") return <div className="v3-grand-mini v3-grand-mini-head"><span>shared trunk θₛ</span><div><i aria-hidden="true">├→</i><b>old θₒ</b><i aria-hidden="true">└→</i><strong>new θₙ</strong></div></div>;
  if (stepId === "warm-up") return <div className="v3-grand-mini v3-grand-mini-warmup"><span>θₛ <b>FROZEN</b></span><span>θₒ <b>FROZEN</b></span><strong>θₙ <small>ACTIVE</small></strong></div>;
  if (stepId === "joint-training") return <div className="v3-grand-mini v3-grand-mini-joint">
    <div><span>Yₒ / Ŷₒ</span><i aria-hidden="true">→</i><b>L_old</b></div>
    <div><span>Yₙ / Ŷₙ</span><i aria-hidden="true">→</i><b>L_new</b></div>
    <div className="v3-grand-mini-total"><strong>objective</strong><i aria-hidden="true">↶ gradient</i><span>θₒ / θₙ → θₛ</span></div>
  </div>;
  if (stepId === "update") return <div className="v3-grand-mini v3-grand-mini-update"><span>Studentₜ₊₁</span><i aria-hidden="true">→</i><strong>Updated Studentₜ₊₁</strong></div>;
  return <div className="v3-grand-mini v3-grand-mini-promotion"><strong>Modelₜ₊₁</strong><i aria-hidden="true">→</i><b>Teacherₜ₊₁</b><span>↺ Task t+2</span></div>;
}

export function LwfGrandTrail({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter?: (chapterId: LwfChapterId) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.75 | 1 | 1.5>(1);
  const prefersReducedMotion = useReducedMotion();
  const step = grandTrailSteps[stepIndex];
  const atEnd = stepIndex === grandTrailSteps.length - 1;
  const arrowId = `lwf-grand-trail-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const boardRef = useRef<HTMLDivElement | null>(null);
  const routesRef = useRef<SVGSVGElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const [tokenPosition, setTokenPosition] = useState<{ left: number; top: number } | null>(null);
  const [routePaths, setRoutePaths] = useState<string[]>([]);
  const [loopPath, setLoopPath] = useState("");

  useEffect(() => {
    if (!isPlaying) return;
    const duration = prefersReducedMotion ? Math.min(step.durationMs, 420) : step.durationMs;
    const timer = window.setTimeout(() => {
      if (stepIndex >= grandTrailSteps.length - 1) {
        setIsPlaying(false);
        return;
      }
      setStepIndex((index) => index + 1);
    }, duration / speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, prefersReducedMotion, speed, step.durationMs, stepIndex]);

  useEffect(() => {
    const board = boardRef.current;
    const node = nodeRefs.current.get(step.id);
    const routes = routesRef.current;
    if (!board || !node || !routes) return;
    const updatePosition = () => {
      const boardRect = board.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const routesRect = routes.getBoundingClientRect();
      if (!boardRect.width || !boardRect.height || !routesRect.width || !routesRect.height) return;
      setTokenPosition({ left: nodeRect.left - boardRect.left + nodeRect.width / 2, top: nodeRect.top - boardRect.top + 17 });

      const scaleX = 900 / routesRect.width;
      const scaleY = 540 / routesRect.height;
      const getNodeRect = (id: string) => nodeRefs.current.get(id)?.getBoundingClientRect();
      const nextPaths = grandTrailEdges.map((edge) => {
        const source = getNodeRect(edge.from);
        const destination = getNodeRect(edge.to);
        if (!source || !destination) return "";
        const sourceCenterX = source.left + source.width / 2;
        const sourceCenterY = source.top + source.height / 2;
        const destinationCenterX = destination.left + destination.width / 2;
        const destinationCenterY = destination.top + destination.height / 2;
        if (Math.abs(destinationCenterX - sourceCenterX) >= Math.abs(destinationCenterY - sourceCenterY)) {
          const toRight = destinationCenterX > sourceCenterX;
          const startX = ((toRight ? source.right + 2 : source.left - 2) - routesRect.left) * scaleX;
          const endX = ((toRight ? destination.left - 12 : destination.right + 12) - routesRect.left) * scaleX;
          const y = ((sourceCenterY + destinationCenterY) / 2 - routesRect.top) * scaleY;
          return `M ${startX} ${y} H ${endX}`;
        }
        const downward = destinationCenterY > sourceCenterY;
        const x = ((sourceCenterX + destinationCenterX) / 2 - routesRect.left) * scaleX;
        const startY = ((downward ? source.bottom + 2 : source.top - 2) - routesRect.top) * scaleY;
        const endY = ((downward ? destination.top - 10 : destination.bottom + 10) - routesRect.top) * scaleY;
        return `M ${x} ${startY} V ${endY}`;
      });
      setRoutePaths(nextPaths);

      const loopSource = getNodeRect(grandTrailSteps[grandTrailSteps.length - 1].id);
      const loopTarget = getNodeRect(grandTrailSteps[0].id);
      if (loopSource && loopTarget) {
        const startX = (loopSource.right - routesRect.left + 2) * scaleX;
        const startY = (loopSource.top + loopSource.height / 2 - routesRect.top) * scaleY;
        const outerX = (routesRect.right - routesRect.left - 28) * scaleX;
        const outerY = 20 * scaleY;
        const targetX = (loopTarget.left + loopTarget.width / 2 - routesRect.left) * scaleX;
        const targetY = (loopTarget.top - routesRect.top - 8) * scaleY;
        const cornerRadiusX = 26 * scaleX;
        const cornerRadiusY = 14 * scaleY;
        setLoopPath(`M ${startX} ${startY} C ${startX + 18 * scaleX} ${startY}, ${outerX} ${startY}, ${outerX} ${startY} V ${outerY + cornerRadiusY} C ${outerX} ${outerY + 10 * scaleY}, ${outerX - 10 * scaleX} ${outerY}, ${outerX - cornerRadiusX} ${outerY} H ${targetX + cornerRadiusX} C ${targetX + 10 * scaleX} ${outerY}, ${targetX} ${outerY + 10 * scaleY}, ${targetX} ${outerY + cornerRadiusY} V ${targetY}`);
      }
    };
    updatePosition();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
    observer?.observe(board);
    observer?.observe(node);
    window.addEventListener("resize", updatePosition);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [step.id]);

  const stop = () => setIsPlaying(false);
  const select = (index: number) => {
    stop();
    setStepIndex(Math.max(0, Math.min(grandTrailSteps.length - 1, index)));
  };
  const play = () => {
    if (atEnd) setStepIndex(0);
    setIsPlaying(true);
  };

  return <div className="v3-grand-trail" data-trail-step={step.id}>
    <p className="v3-grand-trail-intro">选择节点或逐步播放，观察模型角色、输入、响应目标、参数与训练信号如何沿任务生命周期交接。</p>
    <div className="v3-grand-trail-layout">
      <div className="v3-grand-trail-scene">
        <div className="v3-grand-trail-actors" aria-label="当前阶段中的模型与信号角色">
          {step.activeActors.map((actor) => {
            const detail = actorDetails[actor];
            return detail ? <span key={actor} className={detail.className}>{detail.label}</span> : null;
          })}
        </div>
        <div className="v3-grand-trail-board" ref={boardRef}>
          <svg ref={routesRef} className="v3-grand-trail-routes" viewBox="0 0 900 540" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id={arrowId} viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" /></marker></defs>
            {grandTrailEdges.map((edge, index) => {
              const destination = grandTrailSteps.findIndex((item) => item.id === edge.to);
              const completed = stepIndex > destination;
              const active = stepIndex === destination && step.activeFlows.includes(edge.flow);
              return <path key={`${edge.from}-${edge.to}`} className={`v3-grand-trail-route ${completed ? "is-complete" : ""} ${active ? "is-active" : ""}`} data-flow={edge.flow} d={routePaths[index] ?? ""} markerEnd={`url(#${arrowId})`} />;
            })}
            <path className={`v3-grand-trail-route is-loop ${step.id === "next-teacher" ? "is-active" : ""}`} d={loopPath} markerEnd={`url(#${arrowId})`} />
          </svg>
          {grandTrailSteps.map((item, index) => {
            const position = nodePositions[index];
            const current = index === stepIndex;
            const complete = index < stepIndex;
            return <button key={item.id} ref={(node) => { if (node) nodeRefs.current.set(item.id, node); else nodeRefs.current.delete(item.id); }} type="button" className={`v3-grand-trail-node ${current ? "is-current" : ""} ${complete ? "is-complete" : ""}`} style={{ gridColumn: position.column, gridRow: position.row }} aria-pressed={current} aria-label={`${item.checkpoint}: ${item.title}`} onClick={() => select(index)} data-step-id={item.id}>
              <span className="v3-grand-trail-checkpoint">{item.checkpoint}</span>
              <strong>{item.title}</strong>
              <span className="v3-grand-trail-action">{item.action}</span>
              <div aria-hidden="true"><GrandTrailMiniVisual stepId={item.id} /></div>
            </button>;
          })}
          {tokenPosition ? <span className={`v3-grand-trail-model-token ${step.id === "teacher-student-split" ? "is-split" : step.id === "next-teacher" ? "is-promoted" : ""}`} style={{ left: tokenPosition.left, top: tokenPosition.top }}>{tokenLabel(step.id)}</span> : null}
        </div>
        <div className={`v3-grand-trail-loop-summary ${atEnd ? "is-current" : ""}`}><span>LOOP CLOSURE</span><strong>Updated Studentₜ₊₁ → Modelₜ₊₁ → Teacherₜ₊₁</strong><i aria-hidden="true">↺</i><small>Task t+2 arrives; the next stage generates fresh old-task responses.</small></div>
      </div>

      <aside className="v3-grand-trail-detail" aria-label="当前生命周期检查点" aria-live="polite">
        <span className="v3-grand-trail-step-count">CHECKPOINT {String(stepIndex + 1).padStart(2, "0")} / {grandTrailSteps.length}</span>
        <h4>{step.title}</h4>
        <p className="v3-grand-trail-detail-action">{step.action}</p>
        <dl>
          <div><dt>Input</dt><dd>{step.input}</dd></div>
          <div><dt>Output</dt><dd>{step.output}</dd></div>
          <div><dt>State</dt><dd>{step.state}</dd></div>
          <div className="is-why"><dt>Why this step exists</dt><dd>{step.why}</dd></div>
        </dl>
        {step.id === "joint-training" ? <div className="v3-grand-trail-minibatch"><span>CHAPTER 03 · MINIBATCH DETAIL</span><p>{jointTrainingSubsteps.map((substep, index) => <span key={substep}>{index ? <i aria-hidden="true">→</i> : null}{substep}</span>)}</p><small>这条微观训练顺序嵌在当前任务阶段中；Teacher 仍固定。</small></div> : null}
        <div className="v3-grand-trail-detail-links">
          {step.referenceId ? <button type="button" onClick={() => onOpenReference(step.referenceId!)}>Reference Hub · 当前步骤 ↗</button> : null}
          {step.chapterRef && onNavigateChapter ? <button type="button" onClick={() => onNavigateChapter(step.chapterRef!)}>回看 Chapter {step.chapterRef} ↗</button> : null}
        </div>
      </aside>
    </div>

    <div className="v3-grand-trail-controls" aria-label="GrandTrail 回放控制">
      <div className="v3-grand-trail-step-controls">
        <button type="button" disabled={stepIndex === 0} onClick={() => select(stepIndex - 1)}>← Previous</button>
        {isPlaying
          ? <button type="button" className="is-primary" onClick={stop}>❚❚ Pause</button>
          : <button type="button" className="is-primary" onClick={play}>{atEnd ? "↺ Replay from start" : "▶ Play"}</button>}
        <button type="button" disabled={atEnd} onClick={() => select(stepIndex + 1)}>Next →</button>
      </div>
      <div className="v3-grand-trail-speed" role="group" aria-label="GrandTrail 播放速度">
        <span>Speed</span>{([0.75, 1, 1.5] as const).map((option) => <button key={option} type="button" aria-pressed={speed === option} onClick={() => setSpeed(option)}>{option}×</button>)}
      </div>
      <p role="status" aria-live="polite">{isPlaying ? `Playing · checkpoint ${stepIndex + 1} of ${grandTrailSteps.length}` : atEnd ? "GrandTrail complete · stopped at next Teacher" : `Manual · checkpoint ${stepIndex + 1} of ${grandTrailSteps.length}`}</p>
    </div>

    <nav className="v3-grand-trail-progress" aria-label="GrandTrail 检查点">
      {grandTrailSteps.map((item, index) => <button key={item.id} type="button" aria-current={index === stepIndex ? "step" : undefined} onClick={() => select(index)}>
        <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong>
      </button>)}
    </nav>
  </div>;
}
