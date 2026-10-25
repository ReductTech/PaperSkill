export type StateNode = { id: string; label: string; owner?: string; description?: string; effect?: string; terminal?: boolean; position?: { x: number; y: number } };
export type StateTransition = { from: string; to: string; condition?: string; explanation?: string; path?: "straight" | "curve" | "orthogonal" };
export type IllegalTransitionHint = { from: string; to: string; message: string };
export type StateMachineSpec = { states: StateNode[]; transitions: StateTransition[]; initialState: string; illegalHints?: IllegalTransitionHint[] };
export type TransitionResult = { valid: true; state: StateNode; transition: StateTransition } | { valid: false; message: string };

export function validateStateMachine(spec: StateMachineSpec): string[] {
  const ids = new Set(spec.states.map((state) => state.id));
  const errors: string[] = [];
  if (!ids.has(spec.initialState)) errors.push(`Initial state '${spec.initialState}' is not defined.`);
  for (const state of spec.states) {
    if (state.position && (!Number.isFinite(state.position.x) || !Number.isFinite(state.position.y) || state.position.x < 0 || state.position.y < 0)) {
      errors.push(`State '${state.id}' has an invalid position; x and y must be finite, non-negative canvas coordinates.`);
    }
  }
  for (const transition of spec.transitions) {
    if (!ids.has(transition.from) || !ids.has(transition.to)) errors.push(`Transition '${transition.from} → ${transition.to}' references an unknown state.`);
  }
  for (const hint of spec.illegalHints ?? []) {
    if (!ids.has(hint.from) || !ids.has(hint.to)) errors.push(`Illegal-transition hint '${hint.from} → ${hint.to}' references an unknown state.`);
  }
  return errors;
}

export function attemptTransition(spec: StateMachineSpec, fromId: string, toId: string): TransitionResult {
  const from = spec.states.find((state) => state.id === fromId);
  const target = spec.states.find((state) => state.id === toId);
  if (!from || !target) return { valid: false, message: `Cannot move from '${fromId}' to '${toId}': the state is not defined.` };
  if (fromId === toId) return { valid: false, message: `The process is already in '${from.label}'.` };
  if (from.terminal) return { valid: false, message: `'${from.label}' is terminal and cannot transition to another state.` };
  const transition = spec.transitions.find((item) => item.from === fromId && item.to === toId);
  if (transition) return { valid: true, state: target, transition };
  const hint = spec.illegalHints?.find((item) => item.from === fromId && item.to === toId);
  return { valid: false, message: hint?.message ?? `No transition from '${from.label}' to '${target.label}' is defined.` };
}
