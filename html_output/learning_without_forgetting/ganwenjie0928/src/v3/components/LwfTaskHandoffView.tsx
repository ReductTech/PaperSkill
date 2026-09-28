import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "../../shared/foundation/accessibility/useReducedMotion";
import type { LwfChapterId } from "../data/chapters";
import { taskSequence } from "../data/sequential";
import { LwfTaskSequence } from "./LwfTaskSequence";

const positions = [
  { row: 1, column: 1 }, { row: 1, column: 2 }, { row: 1, column: 3 }, { row: 1, column: 4 },
  { row: 2, column: 4 }, { row: 2, column: 3 }, { row: 2, column: 2 }, { row: 2, column: 1 },
];

const details: Record<string, { input: string; output: string; state: string; why: string; reference: string; chapter: LwfChapterId }> = {
  "model-ready": { input: "上一任务阶段完成的 Modelₜ", output: "可运行的旧模型", state: "旧训练数据不可用；模型参数仍可访问。", why: "旧模型是本阶段旧任务行为的参照。", reference: "teacher", chapter: "01" },
  "freeze-teacher": { input: "Modelₜ · 共享表示与旧 head", output: "固定的 Teacherₜ", state: "Teacher 参数在本阶段不更新。", why: "固定副本提供稳定的旧响应来源。", reference: "teacher", chapter: "02" },
  "task-arrives": { input: "新任务输入 Xₜ₊₁ 与标签 Yₜ₊₁", output: "当前阶段可用的训练数据", state: "旧任务图像与标签继续不可用。", why: "LwF 只用当前任务样本来约束旧响应。", reference: "xn", chapter: "02" },
  "refresh-responses": { input: "Teacherₜ + Xₜ₊₁", output: "当前阶段的旧任务响应 Yₒ", state: "响应从当前 Teacher 和当前输入重新生成。", why: "旧行为目标来自模型响应，不是旧样本。", reference: "yo", chapter: "02" },
  "add-head": { input: "扩展后的 Studentₜ₊₁", output: "新增任务 head θₙ", state: "Teacherₜ 固定，Student 独立训练。", why: "新 head 为新任务提供专属输出路径。", reference: "theta-n", chapter: "02" },
  "adapt-student": { input: "Yₒ、Yₙ 与 Student 输出", output: "适配后的 Studentₜ₊₁", state: "旧响应目标与新任务目标共同参与训练。", why: "两个目标让共享表示兼顾旧响应和新任务。", reference: "joint-optimization", chapter: "03" },
  "promote-model": { input: "更新后的 Studentₜ₊₁", output: "下一阶段的 Modelₜ₊₁", state: "当前任务阶段完成，模型包含到 t+1 的任务输出。", why: "本阶段学到的模型成为后续任务的起点。", reference: "sequential-refresh", chapter: "05" },
  "next-task": { input: "Modelₜ₊₁ 与新任务 t+2", output: "固定的 Teacherₜ₊₁", state: "进入下一阶段后再次刷新旧任务响应。", why: "递归交接形成连续任务生命周期。", reference: "sequential-refresh", chapter: "05" },
};

const trailEdges = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
  { from: 4, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 },
];

function HandoffMiniVisual({ id }: { id: string }) {
  if (id === "model-ready") return <div className="v3-handoff-mini-model"><b>Modelₜ</b><small>θₛ + θₒ</small></div>;
  if (id === "freeze-teacher") return <div className="v3-handoff-mini-split"><span>Modelₜ</span><i aria-hidden="true">→</i><b>Teacherₜ <small>FROZEN</small></b></div>;
  if (id === "task-arrives") return <div className="v3-handoff-mini-inputs"><b>Xₜ₊₁</b><b>Yₜ₊₁</b></div>;
  if (id === "refresh-responses") return <div className="v3-handoff-mini-flow"><span>Teacherₜ</span><i aria-hidden="true">→</i><b>Yₒ</b><small>on Xₜ₊₁</small></div>;
  if (id === "add-head") return <div className="v3-handoff-mini-head"><span>shared θₛ</span><i aria-hidden="true">└─</i><b>new θₙ</b></div>;
  if (id === "adapt-student") return <div className="v3-handoff-mini-objective"><span>L_old</span><i aria-hidden="true">+</i><span>L_new</span><i aria-hidden="true">→</i><b>Student</b></div>;
  if (id === "promote-model") return <div className="v3-handoff-mini-flow"><span>Studentₜ₊₁</span><i aria-hidden="true">→</i><b>Modelₜ₊₁</b></div>;
  return <div className="v3-handoff-mini-flow"><span>Modelₜ₊₁</span><i aria-hidden="true">↺</i><b>Teacherₜ₊₁</b></div>;
}

function modelTokenLabel(id: string) {
  if (id === "model-ready") return "Modelₜ";
  if (id === "freeze-teacher") return "Teacherₜ · FROZEN";
  if (id === "task-arrives") return "Xₜ₊₁ / Yₜ₊₁";
  if (id === "refresh-responses") return "Yₒ · refreshed";
  if (id === "add-head" || id === "adapt-student") return "Studentₜ₊₁";
  if (id === "promote-model") return "Modelₜ₊₁";
  return "Teacherₜ₊₁";
}

export function LwfTaskHandoffView({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 1.5>(1);
  const prefersReducedMotion = useReducedMotion();
  const step = taskSequence.states[stepIndex];
  const nextTransition = taskSequence.transitions.find((transition) => transition.from === step.id);
  const nextState = nextTransition && taskSequence.states.find((state) => state.id === nextTransition.to);
  const markerId = `lwf-handoff-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const boardRef = useRef<HTMLDivElement | null>(null);
  const routesRef = useRef<SVGSVGElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [tokenPosition, setTokenPosition] = useState<{ left: number; top: number } | null>(null);
  const [routePaths, setRoutePaths] = useState<string[]>([]);
  const [loopPath, setLoopPath] = useState("");
  const atEnd = stepIndex === taskSequence.states.length - 1;
  const stepDetail = details[step.id];

  useEffect(() => {
    if (!isPlaying) return;
    const duration = prefersReducedMotion ? 420 : 1100;
    const timer = window.setTimeout(() => {
      if (stepIndex >= taskSequence.states.length - 1) {
        setIsPlaying(false);
        return;
      }
      setStepIndex((index) => index + 1);
    }, duration / speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, prefersReducedMotion, speed, stepIndex]);

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
      setTokenPosition({ left: nodeRect.left - boardRect.left + nodeRect.width / 2, top: nodeRect.top - boardRect.top + 16 });

      const scaleX = 1000 / routesRect.width;
      const scaleY = 340 / routesRect.height;
      const stateRect = (index: number) => nodeRefs.current.get(taskSequence.states[index].id)?.getBoundingClientRect();
      const nextPaths = trailEdges.map(({ from, to }) => {
        const source = stateRect(from);
        const destination = stateRect(to);
        if (!source || !destination) return "";
        const sourceCenterX = source.left + source.width / 2;
        const sourceCenterY = source.top + source.height / 2;
        const destinationCenterX = destination.left + destination.width / 2;
        const destinationCenterY = destination.top + destination.height / 2;
        if (Math.abs(destinationCenterX - sourceCenterX) >= Math.abs(destinationCenterY - sourceCenterY)) {
          const toRight = destinationCenterX > sourceCenterX;
          const startX = ((toRight ? source.right + 3 : source.left - 3) - routesRect.left) * scaleX;
          const endX = ((toRight ? destination.left - 12 : destination.right + 12) - routesRect.left) * scaleX;
          const y = ((sourceCenterY + destinationCenterY) / 2 - routesRect.top) * scaleY;
          return `M ${startX} ${y} H ${endX}`;
        }
        const downward = destinationCenterY > sourceCenterY;
        const x = ((sourceCenterX + destinationCenterX) / 2 - routesRect.left) * scaleX;
        const startY = ((downward ? source.bottom + 3 : source.top - 3) - routesRect.top) * scaleY;
        const endY = ((downward ? destination.top - 10 : destination.bottom + 10) - routesRect.top) * scaleY;
        return `M ${x} ${startY} V ${endY}`;
      });
      setRoutePaths(nextPaths);

      const loopSource = stateRect(7);
      const loopTarget = stateRect(0);
      if (loopSource && loopTarget) {
        const x = (loopSource.left + loopSource.width / 2 - routesRect.left) * scaleX;
        const startY = (loopSource.top - routesRect.top - 2) * scaleY;
        const endY = (loopTarget.bottom - routesRect.top + 10) * scaleY;
        setLoopPath(`M ${x} ${startY} V ${endY}`);
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

  const selectStep = (index: number) => {
    setStepIndex(Math.max(0, Math.min(taskSequence.states.length - 1, index)));
  };
  const startPlayback = () => {
    if (atEnd) setStepIndex(0);
    setIsPlaying(true);
  };
  const stopPlayback = () => setIsPlaying(false);

  return <div className="v3-task-handoff" data-step-id={step.id}>
    <p className="v3-task-handoff-hint">沿任务时间线观察模型交接；播放到末尾会停下，随后由你决定是否重播。</p>
    <div className="v3-task-handoff-content">
      <div className="v3-task-handoff-visual" aria-hidden="true">
        <div className="v3-task-handoff-actors">
          {stepIndex >= 1 ? <span className="is-teacher">Teacherₜ · FROZEN</span> : <span className="is-model">Modelₜ · PREVIOUS STAGE</span>}
          {stepIndex >= 4 ? <span className="is-student">Studentₜ₊₁ · ACTIVE</span> : null}
        </div>
        <div className="v3-task-handoff-board" ref={boardRef}>
          <svg ref={routesRef} className="v3-task-handoff-routes" viewBox="0 0 1000 340" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id={markerId} viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" /></marker></defs>
            {trailEdges.map((edge, index) => {
              const completed = stepIndex > edge.to;
              const active = stepIndex === edge.to;
              return <path key={`${edge.from}-${edge.to}`} className={`v3-task-handoff-route ${completed ? "is-complete" : ""} ${active ? "is-active" : ""}`} d={routePaths[index] ?? ""} markerEnd={`url(#${markerId})`} />;
            })}
            <path className={`v3-task-handoff-route is-loop ${step.id === "next-task" ? "is-active" : ""}`} d={loopPath} markerEnd={`url(#${markerId})`} />
          </svg>
          {taskSequence.states.map((state, index) => {
            const position = positions[index];
            const selected = index === stepIndex;
            const past = index < stepIndex;
            return <div key={state.id} ref={(node) => { if (node) nodeRefs.current.set(state.id, node); else nodeRefs.current.delete(state.id); }} className={`v3-task-handoff-node ${selected ? "is-current" : ""} ${past ? "is-complete" : ""}`} style={{ gridColumn: position.column, gridRow: position.row }} data-state-id={state.id}>
              <span className="v3-task-handoff-node-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{state.label}</strong>
              <small>{state.owner}</small>
              <HandoffMiniVisual id={state.id} />
            </div>;
          })}
          {tokenPosition ? <span className="v3-task-handoff-model-token" style={{ left: tokenPosition.left, top: tokenPosition.top }}>{modelTokenLabel(step.id)}</span> : null}
        </div>
        <div className={`v3-task-handoff-loopback ${atEnd ? "is-current" : ""}`}><strong>Next task</strong><span>Modelₜ₊₁ → Teacherₜ₊₁ ↺ Task t+2</span></div>
      </div>

      <aside className="v3-task-handoff-detail" aria-label="当前任务交接阶段" aria-live="polite">
        <span className="v3-task-handoff-step-count">STEP {String(stepIndex + 1).padStart(2, "0")} / {taskSequence.states.length}</span>
        <h4>{step.label}</h4>
        <p className="v3-task-handoff-action">{step.description}</p>
        <dl>
          <div><dt>Input</dt><dd>{stepDetail.input}</dd></div>
          <div><dt>Output</dt><dd>{stepDetail.output}</dd></div>
          <div><dt>State</dt><dd>{stepDetail.state}</dd></div>
          <div><dt>Why</dt><dd>{stepDetail.why}</dd></div>
        </dl>
        {nextState ? <p className="v3-task-handoff-next"><span>下一步</span><strong>{nextState.label}</strong></p> : null}
        <div className="v3-task-handoff-links">
          <button type="button" onClick={() => onOpenReference(stepDetail.reference)}>Reference Hub ↗</button>
          <button type="button" onClick={() => onNavigateChapter(stepDetail.chapter)}>回看 Chapter {stepDetail.chapter} ↗</button>
        </div>
      </aside>
    </div>

    <nav className="v3-task-handoff-progress" aria-label="选择任务阶段">
      {taskSequence.states.map((state, index) => <button key={state.id} type="button" aria-current={index === stepIndex ? "step" : undefined} aria-label={`第 ${index + 1} 步：${state.label}`} onClick={() => { stopPlayback(); selectStep(index); }}>
        <span>{String(index + 1).padStart(2, "0")}</span><strong>{state.label}</strong>
      </button>)}
    </nav>

    <div className="v3-task-handoff-controls" aria-label="任务交接播放控制">
      <div className="v3-task-handoff-buttons">
        <button type="button" disabled={stepIndex === 0} onClick={() => { stopPlayback(); selectStep(stepIndex - 1); }}>← Previous</button>
        {isPlaying
          ? <button type="button" className="is-primary" onClick={stopPlayback}>❚❚ Pause</button>
          : <button type="button" className="is-primary" onClick={startPlayback}>{atEnd ? "↺ Replay handoff" : "▶ Play handoff"}</button>}
        <button type="button" disabled={atEnd} onClick={() => { stopPlayback(); selectStep(stepIndex + 1); }}>Next →</button>
      </div>
      <div className="v3-task-handoff-speed" role="group" aria-label="播放速度">
        <span>Speed</span>{([1, 1.5] as const).map((option) => <button key={option} type="button" aria-pressed={speed === option} onClick={() => setSpeed(option)}>{option}×</button>)}
      </div>
      <p role="status" aria-live="polite">{isPlaying ? "Playing handoff" : atEnd ? "Handoff complete · stopped" : `Manual · step ${stepIndex + 1} of ${taskSequence.states.length}`}</p>
    </div>

    <div className="v3-task-sequence-fallback"><LwfTaskSequence selectedStateId={step.id} onSelectState={(id) => { stopPlayback(); selectStep(taskSequence.states.findIndex((state) => state.id === id)); }} /></div>
  </div>;
}
