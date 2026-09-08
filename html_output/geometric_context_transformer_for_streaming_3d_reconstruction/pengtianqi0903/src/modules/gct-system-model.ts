export const ROPE_TIMES = ['t−4', 't−3', 't−2', 't−1', 't'] as const;

export type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export const TRAINING_CANVAS_HEIGHT = 400;
export const ROPE_CANVAS_HEIGHT = 350;
export const ROUNDED_RECT_STROKE_WIDTH = 1.5;

function roundedRectRenderedBounds(drawRect: Bounds): Bounds {
  const strokeOutset = ROUNDED_RECT_STROKE_WIDTH / 2;
  return {
    left: drawRect.left - strokeOutset,
    top: drawRect.top - strokeOutset,
    right: drawRect.right + strokeOutset,
    bottom: drawRect.bottom + strokeOutset,
  };
}

export const TRAINING_PROGRESS_TRACK = { left: 170, right: 586 } as const;
export const TRAINING_DRAG_TARGET: Bounds = { left: 42, top: 119, right: 604, bottom: 221 };
export const ROPE_TIME_CENTERS = [150, 245, 340, 435, 530] as const;
export const ROPE_DRAG_TARGET: Bounds = { left: 120, top: 42, right: 555, bottom: 96 };

export const TRAINING_LAYOUT = {
  canvas: { left: 0, top: 0, right: 640, bottom: TRAINING_CANVAS_HEIGHT },
  trajectoryCard: { left: 24, top: 43, right: 616, bottom: 233 },
  fixedNote: { left: 171, top: 98, right: 555, bottom: 110 },
  windowDividerY: 140,
  supervisionRegion: { left: 41, top: 271, right: 330, bottom: 370 },
  matrixRegion: { left: 358, top: 270, right: 608, bottom: 370 },
  footerRegion: { left: 24, top: 379, right: 616, bottom: 399 },
} as const;

export const ROPE_LEFT_VECTOR = {
  originX: 158,
  originY: 246,
  endX: 236,
  endY: 210,
  markerRadius: 6,
  labelX: 248,
  labelBaseline: 207,
} as const;

export const ROPE_QUERY = {
  badge: { left: 365, top: 46, right: 495, bottom: 62 },
  titleX: 373,
  detailX: 440,
  labelBaseline: 58,
  arrow: { startX: 496, endX: 516, y: 73 },
} as const;

export const ROPE_READOUT = {
  card: { left: 500, top: 190, right: 600, bottom: 266 },
  labelX: 509,
  titleBaseline: 211,
  offsetBaseline: 233,
  valueBaseline: 254,
} as const;

export const ROPE_DIAGRAM = {
  centerX: 414,
  centerY: 253,
  vectorRadius: 58,
  firstAngle: -1.2,
  angleStep: 0.6,
  axes: { left: 345, top: 198, right: 485, bottom: 291, lineWidth: 1.5 },
  arcRadius: 33,
  arcEndAngle: 1.2,
  arcLineWidth: 2,
} as const;

export const ROPE_LAYOUT = {
  canvas: { left: 0, top: 0, right: 640, bottom: ROPE_CANVAS_HEIGHT },
  fixedQueryBadgeRendered: roundedRectRenderedBounds(ROPE_QUERY.badge),
  fixedQueryArrowRendered: {
    left: ROPE_QUERY.arrow.startX,
    top: ROPE_QUERY.arrow.y - 4.5,
    right: ROPE_QUERY.arrow.endX,
    bottom: ROPE_QUERY.arrow.y + 4.5,
  },
  leftMarker: {
    left: ROPE_LEFT_VECTOR.endX - ROPE_LEFT_VECTOR.markerRadius,
    top: ROPE_LEFT_VECTOR.endY - ROPE_LEFT_VECTOR.markerRadius,
    right: ROPE_LEFT_VECTOR.endX + ROPE_LEFT_VECTOR.markerRadius,
    bottom: ROPE_LEFT_VECTOR.endY + ROPE_LEFT_VECTOR.markerRadius,
  },
  leftMarkerLabel: {
    left: ROPE_LEFT_VECTOR.labelX,
    top: ROPE_LEFT_VECTOR.labelBaseline - 9,
    right: ROPE_LEFT_VECTOR.labelX + 12,
    bottom: ROPE_LEFT_VECTOR.labelBaseline + 7,
  },
  readoutRendered: roundedRectRenderedBounds(ROPE_READOUT.card),
} as const;

export function clampTrainingProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function trainingViewsFromProgress(progress: number) {
  const clamped = Math.min(100, Math.max(0, progress));
  return Math.round(24 + (296 * clamped) / 100);
}

export function trainingProgressAtX(x: number) {
  const scaled = ((x - TRAINING_PROGRESS_TRACK.left) / (TRAINING_PROGRESS_TRACK.right - TRAINING_PROGRESS_TRACK.left)) * 100;
  return clampTrainingProgress(scaled + Number.EPSILON * 100);
}

export function trainingWindowProgresses(progress: number) {
  const current = clampTrainingProgress(progress);
  return [-18, -12, -6, 0].map((offset) => current + offset);
}

export function trainingTrajectoryPoint(progress: number): [number, number] {
  const p = progress / 100;
  const curveProgress = Math.max(0, p);
  return [
    TRAINING_PROGRESS_TRACK.left + (TRAINING_PROGRESS_TRACK.right - TRAINING_PROGRESS_TRACK.left) * p,
    199 - Math.sin(curveProgress * Math.PI) * 36 + Math.sin(curveProgress * Math.PI * 3) * 4,
  ];
}

export function isTrainingDragTarget(x: number, y: number) {
  return x >= TRAINING_DRAG_TARGET.left
    && x <= TRAINING_DRAG_TARGET.right
    && y >= TRAINING_DRAG_TARGET.top
    && y <= TRAINING_DRAG_TARGET.bottom;
}

export function trainingWindowLayoutAt(progress: number) {
  const cameraPoints = trainingWindowProgresses(progress).map(trainingTrajectoryPoint);
  const current = trainingTrajectoryPoint(clampTrainingProgress(progress));
  const left = Math.max(42, Math.min(...cameraPoints.map(([x]) => x)) - 32);
  const right = Math.min(600, Math.max(...cameraPoints.map(([x]) => x)) + 34);
  const currentLabelX = Math.min(555, current[0] + 4);
  const currentLabelBaseline = Math.min(216, current[1] + 27);
  return {
    window: { left, top: 119, right: Math.max(left + 82, right), bottom: 221 },
    cameraBounds: cameraPoints.map(([x, y]) => ({ left: x - 7, top: y - 8, right: x + 13, bottom: y + 8 })),
    currentLabel: { left: currentLabelX, top: currentLabelBaseline - 10, right: currentLabelX + 45, bottom: currentLabelBaseline + 2 },
  };
}

export function clampRopeTimeIndex(index: number) {
  return Math.min(ROPE_TIMES.length - 1, Math.max(0, Math.round(index)));
}

function unionBounds(bounds: Bounds[]): Bounds {
  return {
    left: Math.min(...bounds.map((item) => item.left)),
    top: Math.min(...bounds.map((item) => item.top)),
    right: Math.max(...bounds.map((item) => item.right)),
    bottom: Math.max(...bounds.map((item) => item.bottom)),
  };
}

function ropeVectorRenderedBounds(endX: number, endY: number, lineWidth: number, markerRadius: number): Bounds {
  const dx = endX - ROPE_DIAGRAM.centerX;
  const dy = endY - ROPE_DIAGRAM.centerY;
  const length = Math.hypot(dx, dy);
  const perpendicularX = (Math.abs(dy) / length) * (lineWidth / 2);
  const perpendicularY = (Math.abs(dx) / length) * (lineWidth / 2);
  return unionBounds([
    {
      left: Math.min(ROPE_DIAGRAM.centerX, endX) - perpendicularX,
      top: Math.min(ROPE_DIAGRAM.centerY, endY) - perpendicularY,
      right: Math.max(ROPE_DIAGRAM.centerX, endX) + perpendicularX,
      bottom: Math.max(ROPE_DIAGRAM.centerY, endY) + perpendicularY,
    },
    {
      left: endX - markerRadius,
      top: endY - markerRadius,
      right: endX + markerRadius,
      bottom: endY + markerRadius,
    },
  ]);
}

export function ropeDiagramLayoutAt(index: number) {
  const selected = clampRopeTimeIndex(index);
  const vectors = ROPE_TIMES.map((_, vectorIndex) => {
    const angle = ROPE_DIAGRAM.firstAngle + vectorIndex * ROPE_DIAGRAM.angleStep;
    const endX = ROPE_DIAGRAM.centerX + Math.cos(angle) * ROPE_DIAGRAM.vectorRadius;
    const endY = ROPE_DIAGRAM.centerY + Math.sin(angle) * ROPE_DIAGRAM.vectorRadius;
    const lineWidth = vectorIndex === selected ? 3.5 : 2;
    const markerRadius = vectorIndex === selected ? 5 : 3;
    return {
      angle,
      endX,
      endY,
      lineWidth,
      markerRadius,
      renderedBounds: ropeVectorRenderedBounds(endX, endY, lineWidth, markerRadius),
    };
  });
  const axesRenderedBounds: Bounds = {
    left: ROPE_DIAGRAM.axes.left,
    top: ROPE_DIAGRAM.axes.top,
    right: ROPE_DIAGRAM.axes.right,
    bottom: ROPE_DIAGRAM.axes.bottom,
  };
  const arcExtent = ROPE_DIAGRAM.arcRadius + ROPE_DIAGRAM.arcLineWidth / 2;
  const arcRenderedBounds: Bounds = {
    left: ROPE_DIAGRAM.centerX - arcExtent,
    top: ROPE_DIAGRAM.centerY - arcExtent,
    right: ROPE_DIAGRAM.centerX + arcExtent,
    bottom: ROPE_DIAGRAM.centerY + arcExtent,
  };
  return {
    center: { x: ROPE_DIAGRAM.centerX, y: ROPE_DIAGRAM.centerY },
    axes: ROPE_DIAGRAM.axes,
    arc: {
      radius: ROPE_DIAGRAM.arcRadius,
      startAngle: vectors[selected].angle,
      endAngle: ROPE_DIAGRAM.arcEndAngle,
      lineWidth: ROPE_DIAGRAM.arcLineWidth,
    },
    vectors,
    renderedBounds: unionBounds([axesRenderedBounds, arcRenderedBounds, ...vectors.map((vector) => vector.renderedBounds)]),
  };
}

export function ropeIndexAtX(x: number) {
  const spacing = ROPE_TIME_CENTERS[1] - ROPE_TIME_CENTERS[0];
  return clampRopeTimeIndex((x - ROPE_TIME_CENTERS[0]) / spacing);
}

export function isRopeDragTarget(x: number, y: number) {
  return x >= ROPE_DRAG_TARGET.left
    && x <= ROPE_DRAG_TARGET.right
    && y >= ROPE_DRAG_TARGET.top
    && y <= ROPE_DRAG_TARGET.bottom;
}

export function ropeLayoutAt(index: number) {
  const centerX = ROPE_TIME_CENTERS[clampRopeTimeIndex(index)];
  const drawRect: Bounds = { left: centerX - 10, top: 65, right: centerX + 10, bottom: 85 };
  return {
    selectedToken: {
      drawRect,
      renderedBounds: roundedRectRenderedBounds(drawRect),
    },
  };
}

export function ropeTimeAt(index: number) {
  return ROPE_TIMES[clampRopeTimeIndex(index)];
}

export function ropeOffsetFromCurrent(index: number) {
  return ROPE_TIMES.length - 1 - clampRopeTimeIndex(index);
}
