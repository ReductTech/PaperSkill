import { useEffect, useMemo, useState } from 'react';
import { LearningModule } from './LearningModule';
import './segment-focus.css';

const DURATION = 16;
const FRAME_CAP = 32;
type Window = { start: number; end: number; fps: number };
type Phase = '静止' | '伸手' | '接触' | '抓握' | '抬起' | '拿走';
const INITIAL: Window = { start: 0, end: 16, fps: 0.125 };
const densityOptions = [{ name: '稀疏', fps: 0.125 }, { name: '中等', fps: 1 }, { name: '密集', fps: 4 }];
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const smooth = (v: number) => { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x); };
const labelTime = (t: number) => `${t.toFixed(Number.isInteger(t) ? 0 : 2)} 秒`;

// Every live frame and extracted frame is rendered from this one deterministic state.
export function getSceneStateAt(time: number) {
  const t = clamp(time, 0, DURATION);
  const reach = smooth((t - 4.1) / 2.3);
  const lift = smooth((t - 7.7) / 2.2);
  const carry = smooth((t - 9.9) / 2.1);
  const handX = 425 - 119 * reach + 119 * carry;
  const handY = 151 + 23 * reach - 68 * lift - 9 * carry;
  const attached = t >= 7.7;
  const phase: Phase = t < 4.1 ? '静止' : t < 6.4 ? '伸手' : t < 7.15 ? '接触' : t < 7.7 ? '抓握' : t < 9.9 ? '抬起' : '拿走';
  return { time: t, handX, handY, keyX: attached ? handX - 3 : 303, keyY: attached ? handY + 11 : 185, attached, phase };
}

function KeyScene({ time, compact = false }: { time: number; compact?: boolean }) {
  const s = getSceneStateAt(time);
  return <svg className="segment-scene" viewBox="0 0 640 300" role="img" aria-label={`${labelTime(s.time)}：${s.phase}；钥匙${s.attached ? '已离开桌面，随手移动' : '仍在桌面'}`}>
    <rect width="640" height="300" fill="#f5f8fb"/>
    <rect y="246" width="640" height="54" fill="#e9edf3"/>
    <path d="M46 192 H386 L371 207 H62Z" fill="#c89d70"/>
    <path d="M61 207 H372 V217 H61Z" fill="#ad805b"/>
    <path d="M77 217 V284 M354 217 V284" stroke="#916c50" strokeWidth="12" strokeLinecap="round"/>
    <ellipse cx="303" cy="188" rx="39" ry="5" fill="#735c4b" opacity=".16"/>
    <path d="M451 181 Q480 160 517 186 L528 287 H437Z" fill="#6c88a5"/>
    <path d="M470 177 V265" stroke="#56718d" strokeWidth="4"/>
    <circle cx="481" cy="99" r="42" fill="#e6b18b"/>
    <path d="M439 92 Q437 48 482 52 Q527 54 524 94 Q510 67 479 71 Q457 72 439 92Z" fill="#46546a"/>
    <path d="M465 102 h4 M494 102 h4" stroke="#394653" strokeWidth="3" strokeLinecap="round"/>
    <path d="M472 121 Q482 127 491 121" stroke="#8c6157" strokeWidth="2" fill="none"/>
    <path d={`M449 154 Q${(449 + s.handX) / 2} ${Math.max(111, s.handY - 16)} ${s.handX} ${s.handY}`} stroke="#577493" strokeWidth="29" fill="none" strokeLinecap="round"/>
    <circle cx={s.handX} cy={s.handY} r="14" fill="#e6b18b"/>
    <g transform={`translate(${s.keyX} ${s.keyY}) rotate(${s.attached ? -20 : 0})`}>
      <circle cx="-19" cy="0" r="10" fill="none" stroke="#a97831" strokeWidth="5"/>
      <path d="M-9 0 H24 V8 H18 V4 H13 V9 H7 V0" fill="#d4a544" stroke="#926b2b" strokeWidth="1"/>
    </g>
    {s.attached && <path d={`M${s.handX - 12} ${s.handY + 4} q9 9 22 3`} fill="none" stroke="#c88e70" strokeWidth="3" strokeLinecap="round"/>}
    {!compact && <><rect x="16" y="15" width="130" height="32" rx="7" fill="#fff" opacity=".94"/><text x="28" y="37" fontSize="16" fontWeight="700" fill="#27446e">{labelTime(s.time)} · {s.phase}</text></>}
  </svg>;
}

function sampleFrames(plan: Window) {
  const requested = Math.ceil((plan.end - plan.start) * plan.fps);
  const count = Math.min(FRAME_CAP, requested);
  // Teaching approximation: uniformly spaced midpoint frames, with count proportionally capped.
  return { requested, times: Array.from({ length: count }, (_, i) => Number((plan.start + (i + .5) * (plan.end - plan.start) / count).toFixed(4))) };
}

function observe(times: number[]) {
  const phases = new Set(times.map(t => getSceneStateAt(t).phase));
  const complete = phases.has('接触') && phases.has('抓握') && phases.has('抬起');
  const partial = ['接触', '抓握', '抬起'].some(p => phases.has(p as Phase));
  return complete
    ? '实际采样帧覆盖接触、抓握和抬起，新增画面支持“人物拿起钥匙”的判断；仍不能保证识别正确。'
    : partial ? '只采到动作的局部阶段，现有帧未完整覆盖抓握动作。'
    : '现有帧未完整覆盖抓握动作。';
}

function displayFrames(times: number[]) {
  if (times.length <= 6) return times;
  // Keep actual sampled moments from each visible action phase, including brief contact/grasp.
  const chosen = new Set<number>([0, times.length - 1]);
  for (const phase of ['伸手', '接触', '抓握', '抬起'] as Phase[]) {
    const index = times.findIndex(t => getSceneStateAt(t).phase === phase);
    if (index >= 0) chosen.add(index);
  }
  for (let i = 1; chosen.size < 6 && i < times.length - 1; i++) {
    chosen.add(Math.round(i * (times.length - 1) / 6));
  }
  return [...chosen].sort((a, b) => a - b).slice(0, 6).map(i => times[i]);
}

export function SegmentFocusLesson({ onComplete }: { onComplete: () => void }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [plan, setPlan] = useState<Window>(INITIAL);
  const [observed, setObserved] = useState<Window | null>(null);
  const first = useMemo(() => sampleFrames(INITIAL), []);
  const current = observed ? sampleFrames(observed) : first;
  const visible = displayFrames(current.times);
  const verdict = observe(current.times);
  const dirty = plan.start !== (observed ?? INITIAL).start || plan.end !== (observed ?? INITIAL).end || plan.fps !== (observed ?? INITIAL).fps;

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const id = window.setInterval(() => { const now = performance.now(); const delta = Math.min((now - last) / 1000, .1); last = now; setTime(t => t + delta >= DURATION ? 0 : t + delta); }, 50);
    return () => window.clearInterval(id);
  }, [playing]);

  const setStart = (start: number) => setPlan(p => ({ ...p, start: clamp(start, 0, p.end - .5) }));
  const setEnd = (end: number) => setPlan(p => ({ ...p, end: clamp(end, p.start + .5, DURATION) }));
  const run = () => { setObserved({ ...plan }); onComplete(); };

  return <div className="segment-lesson">
    <LearningModule number="5.1" title="重新观察关键动作">
      <p className="segment-intro">候选片段已找到，但稀疏帧没拍全抓握过程。Reasoner 可调整同一连续区间的观察窗口与密度，让工具从原视频重新取帧，供 Observer 提取新证据。</p>
      <div className="segment-workspace">
        <div className="segment-video"><div className="segment-column-head"><strong>连续源画面</strong><span>{labelTime(time)} / 16 秒</span></div><KeyScene time={time}/><div className="segment-playback"><button className="button-outline" type="button" onClick={() => setPlaying(v => !v)}>{playing ? '暂停' : '播放动作'}</button><input type="range" min="0" max="16" step="0.05" value={time} aria-label="连续画面播放位置" onChange={e => { setPlaying(false); setTime(Number(e.target.value)); }}/></div></div>
        <div className="segment-observer"><div className="segment-column-head"><strong>Observer 当前可见采样帧</strong><span>展示 {visible.length} 帧 / 实际采样 {current.times.length} 帧</span></div><div className="segment-frames">{visible.map(t => { const phase = getSceneStateAt(t).phase; const addedEvidence = observed && !first.times.some(old => Math.abs(old - t) < .001) && (phase === '接触' || phase === '抓握' || phase === '抬起'); return <figure className={`segment-frame${addedEvidence ? ' added' : ''}`} key={t}><KeyScene time={t} compact/><figcaption><b>{labelTime(t)}</b><span>{phase}</span>{addedEvidence && <em>新增证据</em>}</figcaption></figure>; })}</div><p className="segment-verdict" role="status" aria-live="polite"><strong>{observed ? '重新观察' : '首次观察'}：</strong>{verdict}</p></div>
      </div>
      <div className="segment-controls"><div className="segment-control-heading"><strong>调整观察</strong><span>当前画廊对应 {labelTime((observed ?? INITIAL).start)}–{labelTime((observed ?? INITIAL).end)} · {(observed ?? INITIAL).fps} FPS{dirty ? '；设置待重新观察' : ''}</span></div><div className="segment-presets" aria-label="观察时间范围">{[[0,16],[4,12],[6,10],[0,4],[12,16]].map(([start,end]) => <button type="button" key={`${start}-${end}`} aria-pressed={plan.start === start && plan.end === end} onClick={() => setPlan(p => ({ ...p, start, end }))}>{start}–{end} 秒</button>)}</div><div className="segment-sliders"><label>开始 <output>{labelTime(plan.start)}</output><input aria-label="观察开始时间" type="range" min="0" max={plan.end - .5} step="0.25" value={plan.start} onChange={e => setStart(Number(e.target.value))}/></label><label>结束 <output>{labelTime(plan.end)}</output><input aria-label="观察结束时间" type="range" min={plan.start + .5} max="16" step="0.25" value={plan.end} onChange={e => setEnd(Number(e.target.value))}/></label></div><div className="segment-control-bottom"><fieldset className="segment-density"><legend>采样密度</legend>{densityOptions.map(option => <label key={option.name}><input type="radio" name="segment-density" checked={plan.fps === option.fps} onChange={() => setPlan(p => ({ ...p, fps: option.fps }))}/><span>{option.name} <small>{option.fps} FPS</small></span></label>)}</fieldset><button className="button-primary" type="button" onClick={run} disabled={!dirty}>重新观察</button></div></div>
      <p className="segment-outro">更密集的时间采样可能补足局部动作证据，但不保证识别正确。</p>
    </LearningModule>
  </div>;
}
