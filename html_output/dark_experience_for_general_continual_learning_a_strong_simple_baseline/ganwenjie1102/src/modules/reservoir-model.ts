export type MemoryRecord = { id: string; model: 0 | 1 | 2; z: readonly number[]; origin: string };
export type MemoryState<T extends MemoryRecord = MemoryRecord> = { K: number; N: number; M: readonly T[] };
/** Algorithm 3 normalized by W2 M03: N is the count before insertion; j is inclusive. */
export function reservoirInsert<T extends MemoryRecord>(state: MemoryState<T>, candidate: T, j?: number) {
  const { K, N, M } = state;
  if (!Number.isInteger(K) || K < 1 || !Number.isInteger(N) || N < 0 || M.length !== Math.min(N, K)) throw Error("Invalid reservoir state");
  const slot = N < K ? N : j;
  if (N >= K && (!Number.isInteger(j) || j! < 0 || j! > N)) throw Error("Draw must be an integer in [0,N]");
  const accepted = slot! < K, evicted = accepted ? M[slot!] : undefined;
  const next = [...M]; if (accepted) next[slot!] = candidate;
  return { before: state, candidate, j: N < K ? undefined : j, slot: accepted ? slot! : null,
    decision: N < K ? "append" : accepted ? "replace" : "reject",
    evicted, after: { K, N: N + 1, M: next } } as const;
}
// Independent synthetic insertion example. Frozen values are given pre-update outputs, not recomputed here.
export const RESERVOIR_INPUTS: readonly MemoryRecord[] = [
  { id: "x₁", model: 0, z: [2,1,0], origin: "θ₀" },
  { id: "x₂", model: 1, z: [1,2,0], origin: "θ₁" },
  { id: "x₃", model: 2, z: [0,1,2], origin: "θ₂" },
  { id: "x₄", model: 0, z: [2,0,1], origin: "θ₃" },
];
export const RESERVOIR_STEPS = (() => {
  let state: MemoryState = { K: 2, N: 0, M: [] };
  return RESERVOIR_INPUTS.map((candidate, i) => {
    const step = reservoirInsert(state, candidate, [undefined, undefined, 0, 3][i]);
    state = step.after; return step;
  });
})();
export const RESERVOIR_CLIPS = [
  { id: "x₁ · 进入空槽", durationMs: 3600, holdMs: 1000 },
  { id: "x₂ · 填满记忆", durationMs: 3600, holdMs: 1000 },
  { id: "x₃ · 抽签与选留", durationMs: 4800, holdMs: 1200 },
  { id: "x₄ · 抽签与选留", durationMs: 4800, holdMs: 1200 },
] as const;
export function reservoirSceneAt(clip: number, progress: number) {
  const step = RESERVOIR_STEPS[Math.max(0, Math.min(3, clip))];
  const committed = progress >= .9;
  return { ...step, committed, state: committed ? step.after : step.before };
}
