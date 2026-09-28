import { useEffect, useId, useMemo, useState } from "react";
import { createDiagramPath } from "../../foundation/layout/diagram";
import { useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { useReducedMotion } from "../../foundation/accessibility/useReducedMotion";
import { Button } from "../../foundation/controls/Button";
import { validateProcessLoopSpec } from "./types";
import type { ProcessLoopSpec } from "./types";

const nodeSize = { width: 220, height: 78 };

export function ProcessLoopExplorer({ spec, initialStep = 0, mode = "manual", showProgress = true, showInspector = true, intervalMs = 2600, onNodeSelect, onStepChange }: {
  spec: ProcessLoopSpec;
  initialStep?: number;
  mode?: "manual" | "autoplay";
  showProgress?: boolean;
  showInspector?: boolean;
  intervalMs?: number;
  onNodeSelect?: (nodeId: string) => void;
  onStepChange?: (stepId: string, index: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const stickySync = useStickyStepSync();
  const errors = useMemo(() => validateProcessLoopSpec(spec), [spec]);
  const [internalStepIndex, setInternalStepIndex] = useState(Math.max(0, Math.min(initialStep, spec.steps.length - 1)));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(mode === "autoplay" && !reducedMotion);
  const markerId = `rk-process-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stickyIndex = !playing && stickySync?.activeStepId ? spec.steps.findIndex((item) => item.id === stickySync.activeStepId) : -1;
  const stepIndex = stickyIndex >= 0 ? stickyIndex : internalStepIndex;
  const step = spec.steps[stepIndex];

  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useEffect(() => {
    if (!playing || !step || reducedMotion) return;
    const timer = window.setInterval(() => setInternalStepIndex((current) => (current + 1) % spec.steps.length), Math.max(900, intervalMs));
    return () => window.clearInterval(timer);
  }, [playing, step, spec.steps.length, intervalMs, reducedMotion]);

  if (errors.length) return <div className="rk-process-loop rk-error" role="alert"><strong>ProcessLoopExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  if (!step) return null;

  const activeNodes = new Set(step.activeNodes ?? []);
  const activeEdges = new Set(step.activeEdges ?? []);
  const dimNodes = new Set(step.dimNodes ?? []);
  const rows = Math.ceil(spec.nodes.length / 4);
  const positions = new Map(spec.nodes.map((node, index) => [node.id, node.position ?? { x: 125 + (index % 4) * 250, y: 70 + Math.floor(index / 4) * 148 }]));
  const canvasWidth = Math.max(1000, ...Array.from(positions.values(), (point) => point.x + nodeSize.width / 2 + 24));
  const canvasHeight = Math.max(150, rows * 148, ...Array.from(positions.values(), (point) => point.y + nodeSize.height / 2 + 24));
  const nodesById = new Map(spec.nodes.map((node) => [node.id, node]));
  const selectedNode = spec.nodes.find((node) => node.id === selectedNodeId);

  const selectNode = (nodeId: string) => { setSelectedNodeId(nodeId); onNodeSelect?.(nodeId); };
  const changeStep = (index: number) => {
    const bounded = Math.max(0, Math.min(index, spec.steps.length - 1));
    setInternalStepIndex(bounded);
    setPlaying(false);
    stickySync?.setManualStep(spec.steps[bounded].id);
    onStepChange?.(spec.steps[bounded].id, bounded);
  };

  return (
    <section className="rk-process-loop" aria-label="Interactive process diagram">
      <div className="rk-process-loop__controls">
        <Button variant="secondary" onClick={() => changeStep(stepIndex - 1)} disabled={stepIndex === 0}>上一步</Button>
        <label>步骤 <select aria-label="选择流程步骤" value={step.id} onChange={(event) => changeStep(spec.steps.findIndex((item) => item.id === event.currentTarget.value))}>{spec.steps.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title}</option>)}</select></label>
        <Button variant="secondary" onClick={() => changeStep(stepIndex + 1)} disabled={stepIndex === spec.steps.length - 1}>下一步</Button>
        <Button variant="quiet" onClick={() => { changeStep(0); setSelectedNodeId(null); }}>重置</Button>
        <Button variant="quiet" onClick={() => setPlaying((value) => !value)} disabled={reducedMotion} aria-pressed={playing}>{playing ? "暂停" : "播放"}</Button>
      </div>
      {showProgress ? <div className="rk-process-loop__progress" role="progressbar" aria-label="流程进度" aria-valuemin={1} aria-valuemax={spec.steps.length} aria-valuenow={stepIndex + 1}><span style={{ width: `${((stepIndex + 1) / spec.steps.length) * 100}%` }} /></div> : null}
      <div className="rk-process-loop__step-heading" aria-live="polite"><span>第 {stepIndex + 1} 步 · 共 {spec.steps.length} 步</span><h3>{step.title}</h3><p>{step.summary}</p></div>
      <div className="rk-process-loop__viewport" tabIndex={0} aria-label="可滚动的系统流程图">
        <div className="rk-process-loop__canvas" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
          <svg className="rk-process-loop__edges" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} role="img" aria-label="Process connections">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
            {spec.edges.map((edge, index) => {
              const reverse = edge.direction === "reverse" || (!edge.direction && edge.kind === "gradient");
              const sourceId = reverse ? edge.to : edge.from;
              const targetId = reverse ? edge.from : edge.to;
              const source = positions.get(sourceId)!;
              const target = positions.get(targetId)!;
              const route = createDiagramPath(source, target, nodeSize, nodeSize, edge.path);
              const active = activeEdges.has(edge.id);
              const flowing = active && !reducedMotion && (edge.kind === "data" || edge.kind === "gradient");
              const edgeKind = edge.kind ?? "data";
              return <g key={edge.id} className={`rk-process-loop__edge rk-edge--${edgeKind} ${active ? "is-active" : ""} ${flowing ? "is-flowing" : ""}`} data-edge-id={edge.id} data-direction={reverse ? "reverse" : "forward"} data-path={edge.path ?? "straight"}><path d={route.d} markerEnd={`url(#${markerId})`} />{edge.label ? <text x={route.label.x} y={route.label.y - 6}>{edge.label}</text> : null}<title>{edge.label ?? `${nodesById.get(sourceId)?.label} to ${nodesById.get(targetId)?.label}`}</title></g>;
            })}
          </svg>
          <div className="rk-process-loop__nodes">
            {spec.nodes.map((node) => {
              const point = positions.get(node.id)!;
              return <button key={node.id} type="button" className={`rk-process-node rk-process-node--${node.kind ?? "module"} ${activeNodes.has(node.id) ? "is-active" : ""} ${dimNodes.has(node.id) ? "is-dimmed" : ""} ${selectedNodeId === node.id ? "is-selected" : ""}`} style={{ left: `${point.x}px`, top: `${point.y}px` }} aria-pressed={selectedNodeId === node.id} onClick={() => selectNode(node.id)}><b>{node.label}</b>{node.group ? <small>{node.group}</small> : null}</button>;
            })}
          </div>
        </div>
      </div>
      <div className="rk-process-loop__footer">
        <div className="rk-process-loop__annotations" aria-live="polite">{step.annotations?.map((annotation, index) => <p key={`${annotation.target}-${index}`}><b>{nodesById.get(annotation.target)?.label}:</b> {annotation.text}</p>)}</div>
      {showInspector ? <aside className="rk-process-loop__inspector" aria-live="polite"><h4>{selectedNode?.label ?? step.detail?.title ?? "查看系统职责"}</h4><p>{selectedNode?.description ?? step.detail?.bullets.join(" ") ?? "选择一个节点查看它在流程中的职责。"}</p>{step.detail && !selectedNode ? <ul>{step.detail.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</aside> : null}
      </div>
    </section>
  );
}

export type { ProcessEdge, ProcessLoopSpec, ProcessNode, ProcessStep } from "./types";
