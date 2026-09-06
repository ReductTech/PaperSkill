import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { TimelineController } from './useTimeline';
import type { PlaybackRate, TimelinePhase } from './types';

interface TimelineControlsProps {
  timeline: TimelineController;
  phases?: TimelinePhase[];
  label?: string;
}

function formatClock(progress: number, durationMs: number): string {
  const elapsedSeconds = (progress * durationMs) / 1_000;
  const totalSeconds = durationMs / 1_000;
  return `${elapsedSeconds.toFixed(1)} / ${totalSeconds.toFixed(1)} s`;
}

export function TimelineControls({
  timeline,
  phases = [],
  label = '动画时间轴',
}: TimelineControlsProps) {
  const reducedTimers = useRef<number[]>([]);
  const [reducedPlaying, setReducedPlaying] = useState(false);
  const playing = timeline.status === 'playing' || reducedPlaying;
  const rangeStyle = { '--timeline-progress': `${timeline.progress * 100}%` } as CSSProperties;
  const clearReducedPlayback = () => {
    reducedTimers.current.forEach((timer) => window.clearTimeout(timer));
    reducedTimers.current = [];
    setReducedPlaying(false);
  };
  const scheduleReducedPlayback = (fromProgress: number) => {
    clearReducedPlayback();
    const targets = [...new Set([...phases.map((phase) => phase.end), 1])]
      .filter((target) => target > fromProgress + 0.0001)
      .sort((left, right) => left - right);
    if (targets.length === 0) return;
    setReducedPlaying(true);
    reducedTimers.current = targets.map((target, index) => window.setTimeout(() => {
      timeline.seek(target);
      if (index === targets.length - 1) {
        reducedTimers.current = [];
        setReducedPlaying(false);
      }
    }, (index + 1) * 220));
  };
  const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const play = () => prefersReducedMotion() && phases.length > 0
    ? scheduleReducedPlayback(timeline.progress)
    : timeline.play();
  const pause = () => {
    clearReducedPlayback();
    timeline.pause();
  };
  const replay = () => {
    if (prefersReducedMotion() && phases.length > 0) {
      timeline.seek(0);
      scheduleReducedPlayback(0);
    } else timeline.replay();
  };
  const pauseBeforeDrag = (event: PointerEvent<HTMLInputElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pause();
  };

  useEffect(() => () => {
    reducedTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <div className="timeline-controls" aria-label={label}>
      <button
        className="timeline-icon-button"
        type="button"
        aria-label={playing ? '暂停动画' : '播放动画'}
        title={playing ? '暂停' : '播放'}
        onClick={playing ? pause : play}
      >
        <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
      </button>
      <button
        className="timeline-icon-button"
        type="button"
        aria-label="从头重播动画"
        title="重播"
        onClick={replay}
      >
        <span aria-hidden="true">↻</span>
      </button>

      <div className="timeline-track-wrap">
        <input
          className="timeline-range"
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={timeline.progress}
          style={rangeStyle}
          aria-label={`${label}进度`}
          aria-valuetext={`${Math.round(timeline.progress * 100)}%`}
          onPointerDown={pauseBeforeDrag}
          onChange={(event) => {
            clearReducedPlayback();
            timeline.seek(Number(event.currentTarget.value));
          }}
        />
        <div className="timeline-phase-markers" aria-hidden="true">
          {phases.slice(1).map((phase) => (
            <i key={phase.id} style={{ left: `${phase.start * 100}%` }} />
          ))}
        </div>
      </div>

      <output className="timeline-clock" aria-live="off">
        {formatClock(timeline.progress, timeline.durationMs)}
      </output>

      <label className="timeline-rate">
        <span className="sr-only">播放速度</span>
        <select
          value={timeline.playbackRate}
          aria-label="播放速度"
          title="播放速度"
          onChange={(event) => timeline.setPlaybackRate(Number(event.target.value) as PlaybackRate)}
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
        </select>
      </label>
    </div>
  );
}
