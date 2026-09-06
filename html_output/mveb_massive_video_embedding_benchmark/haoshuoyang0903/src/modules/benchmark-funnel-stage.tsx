import React, { useEffect, useRef, useState } from 'react';
import {
  clamp,
  easeInOutQuad,
  easeOutBounce,
  easeOutCubic,
  lerp,
  lerpColor,
  observeCanvas,
  setupCanvas,
} from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  STORY_COLORS as C,
  arrow,
  clearStoryCanvas,
  label,
  roundedRect,
} from './storyKit';

const FILTERS = [
  { label: '有效性', detail: '任务是否可正确运行', color: C.blue },
  { label: '独特性', detail: '是否补充新的能力', color: C.green },
  { label: '语言多样性', detail: '是否保留语言覆盖', color: C.purple },
  { label: '相关性', detail: '高相关任务去重', color: C.orange },
  { label: '运行成本', detail: '控制完整评测成本', color: C.red },
] as const;

const FILTER_START = 1200;
const FILTER_SLOT = 1400;
const FINAL_START = 8200;
const MOVIE_DURATION = 11_000;
const REPRESENTATIVE_DOT_COUNT = 78;

type PlaybackState = 'idle' | 'playing' | 'paused' | 'complete';

const MOVIE_BEATS = [
  {
    start: 0,
    title: 'MVEB+ 候选池',
    feedback: '起点是 MVEB+ 的 184 个任务。',
    feedbackClass: '',
    tone: 'blue',
  },
  ...FILTERS.map((filter, index) => ({
    start: FILTER_START + index * FILTER_SLOT,
    title: `筛选：${filter.label}`,
    feedback: `“${filter.label}”筛选标准触发，候选点随筛选减少。`,
    feedbackClass: 'warn',
    tone: index === 2 ? 'purple' : index === 4 ? 'red' : 'orange',
  })),
  {
    start: FINAL_START,
    title: '收束为 23 个任务',
    feedback: '终点是 23 个精选任务；只需23个任务，就能得到可靠模型能力排序。',
    feedbackClass: 'good',
    tone: 'green',
  },
  {
    start: 9600,
    title: 'MVEB 任务集筛选完成',
    feedback: '确定端点是 184 → 23。',
    feedbackClass: 'good',
    tone: 'green',
  },
] as const;

type CandidateDot = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  removeStage: number;
};

const CANDIDATE_DOTS: CandidateDot[] = (() => {
  const indices = Array.from({ length: REPRESENTATIVE_DOT_COUNT }, (_, index) => index);
  const order = [...indices].sort((a, b) => ((a * 37) % 79) - ((b * 37) % 79));
  const removeStage = new Array(REPRESENTATIVE_DOT_COUNT).fill(FILTERS.length);
  const survivorRank = new Array(REPRESENTATIVE_DOT_COUNT).fill(-1);

  order.slice(0, 23).forEach((dotIndex, rank) => {
    survivorRank[dotIndex] = rank;
  });
  const removalsPerStage = [14, 12, 11, 10, 8];
  let cursor = 23;
  removalsPerStage.forEach((count, stage) => {
    order.slice(cursor, cursor + count).forEach((dotIndex) => {
      removeStage[dotIndex] = stage;
    });
    cursor += count;
  });

  return indices.map((index) => {
    const column = index % 13;
    const row = Math.floor(index / 13);
    const jitterX = ((index * 17) % 7) - 3;
    const jitterY = ((index * 23) % 7) - 3;
    const rank = survivorRank[index];
    const angle = rank >= 0 ? -Math.PI / 2 + (rank / 23) * Math.PI * 2 : 0;
    const radiusX = rank % 2 === 0 ? 82 : 68;
    const radiusY = rank % 2 === 0 ? 58 : 48;
    return {
      x: 34 + column * 41 + jitterX,
      y: 42 + row * 26 + jitterY,
      targetX: rank >= 0 ? 280 + Math.cos(angle) * radiusX : 280,
      targetY: rank >= 0 ? 116 + Math.sin(angle) * radiusY : 116,
      removeStage: removeStage[index],
    };
  });
})();

function segment(
  time: number,
  start: number,
  end: number,
  easing: (value: number) => number = easeOutCubic,
) {
  return easing(clamp((time - start) / Math.max(1, end - start), 0, 1));
}

function drawMini(ctx: CanvasRenderingContext2D, time: number, reduced: boolean) {
  clearStoryCanvas(ctx, 244, 130);
  const progress = reduced ? 1 : easeInOutQuad(clamp(((time % 3200) - 300) / 2100, 0, 1));
  for (let index = 0; index < 24; index += 1) {
    const survivor = index % 4 === 0;
    const sourceX = 18 + (index % 8) * 12;
    const sourceY = 32 + Math.floor(index / 8) * 15;
    const targetX = 154 + (index % 3) * 20;
    const targetY = 34 + Math.floor(index / 8) * 17;
    const x = survivor ? sourceX + (targetX - sourceX) * progress : sourceX;
    const y = survivor ? sourceY + (targetY - sourceY) * progress : sourceY;
    ctx.globalAlpha = survivor ? 1 : 1 - progress * 0.88;
    ctx.fillStyle = survivor ? C.green : C.muted;
    ctx.beginPath();
    ctx.arc(x, y, survivor ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  arrow(ctx, 109, 60, 139, 60, C.orange, 3);
  label(ctx, '184', 54, 96, C.text, 'center', '800 20px "Segoe UI", sans-serif');
  label(ctx, '23', 182, 96, C.green, 'center', '800 20px "Segoe UI", sans-serif');
  label(ctx, '保留排名结构', 234, 116, C.green, 'right', '600 10px "Segoe UI", sans-serif');
}

function FunnelAnalogy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 244, 130);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frame: number | null = null;
    let began = performance.now();
    const render = (now: number) => {
      drawMini(ctx, now - began, reduced);
      canvas.classList.add('is-ready');
      if (!reduced) frame = requestAnimationFrame(render);
    };
    const start = () => {
      began = performance.now();
      if (frame === null) frame = requestAnimationFrame(render);
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);
  return <canvas ref={canvasRef} width={244} height={130} role="img" aria-label="184 个候选任务经过筛选后，23 个代表性任务移动到保留区。" />;
}

function stageProgress(time: number, stage: number) {
  const start = FILTER_START + stage * FILTER_SLOT;
  return segment(time, start + 420, start + 1080);
}

function drawCandidateDots(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean) {
  const finalProgress = segment(time, FINAL_START, 9300, easeInOutQuad);
  CANDIDATE_DOTS.forEach((dot) => {
    const removal = dot.removeStage < FILTERS.length ? stageProgress(time, dot.removeStage) : 0;
    const survives = dot.removeStage === FILTERS.length;
    const alpha = survives ? 1 : 1 - removal;
    if (alpha <= 0) return;

    const x = survives && !reducedMotion ? lerp(dot.x, dot.targetX, finalProgress) : dot.x;
    const yBase = survives && !reducedMotion ? lerp(dot.y, dot.targetY, finalProgress) : dot.y;
    const y = reducedMotion ? yBase : yBase + removal * 10;
    const scale = survives ? lerp(1, 1.28, finalProgress) : lerp(1, 0.55, removal);
    const color = survives
      ? lerpColor(C.blue, C.green, finalProgress)
      : lerpColor(C.blue, FILTERS[dot.removeStage]?.color ?? C.muted, clamp(removal * 3, 0, 1));

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.25 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (!reducedMotion && removal > 0.12 && removal < 0.48) {
      const spark = 1 - Math.abs(removal - 0.3) / 0.18;
      ctx.globalAlpha *= clamp(spark, 0, 1) * 0.75;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 5 + removal * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawTargetSign(
  ctx: CanvasRenderingContext2D,
  time: number,
  filter: (typeof FILTERS)[number],
  index: number,
  reducedMotion: boolean,
) {
  const start = FILTER_START + index * FILTER_SLOT;
  const entryRaw = clamp((time - start) / 420, 0, 1);
  const exit = segment(time, start + 1080, start + 1380, easeInOutQuad);
  const entry = reducedMotion ? easeOutCubic(entryRaw) : easeOutBounce(entryRaw);
  const visibility = entry * (1 - exit);
  if (visibility <= 0) return;

  const settledY = 126;
  const risingY = reducedMotion ? settledY : lerp(258, settledY, entry);
  const y = reducedMotion ? risingY : lerp(risingY, 258, exit);
  const x = 185;
  const width = 190;
  const height = 58;

  ctx.save();
  ctx.globalAlpha *= reducedMotion ? visibility : 1;
  ctx.strokeStyle = filter.color;
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(280, y + height - 2);
  ctx.lineTo(280, 220);
  ctx.stroke();
  ctx.fillStyle = filter.color;
  ctx.beginPath();
  ctx.ellipse(280, 222, 27, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.paper;
  ctx.strokeStyle = filter.color;
  ctx.lineWidth = 3;
  roundedRect(ctx, x, y, width, height, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = filter.color;
  ctx.beginPath();
  ctx.arc(x + 14, y + 14, 4, 0, Math.PI * 2);
  ctx.arc(x + width - 14, y + 14, 4, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, '正在筛选', 280, y + 17, C.muted, 'center', '700 9px "Microsoft YaHei", sans-serif');
  label(ctx, filter.label, 280, y + 36, filter.color, 'center', '850 18px "Microsoft YaHei", sans-serif');
  label(ctx, filter.detail, 280, y + 52, C.muted, 'center', '650 9px "Microsoft YaHei", sans-serif');
  ctx.restore();
}

function drawFinalBadge(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean) {
  const reveal = segment(time, 8850, 9600);
  if (reveal <= 0) return;
  const scale = reducedMotion ? 1 : lerp(0.95, 1, reveal);
  ctx.save();
  ctx.globalAlpha *= reveal;
  ctx.translate(280, 116);
  ctx.scale(scale, scale);
  ctx.translate(-280, -116);
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(280, 116, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(ctx, '23', 280, 108, C.green, 'center', '900 28px "Segoe UI", sans-serif');
  label(ctx, 'MVEB', 280, 133, C.blue, 'center', '850 10px "Segoe UI", sans-serif');
  ctx.restore();
}

function drawFilterMovie(ctx: CanvasRenderingContext2D, elapsed: number, reducedMotion: boolean) {
  const time = clamp(elapsed, 0, MOVIE_DURATION);
  clearStoryCanvas(ctx, 560, 240);

  const finalHeader = segment(time, FINAL_START, 9000);
  ctx.save();
  ctx.globalAlpha *= 1 - finalHeader;
  label(ctx, 'MVEB+ · 184 tasks', 20, 20, C.blue, 'left', '850 13px "Segoe UI", sans-serif');
  label(ctx, '候选任务群', 540, 20, C.muted, 'right', '700 10px "Microsoft YaHei", sans-serif');
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= finalHeader;
  label(ctx, 'MVEB · 23 tasks', 20, 20, C.green, 'left', '850 13px "Segoe UI", sans-serif');
  label(ctx, '五类约束筛选完成', 540, 20, C.green, 'right', '750 10px "Microsoft YaHei", sans-serif');
  ctx.restore();

  drawCandidateDots(ctx, time, reducedMotion);
  FILTERS.forEach((filter, index) => drawTargetSign(ctx, time, filter, index, reducedMotion));
  drawFinalBadge(ctx, time, reducedMotion);

  const finalCaption = segment(time, 9500, 10_100);
  ctx.save();
  ctx.globalAlpha *= finalCaption;
  label(ctx, '184 → 23', 280, 223, C.green, 'center', '800 10px "Microsoft YaHei", sans-serif');
  ctx.restore();
}

function beatIndexAt(elapsed: number) {
  let index = 0;
  for (let candidate = 1; candidate < MOVIE_BEATS.length; candidate += 1) {
    if (elapsed < MOVIE_BEATS[candidate].start) break;
    index = candidate;
  }
  return index;
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `00:${String(seconds).padStart(2, '0')}`;
}

function FilterMovie() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);
  const playbackStateRef = useRef<PlaybackState>('idle');
  const beatIndexRef = useRef(0);
  const paintRef = useRef<(elapsed: number) => void>(() => {});
  const startLoopRef = useRef<() => void>(() => {});
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 240);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = media.matches;

    const paint = (elapsed: number) => {
      drawFilterMovie(ctx, elapsed, reducedMotionRef.current);
      canvas.classList.add('is-ready');
      const progress = clamp(elapsed / MOVIE_DURATION, 0, 1);
      if (progressFillRef.current) progressFillRef.current.style.transform = `scaleX(${progress})`;
      if (progressTrackRef.current) {
        progressTrackRef.current.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      }
      if (timeRef.current) timeRef.current.textContent = `${formatTime(elapsed)} / ${formatTime(MOVIE_DURATION)}`;
      const nextBeat = beatIndexAt(elapsed);
      if (nextBeat !== beatIndexRef.current) {
        beatIndexRef.current = nextBeat;
        setBeatIndex(nextBeat);
      }
    };
    paintRef.current = paint;

    const frame = (now: number) => {
      frameRef.current = null;
      if (playbackStateRef.current !== 'playing' || !visibleRef.current || document.hidden) return;
      const elapsed = clamp(now - startedAtRef.current, 0, MOVIE_DURATION);
      elapsedRef.current = elapsed;
      paint(elapsed);
      if (elapsed >= MOVIE_DURATION) {
        playbackStateRef.current = 'complete';
        setPlaybackState('complete');
        return;
      }
      frameRef.current = requestAnimationFrame(frame);
    };
    const startLoop = () => {
      if (
        frameRef.current === null
        && playbackStateRef.current === 'playing'
        && visibleRef.current
        && !document.hidden
      ) frameRef.current = requestAnimationFrame(frame);
    };
    startLoopRef.current = startLoop;

    const suspendLoop = () => {
      if (playbackStateRef.current === 'playing') {
        elapsedRef.current = clamp(performance.now() - startedAtRef.current, 0, MOVIE_DURATION);
      }
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        paint(elapsedRef.current);
        if (playbackStateRef.current === 'playing') {
          startedAtRef.current = performance.now() - elapsedRef.current;
          startLoop();
        }
      },
      () => {
        suspendLoop();
        visibleRef.current = false;
      },
    );
    const onVisibilityChange = () => {
      if (document.hidden) suspendLoop();
      else if (playbackStateRef.current === 'playing' && visibleRef.current) {
        startedAtRef.current = performance.now() - elapsedRef.current;
        startLoop();
      }
    };
    const onPreferenceChange = () => {
      reducedMotionRef.current = media.matches;
      paint(elapsedRef.current);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    media.addEventListener('change', onPreferenceChange);
    paint(0);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      media.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  const togglePlayback = () => {
    if (playbackStateRef.current === 'playing') {
      elapsedRef.current = clamp(performance.now() - startedAtRef.current, 0, MOVIE_DURATION);
      playbackStateRef.current = 'paused';
      setPlaybackState('paused');
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      paintRef.current(elapsedRef.current);
      return;
    }
    if (playbackStateRef.current === 'complete') {
      elapsedRef.current = 0;
      beatIndexRef.current = 0;
      setBeatIndex(0);
      paintRef.current(0);
    }
    startedAtRef.current = performance.now() - elapsedRef.current;
    playbackStateRef.current = 'playing';
    setPlaybackState('playing');
    startLoopRef.current();
  };

  const resetPlayback = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    elapsedRef.current = 0;
    beatIndexRef.current = 0;
    playbackStateRef.current = 'idle';
    setBeatIndex(0);
    setPlaybackState('idle');
    paintRef.current(0);
  };

  const beat = MOVIE_BEATS[beatIndex];
  const playLabel = playbackState === 'playing'
    ? 'Ⅱ 暂停'
    : playbackState === 'complete'
      ? '↻ 重新播放'
      : playbackState === 'paused'
        ? '▶ 继续筛选'
        : '▶ 开始筛选';

  return (
    <div className="story-widget benchmark-filter-movie" data-status={playbackState} data-tone={beat.tone}>
      <div className="benchmark-filter-heading">
        <span>② BUILD THE BENCHMARK</span>
        <strong>{beat.title}</strong>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label={`MVEB 任务筛选。当前阶段：${beat.title}。${beat.feedback}`}
      />
      <div
        ref={progressTrackRef}
        className="benchmark-filter-progress"
        role="progressbar"
        aria-label="MVEB 筛选进度"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div ref={progressFillRef} className="benchmark-filter-progress-fill" />
        <div className="benchmark-filter-cues" aria-hidden="true">
          {MOVIE_BEATS.slice(1).map((item) => (
            <i key={item.start} style={{ left: `${(item.start / MOVIE_DURATION) * 100}%` }} />
          ))}
        </div>
      </div>
      <div className="benchmark-filter-controls">
        <button type="button" className="tiny" onClick={togglePlayback}>{playLabel}</button>
        <button
          type="button"
          className="tiny ghost"
          onClick={resetPlayback}
          disabled={playbackState === 'idle'}
        >
          回到开头
        </button>
        <strong aria-live="polite">{beat.title}</strong>
        <time ref={timeRef}>00:00 / 00:11</time>
      </div>
      <div className={`feedback ${beat.feedbackClass}`} role="status" aria-live="polite">{beat.feedback}</div>
      <p className="story-boundary">动画中的候选点数量只是示意；中间筛选结果并不确定。</p>
    </div>
  );
}

export const BenchmarkFunnelStage: React.FC<WidgetProps> = (props) => (
  props.moduleId === 'ana' ? <FunnelAnalogy /> : <FilterMovie />
);

export default BenchmarkFunnelStage;
