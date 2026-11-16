import { useEffect, useMemo, useRef, useState } from 'react';
import './s1-visual-labs.css';

const DURATION = 8;
const START = 3.55;
const END = 4.2;
const stamp = (t: number) => `${t.toFixed(1)}s`;
const position = (t: number) => `${t / DURATION * 100}%`;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useClock() {
  const [time, setTime] = useState(reduced() ? 3.9 : 2.4);
  const [playing, setPlaying] = useState(!reduced());
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(.1, (now - previous) / 1000);
      previous = now;
      setTime(current => current + delta >= 4.8 ? 2.4 : current + delta);
    }, 40);
    return () => window.clearInterval(timer);
  }, [playing]);
  return { time, playing, setPlaying, setTime };
}

function KeyCloseup({ time, mode = 'action' }: { time: number; mode?: 'action' | 'entrance' | 'location' }) {
  if (mode === 'entrance') return <svg className="s1v-closeup" viewBox="0 0 420 210" role="img" aria-label="入口近景：橙衣人物 B 先进入房间"><rect width="420" height="210" fill="#edf3f8"/><path d="M70 10V204H226V10Z" fill="#fff" stroke="#9aabbc" strokeWidth="7"/><path d="M210 12V200" stroke="#50647a" strokeWidth="8"/><circle cx="173" cy="75" r="29" fill="#efc6a6" stroke="#9c705c" strokeWidth="3"/><path d="M147 63q25-30 52 0" fill="none" stroke="#39445a" strokeWidth="13"/><path d="M173 108V190 M173 135L118 161 M173 135L225 159" stroke="#c46b37" strokeWidth="33" strokeLinecap="round"/><path d="M0 204H420" stroke="#90a2b5" strokeWidth="7"/><text x="283" y="90" fill="#a75a2f" fontSize="25" fontWeight="800">B 先进入</text></svg>;
  if (mode === 'location') return <svg className="s1v-closeup" viewBox="0 0 420 210" role="img" aria-label="桌面近景：钥匙最终留在桌上"><rect width="420" height="210" fill="#edf3f8"/><path d="M24 150H394" stroke="#64778a" strokeWidth="21" strokeLinecap="round"/><path d="M54 161V210 M365 161V210" stroke="#64778a" strokeWidth="11"/><circle cx="196" cy="126" r="22" fill="none" stroke="#d7782e" strokeWidth="11"/><path d="M218 126H310V145H289V126" fill="none" stroke="#d7782e" strokeWidth="11" strokeLinejoin="round"/><ellipse cx="238" cy="160" rx="94" ry="10" fill="#a5b4c3" opacity=".4"/></svg>;
  const visible = time >= 1.9;
  const progress = Math.max(0, Math.min(1, (time - 3.45) / .67));
  const released = time >= 4.12;
  const handX = released ? 140 : 172 + progress * 87;
  const handY = released ? 106 : 90 + progress * 36;
  const keyX = released ? 267 : handX + 11;
  const keyY = released ? 139 : handY + 3;
  return <svg className="s1v-closeup" viewBox="0 0 420 210" role="img" aria-label={`${stamp(time)}：${!visible ? '桌面尚无钥匙' : released ? '钥匙已放在桌上' : progress ? '人物 A 正将钥匙移向桌面' : '人物 A 手中持有钥匙'}`}>
    <rect width="420" height="210" fill="#edf3f8"/>
    <path d="M229 149H414" stroke="#64778a" strokeWidth="18" strokeLinecap="round"/><path d="M254 160V210 M392 160V210" stroke="#64778a" strokeWidth="9"/>
    {visible && <><circle cx="73" cy="55" r="30" fill="#efc6a6" stroke="#9c705c" strokeWidth="3"/><path d="M45 46q28-33 56 0" fill="none" stroke="#34475e" strokeWidth="13"/><path d="M73 88V208 M73 115L28 165 M73 115L145 105" stroke="#356b9c" strokeWidth="31" strokeLinecap="round"/><path d={`M146 105L${handX} ${handY}`} stroke="#efc6a6" strokeWidth="17" strokeLinecap="round"/><circle cx={handX} cy={handY} r="9" fill="#efc6a6"/><g transform={`translate(${keyX} ${keyY})`}><circle r="12" fill="none" stroke="#d7782e" strokeWidth="7"/><path d="M12 0H63V13H50V0" fill="none" stroke="#d7782e" strokeWidth="7" strokeLinejoin="round"/></g></>}
    {time >= START && time <= END && <path d="M197 55Q266 20 318 75" fill="none" stroke="#f07e47" strokeWidth="5" strokeDasharray="9 8"/>}
  </svg>;
}

function Timeline({ time, samples }: { time?: number; samples?: number[] }) {
  return <div className="s1v-timeline"><div className="s1v-track"><span className="s1v-event" style={{ left: position(START), width: `${(END - START) / DURATION * 100}%` }} />{samples?.map(t => <i key={t} className={`s1v-tick ${t >= START && t <= END ? 'hit' : ''}`} style={{ left: position(t) }} title={stamp(t)} />)}{time !== undefined && <span className="s1v-playhead" style={{ left: position(time) }} />}</div><div className="s1v-axis"><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span></div></div>;
}

export function SamplingLab({ onComplete }: { onComplete: () => void }) {
  const clock = useClock();
  const [fps, setFps] = useState(.5);
  const [offset, setOffset] = useState(.4);
  const samples = useMemo(() => { const result: number[] = []; for (let n = 0; offset + n / fps <= DURATION; n++) result.push(Number((offset + n / fps).toFixed(3))); return result; }, [fps, offset]);
  const hit = samples.some(t => t >= START && t <= END);
  const before = samples.filter(t => t < START).at(-1);
  const after = samples.find(t => t > END);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = strip.current;
    if (!target) return;
    const index = Math.max(0, samples.findIndex(t => t >= START) - 1);
    const frame = target.querySelector('.s1v-frame') as HTMLElement | null;
    target.scrollLeft = index * ((frame?.offsetWidth ?? 150) + 9);
  }, [samples]);
  return <div className="s1v-lab"><p className="s1v-prompt">关键动作可能恰好落在两次采样之间。</p>
    <div className="s1v-action"><KeyCloseup time={clock.time}/><span className="s1v-time">原视频 · {stamp(clock.time)}</span></div>
    <div className="s1v-track-title"><b>8 秒视频</b><span>橙色：放钥匙动作　蓝线：采样</span></div><Timeline time={clock.time} samples={samples}/>
    <div className={`s1v-feedback ${hit ? 'covered' : 'missed'}`} aria-live="polite">{hit ? '采到了动作画面' : '动作落在采样间隔中'} <small>{samples.length} 张采样帧</small></div>
    <div className="s1v-frame-strip" ref={strip}>{samples.flatMap(t => {
      const frame = <div className={`s1v-frame ${t >= START && t <= END ? 'hit' : ''}`} key={t}><KeyCloseup time={t}/><span>{stamp(t)}{t >= START && t <= END ? ' · 动作' : ''}</span></div>;
      return !hit && before === t && after !== undefined ? [frame, <div className="s1v-gap" key="gap"><span>动作发生</span><b>但没有采样帧</b></div>] : [frame];
    })}</div>
    <div className="s1v-controls"><button type="button" onClick={() => clock.setPlaying(!clock.playing)}>{clock.playing ? '暂停' : '播放'}</button><fieldset><legend>采样 FPS</legend>{[.5,1,2,5].map(value => <button type="button" className={fps === value ? 'selected' : ''} aria-pressed={fps === value} key={value} onClick={() => { setFps(value); onComplete(); }}>{value}</button>)}</fieldset><label>采样偏移 <strong>{stamp(offset)}</strong><input type="range" min="0" max="1.5" step="0.1" value={offset} onChange={e => { setOffset(Number(e.target.value)); onComplete(); }}/></label></div>
  </div>;
}

const questions = [
  { label:'谁最先进入房间？', mode:'entrance' as const, time:1.1, start:.65, end:1.65, result:'B 先进入房间' },
  { label:'谁把钥匙放在桌上？', mode:'action' as const, time:4.18, start:3.55, end:4.2, result:'A 将钥匙放在桌上' },
  { label:'钥匙最后在哪里？', mode:'location' as const, time:7.2, start:4.3, end:8, result:'钥匙留在桌上' }
];
export function QuestionLab({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState(0);
  const item = questions[selected];
  return <div className="s1v-lab"><p className="s1v-prompt">同一段视频，不同问题需要不同的关键证据。</p><div className="s1v-question-layout"><div className="s1v-event-map"><div className="s1v-event-line"/>{questions.map((q,i) => <div className={`s1v-event-item ${i === selected ? 'selected' : ''}`} key={q.mode}><span>{stamp(q.time)}</span><b>{i === 0 ? '人物进入' : i === 1 ? '放下钥匙' : '钥匙位置'}</b></div>)}</div><div className="s1v-evidence-view"><KeyCloseup mode={item.mode} time={item.time}/><div className="s1v-evidence-caption"><span>{stamp(item.start)}–{stamp(item.end)} · 关注区域</span><strong>{item.result}</strong></div></div></div><div className="s1v-question-controls" role="group" aria-label="选择问题">{questions.map((q,i) => <button type="button" key={q.label} className={i === selected ? 'selected' : ''} aria-pressed={i === selected} onClick={() => { setSelected(i); onComplete(); }}>{q.label}</button>)}</div></div>;
}
