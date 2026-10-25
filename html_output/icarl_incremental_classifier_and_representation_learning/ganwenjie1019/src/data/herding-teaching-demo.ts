import {
  encode2D,
  euclideanDistance,
  herd,
  mean,
  normalize,
  type Sample,
  type Vector2,
} from "./icarl-runtime";

export const HERDING_DEMO_QUOTA = 4;
// Fixed, asymmetric unit-feature directions. The spread keeps a visible class
// direction while avoiding mirrored samples and exact zero-distance prefixes.
export const HERDING_DEMO_ANGLES = [-12.3, -73.2, -173.7, -143.7, 70, 120.2, -47.3, -116.1] as const;

export const HERDING_DEMO_SAMPLES: readonly Sample[] = HERDING_DEMO_ANGLES.map((angle, index) => {
  const radians = angle * Math.PI / 180;
  return {
    id: `a${index + 1}`,
    classId: "D",
    raw: [Math.cos(radians), Math.sin(radians)] as Vector2,
  };
});

export type HerdingDemoPoint = {
  id: string;
  angle: number;
  feature: Vector2;
};

export type HerdingDemoCandidate = {
  point: HerdingDemoPoint;
  rawPrefixMean: Vector2;
  normalizedPrefixMean: Vector2;
  score: number;
};

export type HerdingDemoRound = {
  k: number;
  chosen: HerdingDemoPoint;
  prefix: readonly HerdingDemoPoint[];
  rawPrefixMean: Vector2;
  normalizedPrefixMean: Vector2;
  score: number;
  candidates: readonly HerdingDemoCandidate[];
};

const featureById = new Map(HERDING_DEMO_SAMPLES.map((sample) => [sample.id, normalize(encode2D(sample, "before"))]));
export const HERDING_DEMO_POINTS: readonly HerdingDemoPoint[] = HERDING_DEMO_SAMPLES.map((sample, index) => ({
  id: sample.id,
  angle: HERDING_DEMO_ANGLES[index],
  feature: featureById.get(sample.id)!,
}));
const pointById = new Map(HERDING_DEMO_POINTS.map((point) => [point.id, point]));
const herdResult = herd(HERDING_DEMO_SAMPLES, HERDING_DEMO_QUOTA, "before");

export const HERDING_DEMO_TARGET_RAW = herdResult.rawTargetMean;
export const HERDING_DEMO_TARGET = herdResult.target;

export const HERDING_DEMO_ROUNDS: readonly HerdingDemoRound[] = (() => {
  const selected: HerdingDemoPoint[] = [];
  return herdResult.steps.map((step, index) => {
    const selectedFeatures = selected.map((point) => point.feature);
    const candidates = step.candidateScores.map((candidate): HerdingDemoCandidate => {
      const point = pointById.get(candidate.sample.id)!;
      const rawPrefixMean = mean([...selectedFeatures, point.feature]);
      const normalizedPrefixMean = normalize(rawPrefixMean);
      return {
        point,
        rawPrefixMean,
        normalizedPrefixMean,
        score: euclideanDistance(normalizedPrefixMean, HERDING_DEMO_TARGET),
      };
    });
    const chosen = pointById.get(step.chosen.id)!;
    selected.push(chosen);
    const rawPrefixMean = mean(selected.map((point) => point.feature));
    const normalizedPrefixMean = normalize(rawPrefixMean);
    return {
      k: index + 1,
      chosen,
      prefix: [...selected],
      rawPrefixMean,
      normalizedPrefixMean,
      score: euclideanDistance(normalizedPrefixMean, HERDING_DEMO_TARGET),
      candidates,
    };
  });
})();

export const HERDING_DEMO_ORDER = HERDING_DEMO_ROUNDS.map((round) => round.chosen);
