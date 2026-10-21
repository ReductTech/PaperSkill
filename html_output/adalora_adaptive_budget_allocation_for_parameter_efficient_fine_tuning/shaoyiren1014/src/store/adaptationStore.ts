import { useEffect, useReducer } from 'react';

export type Prediction = 'equal' | 'different' | 'unsure';
export interface LearningState {
  version: 1;
  step: number;
  firstPrediction: Prediction | null;
  allocation: number[];
  strategy: 'equal' | 'adjust' | null;
  operated: boolean;
  evidenceRead: boolean;
  reflection: string | null;
  completed: boolean;
  reducedMotion: boolean | null;
}
const key = 'adaptive-engine:act0:v1';
const initial: LearningState = { version: 1, step: 0, firstPrediction: null, allocation: [3,3,3,3], strategy: null, operated: false, evidenceRead: false, reflection: null, completed: false, reducedMotion: null };
export function restore(): LearningState {
  try {
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    if (!s || s.version !== 1 || !Number.isInteger(s.step) || s.step < 0 || s.step > 5) return initial;
    if (!Array.isArray(s.allocation) || s.allocation.length !== 4 || s.allocation.some((n: unknown) => typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 6) || s.allocation.reduce((a: number,b: number) => a+b,0) !== 12) return initial;
    if (s.firstPrediction !== null && !['equal','different','unsure'].includes(s.firstPrediction)) return initial;
    if (s.strategy !== null && !['equal','adjust'].includes(s.strategy)) return initial;
    if (['operated','evidenceRead','completed'].some(k => typeof s[k] !== 'boolean')) return initial;
    if (s.reducedMotion !== null && typeof s.reducedMotion !== 'boolean') return initial;
    if (s.reflection !== null && !['universal','conditional','opposite'].includes(s.reflection)) return initial;
    if (s.step > 1 && !s.firstPrediction || s.step > 2 && !s.operated || s.step > 3 && !s.evidenceRead || s.completed && (!s.evidenceRead || s.reflection !== 'conditional')) return initial;
    return { ...initial, ...s };
  } catch { return initial; }
}
type Action =
  | { type: 'step'; value: number }
  | { type: 'predict'; value: Prediction }
  | { type: 'strategy'; value: 'equal' | 'adjust' }
  | { type: 'transfer'; from: number; to: number }
  | { type: 'read' }
  | { type: 'reflect'; value: string }
  | { type: 'complete' }
  | { type: 'motion' }
  | { type: 'reset' };
export function reducer(s: LearningState, a: Action): LearningState {
  switch (a.type) {
    case 'step': {
      if (a.value < 0 || a.value > 5) return s;
      if (a.value > 1 && !s.firstPrediction || a.value > 2 && !s.operated || a.value > 3 && !s.evidenceRead || a.value > 4 && !s.completed) return s;
      return { ...s, step: a.value };
    }
    case 'predict': return { ...s, firstPrediction: s.firstPrediction || a.value };
    case 'strategy': return a.value === 'equal' ? { ...s, strategy: a.value, allocation: [3,3,3,3], operated: true } : { ...s, strategy: a.value };
    case 'transfer': {
      if (!Number.isInteger(a.from) || !Number.isInteger(a.to) || a.from < 0 || a.to < 0 || a.from > 3 || a.to > 3 || a.from === a.to || s.allocation[a.from] < 1 || s.allocation[a.to] >= 6) return s;
      const allocation = [...s.allocation]; allocation[a.from]--; allocation[a.to]++;
      return { ...s, allocation, strategy: 'adjust', operated: true };
    }
    case 'read': return { ...s, evidenceRead: true };
    case 'reflect': return s.completed ? s : { ...s, reflection: a.value };
    case 'complete': return s.firstPrediction && s.operated && s.evidenceRead && s.reflection === 'conditional' ? { ...s, completed: true, step: 5 } : s;
    case 'motion': return { ...s, reducedMotion: !(s.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches) };
    case 'reset': return { ...initial, reducedMotion: s.reducedMotion };
  }
}
export function useLearning() {
  const [state, dispatch] = useReducer(reducer, undefined, restore);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* App remains usable without storage. */ }
  }, [state]);
  return { state, dispatch };
}
