export type ClassId = "A" | "B" | "C" | "D" | "E" | "F";
export type OldClassId = "A" | "B" | "C";
export type IncomingClassId = "D" | "E" | "F";
export type FeatureState = "before" | "after";
export type Vector2 = readonly [number, number];

export type Sample = {
  id: string;
  classId: ClassId;
  raw: Vector2;
};

export type SampleFeaturePoint = {
  id: string;
  classId: ClassId;
  point: [number, number];
  order?: number;
};

export const CLASS_VISUALS: Record<ClassId, { displayLabel: string; outputNodeLabel: string; index: number; glyph: string; color: string }> = {
  A: { displayLabel: "Class 1", outputNodeLabel: "g₁", index: 1, glyph: "△", color: "#28659a" },
  B: { displayLabel: "Class 2", outputNodeLabel: "g₂", index: 2, glyph: "○", color: "#31775f" },
  C: { displayLabel: "Class 3", outputNodeLabel: "g₃", index: 3, glyph: "□", color: "#b46a2d" },
  D: { displayLabel: "Class 4", outputNodeLabel: "g₄", index: 4, glyph: "◇", color: "#76559a" },
  E: { displayLabel: "Class 5", outputNodeLabel: "g₅", index: 5, glyph: "⬟", color: "#a64f68" },
  F: { displayLabel: "Class 6", outputNodeLabel: "g₆", index: 6, glyph: "⬢", color: "#287f86" },
};

/** Fixed synthetic coordinates shared by all pages; old classes use spaced angles so L2-normalized teaching points remain individually visible. */
export const SAMPLES: readonly Sample[] = [
  { id: "x_7", classId: "A", raw: [1.337, 0.188] },
  { id: "x_3", classId: "A", raw: [1.394, 0.400] },
  { id: "x_9", classId: "A", raw: [1.188, 0.529] },
  { id: "x_12", classId: "A", raw: [1.272, 0.795] },
  { id: "x_15", classId: "A", raw: [1.034, 0.868] },
  { id: "x_18", classId: "A", raw: [0.970, 1.078] },
  { id: "x_2", classId: "B", raw: [0.202, 1.436] },
  { id: "x_4", classId: "B", raw: [0.000, 1.350] },
  { id: "x_6", classId: "B", raw: [-0.209, 1.485] },
  { id: "x_8", classId: "B", raw: [-0.358, 1.250] },
  { id: "x_10", classId: "B", raw: [-0.590, 1.325] },
  { id: "x_13", classId: "B", raw: [-0.715, 1.145] },
  { id: "x_1", classId: "C", raw: [-1.256, 0.725] },
  { id: "x_5", classId: "C", raw: [-1.252, 0.506] },
  { id: "x_11", classId: "C", raw: [-1.455, 0.363] },
  { id: "x_16", classId: "C", raw: [-1.293, 0.136] },
  { id: "x_19", classId: "C", raw: [-1.449, -0.051] },
  { id: "x_22", classId: "C", raw: [-1.329, -0.234] },
  { id: "x_20", classId: "D", raw: [-1.862, -1.598] },
  { id: "x_23", classId: "D", raw: [-2.101, -1.530] },
  { id: "x_24", classId: "D", raw: [-1.640, -1.377] },
  { id: "x_25", classId: "D", raw: [-1.421, -1.257] },
  { id: "x_26", classId: "D", raw: [-1.807, -1.823] },
  { id: "x_27", classId: "D", raw: [-2.147, -1.040] },
  { id: "x_28", classId: "E", raw: [0.291, -1.646] },
  { id: "x_29", classId: "E", raw: [0.470, -1.708] },
  { id: "x_30", classId: "E", raw: [0.812, -1.559] },
  { id: "x_31", classId: "E", raw: [0.194, -1.386] },
  { id: "x_32", classId: "E", raw: [0.672, -1.337] },
  { id: "x_33", classId: "E", raw: [1.042, -1.195] },
  { id: "x_34", classId: "F", raw: [1.715, -1.107] },
  { id: "x_35", classId: "F", raw: [1.849, -0.711] },
  { id: "x_36", classId: "F", raw: [1.659, -0.601] },
  { id: "x_37", classId: "F", raw: [1.957, -0.424] },
  { id: "x_38", classId: "F", raw: [1.423, -0.455] },
  { id: "x_39", classId: "F", raw: [1.967, -0.158] },
];

const SAMPLE_MODIFIERS = ["•", "╱", ":", "+", "*", "·"] as const;
const modifierCounts: Record<ClassId, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
export const SAMPLE_MODIFIER_BY_ID: Readonly<Record<string, string>> = Object.fromEntries(SAMPLES.map((sample) => {
  const modifier = SAMPLE_MODIFIERS[modifierCounts[sample.classId] % SAMPLE_MODIFIERS.length];
  modifierCounts[sample.classId] += 1;
  return [sample.id, modifier];
}));

export function sampleModifier(sampleId: string): string {
  return SAMPLE_MODIFIER_BY_ID[sampleId] ?? "•";
}

const sampleIndex = new Map(SAMPLES.map((sample) => [sample.id, sample]));

export function sampleById(id: string): Sample {
  const sample = sampleIndex.get(id);
  if (!sample) throw new Error(`Unknown synthetic sample: ${id}`);
  return sample;
}

export function samplesForClass(classId: ClassId): Sample[] {
  return SAMPLES.filter((sample) => sample.classId === classId);
}

/** A deterministic illustrative feature map. It is not a trained iCaRL checkpoint. */
export function encode2D(sample: Sample, state: FeatureState): [number, number] {
  return encodeRawVector(sample.raw, state);
}

export function encodeRawVector(raw: Vector2, state: FeatureState): [number, number] {
  if (state === "before") return [raw[0], raw[1]];
  const [x, y] = raw;
  return [0.92 * x + 0.16 * y, -0.12 * x + 0.88 * y];
}

/** Runtime calculation output consumed by the shared feature-space renderer. */
export function projectSampleFeatures(
  samples: readonly Sample[],
  state: FeatureState,
  normalized = false,
  orderBySampleId?: ReadonlyMap<string, number>,
): SampleFeaturePoint[] {
  return samples.map((sample) => ({
    id: sample.id,
    classId: sample.classId,
    point: normalized ? normalize(encode2D(sample, state)) : encode2D(sample, state),
    order: orderBySampleId?.get(sample.id),
  }));
}

export function mean(vectors: readonly Vector2[]): [number, number] {
  if (vectors.length === 0) throw new Error("Cannot average an empty vector set.");
  const totals = vectors.reduce<[number, number]>((sum, vector) => [sum[0] + vector[0], sum[1] + vector[1]], [0, 0]);
  return [totals[0] / vectors.length, totals[1] / vectors.length];
}

export function normalize(vector: Vector2): [number, number] {
  const length = Math.hypot(vector[0], vector[1]);
  if (!Number.isFinite(length) || length < 1e-10) throw new Error("Synthetic feature data produced a degenerate L2 normalization.");
  return [vector[0] / length, vector[1] / length];
}

export function euclideanDistance(a: Vector2, b: Vector2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export type HerdingCandidateScore = { sample: Sample; prefixMean: [number, number]; distanceToTarget: number };
export type HerdingStep = { chosen: Sample; prefixMean: [number, number]; distanceToTarget: number; candidateScores: HerdingCandidateScore[] };
export type HerdingResult = { ordered: Sample[]; rawTargetMean: [number, number]; target: [number, number]; steps: HerdingStep[] };

/** Greedy Herding: choose the candidate whose normalized new-prefix mean is nearest the normalized full-class mean. */
export function herd(samples: readonly Sample[], quota: number, state: FeatureState): HerdingResult {
  if (samples.length === 0) throw new Error("Herding needs at least one sample.");
  const featureById = new Map(samples.map((sample) => [sample.id, normalize(encode2D(sample, state))]));
  const rawTargetMean = mean([...featureById.values()]);
  const target = normalize(rawTargetMean);
  const selected: Sample[] = [];
  const selectedFeatures: [number, number][] = [];
  const steps: HerdingStep[] = [];
  const count = Math.max(0, Math.min(Math.floor(quota), samples.length));

  for (let index = 1; index <= count; index += 1) {
    const candidates: HerdingCandidateScore[] = samples
      .filter((sample) => !selected.some((item) => item.id === sample.id))
      .map((sample) => {
        const prefixMean = normalize(mean([...selectedFeatures, featureById.get(sample.id)!]));
        return { sample, prefixMean, distanceToTarget: euclideanDistance(prefixMean, target) };
      })
      .sort((a, b) => a.distanceToTarget - b.distanceToTarget || a.sample.id.localeCompare(b.sample.id));
    const winner = candidates[0];
    if (!winner) break;
    selected.push(winner.sample);
    selectedFeatures.push(featureById.get(winner.sample.id)!);
    steps.push({ chosen: winner.sample, prefixMean: winner.prefixMean, distanceToTarget: winner.distanceToTarget, candidateScores: candidates });
  }

  return { ordered: selected, rawTargetMean, target, steps };
}

export const MEMORY_BUDGET = 12;
export const OLD_CLASS_IDS: readonly OldClassId[] = ["A", "B", "C"];
export const INCOMING_CLASS_IDS: readonly IncomingClassId[] = ["D", "E", "F"];
export const ALL_CLASS_IDS: readonly ClassId[] = [...OLD_CLASS_IDS, ...INCOMING_CLASS_IDS];
export const OLD_QUOTA = Math.floor(MEMORY_BUDGET / OLD_CLASS_IDS.length);
export const NEXT_CLASS_COUNT = ALL_CLASS_IDS.length;
export const NEXT_QUOTA = Math.floor(MEMORY_BUDGET / NEXT_CLASS_COUNT);
export const INCOMING_SAMPLES: Sample[] = INCOMING_CLASS_IDS.flatMap((classId) => samplesForClass(classId));

// Synthetic inherited P_before fixture. The current increment consumes these saved samples only;
// it does not access omitted old-class data or rerun Herding. This calculation creates fixture data.
export const P_BEFORE: Record<ClassId, Sample[]> = {
  A: herd(samplesForClass("A"), OLD_QUOTA, "before").ordered,
  B: herd(samplesForClass("B"), OLD_QUOTA, "before").ordered,
  C: herd(samplesForClass("C"), OLD_QUOTA, "before").ordered,
  D: [],
  E: [],
  F: [],
};

// Each incoming class gets its own complete ordered list. P9 reveals only the first NEXT_QUOTA items.
export const NEW_CLASS_HERDING: Record<IncomingClassId, HerdingResult> = Object.fromEntries(
  INCOMING_CLASS_IDS.map((classId) => [classId, herd(samplesForClass(classId), samplesForClass(classId).length, "after")]),
) as Record<IncomingClassId, HerdingResult>;

export const P_AFTER: Record<ClassId, Sample[]> = Object.fromEntries(ALL_CLASS_IDS.map((classId) => [
  classId,
  OLD_CLASS_IDS.includes(classId as OldClassId)
    ? P_BEFORE[classId].slice(0, NEXT_QUOTA)
    : NEW_CLASS_HERDING[classId as IncomingClassId].ordered.slice(0, NEXT_QUOTA),
])) as Record<ClassId, Sample[]>;

export const P_BEFORE_REMOVED: Record<ClassId, Sample[]> = Object.fromEntries(ALL_CLASS_IDS.map((classId) => [
  classId,
  OLD_CLASS_IDS.includes(classId as OldClassId) ? P_BEFORE[classId].slice(NEXT_QUOTA) : [],
])) as Record<ClassId, Sample[]>;
export const CURRENT_EXEMPLARS: Sample[] = ALL_CLASS_IDS.flatMap((classId) => P_AFTER[classId]);
export const OLD_MEMORY_SIZE = OLD_CLASS_IDS.reduce((count, classId) => count + P_BEFORE[classId].length, 0);
export const REDUCED_MEMORY_SIZE = OLD_CLASS_IDS.reduce((count, classId) => count + P_AFTER[classId].length, 0);
export const COMMITTED_MEMORY_SIZE = CURRENT_EXEMPLARS.length;

export const TRAINING_SET_SIZE = OLD_MEMORY_SIZE + INCOMING_SAMPLES.length;
export const OLD_NODE_COUNT = OLD_CLASS_IDS.length;
export const OUTPUT_NODE_COUNT = ALL_CLASS_IDS.length;

export type Prototype = { classId: ClassId; rawMean: [number, number]; point: [number, number] };

export const PROTOTYPES: Prototype[] = ALL_CLASS_IDS.map((classId) => {
  const features = P_AFTER[classId].map((sample) => normalize(encode2D(sample, "after")));
  const rawMean = mean(features);
  return { classId, rawMean, point: normalize(rawMean) };
});

export const QUERY_VECTOR: Vector2 = [1.5, 1.0];
export const QUERY_FEATURE = normalize(encodeRawVector(QUERY_VECTOR, "after"));
export const QUERY_DISTANCES = PROTOTYPES.map((prototype) => ({
  classId: prototype.classId,
  distance: euclideanDistance(QUERY_FEATURE, prototype.point),
})).sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
export const QUERY_PREDICTION = QUERY_DISTANCES[0].classId;
