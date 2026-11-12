export type Encoder = 'CLIP' | 'SigLIP';
export const ROWS = 4;
export const COLS = 6;
export const PATCHES = ROWS * COLS;

export function position(i: number) {
  return `${String.fromCharCode(65 + Math.floor(i / COLS))}${(i % COLS) + 1}`;
}

// All values in this model are synthetic. The two scoring paths operate on
// row-normalised attention; grouping uses keys, while pooling uses hidden states.
const terrain = [
  0, 1, 0, 0, 0, 0,
  2, 2, 2, 2, 3, 4,
  2, 3, 2, 4, 4, 4,
  2, 2, 4, 4, 4, 4,
];
const prototypes = [
  [1, .15, .1], [.5, .85, .1], [.18, .1, 1], [.12, 1, .2], [.8, .5, .25],
];
const clipBias = [
  1, 6, 1, 2, 3, 1, 2, 1, 2, 3, 13, 3, 2, 10, 2, 5, 6, 3, 2, 1, 2, 3, 4, 2,
];
const sigBias = [
  1, 3, 1, 2, 4, 1, 2, 1, 2, 3, 8, 6, 2, 5, 1, 4, 9, 4, 1, 2, 4, 6, 2, 1,
];
const indices = terrain.map((_, i) => i);
const rawKeys = terrain.map((kind, i) => prototypes[kind].map((v, d) =>
  v + .08 * Math.sin((i + 1) * (d + 1) * 1.47)));
const keys = rawKeys.map(k => k.map(v => v / Math.hypot(...k)));
export const hidden = terrain.map((kind, i) => [
  (i % 4) + kind + 1, ((i + 2 * kind) % 5) + 1,
]);
const dot = (a: number[], b: number[]) => a.reduce((sum, value, d) => sum + value * b[d], 0);
export const keySimilarity = (i: number, target: number) => dot(keys[i], keys[target]);
const total = (a: number[]) => a.reduce((sum, value) => sum + value, 0);
const normalise = (a: number[], extra = 0) => {
  const sum = total(a) + extra;
  return a.map(v => v / sum);
};
const heads = [0, 1];

// Two CLS rows. The omitted self-column gets a positive weight of two.
const clsRows = heads.map(h => normalise(clipBias.map((w, i) =>
  w * w + 1 + .55 * Math.sin(i * 1.7 + h)), 2));
// In SigLIP every patch is a query. Assign positive weights, then normalise
// each row over keys before averaging received attention by column.
const sigHeads = heads.map(h => indices.map(q => normalise(indices.map(j => {
  const affinity = dot(keys[q], keys[j]);
  return Math.exp(1.8 * affinity + .2 * Math.sin((q + j + h) * 1.7)) * sigBias[j];
}))));
export const received: Record<Encoder, number[]> = {
  CLIP: indices.map(j => clsRows.reduce((sum, row) => sum + row[j], 0)),
  SigLIP: indices.map(j => sigHeads.reduce((acc, head) =>
    acc + head.reduce((sum, row) => sum + row[j], 0) / PATCHES, 0) / heads.length),
};
export type Group = { target: number; donors: number[]; vector: number[] };

export function allocation(encoder: Encoder, budget: number, contextual: number) {
  const clsCount = Number(encoder === 'CLIP');
  const nDominant = budget - contextual - clsCount;
  const scores = received[encoder];
  const ranked = [...indices].sort((a, b) => scores[b] - scores[a] || a - b);
  const dominant = ranked.slice(0, nDominant).sort((a, b) => a - b);
  const remaining = indices.filter(i => !dominant.includes(i));
  const stride = Math.max(1, Math.floor(remaining.length / contextual));
  const groups: Group[] = Array.from({ length: contextual }, (_, i) => ({
    target: remaining[i * stride], donors: [], vector: [],
  }));
  const groupOf = Array<number>(PATCHES).fill(-1);
  for (const [g, group] of groups.entries()) groupOf[group.target] = g;
  for (const patch of remaining) {
    if (groupOf[patch] !== -1) continue;
    let best = 0;
    for (let g = 1; g < groups.length; g++) {
      if (keySimilarity(patch, groups[g].target) > keySimilarity(patch, groups[best].target)) best = g;
    }
    groups[best].donors.push(patch);
    groupOf[patch] = best;
  }
  for (const group of groups) {
    group.vector = hidden[group.target].map((v, d) => v +
      group.donors.reduce((sum, i) => sum + hidden[i][d], 0) / Math.max(1, group.donors.length));
  }
  return { clsCount, dominant, remaining, groups, groupOf, ranked, scores, stride };
}
