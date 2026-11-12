import { useEffect, useState } from "react";

export function useLessonPlayback(duration: number) {
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [segmentEnd, setSegmentEnd] = useState<number | null>(null);
  const end = segmentEnd ?? duration;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    function tick(now: number) {
      // The first frame can have been timestamped before this effect started.
      const elapsed = Math.max(0, now - previous);
      previous = now;
      setPosition(value => Math.min(value + elapsed, end));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, playing]);

  useEffect(() => {
    if (position >= end && playing) setPlaying(false);
  }, [end, playing, position]);

  function toggle() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPosition(duration);
      return;
    }
    if (position >= end) setSegmentEnd(null);
    if (position >= duration) setPosition(0);
    setPlaying(true);
  }

  function seek(value: number) {
    setPlaying(false);
    setSegmentEnd(null);
    setPosition(value);
  }

  function playSegment(start: number, finish: number) {
    if (finish <= start || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      seek(finish);
      return;
    }
    setPosition(start);
    setSegmentEnd(finish);
    setPlaying(true);
  }

  return { position, playing, toggle, seek, playSegment, duration };
}

export function PlaybackControls({ playback, label }: { playback: ReturnType<typeof useLessonPlayback>; label: string }) {
  const { position, playing, toggle, seek, duration } = playback;
  return <div className="playback-controls">
    <button type="button" className="lesson-choice" onClick={toggle}>
      {playing ? "暂停" : position >= duration ? "重播" : "播放过程"}
    </button>
    <label><span>{label}</span><input type="range" min="0" max={duration} step="10"
      value={Math.round(position / 10) * 10} onChange={event => seek(Number(event.target.value))} /></label>
    <button type="button" className="text-button" onClick={() => seek(0)}>回到起点</button>
  </div>;
}
