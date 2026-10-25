import { useId, useMemo, useState } from "react";
import { createDiagramPath } from "../../foundation/layout/diagram";
import { Button } from "../../foundation/controls/Button";
import { Feedback } from "../../foundation/feedback/Feedback";
import { attemptTransition, validateStateMachine } from "./types";
import type { StateMachineSpec } from "./types";

const stateSize = { width: 184, height: 96 };

export function StateMachineExplorer({ spec, mode = "guided", showHistory = true, showInspector = true }: { spec: StateMachineSpec; mode?: "guided" | "free-click"; showHistory?: boolean; showInspector?: boolean }) {
  const errors = useMemo(() => validateStateMachine(spec), [spec]);
  const [currentId, setCurrentId] = useState(spec.initialState);
  const [history, setHistory] = useState<string[]>([spec.initialState]);
  const [message, setMessage] = useState("Choose a state to inspect it or attempt a transition.");
  const [invalid, setInvalid] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);
  const markerId = `rk-state-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  if (errors.length) return <div role="alert" className="rk-error"><strong>StateMachineExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  const current = spec.states.find((state) => state.id === currentId)!;
  const knownTransitions = spec.transitions.filter((transition) => transition.from === currentId);
  const availableIds = new Set(knownTransitions.map((transition) => transition.to));
  const visited = new Set(history);
  const positions = new Map(spec.states.map((state, index) => [state.id, state.position ?? { x: 120 + index * 220, y: 112 }]));
  const canvasWidth = Math.max(680, ...Array.from(positions.values(), (point) => point.x + stateSize.width / 2 + 32));
  const canvasHeight = Math.max(220, ...Array.from(positions.values(), (point) => point.y + stateSize.height / 2 + 40));

  const choose = (targetId: string) => {
    const result = attemptTransition(spec, currentId, targetId);
    if (result.valid) {
      setCurrentId(result.state.id);
      setHistory((items) => [...items, result.state.id]);
      setMessage(result.transition.explanation ?? result.transition.condition ?? `Transitioned to ${result.state.label}.`);
      setInvalid(false);
    } else {
      setInvalidCount((count) => count + 1);
      setMessage(result.message);
      setInvalid(true);
    }
  };
  const reset = () => { setCurrentId(spec.initialState); setHistory([spec.initialState]); setInvalidCount(0); setMessage("State history has been reset."); setInvalid(false); };

  return (
    <section className="rk-state-machine" aria-label="Interactive state machine">
      <div className="rk-state-machine__header"><p>Current state: <b>{current.label}</b></p><Button variant="quiet" onClick={reset}>Reset</Button></div>
      <div className="rk-state-machine__viewport" tabIndex={0} aria-label="Scrollable state transition diagram">
        <div className="rk-state-machine__canvas" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
          <svg className="rk-state-machine__edges" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} role="img" aria-label="State transitions">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
            {spec.transitions.map((transition, index) => {
              const from = positions.get(transition.from)!;
              const to = positions.get(transition.to)!;
              const pathMode = transition.path ?? (to.x <= from.x + stateSize.width ? "curve" : from.y !== to.y ? "orthogonal" : "straight");
              const path = createDiagramPath(from, to, stateSize, stateSize, pathMode);
              const available = transition.from === currentId;
              return <g key={`${transition.from}-${transition.to}-${index}`} className={`rk-state-machine__edge ${available ? "is-available" : "is-dimmed"}`} data-from={transition.from} data-to={transition.to} data-path={pathMode}><path d={path.d} markerEnd={`url(#${markerId})`} />{transition.condition ? <text x={path.label.x} y={path.label.y - 6}>{transition.condition}</text> : null}<title>{transition.condition ?? `${transition.from} to ${transition.to}`}</title></g>;
            })}
          </svg>
          <div className="rk-state-machine__states" role="group" aria-label="Available states">
            {spec.states.map((state, index) => {
              const point = positions.get(state.id)!;
              const next = availableIds.has(state.id);
              const dim = mode === "guided" && state.id !== currentId && !next;
              return <button id={`rk-state-${state.id}`} key={state.id} type="button" className={`rk-state-machine__state ${state.id === currentId ? "is-current" : ""} ${visited.has(state.id) ? "is-visited" : ""} ${next && mode === "guided" ? "is-next" : ""} ${dim ? "is-dimmed" : ""} ${state.terminal ? "is-terminal" : ""}`} style={{ left: `${point.x}px`, top: `${point.y}px` }} aria-current={state.id === currentId ? "step" : undefined} aria-disabled={mode === "guided" && !next && state.id !== currentId ? "true" : undefined} onClick={() => choose(state.id)}><b>{state.label}</b>{state.owner ? <small>Owner: {state.owner}</small> : null}{next && mode === "guided" ? <span className="rk-state-machine__available">Next step</span> : null}{state.terminal ? <span className="rk-state-machine__terminal">Terminal</span> : null}</button>;
            })}
          </div>
        </div>
      </div>
      <Feedback tone={invalid ? "warn" : "info"}>{message}</Feedback>
      {showInspector ? <aside className="rk-state-machine__inspector" aria-live="polite"><h3>{current.label}</h3>{current.description ? <p>{current.description}</p> : null}{current.effect ? <p><b>Effect:</b> {current.effect}</p> : null}<h4>Allowed next states</h4>{knownTransitions.length ? <ul>{knownTransitions.map((transition, index) => <li key={`${transition.from}-${transition.to}-${index}`}><b>{spec.states.find((state) => state.id === transition.to)?.label}</b>{transition.condition ? ` — ${transition.condition}` : ""}</li>)}</ul> : <p>No outgoing transition is defined.</p>}</aside> : null}
      {showHistory ? <div className="rk-state-machine__history"><h4>Transition history</h4><ol>{history.map((id, index) => <li key={`${id}-${index}`}>{spec.states.find((state) => state.id === id)?.label}</li>)}</ol><p>Rejected attempts: {invalidCount}</p></div> : null}
    </section>
  );
}

export type { IllegalTransitionHint, StateMachineSpec, StateNode, StateTransition } from "./types";
