import { useSyncExternalStore } from 'react';

type SortMode = 'attn' | 'rand';
type Pruning = { K: number; R: number; mode: SortMode };
let state: Pruning = { K: 2, R: 0.5, mode: 'attn' };
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function update(changes: Partial<Pruning>) {
  const next = { ...state, ...changes };
  if (next.K === state.K && next.R === state.R && next.mode === state.mode) return;
  state = next;
  listeners.forEach(listener => listener());
}
export function setK(value: number | ((k: number) => number)) {
  update({ K: typeof value === 'function' ? value(state.K) : value });
}
export function setR(value: number | ((r: number) => number)) {
  update({ R: typeof value === 'function' ? value(state.R) : value });
}
export function setMode(mode: SortMode) { update({ mode }); }
export function setPoint(point: Pick<Pruning, 'K' | 'R'>) { update(point); }
export function usePruning() { return useSyncExternalStore(subscribe, () => state); }
