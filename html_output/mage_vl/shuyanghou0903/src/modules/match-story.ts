export type SignalLevel = 1 | 2 | 3;
export type SignalCell = readonly [column: number, row: number, level: SignalLevel];
export type GateState = 'SILENT' | 'SPEAK';

export interface MatchBeat {
  id: string;
  label: string;
  ball: { x: number; y: number };
  runner: { x: number; y: number };
  motion: SignalCell[];
  residual: SignalCell[];
  importance: SignalCell[];
  gate: GateState;
  narration: string;
}

const motionBand = (offset: number): SignalCell[] => [
  [5 + offset, 8, 1], [6 + offset, 7, 2], [6 + offset, 8, 2],
  [7 + offset, 7, 3], [7 + offset, 8, 3], [8 + offset, 8, 2],
];

const residualBand = (offset: number): SignalCell[] => [
  [7 + offset, 7, 2], [7 + offset, 8, 3], [8 + offset, 7, 2],
  [8 + offset, 8, 2], [6 + offset, 9, 1],
];

const importanceBand = (offset: number): SignalCell[] => [
  [5 + offset, 8, 1], [6 + offset, 7, 2], [6 + offset, 8, 2],
  [7 + offset, 7, 3], [7 + offset, 8, 3], [8 + offset, 7, 2],
  [8 + offset, 8, 2], [9 + offset, 8, 1],
];

/**
 * One continuous football sequence reused from the hero through chapter seven.
 * Coordinates are normalized to the same 16x16 pitch-token space. Signal levels
 * are qualitative scene states; no paper metric or probability is encoded here.
 */
export const MATCH_BEATS: MatchBeat[] = [
  {
    id: 'scan', label: '背景基本不变', ball: { x: .25, y: .54 }, runner: { x: .18, y: .62 },
    motion: [], residual: [], importance: [], gate: 'SILENT',
    narration: '镜头刚建立：草坪、球门和看台几乎没有变化。',
  },
  {
    id: 'pass-start', label: '局部开始位移', ball: { x: .34, y: .53 }, runner: { x: .24, y: .60 },
    motion: motionBand(-2), residual: residualBand(-2).map(([c, r]) => [c, r, 1] as SignalCell),
    importance: importanceBand(-2), gate: 'SILENT',
    narration: '传球启动：位移集中在球和跑动球员附近。',
  },
  {
    id: 'pass', label: '运动带向前推进', ball: { x: .46, y: .51 }, runner: { x: .34, y: .58 },
    motion: motionBand(0), residual: residualBand(-1), importance: importanceBand(-1), gate: 'SILENT',
    narration: '运动向量描述编码块从参考画面的哪里预测过来。',
  },
  {
    id: 'occlusion', label: '遮挡关系改变', ball: { x: .57, y: .49 }, runner: { x: .48, y: .54 },
    motion: motionBand(1), residual: residualBand(1), importance: importanceBand(1), gate: 'SILENT',
    narration: '球员交错造成新遮挡：预测没有解释掉的区域形成残差。',
  },
  {
    id: 'breakthrough', label: '变化区域继续移动', ball: { x: .68, y: .46 }, runner: { x: .59, y: .51 },
    motion: motionBand(2), residual: residualBand(2), importance: importanceBand(2), gate: 'SILENT',
    narration: 'Importance S 在同一网格上为 patch 排序，静态区域保持低响应。',
  },
  {
    id: 'shot', label: '射门动作形成', ball: { x: .78, y: .42 }, runner: { x: .70, y: .48 },
    motion: motionBand(3), residual: residualBand(3), importance: importanceBand(3), gate: 'SILENT',
    narration: '预算有限时，高 S patch 先被送入视觉编码器。',
  },
  {
    id: 'goal-line', label: '结果仍待确认', ball: { x: .86, y: .39 }, runner: { x: .78, y: .46 },
    motion: motionBand(4), residual: residualBand(3), importance: importanceBand(4), gate: 'SILENT',
    narration: '感知记忆继续累积，但当前证据还不足以触发生成。',
  },
  {
    id: 'confirmed', label: '事件已经成立', ball: { x: .91, y: .38 }, runner: { x: .82, y: .45 },
    motion: motionBand(4), residual: residualBand(4), importance: importanceBand(4), gate: 'SPEAK',
    narration: '事件成立：Cognition Gate 触发局部语言生成。',
  },
];

export interface SampledMatch {
  beatIndex: number;
  localProgress: number;
  beat: MatchBeat;
  nextBeat: MatchBeat;
  ball: { x: number; y: number };
  runner: { x: number; y: number };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function sampleMatch(progress: number): SampledMatch {
  const scaled = clamp01(progress) * (MATCH_BEATS.length - 1);
  const beatIndex = Math.min(MATCH_BEATS.length - 1, Math.floor(scaled));
  const nextIndex = Math.min(MATCH_BEATS.length - 1, beatIndex + 1);
  const localProgress = scaled - beatIndex;
  const beat = MATCH_BEATS[beatIndex];
  const nextBeat = MATCH_BEATS[nextIndex];
  return {
    beatIndex,
    localProgress,
    beat,
    nextBeat,
    ball: {
      x: lerp(beat.ball.x, nextBeat.ball.x, localProgress),
      y: lerp(beat.ball.y, nextBeat.ball.y, localProgress),
    },
    runner: {
      x: lerp(beat.runner.x, nextBeat.runner.x, localProgress),
      y: lerp(beat.runner.y, nextBeat.runner.y, localProgress),
    },
  };
}

const representative = MATCH_BEATS[5].importance;
const priority = new Map(representative.map(([column, row, level]) => [`${column}:${row}`, level]));

/** Stable ranking for the representative 16x16 spatial token map used in §4. */
export const RANKED_PATCHES = Array.from({ length: 16 * 16 }, (_, index) => {
  const column = index % 16;
  const row = Math.floor(index / 16);
  const manual = priority.get(`${column}:${row}`) ?? 0;
  const distanceToChangeBand = Math.hypot(column - 11, row - 8);
  return { column, row, score: manual * 100 - distanceToChangeBand };
}).sort((a, b) => b.score - a.score);

export function drawLabSurface(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fbfcfe';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(39,68,110,.055)';
  ctx.lineWidth = 1;
  for (let x = 24; x < width; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 24; y < height; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}
