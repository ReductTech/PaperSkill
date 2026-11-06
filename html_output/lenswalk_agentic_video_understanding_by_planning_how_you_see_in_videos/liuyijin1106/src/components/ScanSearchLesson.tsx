import { useEffect, useMemo, useRef, useState } from 'react';
import './scan-search.css';

const DURATION = 300;
const RED_START = 166;
const RED_END = 168;
const PER_SLICE_CAP = 30;
const TOTAL_CAP = 180;
const FPS_OPTIONS = [0.1, 0.25, 0.5] as const;
type Phase = 'ready' | 'searching' | 'summary';
type Slice = { index: number; start: number; end: number; requested: number; times: number[]; hit: number | null };
const mmss = (seconds: number) => {
  const tenths = Math.floor(seconds * 10 + 1e-8);
  const whole = Math.floor(tenths / 10);
  const decimal = tenths % 10;
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}${decimal ? `.${decimal}` : ''}`;
};
const hasRedCar = (time: number) => time >= RED_START && time < RED_END;

/** Evenly spaced midpoint frames are a teaching approximation, not the authors' decoder. */
function makeSlices(count: number, fps: number): Slice[] {
  const duration = DURATION / count;
  const requested = Array.from({ length: count }, () => Math.ceil(duration * fps));
  const capped = requested.map(value => Math.min(value, PER_SLICE_CAP));
  const sum = capped.reduce((a, b) => a + b, 0);
  const scale = Math.min(1, TOTAL_CAP / sum);
  const base = capped.map(value => Math.floor(value * scale));
  let spare = Math.min(TOTAL_CAP, sum) - base.reduce((a, b) => a + b, 0);
  capped.map((value, index) => ({ index, remainder: value * scale - base[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach(({ index }) => { if (spare > 0 && base[index] < capped[index]) { base[index]++; spare--; } });
  return base.map((frameCount, index) => {
    const start = index * duration;
    const end = (index + 1) * duration;
    const times = Array.from({ length: frameCount }, (_, frame) => start + (frame + 0.5) * duration / frameCount);
    return { index, start, end, requested: requested[index], times, hit: times.find(hasRedCar) ?? null };
  });
}

function RoadScene({ time, compact = false }: { time: number; compact?: boolean }) {
  const sceneTime = Math.floor(time * 10 + 1e-8) / 10;
  const red = hasRedCar(sceneTime);
  const redX = 25 + (sceneTime - RED_START) * 245;
  const blueX = ((sceneTime * 11 + 70) % 820) - 110;
  const creamX = 660 - ((sceneTime * 7 + 40) % 820);
  const sunX = 480 + Math.sin(sceneTime / 90) * 46;
  return <svg className="scan-scene" viewBox={compact ? '0 0 640 260' : '0 55 640 200'} role="img" aria-label={`${mmss(sceneTime)} 的道路画面；${red ? '红色汽车在道路上' : '未见红色汽车'}`}>
    <rect width="640" height="260" fill="#dcebf3"/>
    <circle cx={sunX} cy="42" r="20" fill="#fff4cc"/>
    <path d="M0 145 Q140 107 275 138 T640 131 V180 H0Z" fill="#d4e3df"/>
    <rect x="48" y="75" width="80" height="92" fill="#b6c6d3"/><rect x="60" y="92" width="14" height="21" fill="#eaf3f8"/><rect x="87" y="92" width="14" height="21" fill="#eaf3f8"/><rect x="60" y="123" width="14" height="20" fill="#eaf3f8"/><rect x="87" y="123" width="14" height="20" fill="#eaf3f8"/>
    <rect x="383" y="87" width="115" height="81" fill="#c3c9d1"/><rect x="397" y="103" width="18" height="20" fill="#edf3f5"/><rect x="429" y="103" width="18" height="20" fill="#edf3f5"/><rect x="461" y="103" width="18" height="20" fill="#edf3f5"/>
    <path d="M0 169 H640 V260 H0Z" fill="#737f8d"/><path d="M0 173 H640 M0 251 H640" stroke="#e9e5dc" strokeWidth="4"/>
    <path d="M15 211 h58 m62 0 h58 m62 0 h58 m62 0 h58 m62 0 h58 m62 0 h58" stroke="#f5f3e9" strokeWidth="4" strokeDasharray="42 22"/>
    <g transform={`translate(${blueX} 178)`}><path d="M5 24 L15 8 H64 L80 24 V45 H0 V27Z" fill="#426d92"/><path d="M22 11 H58 L67 23 H13Z" fill="#c6dce9"/><circle cx="18" cy="44" r="8" fill="#263c50"/><circle cx="63" cy="44" r="8" fill="#263c50"/></g>
    <g transform={`translate(${creamX} 216) scale(.86)`}><path d="M5 24 L17 8 H65 L80 24 V44 H0 V26Z" fill="#d8c5a1"/><path d="M23 11 H59 L67 23 H14Z" fill="#eaf0ec"/><circle cx="18" cy="43" r="8" fill="#3b4349"/><circle cx="63" cy="43" r="8" fill="#3b4349"/></g>
    {red && <g transform={`translate(${redX} 178)`}><path d="M5 24 L16 7 H65 L81 24 V45 H0 V27Z" fill="#d84b4b"/><path d="M22 10 H59 L68 23 H13Z" fill="#d7e8ed"/><path d="M6 27 H76" stroke="#aa333d" strokeWidth="2"/><circle cx="18" cy="44" r="8" fill="#2e3943"/><circle cx="64" cy="44" r="8" fill="#2e3943"/></g>}
    {!compact && <><rect x="10" y="10" width="72" height="26" rx="5" fill="#ffffffdd"/><text x="19" y="28" fill="#27446e" fontSize="15" fontWeight="700">{mmss(time)}</text></>}
  </svg>;
}

// Playback maps wall time linearly to video time; sampling still uses video seconds.
const PREVIEW_SECONDS = 10;
function representativeTimes(slice: Slice) {
  if (slice.times.length <= 6) return slice.times;
  const indices = Array.from({ length: 6 }, (_, i) => Math.round(i * (slice.times.length - 1) / 5));
  const hitIndex = slice.times.findIndex(hasRedCar);
  if (hitIndex >= 0 && !indices.includes(hitIndex)) {
    const nearest = indices.reduce((best, value, position) => Math.abs(value - hitIndex) < Math.abs(indices[best] - hitIndex) ? position : best, 0);
    indices[nearest] = hitIndex;
    indices.sort((a, b) => a - b);
  }
  return indices.map(index => slice.times[index]);
}

export function ScanSearchLesson({ onComplete }: { onComplete: () => void }) {
  const [sliceCount, setSliceCount] = useState(6);
  const [fps, setFps] = useState<number>(0.25);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [completed, setCompleted] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const generation = useRef(0);
  const timers = useRef<number[]>([]);
  const firstCandidateShown = useRef(false);
  const labRef = useRef<HTMLDivElement>(null);
  const previewStarted = useRef(false);
  const slices = useMemo(() => makeSlices(sliceCount, fps), [sliceCount, fps]);
  const selected = slices[selectedIndex];
  const frames = representativeTimes(selected);
  const hits = slices.filter(slice => slice.hit !== null);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !previewStarted.current && !reduced()) {
        previewStarted.current = true;
        setPlaying(true);
      }
    }, { threshold: 0.2 });
    if (labRef.current) observer.observe(labRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || reduced()) return;
    const start = performance.now() - time / DURATION * PREVIEW_SECONDS * 1000;
    let frame = 0;
    const tick = (now: number) => {
      const videoTime = Math.min(DURATION, (now - start) / (PREVIEW_SECONDS * 1000) * DURATION);
      setTime(videoTime);
      if (videoTime >= DURATION) setPlaying(false);
      else frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); generation.current++; }, []);

  function resetRun() {
    generation.current++;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    firstCandidateShown.current = false;
    setPhase('ready');
    setCompleted(0);
  }
  function changeCount(count: number) { resetRun(); setSliceCount(count); setSelectedIndex(0); }
  function changeFps(value: number) { resetRun(); setFps(value); }
  function run() {
    resetRun();
    setPlaying(false);
    if (reduced()) {
      setCompleted(sliceCount);
      setPhase('summary');
      setSelectedIndex(hits[0]?.index ?? 0);
      onComplete();
      return;
    }
    const token = generation.current;
    const schedule = (delay: number, callback: () => void) => timers.current.push(window.setTimeout(() => { if (generation.current === token) callback(); }, delay));
    setPhase('searching'); // All slices start independently; delays only stage the teaching display.
    slices.forEach((slice, index) => schedule(650 + index * 220, () => {
      setCompleted(index + 1);
      if (slice.hit !== null && !firstCandidateShown.current) {
        firstCandidateShown.current = true;
        setSelectedIndex(index);
      }
    }));
    schedule(650 + sliceCount * 220 + 250, () => { setPhase('summary'); onComplete(); });
  }

  const resultVisible = phase === 'summary';
  const selectedObserved = resultVisible || (phase === 'searching' && selectedIndex < completed);
  return <div className="lab-card scan-lab" ref={labRef}>
    <p className="scan-intro">在一段长视频中寻找红色汽车。Scan Search 将观察范围划分为多个片段，分别采样检查，再汇总候选时间区域。</p>

    <div className="scan-video-head"><strong>原始视频 · 00:00–05:00</strong><span>{mmss(time)} / 05:00 · 10 秒预览</span></div>
    <RoadScene time={time}/>
    <div className="scan-playback"><button type="button" className="button-outline" onClick={() => { if (!playing && time >= DURATION) setTime(0); setPlaying(value => !value); }}>{playing ? '暂停' : '播放'}</button><div className="scan-scrubber"><input type="range" min="0" max={DURATION} step="0.1" value={time} aria-label="原始视频时间" onChange={event => { setPlaying(false); setTime(Number(event.target.value)); }}/>{phase !== 'ready' && slices.slice(1).map(slice => <i key={slice.index} className="scan-boundary" style={{ left: `${slice.start / DURATION * 100}%` }} aria-hidden="true"/>)}</div></div>

    <div className="scan-workbench">
      <div className="scan-controls"><fieldset><legend>分片</legend>{[4, 6, 8].map(count => <label key={count}><input type="radio" name="scan-slices" checked={sliceCount === count} onChange={() => changeCount(count)}/>{count} 片</label>)}</fieldset><fieldset><legend>采样率</legend>{FPS_OPTIONS.map(option => <label key={option}><input type="radio" name="scan-fps" checked={fps === option} onChange={() => changeFps(option)}/>{option} FPS</label>)}</fieldset><button type="button" className="button-primary" onClick={run}>开始搜索</button></div>
      <p className="scan-budget">0.25 FPS 为论文实验默认值；其他速率用于教学比较。每片最多 30 帧，单次最多 180 帧。当前实际采样 {slices.reduce((sum, slice) => sum + slice.times.length, 0)} 帧。</p>
      <div className="scan-slices" aria-label="分片搜索概览">{slices.map(slice => {
        const observed = resultVisible || (phase === 'searching' && slice.index < completed);
        const status = observed ? slice.hit !== null ? '发现候选' : '已完成' : phase === 'searching' ? '观察中' : '待观察';
        return <button type="button" key={slice.index} className={`scan-slice ${selectedIndex === slice.index ? 'selected' : ''} ${observed && slice.hit !== null ? 'candidate' : ''}`} onClick={() => setSelectedIndex(slice.index)} aria-pressed={selectedIndex === slice.index} aria-label={`第 ${slice.index + 1} 片，${mmss(slice.start)} 至 ${mmss(slice.end)}，${status}`}><b>片 {slice.index + 1}</b><span>{mmss(slice.start)}–{mmss(slice.end)}</span><small>{status}</small></button>;
      })}</div>

      <div className="scan-gallery" aria-live="polite"><div className="scan-gallery-head"><strong>片 {selected.index + 1} · 采样观察</strong><span>展示 {frames.length} 张代表帧 / 实际采样 {selected.times.length} 帧{selected.requested > selected.times.length ? ' · 已按帧预算缩减' : ''}</span></div><div className="scan-frame-strip" aria-label={`第 ${selected.index + 1} 片的代表采样画面`}>{frames.map(sampleTime => <div className={`scan-frame ${selectedObserved && hasRedCar(sampleTime) ? 'target-frame' : ''}`} key={sampleTime}><RoadScene time={sampleTime} compact/><span>{mmss(sampleTime)}</span></div>)}</div><p className={`scan-observation ${selectedObserved && selected.hit !== null ? 'found' : ''}`}>{selectedObserved ? selected.hit !== null ? `模拟 Observer：在 ${mmss(selected.hit)} 的实际采样帧发现红色汽车；候选区域 ${mmss(selected.start)}–${mmss(selected.end)}。` : '模拟 Observer：实际采样帧中未见红色汽车。' : phase === 'searching' ? '各片独立观察中，可并行处理。' : '等待搜索；可先切换分片查看预设采样帧。'}</p></div>
    </div>
    {resultVisible && <div className="scan-result"><p className="scan-summary" role="status">{hits.length ? `按时间顺序汇总给 Reasoner：候选区域 ${hits.map(slice => `${mmss(slice.start)}–${mmss(slice.end)}`).join('、')}。结果只用于后续核查，不能精确定位首次出现时刻。` : '本次稀疏采样未发现目标，不能据此断定原视频中不存在目标。'}</p></div>}
  </div>;
}
