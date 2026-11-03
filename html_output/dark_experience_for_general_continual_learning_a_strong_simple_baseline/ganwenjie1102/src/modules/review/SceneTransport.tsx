import { useEffect, useId, useRef, useState } from "react";
import { useAnimationTimeline, timelineClipTotal, type TimelineClip } from "../../shared/foundation/animation/useAnimationTimeline";
import { useReducedMotion } from "../../shared/foundation/accessibility/useReducedMotion";

export function useSceneTimeline(clips: readonly TimelineClip[], autoPlay = false) {
  const timeline = useAnimationTimeline({ clips, autoPlay });
  const reducedMotion = useReducedMotion();
  const { state } = timeline;
  // All scene navigation uses the same paused-start contract. Reduced motion is
  // owned by the existing timeline and keeps its complete, manually read frames.
  const start = (index: number) => timeline.controls.goToClip(index, { autoPlay: false });
  const atPausedStart = state.status === "paused" && state.elapsedMs === 0;
  const canGoBack = state.hasPrevious || (!reducedMotion && !atPausedStart);
  const previous = () => start(reducedMotion || atPausedStart ? state.clipIndex - 1 : state.clipIndex);
  const next = () => start(state.clipIndex + 1);
  const elapsedSeconds = (clips.slice(0, state.clipIndex).reduce((sum, clip) => sum + timelineClipTotal(clip), 0) + state.elapsedMs) / 1000;
  return { state, elapsedSeconds, reducedMotion, start, previous, next, canGoBack,
    playFrom: (index: number) => timeline.controls.goToClip(index, { autoPlay: true }),
    seek: (index: number, progress: number) => timeline.controls.goToClip(index, { progress, autoPlay: false }),
    reset: () => start(0), toggle: timeline.controls.toggle, complete: timeline.controls.stepForward,
    replay: () => timeline.controls.goToClip(0, { autoPlay: true }) };
}
export type SceneTimeline = ReturnType<typeof useSceneTimeline>;

function StagePicker({ clips, value, onChange, label, matchTrigger = false }: { clips: readonly TimelineClip[]; value: number; onChange: (n: number) => void; label: string; matchTrigger?: boolean }) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(value);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), list = useRef<HTMLDivElement>(null);
  const [menuGeometry, setMenuGeometry] = useState<{ width: number; up: boolean; maxHeight: number } | null>(null);
  const id = useId();
  useEffect(() => {
    if (!open || !matchTrigger) return;
    const measure = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 14, above = rect.top - 14;
      const up = below < (list.current?.scrollHeight ?? clips.length * 48 + 60) && above > below;
      setMenuGeometry({ width: rect.width, up, maxHeight: Math.max(120, Math.min(430, up ? above : below)) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, matchTrigger, clips.length]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => { if (open) list.current?.querySelector<HTMLButtonElement>(`[data-stage-option="${active}"]`)?.focus({ preventScroll: true }); }, [open, active]);
  const choose = (n: number) => { onChange(n); setOpen(false); trigger.current?.focus(); };
  return <div className="motion-stage-picker" ref={root} onKeyDown={e => {
    if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); e.preventDefault(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setActive(open ? (active + (e.key === "ArrowDown" ? 1 : -1) + clips.length) % clips.length : value); setOpen(true); }
    if (open && (e.key === "Home" || e.key === "End")) { e.preventDefault(); setActive(e.key === "Home" ? 0 : clips.length - 1); }
    if (e.key === "Tab") setOpen(false);
  }}>
    <span className="motion-stage-label">阶段</span>
    <button ref={trigger} className="motion-stage-trigger" role="combobox" aria-label={`${label}阶段选择`} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => { setActive(value); setOpen(!open); }}>
      <span className="motion-stage-number">{String(value + 1).padStart(2, "0")}</span><span>{clips[value].id}</span>
      <span className="motion-stage-arrow" aria-hidden="true" />
    </button>
    {/* Synchronised native value for programmatic state inspection; the visible picker owns keyboard interaction. */}
    <select className="motion-stage-value" aria-hidden="true" tabIndex={-1} value={value} onChange={e => { onChange(Number(e.target.value)); setOpen(false); }}>{clips.map((c, i) => <option key={c.id} value={i}>{i + 1}. {c.id}</option>)}</select>
    {open && <div id={id} className="motion-stage-menu" style={matchTrigger ? { width: menuGeometry?.width ?? trigger.current?.getBoundingClientRect().width, maxHeight: menuGeometry?.maxHeight, top: menuGeometry?.up ? "auto" : undefined, bottom: menuGeometry?.up ? "calc(100% + 9px)" : undefined } : undefined} ref={list} role="listbox" aria-label={`${label}阶段`}>
      <div className="motion-stage-menu-title">选择一个阶段<span>{clips.length} 个步骤</span></div>
      {clips.map((c, i) => <button key={c.id} role="option" aria-selected={value === i} data-stage-option={i} tabIndex={active === i ? 0 : -1} onClick={() => choose(i)}>
        <span className="motion-stage-number">{String(i + 1).padStart(2, "0")}</span><span>{c.id}</span><span className="motion-stage-check">{value === i ? "✓" : ""}</span>
      </button>)}
    </div>}
  </div>;
}

export default function SceneTransport({ timeline, clips, label, caption, showTiming = true, teachingProgress = false }: { timeline: SceneTimeline; clips: readonly TimelineClip[]; label: string; caption?: string; showTiming?: boolean; teachingProgress?: boolean }) {
  const { state, reducedMotion, start, previous, next, canGoBack } = timeline;
  const total = clips.reduce((n, c) => n + timelineClipTotal(c), 0);
  const elapsed = clips.slice(0, state.clipIndex).reduce((n, c) => n + timelineClipTotal(c), 0) + state.elapsedMs;
  return <div className="motion-transport" role="group" aria-label={`${label}播放控制`}>
    <div className="motion-progress"><progress max={teachingProgress ? clips.length : total} value={teachingProgress ? state.clipIndex + state.progress : elapsed} aria-label={teachingProgress ? "教学步骤进度" : "整段进度"} /><span data-time-readout>{teachingProgress && <>第 {state.clipIndex + 1}/{clips.length} 步 · 本步 {Math.round(state.progress * 100)}% · </>}{showTiming && <>{(elapsed / 1000).toFixed(1)} / {(total / 1000).toFixed(1)} 秒 · </>}{state.isHolding ? "停留观察" : state.status === "finished" ? "播放结束" : state.status === "playing" ? "播放中" : "已暂停"}</span></div>
    <div className="motion-buttons"><button data-play onClick={timeline.toggle} disabled={reducedMotion && !state.hasNext}>{reducedMotion ? "下一语义步骤" : state.status === "playing" ? "暂停" : state.status === "finished" ? "再次播放" : "播放 / 继续"}</button><button data-back disabled={!canGoBack} onClick={previous}>上一步</button><button data-next disabled={teachingProgress ? state.atEnd : !state.hasNext} onClick={teachingProgress && !state.hasNext ? timeline.complete : next}>{teachingProgress && !state.hasNext ? "完成本步" : "下一步"}</button><button data-replay onClick={timeline.replay}>重播整段</button><StagePicker clips={clips} value={state.clipIndex} onChange={start} label={label} matchTrigger={teachingProgress} /></div>
    <p className="motion-caption">{reducedMotion ? "减少动态：显示每一阶段的完整语义，使用前后步骤阅读。" : caption ?? (teachingProgress ? "选择阶段会停在本步起点；可播放观察，或在最后一步选择“完成本步”查看结果。" : "选择阶段停在起点；上一步先回本阶段起点，再回上一阶段起点。")}</p>
  </div>;
}
