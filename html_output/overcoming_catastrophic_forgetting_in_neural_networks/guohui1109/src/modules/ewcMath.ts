// Shared toy model for the "mixing console" teaching theme (paper-specific helper, not a widget).
//
// Four faders θ = (θ1..θ4) stand for four network weights.
//  * Task A ("balance of song A") is a diagonal quadratic around the old solution θ*_A with
//    curvature F_A (the diagonal Fisher / second derivative of L_A near its minimum, paper §2 (a)).
//  * Task B / C ("loudness / contrast target") only constrain ONE linear combination w·θ = t.
//    Many fader settings therefore solve them, mirroring the paper's over-parameterisation
//    argument (§2: "many configurations of θ result in the same performance").
//  * EWC minimises  L_new(θ) + Σ_p (λ/2) Σ_i F_p,i (θ_i − θ*_p,i)²   — Eq. (3) with several penalties.
// All numbers are a SYNTHETIC demonstration; they are not paper results.

export type Vec = number[];

export const CHANNELS = ['低频', '人声', '鼓点', '镲片'];
export const A_ANCHOR: Vec = [0.7, 0.35, 0.6, 0.45];
export const F_A: Vec = [14, 1, 9, 0.5];

export interface Task { id: string; w: Vec; t: number; kappa: number; }
export const TASK_B: Task = { id: 'B', w: [1, 1, 1, 1], t: 2.9, kappa: 4 };
export const TASK_C: Task = { id: 'C', w: [0.3, 1, 0.3, 0.6], t: 2.04, kappa: 4 };
/** Fader travel: positions may exceed 1 slightly when a task needs a large correction. */
export const FADER_MAX = 1.2;

export interface Penalty { anchor: Vec; F: Vec; }
export type Method = 'sgd' | 'l2' | 'ewc';

export const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const mean = (a: Vec) => a.reduce((s, v) => s + v, 0) / a.length;
export const lerpVec = (a: Vec, b: Vec, t: number) => a.map((v, i) => v + (b[i] - v) * t);
export const ease = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

export function lossA(th: Vec): number {
  return 0.5 * th.reduce((s, v, i) => s + F_A[i] * (v - A_ANCHOR[i]) ** 2, 0);
}
export function residual(task: Task, th: Vec): number { return dot(task.w, th) - task.t; }
export function lossTask(task: Task, th: Vec): number { return 0.5 * task.kappa * residual(task, th) ** 2; }
/** Diagonal of the Hessian / Fisher of L_task (property (a) of the paper's Fisher). */
export function fisherOf(task: Task): Vec { return task.w.map(x => task.kappa * x * x); }
export const uniformFisher = (F: Vec): Vec => F.map(() => mean(F));

export function solveLinear(M: number[][], b: Vec): Vec {
  const n = b.length;
  const A = M.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / d;
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  const x: Vec = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = A[r][n];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
    x[r] = s / (A[r][r] || 1e-12);
  }
  return x;
}

/** Exact minimiser of L_task(θ) + Σ_p (λ/2) Σ_i F_p,i (θ_i − anchor_p,i)² (Eq. 3 with several penalties). */
export function trainPenalised(task: Task, penalties: Penalty[], lambda: number): Vec {
  const n = task.w.length;
  const H: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => task.kappa * task.w[i] * task.w[j] + (i === j ? 1e-9 : 0)));
  const rhs: Vec = task.w.map(wi => task.kappa * task.t * wi);
  for (const p of penalties) {
    for (let i = 0; i < n; i++) { H[i][i] += lambda * p.F[i]; rhs[i] += lambda * p.F[i] * p.anchor[i]; }
  }
  return solveLinear(H, rhs);
}

/** Plain gradient descent on the new task only, started from `start` (converged). */
export function trainSgd(task: Task, start: Vec): Vec {
  const k = (task.t - dot(task.w, start)) / dot(task.w, task.w);
  return start.map((v, i) => v + k * task.w[i]);
}

/** One sequential training step with the chosen method. `old` lists previous tasks' penalties. */
export function trainStep(method: Method, task: Task, start: Vec, old: Penalty[], lambda: number): Vec {
  if (method === 'sgd') return trainSgd(task, start);
  const pens = method === 'l2' ? old.map(p => ({ anchor: p.anchor, F: uniformFisher(p.F) })) : old;
  return trainPenalised(task, pens, lambda);
}

export const PEN_A: Penalty = { anchor: A_ANCHOR, F: F_A };
export const penaltyOf = (task: Task, anchor: Vec): Penalty => ({ anchor, F: fisherOf(task) });
