import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ClassFeatureMarker } from "../components/FeatureSpaceWorkbench";
import {
  CLASS_VISUALS,
  encode2D,
  encodeRawVector,
  euclideanDistance,
  mean,
  normalize,
  P_BEFORE,
  type ClassId,
  type Vector2,
} from "../data/icarl-runtime";
import {
  activeNarrationIndex,
  useAnimationTimeline,
  type AnimationClip,
} from "../shared/animation/useAnimationTimeline";
import {
  arcSegmentPath,
  clamp,
  lerpPoint,
  lineRevealPath,
  placeLabel,
  progressWithin,
  smoothstep,
  type Point,
} from "../shared/animation/easing";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

/* ------------------------------------------------------------------ data --- */

const classIds: readonly ClassId[] = ["A", "B", "C"];
const exemplarByClass = new Map(classIds.map((classId) => [classId, P_BEFORE[classId]]));
const exemplars = classIds.flatMap((classId) => exemplarByClass.get(classId)!);

const queryInput: Vector2 = [1.732, -1.0];
const queryRawFeature = encodeRawVector(queryInput, "before");
const queryUnitFeature = normalize(queryRawFeature);

type PrototypeCalculation = {
  classId: ClassId;
  features: [number, number][];
  rawMean: [number, number];
  prototype: [number, number];
  meanDistanceToRaw: number;
};

const prototypeCalculations: PrototypeCalculation[] = classIds.map((classId) => {
  const features = exemplarByClass.get(classId)!.map((sample) => normalize(encode2D(sample, "before")));
  const rawMean = mean(features);
  return {
    classId,
    features,
    rawMean,
    prototype: normalize(rawMean),
    meanDistanceToRaw: euclideanDistance(rawMean, features[0]),
  };
});

/**
 * Displayed distances. Values below the unit circle's own resolution are surfaced verbatim in the
 * checkpoint view instead of being nudged, so the geometry never contradicts the formula.
 */
const queryComparisons = prototypeCalculations
  .map(({ classId, prototype }) => ({
    classId,
    distance: euclideanDistance(queryUnitFeature, prototype),
  }))
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
const predictedClass = queryComparisons[0].classId;
const comparisonOrder: ClassId[] = ["A", "B", "C"];

/* ------------------------------------------------------------- projection --- */

/**
 * The teaching space is a square viewBox so the scene always fills its slot: the container is
 * roughly square, and a non-square viewBox would letterbox the geometry and shrink the circle.
 */
const VIEW = { width: 600, height: 600 };

const projectedVectors: { id: string; vector: Vector2 }[] = [
  ...exemplars.flatMap((sample) => [
    { id: `${sample.id}:raw`, vector: encode2D(sample, "before") },
    { id: `${sample.id}:unit`, vector: normalize(encode2D(sample, "before")) },
  ]),
  ...prototypeCalculations.flatMap((item) => [
    { id: `${item.classId}:mean`, vector: item.rawMean },
    { id: `${item.classId}:prototype`, vector: item.prototype },
  ]),
  { id: "query:raw", vector: queryRawFeature },
  { id: "query:unit", vector: queryUnitFeature },
];

const LABEL_FALLBACK = { dx: 15, dy: -13, anchor: "start" as const };

/** Extra space each label needs beyond its mark, per side, in feature units. */
const prototypeLabel: Partial<Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }>> = {
  A: { dx: 15, dy: -13, anchor: "start" },
  B: { dx: 0, dy: -23, anchor: "middle" },
  C: { dx: -15, dy: -11, anchor: "end" },
};

const meanLabel: Partial<Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }>> = {
  A: { dx: -13, dy: 22, anchor: "end" },
  B: { dx: -13, dy: 20, anchor: "end" },
  C: { dx: 15, dy: 21, anchor: "start" },
};

/** z_q drops below its marker: that corner is free of other marks and of the comparison chords. */
const queryLabel = { dx: 16, dy: 34, anchor: "start" as const };

/**
 * Fit every plotted object plus the space its label needs. Solving this as one padded box is what
 * lets the diagram be as large as its slot allows while guaranteeing that nothing is clipped.
 */
const chartFrame = (() => {
  const boxes: { min: [number, number]; max: [number, number] }[] = projectedVectors.map((item) => ({
    min: [item.vector[0] - 0.13, item.vector[1] - 0.11],
    max: [item.vector[0] + 0.13, item.vector[1] + 0.11],
  }));
  prototypeCalculations.forEach((item) => {
    const placement = prototypeLabel[item.classId] ?? LABEL_FALLBACK;
    const extraTop = placement.dy < 0 ? 0.28 : 0.1;
    const extraSide = Math.abs(placement.dx) > 20 ? 0.3 : 0.22;
    const side = placement.anchor === "end" ? -extraSide : placement.anchor === "start" ? extraSide : 0;
    boxes.push({
      min: [item.prototype[0] + Math.min(0, side), item.prototype[1] - 0.1],
      max: [item.prototype[0] + Math.max(0, side), item.prototype[1] + extraTop],
    });
    boxes.push({ min: [item.rawMean[0] - 0.24, item.rawMean[1] - 0.24], max: [item.rawMean[0] + 0.24, item.rawMean[1] + 0.24] });
  });
  // The Query is entered at a low y; its marker and the z_q label extend right and downward.
  boxes.push({ min: [queryUnitFeature[0] - 0.12, queryUnitFeature[1] - 0.12], max: [queryUnitFeature[0] + 0.62, queryUnitFeature[1] + 0.4] });
  boxes.push({ min: [queryRawFeature[0] - 0.2, queryRawFeature[1] - 0.4], max: [queryRawFeature[0] + 0.2, queryRawFeature[1] + 0.12] });

  const minX = Math.min(...boxes.map((box) => box.min[0]));
  const maxX = Math.max(...boxes.map((box) => box.max[0]));
  const minY = Math.min(...boxes.map((box) => box.min[1]));
  const maxY = Math.max(...boxes.map((box) => box.max[1]));
  const MARGIN = 22;
  const usable = Math.min(VIEW.width, VIEW.height) - MARGIN * 2;
  const scale = usable / Math.max(maxX - minX, maxY - minY);
  const origin = {
    x: MARGIN + (0 - minX) * scale + (usable - (maxX - minX) * scale) / 2,
    y: MARGIN + (maxY - 0) * scale + (usable - (maxY - minY) * scale) / 2,
  };
  return { scale, origin };
})();

const chartScale = chartFrame.scale;
const ORIGIN = chartFrame.origin;
const SAFE = { left: 18, right: VIEW.width - 18, top: 18, bottom: VIEW.height - 34 };

function project(vector: Vector2): Point {
  return { x: ORIGIN.x + vector[0] * chartScale, y: ORIGIN.y - vector[1] * chartScale };
}

const samplePointById = new Map(
  exemplars.map((sample) => {
    const raw = encode2D(sample, "before");
    const unit = normalize(raw);
    return [sample.id, { sample, raw, unit, rawPoint: project(raw), unitPoint: project(unit) }];
  }),
);

// The fit above must include every plotted vector; a regression here would crop the diagram.
projectedVectors.forEach(({ id, vector }) => {
  const point = project(vector);
  if (
    point.x < SAFE.left - 4 ||
    point.x > SAFE.right + 4 ||
    point.y < SAFE.top - 4 ||
    point.y > SAFE.bottom + 4
  ) {
    throw new Error(`P3 plot point ${id} is outside the safe viewport.`);
  }
});

/* --------------------------------------------------------------- timeline --- */

const clips: readonly AnimationClip[] = [
  { id: "p3-a-normalize", durationMs: 6600, holdMs: 900, narrative: "十二张代表图片的单位化" },
  { id: "p3-b-aggregate", durationMs: 8600, holdMs: 1100, narrative: "贡献点聚合成类别均值，再单位化为原型" },
  { id: "p3-c-query", durationMs: 5000, holdMs: 900, narrative: "Query 先落入原始特征位置，再单位化" },
  { id: "p3-d-decide", durationMs: 7800, holdMs: 1200, narrative: "逐条比较距离与夹角，argmin 给出预测" },
];

const clipNarratives: readonly (readonly string[])[] = [
  [
    "十二张已保存的代表图片由同一个固定网络映射为特征。",
    "每个特征沿自身径向缩放到单位圆上，方向保持不变。",
    "得到的十二个单位特征将用于构造各自类别的原型。",
  ],
  [
    "把同一类别的四个单位特征取算术平均，形成类别均值。",
    "贡献副本移动到均值位置；原始特征点保持不动。",
    "再将类别均值单位化，得到用于比较的原型 μ_y。",
  ],
  [
    "新图片 Query 通过同一个固定特征提取器，得到原始特征 φ_Θ(x_q)。",
    "将其沿径向单位化，得到 z_q = φ_Θ(x_q) / ‖φ_Θ(x_q)‖₂。",
    "Query 只参与这次预测，不写入记忆，也不更新模型参数。",
  ],
  [
    "逐一比较单位查询 z_q 与三个类别原型 μ_y。",
    "图中的线段和圆心夹角都由真实向量计算；最近原型对应最小距离。",
    "对单位向量而言，最小距离也对应最小夹角，argmin 给出预测类别。",
  ],
];

const clipTitles: readonly string[] = [
  "代表图片变成单位特征",
  "四张同类样本形成一个 Prototype",
  "新 Query 进入同一空间",
  "几何比较与决策",
];
const stageResults: readonly string[] = [
  "阶段结果：十二张 Exemplar 已成为单位特征，图片身份和类别保持不变。",
  "阶段结果：三类 Prototype 已由各自四张 Exemplar 的单位特征计算完成。",
  "阶段结果：Query 已用同一固定模型编码；它不写入记忆。",
  `最终结果：三类真实距离比较完成，最近原型给出 ${CLASS_VISUALS[predictedClass].displayLabel}。`,
];

/* ------------------------------------------------------------------ types --- */

type SceneState = {
  clipIndex: number;
  progress: number;
  unitizeProgressByClass: number[];
  unitizationRayOpacity: number;
  contributionByClass: (number | null)[];
  prototypeProgressByClass: number[];
  contributionOpacityByClass: number[];
  meanOpacityByClass: number[];
  queryRawGhostOpacity: number;
  queryUnitizeProgress: number;
  queryOpacity: number;
  comparisonProgress: number[];
  arcProgress: number[];
  decisionProgress: number;
  predictedOpacity: number;
  showPrototypes: boolean;
};

function sceneAt(clipIndex: number, progress: number): SceneState {
  const p = clamp(progress);
  const perClassWindow = 0.78 / classIds.length;

  const unitizeProgressByClass = classIds.map((_, index) => {
    if (clipIndex === 0) {
      const start = 0.14 + index * perClassWindow;
      return smoothstep(progressWithin(p, start, start + perClassWindow * 0.86));
    }
    return 1;
  });
  /**
   * Original-to-circle rays belong to the unitisation stage only. Keeping them afterwards would
   * collide with the aggregation rays, which also start at the origin.
   */
  const unitizationRayOpacity = clipIndex === 0 ? 1 : 0;

  const contributionByClass = classIds.map((_, index) => {
    if (clipIndex !== 1) return null;
    const start = 0.04 + index * 0.3;
    return smoothstep(progressWithin(p, start, start + 0.17));
  });

  const prototypeProgressByClass = classIds.map((_, index) => {
    if (clipIndex === 0) return 0;
    if (clipIndex > 1) return 1;
    const start = 0.04 + index * 0.3;
    return smoothstep(progressWithin(p, start + 0.21, start + 0.3));
  });

  const contributionOpacityByClass = classIds.map((_, index) => {
    if (clipIndex !== 1) return 0;
    const start = 0.04 + index * 0.3;
    return clamp(progressWithin(p, start + 0.1, start + 0.18)) * (1 - clamp(progressWithin(p, start + 0.19, start + 0.24)));
  });

  const meanOpacityByClass = classIds.map((_, index) => {
    if (clipIndex === 0) return 0;
    if (clipIndex > 1) return 0;
    const start = 0.04 + index * 0.3;
    return clamp(progressWithin(p, start + 0.15, start + 0.2)) * (1 - clamp(progressWithin(p, start + 0.27, start + 0.31)));
  });

  const queryUnitizeProgress = clipIndex < 2 ? 0 : clipIndex > 2 ? 1 : smoothstep(progressWithin(p, 0.26, 0.66));
  const queryOpacity = clipIndex < 2 ? 0 : clipIndex > 2 ? 1 : clamp(progressWithin(p, 0.1, 0.26));
  const queryRawGhostOpacity =
    clipIndex > 2 ? 0 : clipIndex === 2 ? clamp(progressWithin(p, 0.46, 0.7)) * 0.65 : 0;

  const comparisonProgress = comparisonOrder.map((_, index) => {
    if (clipIndex < 3) return 0;
    const start = 0.04 + index * 0.17;
    return smoothstep(progressWithin(p, start, start + 0.14));
  });
  const arcProgress = comparisonOrder.map((_, index) => {
    if (clipIndex < 3) return 0;
    const start = 0.26 + index * 0.17;
    return smoothstep(progressWithin(p, start, start + 0.14));
  });
  const decisionProgress = clipIndex < 3 ? 0 : smoothstep(progressWithin(p, 0.8, 0.93));
  const predictedOpacity = clipIndex < 3 ? 0 : clamp(progressWithin(p, 0.88, 0.96));

  return {
    clipIndex,
    progress: p,
    unitizeProgressByClass,
    unitizationRayOpacity,
    contributionByClass,
    prototypeProgressByClass,
    contributionOpacityByClass,
    meanOpacityByClass,
    queryRawGhostOpacity,
    queryUnitizeProgress,
    queryOpacity,
    comparisonProgress,
    arcProgress,
    decisionProgress,
    predictedOpacity,
    showPrototypes: clipIndex >= 1,
  };
}

/* ---------------------------------------------------------------- subviews --- */

const ARC_RADIUS = [46, 62, 78] as const;

function FeatureScene({ scene, selectedSampleId, onSelectSample }: {
  scene: SceneState;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
}) {
  const origin = ORIGIN;
  const comparisonIndexByClass = new Map(comparisonOrder.map((classId, index) => [classId, index]));
  const predictedIndex = comparisonIndexByClass.get(predictedClass) ?? 0;

  function activate(event: KeyboardEvent<SVGGElement>, sampleId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSample(sampleId);
    }
  }

  const rawQueryPoint = project(queryRawFeature);
  const unitQueryPoint = project(queryUnitFeature);
  const queryMarkerPoint = lerpPoint(rawQueryPoint, unitQueryPoint, scene.queryUnitizeProgress);
  /** The dashed ray grows out of the origin to the query's raw position before the marker moves. */
  const queryRayReveal = scene.clipIndex < 2 ? 0 : scene.clipIndex > 2 ? 1 : smoothstep(progressWithin(scene.progress, 0.03, 0.24));
  const queryRayEnd = lerpPoint(origin, queryMarkerPoint, queryRayReveal);

  return (
    <div className="p3-canvas">
      <svg
        className="p3-scene"
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="十二张已保留图片的单位化特征、三类原型与查询特征构成的固定二维教学空间"
      >
      <title>Exemplar 原型分类</title>
      <desc>十二张 Exemplar 依次单位化；同类四个单位特征通过贡献点聚合成均值，再单位化为原型；独立 Query 先落到原始特征位置再单位化；最后逐条绘制距离线与圆心角弧，由 argmin 给出预测。</desc>

      <circle className="p3-scene__unit-circle" cx={origin.x} cy={origin.y} r={chartScale} />
      <line className="p3-scene__axis" x1="14" y1={origin.y} x2={VIEW.width - 14} y2={origin.y} />
      <line className="p3-scene__axis" x1={origin.x} y1="14" x2={origin.x} y2={VIEW.height - 14} />

      {/* Persistent normalization layer: rays and moving points keep their identity across clips. */}
      {exemplars.map((sample) => {
        const entry = samplePointById.get(sample.id)!;
        const classIndex = classIds.indexOf(sample.classId);
        const classProgress = scene.unitizeProgressByClass[classIndex] ?? 0;
        const moving = lerpPoint(entry.rawPoint, entry.unitPoint, classProgress);
        const isSelected = sample.id === selectedSampleId;
        const color = CLASS_VISUALS[sample.classId].color;
        const style = { "--p3-point-color": color } as CSSProperties;
        const ghostProgress = clamp((classProgress - 0.02) / 0.38) * (1 - clamp((classProgress - 0.42) / 0.48));
        const ghostOpacity = scene.clipIndex === 0 ? ghostProgress * 0.3 : 0;
        return (
          <g
            key={`feature-${sample.id}`}
            className={`p3-scene__point${isSelected ? " is-selected" : ""}`}
            style={style}
            data-sample-id={sample.id}
            data-unit-progress={classProgress.toFixed(3)}
            data-marker-x={moving.x.toFixed(2)}
            data-marker-y={moving.y.toFixed(2)}
            tabIndex={0}
            role="button"
            aria-label={`${CLASS_VISUALS[sample.classId].displayLabel} 已保留样本 ${sample.id}；选择以联动左栏身份`}
            onClick={() => onSelectSample(sample.id)}
            onKeyDown={(event) => activate(event, sample.id)}
          >
            {classProgress > 0 && scene.unitizationRayOpacity > 0.02 ? (
              <line
                className="p3-scene__radial-ray"
                x1={origin.x}
                y1={origin.y}
                x2={moving.x}
                y2={moving.y}
                opacity={(isSelected ? 0.85 : 0.4) * scene.unitizationRayOpacity}
              />
            ) : null}
            {ghostOpacity > 0.02 ? (
              <circle
                className="p3-scene__raw-ghost"
                cx={entry.rawPoint.x}
                cy={entry.rawPoint.y}
                r="4"
                opacity={ghostOpacity}
              />
            ) : null}
            <ClassFeatureMarker
              className="p3-scene__unit-point"
              classId={sample.classId}
              x={moving.x}
              y={moving.y}
              radius={isSelected ? 5 : 3.8}
              selected={false}
              fillOverride={color}
            />
            <title>{`${sample.id} · fΘ(p) → z_p`}</title>
          </g>
        );
      })}

      {/* Aggregation layer for the class being computed. Each ray grows out of the origin until it
          reaches its own sample, then that sample's copy travels back along the ray to the mean.
          Rays and copies exist only while the mean is being formed: once it is known they are gone,
          so the picture afterwards is just the unit points, the mean and the prototypes. */}
      {classIds.map((classId) => {
        const calculation = prototypeCalculations.find((item) => item.classId === classId)!;
        const classIndex = classIds.indexOf(classId);
        const gather = scene.contributionByClass[classIndex];
        const meanPoint = project(calculation.rawMean);
        if (gather === null || gather === undefined) return null;
        const contributionOpacity = scene.contributionOpacityByClass[classIndex] ?? 0;
        return (
          <g key={`aggregate-${classId}`} className="p3-scene__aggregate" style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            {calculation.features.map((feature, index) => {
              const source = project(feature);
              // The origin-to-sample leg is drawn first, so the dash appears as a growing line.
              const rayReveal = smoothstep(progressWithin(gather, index * 0.06, index * 0.06 + 0.5));
              const position = lerpPoint(source, meanPoint, gather);
              const rayEnd = lerpPoint(origin, source, rayReveal);
              return (
                <g key={`contribution-${classId}-${index}`}>
                  <line
                    className="p3-scene__contribution-line"
                    x1={origin.x}
                    y1={origin.y}
                    x2={rayEnd.x}
                    y2={rayEnd.y}
                    opacity={contributionOpacity * 0.75}
                  />
                  <circle
                    className="p3-scene__contribution"
                    cx={position.x}
                    cy={position.y}
                    r="6"
                    opacity={contributionOpacity}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Category means (inside the circle) and prototypes (on the circle). */}
      {prototypeCalculations.map((calculation) => {
        const classIndex = classIds.indexOf(calculation.classId);
        const meanPoint = project(calculation.rawMean);
        const prototypePoint = project(calculation.prototype);
        const move = scene.prototypeProgressByClass[classIndex] ?? 0;
        const markerPoint = lerpPoint(meanPoint, prototypePoint, move);
        const label = prototypeLabel[calculation.classId] ?? LABEL_FALLBACK;
        const meanPlacement = meanLabel[calculation.classId] ?? LABEL_FALLBACK;
        return (
          <g key={`prototype-${calculation.classId}`} style={{ "--p3-point-color": CLASS_VISUALS[calculation.classId].color } as CSSProperties}>
            {/* The normalization path is only the movement between mean and prototype. Once the
                prototype has landed, a stable radial ray from the origin takes over and stays for the
                rest of the page, so the prototype's direction is readable at every later moment. */}
            {move > 0.01 && move < 0.99 ? (
              <path
                className="p3-scene__normalize-path"
                d={lineRevealPath(meanPoint, prototypePoint, move)}
                opacity={0.9}
              />
            ) : null}
            {move > 0.99 ? (
              <line
                className="p3-scene__prototype-ray"
                x1={origin.x}
                y1={origin.y}
                x2={prototypePoint.x}
                y2={prototypePoint.y}
              />
            ) : null}
            <circle
              className="p3-scene__raw-mean"
              cx={meanPoint.x}
              cy={meanPoint.y}
              r="9"
              opacity={scene.meanOpacityByClass[classIndex] ?? 0}
            />
            <path
              className="p3-scene__prototype"
              d={`M ${markerPoint.x - 7.5} ${markerPoint.y - 7.5} h 15 v 15 h -15 Z`}
              opacity={scene.showPrototypes ? clamp(move * 1.6) : 0}
            />
            {scene.showPrototypes && move > 0.6 ? (
              <PlacedLabel
                point={prototypePoint}
                text={`μ${CLASS_VISUALS[calculation.classId].index}`}
                placement={label}
                fontSize={17}
                className="p3-scene__label"
              />
            ) : null}
            {(scene.meanOpacityByClass[classIndex] ?? 0) > 0.05 ? (
              <PlacedLabel
                point={meanPoint}
                text={`z̄${CLASS_VISUALS[calculation.classId].index}`}
                placement={meanPlacement}
                fontSize={15}
                className="p3-scene__label p3-scene__label--mean"
              />
            ) : null}
          </g>
        );
      })}

      {/* Query: a dashed radial ray grows out of the origin, the query feature lands on it at its raw
          position, and the marker then travels along that same ray onto the unit circle. */}
      <g className="p3-scene__query" opacity={scene.queryOpacity}>
        {queryRayReveal > 0.01 ? (
          <line
            className="p3-scene__query-ray"
            x1={origin.x}
            y1={origin.y}
            x2={queryRayEnd.x}
            y2={queryRayEnd.y}
          />
        ) : null}
        {scene.queryRawGhostOpacity > 0.02 ? (
          <circle
            className="p3-scene__raw-ghost"
            cx={rawQueryPoint.x}
            cy={rawQueryPoint.y}
            r="5"
            opacity={scene.queryRawGhostOpacity}
          />
        ) : null}
      </g>

      {/* Comparison lines, then angle arcs with the vertex at the origin. */}
      {comparisonOrder.map((classId, index) => {
        const prototype = prototypeCalculations.find((item) => item.classId === classId)!.prototype;
        const prototypePoint = project(prototype);
        const queryPoint = project(queryUnitFeature);
        const lineProgress = scene.comparisonProgress[index] ?? 0;
        const reveal = scene.arcProgress[index] ?? 0;
        const isNearest = classId === predictedClass;
        const emphasized = scene.decisionProgress > 0 && isNearest;
        const faded = scene.decisionProgress > 0 && !isNearest;
        const className = [
          "p3-scene__comparison",
          emphasized ? "is-nearest" : "",
          faded ? "is-faded" : "",
        ].filter(Boolean).join(" ");
        return (
          <g key={`comparison-${classId}`} className={className} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            {lineProgress > 0.01 ? (
              <path className="p3-scene__distance-line" d={lineRevealPath(queryPoint, prototypePoint, lineProgress)} />
            ) : null}
            {reveal > 0.01 ? (
              <AngleArc
                center={origin}
                radius={ARC_RADIUS[index]}
                from={queryUnitFeature}
                to={prototype}
                progress={reveal}
              />
            ) : null}
          </g>
        );
      })}

      {/* Query marker sits above the comparison lines so it stays visible at every checkpoint. The
          label follows the marker and renames itself once normalisation completes. */}
      {scene.queryOpacity > 0.05 ? (
        <g className="p3-scene__query p3-scene__query--marker" opacity={scene.queryOpacity}>
          <QueryMarker point={queryMarkerPoint} progress={scene.queryUnitizeProgress} />
          <PlacedLabel
            point={scene.queryUnitizeProgress > 0.6 ? unitQueryPoint : rawQueryPoint}
            text={scene.queryUnitizeProgress > 0.6 ? "z_q" : "f(x_q)"}
            placement={queryLabel}
            fontSize={scene.queryUnitizeProgress > 0.6 ? 17 : 14}
            className="p3-scene__label p3-scene__label--query"
          />
        </g>
      ) : null}

      {/* Prediction is revealed once, after all three comparisons, and comes from the real argmin. */}
      {scene.predictedOpacity > 0.02 ? (
        <g className="p3-scene__decision" opacity={scene.predictedOpacity}>
          <line
            className="p3-scene__decision-leader"
            x1={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).x}
            y1={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).y}
            x2={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).x + 40}
            y2={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).y + 40}
          />
          <text
            x={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).x + 46}
            y={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).y + 46}
          >
            ŷ = {CLASS_VISUALS[predictedClass].displayLabel}
          </text>
        </g>
      ) : null}

      <circle className="p3-scene__origin" cx={origin.x} cy={origin.y} r="3.4" />
      <text className="p3-scene__scale-note" x="14" y="22">
        固定合成二维教学特征空间 · 单位圆 ‖z‖₂ = 1 · 全部图形共用同一坐标系
      </text>
      </svg>
    </div>
  );
}

function AngleArc({ center, radius, from, to, progress }: {
  center: Point;
  radius: number;
  from: Vector2;
  to: Vector2;
  progress: number;
}) {
  const startDeg = (Math.atan2(from[1], from[0]) * 180) / Math.PI;
  const endDeg = (Math.atan2(to[1], to[0]) * 180) / Math.PI;
  // Screen y grows downward, so the feature angle must be negated to draw in SVG space.
  const startScreen = -startDeg;
  let delta = -endDeg - startScreen;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return (
    <path
      className="p3-scene__angle"
      d={arcSegmentPath(center, radius, startScreen, delta * clamp(progress))}
    />
  );
}

function QueryMarker({ point, progress }: { point: Point; progress: number }) {
  const radius = 6.5;
  return (
    <path
      className="p3-scene__query-marker"
      data-query-progress={progress.toFixed(3)}
      data-marker-x={point.x.toFixed(2)}
      data-marker-y={point.y.toFixed(2)}
      d={`M ${point.x} ${point.y - radius} L ${point.x + radius} ${point.y} L ${point.x} ${point.y + radius} L ${point.x - radius} ${point.y} Z`}
    />
  );
}

/** Draws a label with a short leader, keeping the text inside the canvas at any scale. */
function PlacedLabel({ point, text, placement, fontSize, className }: {
  point: Point;
  text: string;
  placement: { dx: number; dy: number; anchor?: "start" | "middle" | "end" };
  fontSize: number;
  className: string;
}) {
  const placed = placeLabel(point, text, {
    dx: placement.dx,
    dy: placement.dy,
    anchor: placement.anchor,
    fontSize,
    bounds: { width: VIEW.width, height: VIEW.height },
  });
  return (
    <g className={className}>
      <line className="p3-scene__label-leader" x1={point.x} y1={point.y} x2={placed.x} y2={placed.y - fontSize * 0.34} />
      <text x={placed.x} y={placed.y} textAnchor={placed.anchor}>{text}</text>
    </g>
  );
}

function P3ConceptMap({ onInspect, onPlayAll, reducedMotion }: { onInspect: () => void; onPlayAll: () => void; reducedMotion: boolean }) {
  return (
    <section className="p3-concept" aria-labelledby="p3-concept-title">
      <header className="p3-concept__header">
        <span className="eyebrow">有限记忆怎样变成可比较的类别参考？</span>
        <h2 id="p3-concept-title">历史图像不能全部保留，怎样给每个已学类别一个可比较的参考？</h2>
      </header>

      <div className="p3-concept__map">
        <section className="p3-concept__memory" aria-label="每个类别只保留部分 Exemplar 原图">
          <span className="p3-concept__panel-label">每类留下少量原图</span>
          {classIds.map((classId) => (
            <div key={classId} style={{ "--p3-concept-color": CLASS_VISUALS[classId].color } as CSSProperties}>
              <b>{CLASS_VISUALS[classId].displayLabel}</b>
              <span aria-label={`${CLASS_VISUALS[classId].displayLabel} 的部分 Exemplar`}>
                <i /><i /><i /><i />
              </span>
              <small>Exemplars</small>
            </div>
          ))}
          <p>原件是有限记忆，不是完整历史数据。</p>
        </section>

        <div className="p3-concept__bridge" aria-label="使用同一个当前特征提取器">
          <span>同一个当前 φ</span>
          <svg viewBox="0 0 88 32" aria-hidden="true"><path d="M2 16h78m-9-9 9 9-9 9" /></svg>
          <small>逐张编码并单位化</small>
        </div>

        <section className="p3-concept__space" aria-label="同类特征聚合为类别 Prototype">
          <span className="p3-concept__panel-label">每类特征形成一个 Prototype</span>
          <svg viewBox="0 0 300 190" role="img" aria-label="三组同类特征分别聚合为三个类别 Prototype">
            <path className="p3-concept__axis" d="M28 160H278M46 176V18" />
            <g className="p3-concept__cluster p3-concept__cluster--one">
              <circle cx="72" cy="66" r="5" /><circle cx="91" cy="56" r="5" /><circle cx="104" cy="78" r="5" /><circle cx="80" cy="89" r="5" />
              <circle className="p3-concept__prototype" cx="87" cy="72" r="12" /><text x="87" y="77">μ₁</text>
            </g>
            <g className="p3-concept__cluster p3-concept__cluster--two">
              <circle cx="181" cy="51" r="5" /><circle cx="207" cy="57" r="5" /><circle cx="215" cy="82" r="5" /><circle cx="189" cy="88" r="5" />
              <circle className="p3-concept__prototype" cx="198" cy="69" r="12" /><text x="198" y="74">μ₂</text>
            </g>
            <g className="p3-concept__cluster p3-concept__cluster--three">
              <circle cx="126" cy="126" r="5" /><circle cx="150" cy="116" r="5" /><circle cx="163" cy="140" r="5" /><circle cx="136" cy="149" r="5" />
              <circle className="p3-concept__prototype" cx="144" cy="133" r="12" /><text x="144" y="138">μ₃</text>
            </g>
          </svg>
          <p><strong>Prototype 是某个类别在当前特征空间中的近似参考位置</strong>，由该类保留图像的特征构成；它不是某张“典型图片”，也不是训练输出头的分数。</p>
        </section>

        <div className="p3-concept__bridge p3-concept__bridge--query" aria-hidden="true">
          <svg viewBox="0 0 88 32"><path d="M2 16h78m-9-9 9 9-9 9" /></svg>
        </div>

        <section className="p3-concept__query" aria-label="Query 与不同类别 Prototype 比较距离">
          <span className="p3-concept__panel-label">Query 找最近类别参考</span>
          <div className="p3-concept__query-mark"><i />Query<span>同一个当前 φ 编码</span></div>
          <div className="p3-concept__distances">
            {classIds.map((classId, index) => (
              <span key={classId} style={{ "--p3-concept-color": CLASS_VISUALS[classId].color } as CSSProperties}>
                <i /><b>μ<sub>{index + 1}</sub></b><em>待比较</em>
              </span>
            ))}
          </div>
          <p>动画将比较所有类别距离；此处不提前指定最近类别。</p>
        </section>
      </div>

      <ol className="p3-concept__reasoning">
        <li><span>1</span><p><strong>历史原图不能全部保存</strong>，因此无法总是重放全部旧图。</p></li>
        <li><span>2</span><p>每类保留图片经当前表示形成<strong>Prototype 参考</strong>。</p></li>
        <li><span>3</span><p>Query 与<strong>所有已学类别参考</strong>比较距离，再由 argmin 决定类别。</p></li>
      </ol>

      <div className="p3-concept__conclusion"><b>每类保留的原图</b><i>→</i><b>当前表示下的 Prototype</b><i>→</i><strong>Query 的最近原型判别</strong></div>
      <footer className="p3-concept__footer">
        <p><b>接下来观察</b>看同类保留图怎样形成 Prototype，再看 Query 的距离比较如何决定类别。<span>示例设置：3 个类别、每类 4 张图片。</span></p>
        <div>
          <button type="button" className="icarl-button icarl-button--quiet p3-start-button" onClick={onInspect}>查看演示 ↓</button>
          <button type="button" className="icarl-button icarl-button--primary" onClick={onPlayAll} disabled={reducedMotion}>▶ 从头完整播放</button>
        </div>
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------- page --- */

export function PageThree({ onContinue }: { onContinue?: () => void } = {}) {
  const reducedMotion = useReducedMotion();
  const { state, controls } = useAnimationTimeline({ clips, reducedMotion, autoPlay: false });
  const [playMode, setPlayMode] = useState<"all" | "phase">("phase");
  const scene = useMemo(() => sceneAt(state.clipIndex, state.progress), [state.clipIndex, state.progress]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(P_BEFORE.A[0].id);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const chapterJumpsRef = useRef<HTMLDetailsElement | null>(null);

  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];
  const selectedRaw = encode2D(selectedSample, "before");
  const selectedUnit = normalize(selectedRaw);
  const selectedClassIndex = classIds.indexOf(selectedSample.classId);
  const selectedUnitProgress = scene.unitizeProgressByClass[selectedClassIndex] ?? 0;
  const selectedUnitized = selectedUnitProgress > 0.999;

  const narrationIndex = activeNarrationIndex(clipNarratives[state.clipIndex], state.progress);
  const predictedVisible = scene.predictedOpacity > 0.4;
  const comparisonLabel = state.clipIndex < 3
    ? "尚未开始比较"
    : scene.comparisonProgress.filter((value) => value > 0.999).length + " / 3 条比较线";

  useEffect(() => {
    if (playMode === "phase" && state.status === "playing" && state.isHolding) controls.pause();
  }, [controls.pause, playMode, state.isHolding, state.status]);

  function togglePlayback() {
    if (state.status === "playing") {
      controls.pause();
      return;
    }
    if (reducedMotion) return;
    if (state.isHolding || state.status === "finished") {
      setPlayMode("phase");
      controls.replayClip();
      return;
    }
    controls.play();
  }

  function playAll() {
    if (reducedMotion) return;
    setPlayMode("all");
    controls.goToClip(0, { autoPlay: true });
    requestAnimationFrame(focusWorkbench);
  }

  function replayStage() {
    setPlayMode("phase");
    controls.replayClip();
  }

  function moveStage(index: number) {
    setPlayMode("phase");
    controls.goToClip(index, { autoPlay: false });
  }

  function focusWorkbench() {
    workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function jumpToClip(index: number) {
    moveStage(index);
    if (chapterJumpsRef.current) chapterJumpsRef.current.open = false;
    requestAnimationFrame(focusWorkbench);
  }

  return (
    <article className="tutorial-page icarl-page icarl-page--p3">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 03</span><i /> PROTOTYPE CLASSIFICATION</div>
        <h1>分类为什么能不用训练输出头？</h1>
        <p>把少量保留原图变成当前特征空间里的类别参考，再让 Query 与这些参考直接比较。</p>
      </header>

      <P3ConceptMap onInspect={focusWorkbench} onPlayAll={playAll} reducedMotion={reducedMotion} />

      <section
        className="p3-workbench"
        aria-label="已保留图片、特征空间与当前预测规则"
        data-clip={state.clip.id}
        data-progress={state.progress.toFixed(3)}
        data-status={state.status}
        ref={workbenchRef}
      >
        <header className="p3-workbench__heading">
          <div>
            <span className="eyebrow">片段 {state.clipIndex + 1} / {clips.length} · {clipTitles[state.clipIndex]}</span>
            <h2>{state.clip.narrative}</h2>
            <p aria-live="polite">{state.isHolding ? stageResults[state.clipIndex] : clipNarratives[state.clipIndex][narrationIndex]}</p>
          </div>
          <span className="p3-workbench__phase">{state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}</span>
        </header>

        <div className="p3-workbench__layout">
          <section className="panel p3-source" aria-label="已保留 Exemplars 来源">
            <div className="panel-heading">
              <div><span className="eyebrow">SOURCE</span><h2>已保留 Exemplars</h2></div>
              <span className="p3-mini-count">12 张</span>
            </div>
            <div className="p3-source__samples">
              {classIds.map((classId) => {
                const classSamples = exemplarByClass.get(classId)!;
                const classProgress = scene.unitizeProgressByClass[classIds.indexOf(classId)] ?? 0;
                const done = classProgress > 0.999;
                const active = classProgress > 0.001 && !done;
                return (
                  <section
                    className={`p3-source__group${done ? " is-done" : ""}${active ? " is-active" : ""}`}
                    key={classId}
                    style={{ "--p3-group-color": CLASS_VISUALS[classId].color } as CSSProperties}
                  >
                    <div>
                      <b>{CLASS_VISUALS[classId].displayLabel}</b>
                      <span>P<sub>{CLASS_VISUALS[classId].index}</sub> · {classSamples.length} 张 · {done ? "已进入特征空间" : active ? "单位化中" : "待单位化"}</span>
                    </div>
                    <div className="p3-source__grid">
                      {classSamples.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          className={`p3-source__sample${selectedSampleId === sample.id ? " is-selected" : ""}`}
                          onClick={() => setSelectedSampleId(sample.id)}
                          aria-pressed={selectedSampleId === sample.id}
                          title={`${CLASS_VISUALS[sample.classId].displayLabel} · ${sample.id}`}
                        >
                          <i aria-hidden="true">{CLASS_VISUALS[sample.classId].glyph}</i>
                          <b>{sample.id}</b>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <details className="p3-source__mapping" data-sample-id={selectedSample.id}>
              <summary>核对当前图片 · {selectedSample.id} · {CLASS_VISUALS[selectedSample.classId].displayLabel}</summary>
              <div>
                <small>{selectedUnitized ? "zₚ 已落在单位圆上" : selectedUnitProgress > 0.01 ? "沿径向移动，方向保持" : "保留原始特征长度"}</small>
                <small>f<sub>Θ</sub>(x) = ({selectedRaw[0].toFixed(3)}, {selectedRaw[1].toFixed(3)}) · ‖f‖₂ = {Math.hypot(...selectedRaw).toFixed(3)}</small>
                <small>z = ({selectedUnit[0].toFixed(3)}, {selectedUnit[1].toFixed(3)}) · ‖z‖₂ = 1.000</small>
              </div>
            </details>
            {state.clipIndex >= 2 ? (
              <div className="p3-query-source">
                <span>独立的新输入 · 不属于上面十二张</span>
                <b>x<sub>q</sub></b>
                <p>{state.clipIndex === 2 && scene.queryUnitizeProgress < 0.99 ? "先落到原始特征位置，再沿圆心方向单位化。" : "已得到单位化查询特征 z_q；它不进入 Exemplar Memory。"}</p>
              </div>
            ) : null}
          </section>

          <section className="panel p3-space-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">ONE FIXED FEATURE SPACE</span><h2>单位特征、Prototype 与 Query</h2></div>
              <span className="p3-mini-count">{comparisonLabel}</span>
            </div>
            <FeatureScene scene={scene} selectedSampleId={selectedSampleId} onSelectSample={setSelectedSampleId} />
            <div className="p3-scene__legend" aria-label="当前片段可见图形标记说明">
              <span><i className="p3-legend-unit" />单位圆 ‖z‖₂=1</span>
              <span><i className="p3-legend-unit-point" />Exemplar 特征</span>
              {state.clipIndex >= 1 ? <>
                <span><i className="p3-legend-mean" />类别均值 z̄<sub>y</sub></span>
                <span><i className="p3-legend-prototype" />Prototype μ<sub>y</sub></span>
              </> : null}
              {state.clipIndex >= 2 ? <span><i className="p3-legend-query" />Query 特征</span> : null}
              {state.clipIndex >= 3 ? <>
                <span><i className="p3-legend-distance" />距离</span>
                <span><i className="p3-legend-angle" />圆心夹角</span>
              </> : null}
            </div>
          </section>

          <aside className="panel p3-rule-panel" aria-live="polite">
            <div className="panel-heading"><div><span className="eyebrow">分类规则</span><h2>判定依据</h2></div></div>
            {predictedVisible ? (
              <p className="p3-prediction">预测类别：{CLASS_VISUALS[predictedClass].displayLabel}</p>
            ) : null}
            <details className="p3-calculation-details">
              <summary>查看完整计算依据</summary>
              <div>
                <p><b>单位特征</b> z<sub>p</sub> = f<sub>Θ</sub>(p) / ‖f<sub>Θ</sub>(p)‖₂</p>
                <p><b>类别均值</b> z̄<sub>y</sub> = (1/|P<sub>y</sub>|) Σ<sub>p∈P<sub>y</sub></sub> z<sub>p</sub>（本页每类四张，即 ¼Σz<sub>p</sub>）</p>
                <p><b>类别原型</b> μ<sub>y</sub> = z̄<sub>y</sub> / ‖z̄<sub>y</sub>‖₂</p>
                <p><b>查询特征</b> z<sub>q</sub> = φ<sub>Θ fixed</sub>(x<sub>q</sub>) / ‖φ<sub>Θ fixed</sub>(x<sub>q</sub>)‖₂</p>
                <p><b>预测</b> ŷ = arg min<sub>y</sub> ‖z<sub>q</sub> − μ<sub>y</sub>‖₂</p>
              </div>
            </details>
            <details className="p3-calculation-details">
              <summary>核对单位化前后的坐标</summary>
              <div className="p3-coordinate-table">
                {exemplars.map((sample) => {
                  const raw = encode2D(sample, "before");
                  const unit = normalize(raw);
                  return (
                    <p key={sample.id}>
                      <b>{sample.id}</b>
                      f = ({raw[0].toFixed(2)}, {raw[1].toFixed(2)}) · ‖f‖₂ = {Math.hypot(raw[0], raw[1]).toFixed(2)} · z = ({unit[0].toFixed(2)}, {unit[1].toFixed(2)}) · ‖z‖₂ = 1.00
                    </p>
                  );
                })}
                {prototypeCalculations.map((calculation) => (
                  <p key={`mean-${calculation.classId}`}>
                    <b>z̄{CLASS_VISUALS[calculation.classId].index}</b>
                    ({calculation.rawMean[0].toFixed(3)}, {calculation.rawMean[1].toFixed(3)}) → μ{CLASS_VISUALS[calculation.classId].index} ({calculation.prototype[0].toFixed(3)}, {calculation.prototype[1].toFixed(3)})
                  </p>
                ))}
                <p><b>z_q</b>({queryUnitFeature[0].toFixed(3)}, {queryUnitFeature[1].toFixed(3)}) · ‖z_q‖₂ = 1.000</p>
                {queryComparisons.map(({ classId, distance }) => (
                  <p key={`distance-${classId}`}><b>d(μ{CLASS_VISUALS[classId].index})</b>{distance.toFixed(4)}{classId === predictedClass ? " · 最近 → 预测" : ""}</p>
                ))}
              </div>
            </details>
            <p className="p3-state-boundary">
              当前片段只读取已固定的特征提取器与 Exemplar Memory：不训练、不写入记忆、不展开 Herding。
            </p>
          </aside>
        </div>

        <div className="p3-workbench__controls" aria-label="Page 3 动画控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => moveStage(state.clipIndex - 1)} disabled={!state.hasPrevious}>← 上一阶段</button>
          <div className="p3-playback-controls">
            <button type="button" className="icarl-button icarl-button--quiet" onClick={togglePlayback} disabled={reducedMotion}>
              {reducedMotion ? "逐步查看" : state.status === "playing" ? "Ⅱ 暂停" : state.elapsedMs > 0 && !state.isHolding ? "▶ 继续播放" : "▶ 播放本阶段"}
            </button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={replayStage} disabled={reducedMotion}>↺ 重播本阶段</button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={playAll} disabled={reducedMotion}>▶ 完整播放</button>
            <span aria-live="polite">{String(state.clipIndex + 1).padStart(2, "0")} / 0{clips.length} · {playMode === "all" ? "全程" : "本阶段"} · {state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}</span>
          </div>
          <button type="button" className="icarl-button icarl-button--primary" onClick={() => moveStage(state.clipIndex + 1)} disabled={!state.hasNext}>下一阶段 →</button>
        </div>

        <div className="p3-clip-rail" role="group" aria-label="片段定位">
          {clips.map((clip, index) => (
            <button
              key={clip.id}
              type="button"
              className={index === state.clipIndex ? "is-current" : index < state.clipIndex ? "is-complete" : ""}
              aria-pressed={index === state.clipIndex}
              onClick={() => jumpToClip(index)}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>{clipTitles[index]}
            </button>
          ))}
        </div>
      </section>

      <section className="p3-next-step" aria-label="第 3 页到第 4 页的学习衔接">
        <div className="p3-next-step__visual" aria-hidden="true"><span>μ<sub>y</sub></span><svg viewBox="0 0 56 24"><path d="M2 12h47m-8-7 8 7-8 7" /></svg><i /><i /><i /><i /><i /></div>
        <p>
          <strong><b>本页结论</b>Prototype 可由有限原图计算，并用于 Query 分类。</strong>
          <span><b>还缺什么</b>预测规则假定代表图片已经选好，却没有说明有限名额该留给谁。</span>
          <span><b>下一页问题</b>怎样选出少量图片，让它们形成的类别参考尽量接近完整数据？</span>
        </p>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>筛选代表样本 →</button> : null}
      </section>
    </article>
  );
}
