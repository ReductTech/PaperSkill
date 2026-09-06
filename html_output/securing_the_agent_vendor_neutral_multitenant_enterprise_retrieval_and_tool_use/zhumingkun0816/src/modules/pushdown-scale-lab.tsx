import { useMemo, useState, type CSSProperties } from 'react';
import { TimelineControls } from '../animation/TimelineControls';
import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { logProgressToCorpusSize } from '../animation/useContinuousControl';
import { useTimeline, type TimelineController } from '../animation/useTimeline';
import { PAPER_EVIDENCE, overheadAtCorpusSize, recallAtCorpusSize } from './evidence/paperEvidence';
import { ChipRow, ContinuousSlider, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, box, dot, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type ScaleMode = 'post' | 'pushdown';
export type ScalePhase = 'grow' | 'trace' | 'terminal-hold' | 'switch' | 'compare';

const PUSHDOWN_SCALE_DISPLAY = {
  logicalWidth: 560,
  maxDisplayWidth: 820,
  minimumLogicalFontPx: 8,
} as const;

export function derivePushdownScaleDisplayMetrics() {
  const scale = PUSHDOWN_SCALE_DISPLAY.maxDisplayWidth / PUSHDOWN_SCALE_DISPLAY.logicalWidth;
  return {
    ...PUSHDOWN_SCALE_DISPLAY,
    scale,
    minimumDisplayedFontPx: PUSHDOWN_SCALE_DISPLAY.minimumLogicalFontPx * scale,
  };
}

export interface PushdownScaleScene {
  phase: ScalePhase;
  mode: ScaleMode;
  corpusSize: number;
  corpusProgress: number;
  recall: number;
  postFilterRecall: number;
  postFilterApproximate: boolean;
  overheadMs: number | null;
  approximate: boolean;
  interpolationLabel: string | null;
  ctlr: 0;
  authorizedTopK: number;
}

export interface CompetitionToken {
  id: string;
  x: number;
  y: number;
  financeMix: number;
  rejectionMix: number;
}

export interface CandidateCompetition {
  candidates: CompetitionToken[];
  results: CompetitionToken[];
  filterMix: number;
  filterX: number;
  filterY: number;
  filterWidth: number;
  illustrative: true;
}

export interface ScaleModeTransition {
  from: ScaleMode;
  to: ScaleMode;
}

const candidateThresholds = Array.from(
  { length: 25 },
  (_, index) => 0.08 + ((index * 11) % 25) / 27,
);
const resultThresholds = [0.18, 0.34, 0.5, 0.66, 0.82];

function continuousPresence(corpusProgress: number, threshold: number): number {
  return easeInOutCubic(clamp01((threshold - corpusProgress + 0.09) / 0.18));
}

export function deriveCandidateCompetition(
  corpusProgress: number,
  pushdownMix: number,
): CandidateCompetition {
  const corpus = clamp01(corpusProgress);
  const filterMix = easeInOutCubic(clamp01(pushdownMix));
  const makeToken = (
    id: string,
    index: number,
    threshold: number,
    columns: number,
    originX: number,
    originY: number,
    gapX: number,
    gapY: number,
  ): CompetitionToken => {
    const postFinanceMix = continuousPresence(corpus, threshold);
    const financeMix = lerp(postFinanceMix, 1, filterMix);
    return {
      id,
      x: originX + (index % columns) * gapX,
      y: originY + Math.floor(index / columns) * gapY,
      financeMix,
      rejectionMix: (1 - postFinanceMix) * filterMix,
    };
  };

  const contraction = easeInOutCubic(phaseProgress(filterMix, 0, 0.18));
  const travel = easeInOutCubic(phaseProgress(filterMix, 0.18, 0.82));
  const expansion = easeInOutCubic(phaseProgress(filterMix, 0.82, 1));
  const filterWidth = filterMix <= 0.18
    ? lerp(168, 28, contraction)
    : filterMix < 0.82
      ? 28
      : lerp(28, 168, expansion);
  return {
    candidates: candidateThresholds.map((threshold, index) =>
      makeToken(`candidate-${index}`, index, threshold, 5, 47, 124, 23, 17),
    ),
    results: resultThresholds.map((threshold, index) =>
      makeToken(`result-${index}`, index, threshold, 5, 38, 250, 29, 1),
    ),
    filterMix,
    filterWidth,
    filterX: 202 - filterWidth,
    filterY: lerp(202, 86, travel),
    illustrative: true,
  };
}

export function deriveModeMix(transition: ScaleModeTransition, progress: number): number {
  const from = transition.from === 'pushdown' ? 1 : 0;
  const to = transition.to === 'pushdown' ? 1 : 0;
  return lerp(from, to, easeInOutCubic(clamp01(progress)));
}

export function deriveResultTokenMotion(financeMix: number) {
  const mix = clamp01(financeMix);
  return {
    deniedX: lerp(0, 8, mix),
    deniedY: lerp(0, 8, mix),
    deniedOpacity: 1 - mix,
    financeX: lerp(-8, 0, mix),
    financeY: lerp(-8, 0, mix),
    financeOpacity: mix,
  };
}

function corpusProgressFromSize(corpusSize: number): number {
  const bounded = Math.max(100, Math.min(50_000, corpusSize));
  return (Math.log10(bounded) - Math.log10(100)) / (Math.log10(50_000) - Math.log10(100));
}

export function preserveScaleModeOnCorpusDrag(mode: ScaleMode, corpusProgress: number) {
  return { mode, corpusProgress };
}

export function derivePushdownScaleScene(progress: number, corpusSize: number, mode: ScaleMode): PushdownScaleScene {
  const bounded = Math.max(100, Math.min(50_000, Math.round(corpusSize)));
  const phase: ScalePhase = progress < 0.45
    ? 'grow'
    : progress < 0.58
      ? 'trace'
      : progress < 0.677
        ? 'terminal-hold'
        : progress < 0.82
          ? 'switch'
          : 'compare';
  const postRecall = recallAtCorpusSize(bounded);
  const postOverhead = overheadAtCorpusSize(bounded);

  if (mode === 'pushdown') {
    return {
      phase,
      mode,
      corpusSize: bounded,
      corpusProgress: corpusProgressFromSize(bounded),
      recall: 1,
      postFilterRecall: postRecall.value,
      postFilterApproximate: postRecall.approximate,
      overheadMs: null,
      approximate: false,
      interpolationLabel: null,
      ctlr: 0,
      authorizedTopK: 5,
    };
  }

  return {
    phase,
    mode,
    corpusSize: bounded,
    corpusProgress: corpusProgressFromSize(bounded),
    recall: postRecall.value,
    postFilterRecall: postRecall.value,
    postFilterApproximate: postRecall.approximate,
    overheadMs: postOverhead.value,
    approximate: postRecall.approximate || postOverhead.approximate,
    interpolationLabel: postRecall.approximate || postOverhead.approximate ? '视觉插值；锚点为论文实测' : null,
    ctlr: 0,
    authorizedTopK: Math.max(0, Math.min(5, Math.round(postRecall.value * 5))),
  };
}

const phases = [
  { id: 'grow', label: '扩大共享语料', start: 0, end: 0.45 },
  { id: 'trace', label: '描出 Recall', start: 0.45, end: 0.58 },
  { id: 'hold', label: '50K 停留', start: 0.58, end: 0.677 },
  { id: 'switch', label: '切换下推', start: 0.677, end: 0.82 },
  { id: 'compare', label: '对比', start: 0.82, end: 1 },
];

export function PushdownScaleLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(6_200);
  const modeTimeline = useTimeline(700);
  const [manualCorpusProgress, setManualCorpusProgress] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState<ScaleMode | null>(null);
  const [modeTransition, setModeTransition] = useState<ScaleModeTransition>({
    from: 'post',
    to: 'post',
  });
  const playbackCorpusProgress = easeInOutCubic(phaseProgress(timeline.progress, 0, 0.58));
  const corpusProgress = manualCorpusProgress ?? playbackCorpusProgress;
  const corpusSize = logProgressToCorpusSize(corpusProgress);
  const playbackMode: ScaleMode = timeline.progress < 0.82 ? 'post' : 'pushdown';
  const mode = manualMode ?? playbackMode;
  const automaticMix = easeInOutCubic(phaseProgress(timeline.progress, 0.677, 0.82));
  const pushdownMix = manualMode === null
    ? automaticMix
    : deriveModeMix(modeTransition, modeTimeline.progress);
  const scene = derivePushdownScaleScene(timeline.progress, corpusSize, mode);
  const controlledTimeline: TimelineController = useMemo(() => ({
    ...timeline,
    replay: () => {
      setManualCorpusProgress(null);
      setManualMode(null);
      setModeTransition({ from: 'post', to: 'post' });
      modeTimeline.seek(0);
      timeline.replay();
    },
  }), [modeTimeline, timeline]);

  const chooseMode = (next: string) => {
    const target = next as ScaleMode;
    if (target === mode) return;
    timeline.pause();
    setModeTransition({ from: mode, to: target });
    setManualMode(target);
    modeTimeline.replay();
  };
  const chooseCorpus = (next: number) => {
    const selection = preserveScaleModeOnCorpusDrag(mode, next);
    setManualCorpusProgress(selection.corpusProgress);
    setManualMode(selection.mode);
    setModeTransition({ from: selection.mode, to: selection.mode });
    modeTimeline.seek(1);
  };

  const formatCorpus = (value: number) => value >= 1_000 ? `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K` : `${value}`;
  const competition = deriveCandidateCompetition(scene.corpusProgress, pushdownMix);
  const chartX = (size: number) => 246 + corpusProgressFromSize(size) * 286;
  const chartY = (recall: number) => 54 + Math.min(1, Math.max(0, -Math.log10(Math.max(0.001, recall)) / 3)) * 150;
  const postCopy = '先在共享语料中取候选，再丢弃无权结果；CTLR 仍为 0，但授权内容可能已经被挤出 top-k。';
  const pushdownCopy = '授权谓词先缩小可搜索语料，其他租户候选不参与排名；论文四个规模的 Recall@5 均为 1.000。';
  const displayMetrics = derivePushdownScaleDisplayMetrics();
  const displayStyle = {
    '--pushdown-scale-canvas-width': `${displayMetrics.maxDisplayWidth}px`,
  } as CSSProperties;

  return (
    <LabShell>
      <ContinuousSlider
        label="共享语料规模（对数轴）"
        value={corpusProgress}
        min={0}
        max={1}
        step={0.001}
        valueText={`N = ${scene.corpusSize.toLocaleString('en-US')}`}
        onTakeControl={timeline.pause}
        onChange={chooseCorpus}
      />
      <ChipRow
        labelText="过滤位置"
        options={[{ value: 'post', label: '搜索后过滤' }, { value: 'pushdown', label: '谓词下推' }]}
        value={mode}
        onChange={chooseMode}
      />
      <div className="pushdown-scale-canvas" style={displayStyle}>
        <LabCanvas
          width={displayMetrics.logicalWidth}
          height={316}
          labelText={`${mode === 'post' ? '搜索后过滤' : '谓词下推'}；N=${scene.corpusSize.toLocaleString('en-US')}；左侧为候选竞争机制示意；后过滤 Recall@5${scene.postFilterApproximate ? '约 ' : '='}${scene.postFilterRecall.toFixed(3)}`}
          onOutOfView={timeline.pause}
          draw={(ctx) => {
          box(ctx, 18, 42, 200, 240, C.white, C.line, 2);
          label(ctx, '候选竞争 · 5× over-fetch（机制示意）', 118, 58, C.ink, 9);
          dot(ctx, 54, 77, 4, C.red);
          label(ctx, '其他租户', 64, 77, C.muted, 8, 'left');
          dot(ctx, 137, 77, 4, C.green);
          label(ctx, 'Finance', 147, 77, C.muted, 8, 'left');

          competition.candidates.forEach((token) => {
            ctx.save();
            ctx.globalAlpha = 1 - token.financeMix;
            dot(ctx, token.x, token.y, 4, C.red, C.white, 1);
            ctx.globalAlpha = token.financeMix;
            dot(ctx, token.x, token.y, 4, C.green, C.white, 1);
            ctx.restore();
          });

          const compactFilter = competition.filterWidth < 72;
          const filterColor = compactFilter ? C.blue : competition.filterMix > 0.5 ? C.green : C.red;
          const filterFill = compactFilter ? '#eef3fa' : competition.filterMix > 0.5 ? '#eef9f3' : '#fff1f3';
          box(ctx, competition.filterX, competition.filterY, competition.filterWidth, 24, filterFill, filterColor, 2);
          label(
            ctx,
            compactFilter
              ? 'P'
              : competition.filterMix > 0.5
                ? '授权过滤在搜索前'
                : '授权过滤在搜索后',
            competition.filterX + competition.filterWidth / 2,
            competition.filterY + 12,
            filterColor,
            compactFilter ? 11 : 9,
          );

          competition.results.forEach((token) => {
            const motion = deriveResultTokenMotion(token.financeMix);
            box(ctx, token.x - 10, token.y - 14, 20, 28, C.white, C.line, 1);
            ctx.save();
            ctx.globalAlpha = motion.deniedOpacity;
            label(ctx, '×', token.x + motion.deniedX, token.y + motion.deniedY, C.red, 10);
            ctx.globalAlpha = motion.financeOpacity;
            label(ctx, 'F', token.x + motion.financeX, token.y + motion.financeY, C.green, 10);
            ctx.restore();
          });
          label(ctx, '过滤后 top-5 结果', 118, 272, C.muted, 8);

          label(ctx, 'Recall@5（对数纵轴）', 246, 24, C.ink, 11, 'left');
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(246, 50);
          ctx.lineTo(246, 206);
          ctx.lineTo(532, 206);
          ctx.stroke();
          [1, 0.1, 0.01, 0.001].forEach((tick) => {
            const y = chartY(tick);
            ctx.strokeStyle = '#e8edf3';
            ctx.beginPath();
            ctx.moveTo(246, y);
            ctx.lineTo(532, y);
            ctx.stroke();
            label(ctx, tick.toFixed(tick >= 0.1 ? 1 : 3), 238, y, C.muted, 8, 'right');
          });

          ctx.save();
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const samples = 64;
          for (let index = 0; index <= samples; index += 1) {
            const t = index / samples * scene.corpusProgress;
            const size = logProgressToCorpusSize(t);
            const x = chartX(size);
            const y = chartY(recallAtCorpusSize(size).value);
            if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();

          PAPER_EVIDENCE.postFilter.forEach((anchor) => {
            dot(ctx, chartX(anchor.corpusSize), chartY(anchor.recallAt5), 5, C.red);
            label(ctx, formatCorpus(anchor.corpusSize), chartX(anchor.corpusSize), 220, C.muted, 8);
          });
          if (pushdownMix > 0) {
            ctx.save();
            ctx.globalAlpha = pushdownMix;
            ctx.strokeStyle = C.green;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(246, chartY(1));
            ctx.lineTo(532, chartY(1));
            ctx.stroke();
            PAPER_EVIDENCE.postFilter.forEach((anchor) => {
              dot(ctx, chartX(anchor.corpusSize), chartY(1), 5, C.green);
            });
            ctx.restore();
          }
          const currentPostY = chartY(scene.postFilterRecall);
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(chartX(scene.corpusSize), 50);
          ctx.lineTo(chartX(scene.corpusSize), 206);
          ctx.stroke();
          dot(ctx, chartX(scene.corpusSize), currentPostY, 7, C.orange);
          label(ctx, `${scene.postFilterApproximate ? '约 ' : ''}${scene.postFilterRecall.toFixed(3)}`, chartX(scene.corpusSize), Math.max(35, currentPostY - 15), C.orange, 10);
          if (pushdownMix > 0) {
            ctx.save();
            ctx.globalAlpha = pushdownMix;
            dot(ctx, chartX(scene.corpusSize), chartY(1), 7, C.green);
            label(ctx, '1.000', chartX(scene.corpusSize), 35, C.green, 10);
            ctx.restore();
          }
          label(ctx, '红虚线：后过滤 · 实心点为论文实测', 246, 248, C.red, 9, 'left');
          ctx.save();
          ctx.globalAlpha = Math.max(0.35, pushdownMix);
          label(ctx, '绿实线：谓词下推 · 四个规模均为 1.000', 246, 266, C.green, 9, 'left');
          ctx.restore();
          label(
            ctx,
            scene.postFilterApproximate ? '视觉插值；锚点为论文实测' : '曲线间为视觉插值',
            389,
            288,
            scene.postFilterApproximate ? C.orange : C.muted,
            9,
          );
          label(ctx, '左侧仅解释机制；精确值见右侧实心点', 118, 301, C.muted, 8);
          }}
        />
      </div>
      <div className="lab-stat-strip">
        <span className="lab-stat safe">CTLR = 0%</span>
        <span className={scene.recall < 0.1 ? 'lab-stat danger' : 'lab-stat'}>Recall@5 = {scene.approximate ? '约 ' : ''}{scene.recall.toFixed(3)}</span>
        <span className="lab-stat">{scene.overheadMs === null ? '下推时延：需按后端测量' : `过滤开销 = ${scene.approximate ? '约 ' : ''}${scene.overheadMs.toFixed(2)} ms`}</span>
        <span className="lab-protocol">论文条件：sqlite-vec · 5× over-fetch · 实心点为实测</span>
      </div>
      <TimelineControls timeline={controlledTimeline} phases={phases} label="后过滤规模效应" />
      <Feedback tone={mode === 'pushdown' ? 'good' : scene.recall < 0.1 ? 'bad' : 'warn'}>
        {mode === 'pushdown' ? pushdownCopy : postCopy}
      </Feedback>
    </LabShell>
  );
}
