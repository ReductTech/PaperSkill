import { useEffect, useRef, useState } from 'react';
import './s4-observer.css';

const ORIGIN = 32 * 60;
const stamp = (second: number) => `${String(Math.floor((ORIGIN + second) / 60)).padStart(2, '0')}:${String(Math.floor((ORIGIN + second) % 60)).padStart(2, '0')}`;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useSceneClock(start: number, end: number, initial: number, auto = false) {
  const [time, setTime] = useState(initial);
  const [playing, setPlaying] = useState(auto && !reducedMotion());
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - previous) / 1000;
      previous = now;
      setTime(current => {
        const next = Math.min(end, current + delta);
        if (next >= end) setPlaying(false);
        return next;
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [end, playing]);
  return { time, playing, setTime, setPlaying,
    toggle: () => { if (time >= end) setTime(start); setPlaying(!playing); },
    replay: () => { setTime(start); setPlaying(true); }
  };
}

type Focus = 'action' | 'location' | 'entrance' | 'approach';

function Scene({ time, focus, compact = false }: { time: number; focus: Focus; compact?: boolean }) {
  const aX = time < 0 ? -30 : time < 4 ? -30 + time * 35 : time < 14 ? 110 + (time - 4) * 24 : 350;
  const bX = time < 48 ? -35 : time < 52 ? -35 + (time - 48) * 110 : 405;
  const reach = time < 14 ? 0 : time < 14.8 ? (time - 14) / .8 : time < 15.2 ? 1 : time < 16 ? 1 - (time - 15.2) / .8 : 0;
  const handX = aX + 42 + reach * 97;
  const handY = 117 + reach * 28;
  const released = time >= 15.2;
  const keyX = released ? 496 : handX + 7;
  const keyY = released ? 145 : handY;
  const actionGlow = focus === 'action' && time >= 12 && time <= 16.3;
  const locationGlow = focus === 'location' && time >= 15.2;
  return <svg className={`s4-scene ${compact ? 'compact' : ''}`} viewBox="0 0 640 230" role="img" aria-label={`${stamp(time)}：${time < 4 ? '人物 A 进入房间，手中持有钥匙' : time < 14 ? '人物 A 持钥匙接近桌子' : time < 15.2 ? '人物 A 将钥匙移向桌面' : time < 16 ? '人物 A 松开钥匙，手部离开' : time < 48 ? '钥匙留在桌面' : '人物 B 走近桌子，钥匙仍在桌面'}`}>
    <rect width="640" height="230" fill="#f7f9fc" />
    <path d="M0 190H640 M28 25V190 M28 25H117V190" fill="none" stroke="#d7deea" strokeWidth="3" />
    <path d="M93 27V186" stroke="#e1e7ef" strokeWidth="3" />
    <rect x="466" y="150" width="146" height="10" rx="4" fill="#8c9bab" />
    <path d="M480 160V226 M598 160V226" stroke="#8c9bab" strokeWidth="7" />
    {focus === 'entrance' && time <= 5 && <rect x="30" y="28" width="163" height="158" rx="15" fill="#f07e47" fillOpacity=".08" stroke="#f07e47" strokeWidth="3" />}
    {focus === 'approach' && time >= 47 && <ellipse cx={bX} cy="131" rx="35" ry="87" fill="#f07e47" fillOpacity=".08" stroke="#f07e47" strokeWidth="3" />}
    <g transform={`translate(${bX} 0)`} opacity={time < 48 ? 0 : 1}>
      <circle cy="73" r="17" fill="#f2d4b9" stroke="#bd9273" strokeWidth="2" />
      <path d="M-13 63Q0 49 13 63" stroke="#5c4850" strokeWidth="8" fill="none" />
      <path d="M0 93V148 M0 111L-27 134 M0 111L27 131 M0 148L-20 187 M0 148L20 187" fill="none" stroke="#c46b37" strokeWidth="13" strokeLinecap="round" />
      <text y="209" textAnchor="middle" fill="#96502b" fontSize="17" fontWeight="800">B</text>
    </g>
    <g opacity={time < 0 ? 0 : 1}>
      <circle cx={aX} cy="72" r="17" fill="#efd0b5" stroke="#bd9273" strokeWidth="2" />
      <path d={`M${aX - 13} 62Q${aX} 47 ${aX + 13} 62`} stroke="#4b5360" strokeWidth="8" fill="none" />
      <path d={`M${aX} 93V148 M${aX} 148L${aX - 19} 187 M${aX} 148L${aX + 20} 187 M${aX - 4} 108L${aX - 27} 132 M${aX + 4} 108L${handX} ${handY}`} fill="none" stroke="#3d75ab" strokeWidth="13" strokeLinecap="round" />
      <circle cx={handX} cy={handY} r="6" fill="#efd0b5" />
      <text x={aX} y="209" textAnchor="middle" fill="#28547e" fontSize="17" fontWeight="800">A</text>
    </g>
    {actionGlow && <circle cx={handX + 8} cy={handY} r="21" fill="#f07e47" fillOpacity=".12" stroke="#f07e47" strokeWidth="2" />}
    {locationGlow && <ellipse cx="508" cy="144" rx="46" ry="21" fill="#f07e47" fillOpacity=".1" stroke="#f07e47" strokeWidth="2" />}
    <g transform={`translate(${keyX} ${keyY})`}>
      <circle r="6" fill="none" stroke="#a56824" strokeWidth="4" />
      <path d="M6 0H27V6H21V0" fill="none" stroke="#a56824" strokeWidth="4" strokeLinejoin="round" />
    </g>
  </svg>;
}

function Playback({ clock, start, end, label, onSeek, marks = [] }: { clock: ReturnType<typeof useSceneClock>; start: number; end: number; label: string; onSeek?: (time: number) => void; marks?: number[] }) {
  return <div className="s4-playback">
    <div className="s4-controls"><button type="button" onClick={clock.toggle}>{clock.playing ? '暂停' : '继续'}</button><button type="button" onClick={clock.replay}>重新播放</button><span>{stamp(clock.time)}</span></div>
    <div className="s4-seek"><label htmlFor={label}>{label}</label><input id={label} type="range" min={start} max={end} step="0.05" value={clock.time} aria-valuetext={stamp(clock.time)} onChange={event => { const next = Number(event.target.value); clock.setPlaying(false); clock.setTime(next); onSeek?.(next); }} />
      <div className="s4-ruler"><span>{stamp(start)}</span>{marks.map(mark => <span key={mark}>{stamp(mark)}</span>)}<span>{stamp(end)}</span></div>
    </div>
  </div>;
}

export function S4Observation({ onComplete }: { onComplete: () => void }) {
  const clock = useSceneClock(12, 18, 12);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !started.current) {
        started.current = true;
        if (!reducedMotion()) clock.setPlaying(true);
      }
    }, { threshold: .25 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const [question, setQuestion] = useState<'action' | 'location'>('action');
  const completed = useRef(false);
  const phase = clock.time < 14 ? 0 : clock.time < 15.2 ? 1 : clock.time < 16 ? 2 : 3;
  useEffect(() => { if (phase === 3 && !completed.current) { completed.current = true; onComplete(); } }, [phase, onComplete]);
  const facts = question === 'action'
    ? ['人物 A 持有钥匙。', '人物 A 的手移动到桌面附近。', '人物 A 松开钥匙，手部正在离开。', '人物 A 松开钥匙，钥匙留在桌上。']
    : ['钥匙仍在人物 A 手中。', '钥匙接近桌面。', '钥匙已接触桌面。', '钥匙最终留在桌上。'];
  const final = question === 'action' ? '人物 A 将钥匙放在桌上。' : '钥匙最终位于桌面。';
  return <div className="s4-lab" ref={root}>
    <p className="s4-intro">Planner 已指定观察原视频 <b>32:12–32:18</b>。Observer 读取这段画面，围绕当前问题寻找动作前后能相互印证的视觉变化。</p>
    <div className="s4-question"><strong>当前问题：{question === 'action' ? '人物 A 是否将钥匙放在桌上？' : '钥匙最终位于哪里？'}</strong><div role="group" aria-label="切换观察目标"><button type="button" className={question === 'action' ? 'selected' : ''} aria-pressed={question === 'action'} onClick={() => { setQuestion('action'); clock.setTime(12); clock.setPlaying(!reducedMotion()); }}>人物 A 做了什么？</button><button type="button" className={question === 'location' ? 'selected' : ''} aria-pressed={question === 'location'} onClick={() => { setQuestion('location'); clock.setTime(14); clock.setPlaying(!reducedMotion()); }}>钥匙最终位于哪里？</button></div></div>
    <div className="s4-observation-grid">
      <div className="s4-video-area"><div className="s4-screen"><Scene time={clock.time} focus={question} /><span>原视频 · {stamp(clock.time)}</span></div><Playback clock={clock} start={12} end={18} label="观察片段进度" marks={[14, 16]} /><div className="s4-keyframes"><b>观察关键帧</b>{[12.5, 14.5, 16.5].map(point => <button type="button" key={point} className={Math.abs(clock.time - point) < .5 ? 'active' : ''} onClick={() => { clock.setTime(point); clock.setPlaying(false); }}><Scene time={point} focus={question} compact /><span>{stamp(point)}</span></button>)}</div></div>
      <div className="s4-evidence-form"><div className="s4-target"><span>观察目标</span><strong>{question === 'action' ? '手部 → 钥匙 → 桌面' : '钥匙 → 最终位置'}</strong><small>{question === 'action' ? '重点观察 32:14–32:16' : '重点观察 32:15–32:18'}</small></div><div className="s4-fact" aria-live="polite"><span>当前观察事实</span><p key={`${question}-${phase}`}>{facts[phase]}</p><div className="s4-phase" aria-hidden="true">{[0, 1, 2].map(index => <i key={index} className={phase > index ? 'done' : ''}/>)}</div></div><div className={`s4-final ${phase === 3 ? 'ready' : ''}`} aria-live="polite"><span>形成的时间戳证据</span>{phase === 3 ? <strong>[32:14, 32:16] {final}</strong> : <p>继续观察钥匙接触、松开与手部离开。</p>}</div></div>
    </div>
    <p className="s4-conclusion">同一段视频会因问题改变视觉重点和提取内容。关键证据来自相关画面的连续变化，而不是对所有可见物体的通用描述。</p>
  </div>;
}

const records = [
  { start: 0, end: 4, text: '人物 A 进入房间。', focus: 'entrance' as Focus, round: 'Round 1' },
  { start: 14, end: 16, text: '人物 A 将钥匙放在桌上。', focus: 'action' as Focus, round: 'Round 2' },
  { start: 48, end: 52, text: '人物 B 走近桌子。', focus: 'approach' as Focus, round: '后续观察' }
];

export function S4EvidenceMemory({ onComplete }: { onComplete: () => void }) {
  const clock = useSceneClock(0, 52, 0);
  const [count, setCount] = useState(1);
  const active = records.findIndex(item => clock.time >= item.start && clock.time <= item.end);
  function seek(time: number) {
    clock.setTime(time);
    clock.setPlaying(false);
    const index = records.findIndex(item => time >= item.start && time <= item.end);
    if (index >= 0 && time >= records[index].end) setCount(current => Math.max(current, index + 1));
  }
  function addRound(index: number) {
    setCount(current => Math.max(current, index + 1));
    seek(records[index].end);
    if (index >= 1) onComplete();
  }
  return <div className="s4-lab">
    <p className="s4-intro">一条证据由原视频时间范围与关键事件描述组成。保留时间位置，后续观察便能直接返回相关画面核对。</p>
    <div className="s4-formula"><strong>E<sup>(r)</sup> = &#123;([start<sub>i</sub>, end<sub>i</sub>], d<sub>i</sub>)&#125;</strong><span><b>start<sub>i</sub> / end<sub>i</sub></b>：原视频起止时间　<b>d<sub>i</sub></b>：事件描述　<b>E<sup>(r)</sup></b>：本轮所得证据集合</span></div>
    <div className="s4-memory-grid"><div className="s4-memory-video"><div className="s4-screen"><Scene time={clock.time} focus={active >= 0 ? records[active].focus : 'location'} /><span>原视频 · {stamp(clock.time)}</span></div><Playback clock={clock} start={0} end={52} label="原视频进度" onSeek={seek} marks={[14, 32, 48]} /><div className="s4-event-track" aria-hidden="true">{records.map((item, index) => <span key={item.start} className={active === index ? 'active' : ''} style={{ left: `${item.start / 52 * 100}%`, width: `${(item.end - item.start) / 52 * 100}%` }} />)}<i style={{ left: `${clock.time / 52 * 100}%` }}/></div><p className="s4-now">当前画面：{clock.time < 4 ? '人物 A 正进入房间。' : clock.time < 14 ? '人物 A 持钥匙走向桌子。' : clock.time < 15.2 ? '人物 A 将钥匙移向桌面。' : clock.time < 16 ? '人物 A 松开钥匙，手部离开。' : clock.time < 48 ? '钥匙留在桌上。' : '人物 B 走近桌子。'}</p></div>
      <div className="s4-memory"><div className="s4-rounds" role="group" aria-label="观察轮次">{records.map((item, index) => <button type="button" key={item.round} className={count === index + 1 ? 'selected' : ''} onClick={() => addRound(index)}>{item.round}</button>)}</div><div className="s4-list" aria-live="polite"><h5>累计证据 · {count} 条</h5>{records.slice(0, count).map((item, index) => <button type="button" key={item.start} className={`${active === index ? 'active' : ''} ${index === count - 1 ? 'newest' : ''}`} onClick={() => { seek(item.end); if (index >= 1) onComplete(); }}><span>{item.round} · [{stamp(item.start)}, {stamp(item.end)}]</span><strong>{item.text}</strong></button>)}</div><p>点击证据回看原视频；拖动进度进入证据区间，记录会随画面突出。先前轮次的记录保留在工作记忆中。</p></div></div>
  </div>;
}
