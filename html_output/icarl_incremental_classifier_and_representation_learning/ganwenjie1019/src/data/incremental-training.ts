import {
  ALL_CLASS_IDS,
  CLASS_VISUALS,
  INCOMING_CLASS_IDS,
  INCOMING_SAMPLES,
  NEXT_QUOTA,
  OLD_QUOTA,
  OLD_CLASS_IDS,
  P_BEFORE,
  encode2D,
  normalize,
  type ClassId,
  type IncomingClassId,
  type Sample,
} from "./icarl-runtime";

export type ThreeOutputs = readonly [number, number, number];
export type SixOutputs = readonly [number, number, number, number, number, number];

export interface IncrementalStageData {
  oldClassIds: typeof OLD_CLASS_IDS;
  incomingClassIds: typeof INCOMING_CLASS_IDS;
  oldExemplars: readonly Sample[];
  incomingSamples: readonly Sample[];
  trainingSamples: readonly Sample[];
  snapshotBySampleId: ReadonlyMap<string, ThreeOutputs>;
  quotaBefore: number;
  quotaAfter: number;
}

const oldExemplars = OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId]);
const trainingSamples = [...oldExemplars, ...INCOMING_SAMPLES];

/** Fixed teaching-only sigmoid weights for the pre-update three-node model. */
export const TEACHER_OLD_NODE_WEIGHTS: Readonly<Record<Exclude<ClassId, IncomingClassId>, readonly [number, number, number]>> = {
  A: [1.85, 0.18, -0.22],
  B: [0.12, 1.92, -0.34],
  C: [-1.74, 0.12, -0.18],
};

/** Fixed teaching-only weights for a deterministic six-node current-model output illustration. */
export const STUDENT_NODE_WEIGHTS: Readonly<Record<ClassId, readonly [number, number, number]>> = {
  A: [1.45, 0.15, -0.25],
  B: [0.05, 1.55, -0.38],
  C: [-1.45, -0.05, -0.15],
  D: [-0.85, -1.35, -0.35],
  E: [0.4, -1.25, -0.55],
  F: [1.25, -0.65, -0.35],
};

function sigmoid(logit: number): number {
  if (logit >= 0) return 1 / (1 + Math.exp(-logit));
  const exponential = Math.exp(logit);
  return exponential / (1 + exponential);
}

function outputFor(sample: Sample, classId: ClassId, state: "before" | "after"): number {
  const feature = normalize(encode2D(sample, state));
  const [weightX, weightY, bias] = state === "before"
    ? TEACHER_OLD_NODE_WEIGHTS[classId as keyof typeof TEACHER_OLD_NODE_WEIGHTS]
    : STUDENT_NODE_WEIGHTS[classId];
  return sigmoid(weightX * feature[0] + weightY * feature[1] + bias);
}

export const TEACHER_SNAPSHOT_BY_SAMPLE_ID: ReadonlyMap<string, ThreeOutputs> = new Map(
  trainingSamples.map((sample) => [
    sample.id,
    OLD_CLASS_IDS.map((classId) => outputFor(sample, classId, "before")) as unknown as ThreeOutputs,
  ]),
);

export const INCREMENTAL_STAGE_DATA: IncrementalStageData = {
  oldClassIds: OLD_CLASS_IDS,
  incomingClassIds: INCOMING_CLASS_IDS,
  oldExemplars,
  incomingSamples: INCOMING_SAMPLES,
  trainingSamples,
  snapshotBySampleId: TEACHER_SNAPSHOT_BY_SAMPLE_ID,
  quotaBefore: OLD_QUOTA,
  quotaAfter: NEXT_QUOTA,
};

export function teacherSnapshotFor(sample: Sample): ThreeOutputs {
  const snapshot = TEACHER_SNAPSHOT_BY_SAMPLE_ID.get(sample.id);
  if (!snapshot) throw new Error(`No pre-update response snapshot exists for ${sample.id}.`);
  return snapshot;
}

/** Old-node targets use the matching Q row; only new nodes use the incoming class label. */
export function buildTargets(sample: Sample, q: ThreeOutputs = teacherSnapshotFor(sample)): SixOutputs {
  if (q.length !== OLD_CLASS_IDS.length) throw new Error("Q must contain one response for each of the three old nodes.");
  return [
    q[0], q[1], q[2],
    Number(sample.classId === INCOMING_CLASS_IDS[0]),
    Number(sample.classId === INCOMING_CLASS_IDS[1]),
    Number(sample.classId === INCOMING_CLASS_IDS[2]),
  ];
}

export function studentOutputFor(sample: Sample): SixOutputs {
  return ALL_CLASS_IDS.map((classId) => outputFor(sample, classId, "after")) as unknown as SixOutputs;
}

/** The formula is defined for 0 < g < 1; clamp only protects numeric exploration at the slider edges. */
export function binaryCrossEntropy(target: number, output: number): number {
  const safeOutput = Math.min(1 - 1e-7, Math.max(1e-7, output));
  return -(target * Math.log(safeOutput) + (1 - target) * Math.log(1 - safeOutput));
}

/** The fixed six-node model loss is independent of the single-node formula probe shown on P6. */
export function sixNodeBceLoss(targets: SixOutputs, outputs: SixOutputs): number {
  if (targets.length !== ALL_CLASS_IDS.length || outputs.length !== ALL_CLASS_IDS.length) {
    throw new Error("The sample loss requires one target and one output for each of the six nodes.");
  }
  return ALL_CLASS_IDS.reduce((sum, _, index) => sum + binaryCrossEntropy(targets[index], outputs[index]), 0);
}

export function classLabel(classId: ClassId): string {
  return CLASS_VISUALS[classId].displayLabel;
}

/** Fails fast if a page is ever wired to a partial or misaligned D/Q/R example. */
export function validateIncrementalStageData(): true {
  const ids = new Set(INCREMENTAL_STAGE_DATA.trainingSamples.map((sample) => sample.id));
  if (INCREMENTAL_STAGE_DATA.oldExemplars.length !== 12) throw new Error("The inherited old memory must contain 12 exemplars.");
  if (INCREMENTAL_STAGE_DATA.incomingSamples.length !== 18) throw new Error("The incoming batch must contain 18 images.");
  if (INCREMENTAL_STAGE_DATA.trainingSamples.length !== 30 || ids.size !== 30) throw new Error("D must contain 30 unique samples.");
  if (INCREMENTAL_STAGE_DATA.snapshotBySampleId.size !== 30) throw new Error("Q must contain one row for each of the 30 samples in D.");

  // The page animates D in the order of `trainingSamples`; a duplicate would hide a real sample
  // and desynchronise the Q rows it writes.
  const seen = new Set<string>();
  for (const sample of INCREMENTAL_STAGE_DATA.trainingSamples) {
    if (seen.has(sample.id)) throw new Error(`D repeats ${sample.id}; its Q row would be written twice.`);
    seen.add(sample.id);
    if (!INCREMENTAL_STAGE_DATA.snapshotBySampleId.has(sample.id)) {
      throw new Error(`D contains ${sample.id} but Q has no row for it.`);
    }
  }

  for (const sample of INCREMENTAL_STAGE_DATA.trainingSamples) {
    const q = teacherSnapshotFor(sample);
    const target = buildTargets(sample, q);
    if (q.length !== 3 || q.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
      throw new Error(`Q row for ${sample.id} must contain three finite sigmoid responses.`);
    }
    if (target.length !== ALL_CLASS_IDS.length || target.slice(0, 3).some((value, index) => value !== q[index])) {
      throw new Error(`The six-dimensional target for ${sample.id} must begin with its own Q row.`);
    }
    for (let index = 0; index < INCOMING_CLASS_IDS.length; index += 1) {
      const expected = Number(sample.classId === INCOMING_CLASS_IDS[index]);
      if (target[index + OLD_CLASS_IDS.length] !== expected) {
        throw new Error(`The new-node target for ${sample.id} does not match its class label.`);
      }
    }
  }

  return true;
}

export const INCREMENTAL_DATA_VALIDATION = validateIncrementalStageData();
