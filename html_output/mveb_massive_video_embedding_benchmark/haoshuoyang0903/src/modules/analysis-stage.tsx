import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { STORY_COLORS, arrow, clearStoryCanvas, label, pill, seal } from './storyKit';
import { VIDEO_PALETTE as P } from './videoPalette';

const C = {
  ...STORY_COLORS,
  blue: P.primary,
  green: P.success,
  red: P.error,
  orange: P.warning,
  purple: P.secondary,
  text: P.text,
  muted: P.muted,
};

type Experiment = 'audio' | 'frames' | 'retrieval' | 'summary';
type FrameCount = 1 | 8 | 16 | 32 | 64;

type DirectionId = 'T→V' | 'A→V' | 'AT→V' | 'V→T' | 'VA→T' | 'V→A' | 'VT→A' | 'T→VA';
type Point = { x: number; y: number };

const EXPERIMENTS: readonly Experiment[] = ['audio', 'frames', 'retrieval', 'summary'];
const EXPERIMENT_LABELS: Record<Experiment, string> = {
  audio: '01 · Audio',
  frames: '02 · Frames',
  retrieval: '03 · Retrieval',
  summary: '收束',
};

const MAX_STEP: Record<Experiment, number> = {
  audio: 4,
  frames: 5,
  retrieval: 5,
  summary: 1,
};

const NEXT_LABELS: Record<Experiment, readonly string[]> = {
  audio: ['打开音频', '分裂实验路线', '显示差值', '留下结论', '进入 Frames'],
  frames: ['展开到 8 帧', '增加到 16 帧', '标记 32 帧', '增加到 64 帧', '留下结论', '进入 Retrieval'],
  retrieval: ['展开 8 个方向', '显示相关性', '形成能力群组', '查看最弱相关', '留下结论', '汇总三个实验'],
  summary: ['汇聚最终结论', '本章实验完成'],
};

const FRAME_STEPS: readonly FrameCount[] = [1, 8, 16, 32, 64];
const CURVE_PROGRESS = [5, 48, 67, 86, 100] as const;

const DIRECTIONS: readonly DirectionId[] = ['T→V', 'A→V', 'AT→V', 'V→T', 'VA→T', 'V→A', 'VT→A', 'T→VA'];

const LOOSE_POSITIONS: Record<DirectionId, Point> = {
  'T→V': { x: 92, y: 84 },
  'A→V': { x: 276, y: 58 },
  'AT→V': { x: 476, y: 74 },
  'V→T': { x: 628, y: 92 },
  'VA→T': { x: 132, y: 262 },
  'V→A': { x: 322, y: 286 },
  'VT→A': { x: 504, y: 258 },
  'T→VA': { x: 652, y: 276 },
};

const CLUSTER_POSITIONS: Record<DirectionId, Point> = {
  'V→T': { x: 492, y: 78 },
  'VA→T': { x: 604, y: 78 },
  'A→V': { x: 112, y: 184 },
  'AT→V': { x: 226, y: 158 },
  'V→A': { x: 226, y: 222 },
  'T→V': { x: 420, y: 240 },
  'T→VA': { x: 532, y: 216 },
  'VT→A': { x: 638, y: 262 },
};

const WEAK_PAIR_POSITIONS: Partial<Record<DirectionId, Point>> = {
  'T→VA': { x: 112, y: 180 },
  'A→V': { x: 608, y: 180 },
};

const RETRIEVAL_GROUP: Record<DirectionId, number> = {
  'V→T': 1,
  'VA→T': 1,
  'A→V': 2,
  'AT→V': 2,
  'V→A': 2,
  'T→V': 3,
  'T→VA': 3,
  'VT→A': 3,
};

const SPEARMAN_MATRIX: readonly (readonly number[])[] = [
  [1, .49, .55, .75, .72, .66, .91, .89],
  [.49, 1, .92, .73, .63, .89, .59, .37],
  [.55, .92, 1, .84, .72, .93, .60, .41],
  [.75, .73, .84, 1, .95, .89, .77, .65],
  [.72, .63, .72, .95, 1, .77, .72, .70],
  [.66, .89, .93, .89, .77, 1, .74, .47],
  [.91, .59, .60, .77, .72, .74, 1, .81],
  [.89, .37, .41, .65, .70, .47, .81, 1],
];

const CORRELATION_LINKS = DIRECTIONS.flatMap((from, fromIndex) =>
  DIRECTIONS.slice(fromIndex + 1).map((to, offset) => ({
    from,
    to,
    rho: SPEARMAN_MATRIX[fromIndex][fromIndex + offset + 1],
  })),
);

function frameIndices(count: FrameCount) {
  if (count === 1) return new Set<number>();
  return new Set(Array.from({ length: count }, (_, index) => Math.round((index * 63) / (count - 1))));
}

function AnalysisAnalogy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 244, 130);
    } catch {
      return;
    }

    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = '244px';

    const draw = () => {
      clearStoryCanvas(ctx, 244, 130);
      ['Audio', 'Frames', 'Retrieval'].forEach((text, index) => {
        pill(ctx, text, 9 + index * 78, 25 + index * 17, 70, index === 0, index === 0 ? C.purple : index === 1 ? C.orange : C.blue);
      });
      arrow(ctx, 50, 91, 194, 91, C.green, 3);
      seal(ctx, 211, 91, '平衡');
      label(ctx, '点击推进，逐个查看实验', 122, 116, C.text, 'center', '700 11px "Segoe UI", sans-serif');
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={244}
      height={130}
      role="img"
      aria-label="点击按钮，依次查看音频、帧数和检索结构实验。"
    />
  );
}

function Waveform() {
  const heights = [18, 42, 28, 64, 36, 76, 48, 60, 30, 70, 42, 22, 54, 34, 62, 26];
  return (
    <span className="audio-waveform" aria-hidden="true">
      {heights.map((height, index) => <i key={`${height}-${index}`} style={{ '--wave-height': `${height}%` } as React.CSSProperties} />)}
    </span>
  );
}

function VideoCard({ audioOn }: { audioOn: boolean }) {
  return (
    <div className="analysis-video-card">
      <div className="analysis-video-screen">
        <span className="analysis-video-tag">VIDEO</span>
        <span className="analysis-video-play" aria-hidden="true">▶</span>
        <span className="analysis-video-copy">sample clip</span>
        <span className="analysis-audio-icon" aria-label={audioOn ? '音频已开启' : '音频已静音'}>{audioOn ? '🔊' : '🔇'}</span>
        <Waveform />
      </div>
      <strong>{audioOn ? 'VIDEO + AUDIO' : 'VIDEO ONLY'}</strong>
    </div>
  );
}

function AudioScene({ step }: { step: number }) {
  const audioOn = step >= 1;
  const split = step >= 2;
  const result = step >= 3;
  const conclusion = step >= 4;

  return (
    <section
      className={`analysis-scene audio-experiment ${audioOn ? 'is-audio-on' : ''} ${split ? 'is-split' : ''} ${result ? 'is-result' : ''} ${conclusion ? 'is-conclusion' : ''}`}
      aria-label="Audio 实验"
    >
      <header className="analysis-scene-heading">
        <span>01 · DOES AUDIO HELP?</span>
        <strong>{split ? '同一批视频，按标签来源分成两组' : audioOn ? 'VIDEO + AUDIO' : 'VIDEO ONLY'}</strong>
      </header>

      <div className="audio-primary-card">
        <VideoCard audioOn={audioOn} />
        <p>“多一个模态，应该更好了吧？”</p>
      </div>

      <div className="audio-branch-stage" aria-hidden={!split}>
        <div className="audio-source-label">AUDIO ON</div>
        <div className="audio-fork" aria-hidden="true"><i /><i /><i /></div>

        <article className="audio-branch av-branch">
          <span>AV-grounded</span>
          <div className="audio-delta-track">
            <i className="audio-zero-line" />
            <strong className="audio-delta-marker">{result ? '+0.016 ↑' : 'Δ = 0'}</strong>
          </div>
          <small>标签依赖声音与画面</small>
        </article>

        <div className="audio-not-equal" aria-hidden="true">≠</div>

        <article className="audio-branch v-branch">
          <span>V-grounded</span>
          <div className="audio-delta-track">
            <i className="audio-zero-line" />
            <strong className="audio-delta-marker">{result ? '−0.046 ↓' : 'Δ = 0'}</strong>
          </div>
          <small>标签只根据视觉内容产生</small>
        </article>
      </div>

      <div className="analysis-conclusion audio-conclusion" aria-hidden={!conclusion}>
        <strong>More modalities ≠ better representations</strong>
        <p>标签需要声音时，音频才可能帮上忙；只看画面就能确定标签时，加入音频反而可能拖累结果。</p>
        <small>Δ = score<sub>va</sub> − score<sub>v</sub> · 48 个配对任务组 · 14 个音频兼容模型</small>
      </div>
    </section>
  );
}

function PerformanceCurve({ step }: { step: number }) {
  const pointIndex = Math.min(step, 4);
  const points = [
    { x: 42, y: 151 },
    { x: 168, y: 64 },
    { x: 270, y: 45 },
    { x: 374, y: 34 },
    { x: 506, y: 30 },
  ];

  return (
    <svg className="frame-performance-curve" viewBox="0 0 540 180" role="img" aria-label="性能从 1 到 8 帧显著提升，随后斜率逐渐变小，到 32 至 64 帧趋于平缓。">
      <path className="frame-curve-guide" d="M42 151 C90 147 118 78 168 64 C220 49 233 48 270 45 C320 40 338 36 374 34 C432 31 467 30 506 30" />
      <path
        className="frame-curve-active"
        pathLength="100"
        d="M42 151 C90 147 118 78 168 64 C220 49 233 48 270 45 C320 40 338 36 374 34 C432 31 467 30 506 30"
        style={{ strokeDashoffset: 100 - CURVE_PROGRESS[pointIndex] }}
      />
      {points.map((point, index) => (
        <circle key={point.x} className={index <= pointIndex ? 'is-active' : ''} cx={point.x} cy={point.y} r={index === pointIndex ? 7 : 5} />
      ))}
    </svg>
  );
}

function FramesScene({ step }: { step: number }) {
  const frameStep = Math.min(step, 4);
  const count = FRAME_STEPS[frameStep];
  const activeIndices = useMemo(() => frameIndices(count), [count]);
  const conclusion = step >= 5;

  return (
    <section
      className={`analysis-scene frames-experiment ${step >= 1 ? 'is-filmstrip' : ''} ${step >= 3 ? 'is-ceiling' : ''} ${step >= 4 ? 'is-long' : ''} ${conclusion ? 'is-conclusion' : ''}`}
      aria-label="Frames 实验"
    >
      <header className="analysis-scene-heading">
        <span>02 · HOW MANY FRAMES ARE ENOUGH?</span>
        <strong>{count} {count === 1 ? 'FRAME' : 'FRAMES'}</strong>
      </header>

      <div className="frame-hero-card">
        <span>FRAME 1</span>
        <i aria-hidden="true">▶</i>
      </div>

      <div className="frame-filmstrip" aria-label={`当前展示 ${count} 帧的时间上下文`}>
        <div className="frame-filmstrip-edge" aria-hidden="true" />
        <div className="frame-cells" aria-hidden="true">
          {Array.from({ length: 64 }, (_, index) => (
            <i key={index} className={activeIndices.has(index) ? 'is-active' : ''}><span /></i>
          ))}
        </div>
        <strong>{count} FRAMES</strong>
      </div>

      <div className="frame-curve-wrap">
        <span>PERFORMANCE</span>
        <PerformanceCurve step={frameStep} />
        <div className="frame-early-label">
          <strong>+43.7%</strong>
          <span>relative improvement</span>
          <small>1 → 8</small>
        </div>
        <div className="frame-ceiling-label">
          <i />
          <strong>32</strong>
          <span>REASONABLE CEILING</span>
        </div>
        <div className="frame-late-label">
          <small>32 → 64</small>
          <strong>+2.2 pts</strong>
          <span>absolute</span>
        </div>
      </div>

      <div className="analysis-conclusion frames-conclusion" aria-hidden={!conclusion}>
        <strong>More context → diminishing returns</strong>
        <p>增加帧数能补充时间信息，但越往后，新增帧带来的提升越小。</p>
        <small>7 个长视频任务 · 5 个兼容模型的研究子集</small>
      </div>
    </section>
  );
}

function linkLine(
  link: (typeof CORRELATION_LINKS)[number],
  positions: Record<DirectionId, Point>,
  keyPrefix: string,
) {
  const from = positions[link.from];
  const to = positions[link.to];
  const strength = (link.rho - .37) / (.95 - .37);
  return (
    <line
      key={`${keyPrefix}-${link.from}-${link.to}`}
      className="retrieval-link"
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      style={{
        opacity: .08 + strength * .72,
        strokeWidth: 1 + strength * 4,
      }}
    />
  );
}

function RetrievalScene({ step }: { step: number }) {
  const nodesVisible = step >= 1;
  const correlationsVisible = step >= 2;
  const clustered = step === 3 || step >= 5;
  const weakPair = step === 4;
  const conclusion = step >= 5;

  const positionFor = (direction: DirectionId) => {
    if (weakPair && WEAK_PAIR_POSITIONS[direction]) return WEAK_PAIR_POSITIONS[direction] as Point;
    return clustered ? CLUSTER_POSITIONS[direction] : LOOSE_POSITIONS[direction];
  };

  return (
    <section
      className={`analysis-scene retrieval-experiment ${nodesVisible ? 'has-nodes' : ''} ${correlationsVisible ? 'has-correlations' : ''} ${clustered ? 'is-clustered' : ''} ${weakPair ? 'is-weak-pair' : ''} ${conclusion ? 'is-conclusion' : ''}`}
      aria-label="Retrieval 实验"
    >
      <header className="analysis-scene-heading">
        <span>03 · RETRIEVAL STRUCTURE</span>
        <strong>8 Retrieval Directions</strong>
      </header>

      <svg className="retrieval-map" viewBox="0 0 720 360" role="img" aria-label="八个检索方向先分散出现，再按论文报告的 Spearman 相关性靠拢为三个群组。">
        <g className="retrieval-cluster-boxes">
          <g>
            <rect x="422" y="34" width="242" height="90" rx="18" />
            <text x="543" y="54">V→T · VA→T · ρ=.96</text>
          </g>
          <g>
            <rect x="52" y="120" width="234" height="142" rx="18" />
            <text x="169" y="132">A→V · AT→V · V→A · ρ ≥ .87</text>
          </g>
          <g>
            <rect x="368" y="178" width="316" height="126" rx="18" />
            <text x="526" y="190">T→V · T→VA · VT→A · ρ ≥ .77</text>
          </g>
        </g>

        <g className="retrieval-loose-links">
          {CORRELATION_LINKS.map((link) => linkLine(link, LOOSE_POSITIONS, 'loose'))}
        </g>
        <g className="retrieval-cluster-links">
          {CORRELATION_LINKS
            .filter((link) => RETRIEVAL_GROUP[link.from] === RETRIEVAL_GROUP[link.to])
            .map((link) => linkLine(link, CLUSTER_POSITIONS, 'cluster'))}
        </g>

        <g className="retrieval-weak-line">
          <line x1="155" y1="180" x2="565" y2="180" />
          <rect x="300" y="151" width="120" height="58" rx="16" />
          <text x="360" y="177">ρ = .38</text>
          <text x="360" y="196">最弱相关</text>
        </g>

        {DIRECTIONS.map((direction) => {
          const point = positionFor(direction);
          const weakFocus = direction === 'T→VA' || direction === 'A→V';
          return (
            <g
              key={direction}
              className={`retrieval-node ${weakPair && !weakFocus ? 'is-muted' : ''}`}
              style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
            >
              <rect x="-43" y="-21" width="86" height="42" rx="12" />
              <text x="0" y="5">{direction}</text>
            </g>
          );
        })}
      </svg>

      <p className="retrieval-expectation">八个方向，是否就等于八种独立能力？</p>

      <div className="analysis-conclusion retrieval-conclusion" aria-hidden={!conclusion}>
        <strong>8 directions ≠ 8 independent abilities</strong>
        <p>八个检索方向并不彼此独立。它们的相关性显示出三个能力群组。</p>
        <small>28 条连线的亮度和粗细对应论文的 Spearman 矩阵；节点终点按论文总结的三组结构排列。</small>
      </div>
    </section>
  );
}

function SummaryScene({ step }: { step: number }) {
  const resolved = step >= 1;
  const items = [
    { label: 'AUDIO', symbol: '±', paper: 'Audio 有时帮助、有时伤害', takeaway: 'More modalities ≠ always better' },
    { label: 'FRAMES', symbol: 'plateau', paper: '32 帧之后收益趋缓', takeaway: 'More context ≠ proportional gains' },
    { label: 'RETRIEVAL', symbol: '8 → 3', paper: '8 个检索方向形成相关能力群组', takeaway: 'More retrieval directions ≠ independent abilities' },
  ];

  return (
    <section className={`analysis-scene analysis-summary ${resolved ? 'is-resolved' : ''}`} aria-label="三个实验的共同结论">
      <header className="analysis-scene-heading">
        <span>THE PATTERN</span>
        <strong>三个实验说明了什么？</strong>
      </header>

      <div className="analysis-summary-grid">
        {items.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong className="analysis-summary-symbol">{item.symbol}</strong>
            <p className="analysis-summary-paper">{item.paper}</p>
            <p className="analysis-summary-takeaway">{item.takeaway}</p>
          </article>
        ))}
      </div>

      <div className="analysis-balance">
        <strong>General Ability is about balance.</strong>
        <p>模态、帧数和任务方向都不是越多越好。更重要的是，模型能否在不同条件下给出稳定、可用的表示。</p>
        <small>接下来要问：什么训练方式更可能得到这样的 embedding？</small>
      </div>
    </section>
  );
}

function SceneBody({ experiment, step }: { experiment: Experiment; step: number }) {
  if (experiment === 'audio') return <AudioScene step={step} />;
  if (experiment === 'frames') return <FramesScene step={step} />;
  if (experiment === 'retrieval') return <RetrievalScene step={step} />;
  return <SummaryScene step={step} />;
}

export const AnalysisStage: React.FC<WidgetProps> = ({ moduleId }) => {
  const isAnalogy = moduleId === 'ana';
  const [experiment, setExperiment] = useState<Experiment>('audio');
  const [step, setStep] = useState(0);
  const [inputMode, setInputMode] = useState<'pointer' | 'keyboard'>('pointer');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (isAnalogy) return <AnalysisAnalogy />;

  const experimentIndex = EXPERIMENTS.indexOf(experiment);
  const isFirst = experimentIndex === 0 && step === 0;
  const isComplete = experiment === 'summary' && step === MAX_STEP.summary;

  const selectExperiment = (next: Experiment) => {
    setExperiment(next);
    setStep(0);
  };

  const goNext = () => {
    if (step < MAX_STEP[experiment]) {
      setStep((current) => current + 1);
      return;
    }
    const next = EXPERIMENTS[experimentIndex + 1];
    if (next) selectExperiment(next);
  };

  const goBack = () => {
    if (step > 0) {
      setStep((current) => current - 1);
      return;
    }
    const previous = EXPERIMENTS[experimentIndex - 1];
    if (previous) {
      setExperiment(previous);
      setStep(MAX_STEP[previous]);
    }
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? EXPERIMENTS.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + EXPERIMENTS.length) % EXPERIMENTS.length;
    const next = EXPERIMENTS[nextIndex];
    selectExperiment(next);
    tabRefs.current[nextIndex]?.focus();
  };

  const liveText = `${EXPERIMENT_LABELS[experiment]}，第 ${step + 1} 幕，共 ${MAX_STEP[experiment] + 1} 幕。`;

  return (
    <div
      className="analysis-player"
      data-input={inputMode}
      onPointerDownCapture={() => setInputMode('pointer')}
      onKeyDownCapture={(event) => {
        if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) setInputMode('keyboard');
      }}
    >
      <div className="analysis-experiment-tabs" role="tablist" aria-label="选择第五章实验">
        {EXPERIMENTS.map((id, index) => (
          <button
            key={id}
            ref={(node) => { tabRefs.current[index] = node; }}
            id={`analysis-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={experiment === id}
            aria-controls="analysis-stage-panel"
            tabIndex={experiment === id ? 0 : -1}
            className={experiment === id ? 'active' : ''}
            onClick={() => selectExperiment(id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {EXPERIMENT_LABELS[id]}
          </button>
        ))}
      </div>

      <div
        id="analysis-stage-panel"
        className="analysis-stage-panel"
        role="tabpanel"
        aria-labelledby={`analysis-tab-${experiment}`}
        data-experiment={experiment}
        data-step={step}
      >
        <SceneBody experiment={experiment} step={step} />
      </div>

      <div className="analysis-player-controls">
        <button type="button" className="analysis-back" onClick={goBack} disabled={isFirst}>← 上一幕</button>

        <div className="analysis-step-dots" role="group" aria-label={`${EXPERIMENT_LABELS[experiment]}分镜`}>
          {Array.from({ length: MAX_STEP[experiment] + 1 }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`跳到第 ${index + 1} 幕`}
              aria-current={step === index ? 'step' : undefined}
              className={step === index ? 'active' : ''}
              onClick={() => setStep(index)}
            />
          ))}
        </div>

        <span className="analysis-step-count" aria-hidden="true">{String(step + 1).padStart(2, '0')} / {String(MAX_STEP[experiment] + 1).padStart(2, '0')}</span>

        <button type="button" className="analysis-next" onClick={goNext} disabled={isComplete}>
          {NEXT_LABELS[experiment][step]} {isComplete ? '✓' : '→'}
        </button>
      </div>

      <p className="analysis-evidence-note">
        图中只标论文明确报告的数值。中间曲线表示整体趋势，不对应论文未公开的具体分数。
      </p>
      <p className="analysis-sr-only" role="status" aria-live="polite">{liveText}</p>
    </div>
  );
};

export default AnalysisStage;
