import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import './s6-case.css';

type Props = { onComplete: () => void };
const DURATION = 9;
const STEPS = [0, 2, 3.5, 5.5, 7.5, 9];

function MonumentScene({ clear, found = false, compact = false }: { clear: boolean; found?: boolean; compact?: boolean }) {
  return <div className={`s6-scene ${clear ? 'is-clear' : 'is-low'} ${found ? 'is-found' : ''} ${compact ? 'is-compact' : ''}`} role="img" aria-label={found ? '西部城镇远景：小型锥状纪念碑位于画面左上方的山丘背景中' : '西部城镇远景，背景细节尚不清楚'}>
    <svg viewBox="0 0 960 510" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="s6sky" x2="0" y2="1"><stop stopColor="#7ab7dc"/><stop offset=".65" stopColor="#d5e4d9"/><stop offset="1" stopColor="#f1d6a7"/></linearGradient>
        <linearGradient id="s6sand" x2="0" y2="1"><stop stopColor="#d4ae78"/><stop offset="1" stopColor="#a9734e"/></linearGradient>
        <linearGradient id="s6road" x2="0" y2="1"><stop stopColor="#d8b78d"/><stop offset="1" stopColor="#8d5a43"/></linearGradient>
      </defs>
      <rect width="960" height="510" fill="url(#s6sky)"/>
      <g opacity=".55" fill="#fff5df"><path d="M52 93q22-26 57-12 28-18 60 7 17-3 29 13H42z"/><path d="M599 65q34-25 67-5 29-18 54 10 24-4 39 17H582z"/></g>
      <path d="M0 244 58 196 132 213 205 166 275 189 360 151 458 204 527 168 620 201 700 154 777 184 847 148 960 200v96H0Z" fill="#a9a78e"/>
      <path d="M0 272 61 231 136 245 212 221 299 255 399 220 486 251 573 223 679 253 767 212 858 239 960 219v95H0Z" fill="#8c8e76"/>
      <path d="M0 278q106-64 214-34 69-31 129 9 79-25 150 18 111-34 222-10 110-35 245 16v71H0Z" fill="#c7a876"/>
      <path d="M0 300q115-24 204 0 89-19 192 4 90-23 163-4 166-23 401 2v208H0Z" fill="url(#s6sand)"/>
      <path d="M383 306 551 304 960 510H0Z" fill="url(#s6road)"/>
      <path d="M455 314 469 314 505 510h-10Z" fill="#e6c89d" opacity=".65"/>
      <g opacity=".92"><path d="M0 280h244v100H0Z" fill="#a26648"/><path d="m0 279 81-59h130l42 59Z" fill="#754c3c"/><path d="M11 296h225v11H11Z" fill="#e3bb85"/><path d="M23 314h36v48H23zm63 0h36v48H86zm64 0h36v48h-36Z" fill="#533c38"/><path d="M15 373h240v9H15Z" fill="#704536"/><path d="M22 283v98m57-98v98m55-98v98m61-98v98" stroke="#d0a277" strokeWidth="5"/></g>
      <g><path d="M700 264h260v135H700Z" fill="#b87450"/><path d="m676 264 76-62h208v62Z" fill="#734940"/><path d="M723 285h44v79h-44zm74 0h44v79h-44zm75 0h44v79h-44Z" fill="#4d4442"/><path d="M696 278h264m-260 91h260" stroke="#e9be89" strokeWidth="10"/><path d="M709 271v119m66-119v119m78-119v119m68-119v119" stroke="#e1aa72" strokeWidth="5"/></g>
      <path d="M250 320h108v48H250Z" fill="#ba8057"/><path d="m241 320 33-29h74l20 29Z" fill="#775043"/><path d="M583 316h101v53H583Z" fill="#986c57"/><path d="m572 316 29-27h75l20 27Z" fill="#6d5145"/>
      <g stroke="#754f3f" strokeWidth="4"><path d="M0 387h388m186 4h386M39 363v47m52-47v47m53-47v47m55-47v47m54-47v47m55-47v47m54-47v47M626 370v44m61-44v44m61-44v44m61-44v44m61-44v44"/></g>
      <g fill="#66765c"><path d="M296 293q-16-29 0-51 21 24 0 51Zm18 6q-12-21 3-39 16 20-3 39Z"/><path d="M614 299q-15-31 0-53 20 26 0 53Zm20 0q-9-21 4-37 14 17-4 37Z"/></g>
      <g className="s6-monument"><path d="M139 215 150 168 165 215Z" fill="#e0d7bd" stroke="#645c50" strokeWidth="3"/><path d="M132 216h42v7h-42Z" fill="#ccc2a8" stroke="#645c50" strokeWidth="2"/><path d="M143 183h15m-18 12h21m-22 11h25" stroke="#887e6a" strokeWidth="2"/></g>
      <g opacity=".35" stroke="#fff4d7" strokeWidth="2"><path d="M29 456q25-10 50 2m747-12q33-14 70-2M322 420q22-7 46 3"/></g>
    </svg>
    <div className="s6-target-ring" aria-hidden="true"><span>左上方背景</span></div>
    {!compact && <div className="s6-screen-grid" aria-hidden="true"><i/><i/></div>}
  </div>;
}

function SearchTimeline({ phase, time }: { phase: number; time: number }) {
  const focused = phase >= 2;
  return <div className={`s6-time ${focused ? 'is-focused' : ''}`} aria-label={focused ? '观察窗口缩小到 1:00–1:10' : '全视频粗略搜索，候选区间 1:00–1:10'}>
    <div className="s6-time-top"><span>{focused ? '目标窗口' : '全视频搜索'}</span><strong>{focused ? '1:00–1:10' : '0:00 → 全片'}</strong></div>
    <div className="s6-time-track"><div className="s6-time-window"/><div className="s6-time-frames">{Array.from({ length: focused ? 21 : 11 }, (_, i) => <i key={`${focused}-${i}`} />)}</div><div className="s6-time-playhead" style={{ left: focused ? `${Math.min(97, Math.max(3, (time - 3.5) / 4 * 94))}%` : `${Math.min(96, Math.max(3, time / 2 * 94))}%` }}/></div>
    <div className="s6-time-labels"><span>{focused ? '1:00' : '0:00'}</span><span>{focused ? '1:10' : '1:00–1:10 候选'}</span></div>
  </div>;
}

export function S6Search({ onComplete }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const lastRef = useRef(0);
  const done = useRef(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !started) { setStarted(true); if (!media.matches) setPlaying(true); }
    }, { threshold: .25 });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [started]);
  useEffect(() => {
    if (!playing) { lastRef.current = 0; return; }
    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current) {
        const next = Math.min(DURATION, timeRef.current + (now - lastRef.current) / 1000);
        timeRef.current = next; setTime(next);
        if (next >= DURATION) { setPlaying(false); if (!done.current) { done.current = true; onComplete(); } return; }
      }
      lastRef.current = now; raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lastRef.current = 0; };
  }, [playing, onComplete]);
  const phase = time < 2 ? 0 : time < 3.5 ? 1 : time < 5.5 ? 2 : time < 7.5 ? 3 : 4;
  const clear = phase >= 2;
  const found = phase >= 3;
  function jump(next: number) { timeRef.current = next; setTime(next); setPlaying(false); if (next >= DURATION && !done.current) { done.current = true; onComplete(); } }
  return <div className="s6-search" ref={root}>
    <div className="s6-question">目标纪念碑第一次出现时，位于画面的什么位置？</div>
    <div className="s6-stage" data-phase={phase}>
      <MonumentScene clear={clear} found={found} />
      <div className="s6-stage-heading"><span>{phase < 2 ? 'ROUND 1 · 粗略搜索' : 'ROUND 2 · 精细观察'}</span><b>{phase < 2 ? '0.5 FPS · Low' : '2 FPS · Medium'}</b></div>
      <div className="s6-scanline" aria-hidden="true"/>
      {phase >= 1 && phase < 3 && <div className="s6-candidate">候选片段已找到<br/><strong>目标位置仍不明确</strong></div>}
      {phase >= 3 && <div className="s6-discovery"><span>空间证据</span><strong>山丘上的小型锥状纪念碑</strong><b>左上方背景</b></div>}
    </div>
    <SearchTimeline phase={phase} time={time}/>
    <div className="s6-status"><div><span>Planner</span><b>{phase < 2 ? '全片寻找首次出现的片段' : '重看 1:00–1:10'}</b></div><div><span>Observer</span><b>{phase < 1 ? '稀疏扫描中' : phase < 3 ? '候选区间 1:00–1:10' : '确认左上方背景'}</b></div><div className={phase >= 4 ? 's6-stop' : phase >= 1 ? 's6-continue' : ''}><span>Reflector</span><b>{phase < 1 ? '等待证据' : phase < 4 ? '0.3 · 继续观察' : '0.7 · 停止，答案 D'}</b></div></div>
    <div className="s6-controls"><button type="button" onClick={() => { if (time >= DURATION) jump(0); setPlaying(p => !p); }} aria-label={playing ? '暂停演示' : '继续演示'}>{playing ? <Pause size={17}/> : <Play size={17}/>} {playing ? '暂停' : '继续'}</button><button type="button" onClick={() => jump(STEPS.find(step => step > time + .05) ?? DURATION)} aria-label="查看下一步"><StepForward size={17}/> 单步</button><button type="button" onClick={() => { jump(0); if (!reduced) setPlaying(true); }}><RotateCcw size={17}/> 重播</button><span>{Math.round(time)} / {DURATION} 秒</span></div>
  </div>;
}

export function S6Trace({ onComplete }: Props) {
  const [selected, setSelected] = useState(0);
  const rows = [
    { title: 'Round 1', sub: '粗略搜索', plan: '在全片寻找纪念碑首次出现的片段', range: '全视频', setting: '0.5 FPS · Low', evidence: '候选时间区间：1:00–1:10', reflect: '0.3 · 位置证据不足，继续观察' },
    { title: 'Round 2', sub: '精细观察', plan: '沿用候选区间，核实目标的画面位置', range: '1:00–1:10', setting: '2 FPS · Medium', evidence: '山丘上的小型锥状纪念碑位于左上方背景', reflect: '0.7 · 证据足以回答' },
  ];
  function select(index: number) { setSelected(index); if (index === 2) onComplete(); }
  return <div className="s6-trace">
    <div className="s6-trace-nav" aria-label="案例推理阶段">{['Round 1', 'Round 2', 'Final Answer'].map((name, index) => <button type="button" key={name} className={selected === index ? 'active' : selected > index ? 'done' : ''} aria-pressed={selected === index} onClick={() => select(index)}><span>0{index + 1}</span><b>{name}</b><small>{['粗略搜索','精细观察','停止并回答'][index]}</small></button>)}</div>
    <div className="s6-trace-body"><div className="s6-trace-visual"><div className="s6-trace-picture"><MonumentScene compact clear={selected > 0} found={selected > 0}/></div><div className={`s6-trace-range ${selected > 0 ? 'narrow' : ''}`}><span>全片</span><i/><strong>1:00–1:10</strong></div><p>{selected === 0 ? '先得到候选时间，空间位置尚未确定。' : '沿用第一轮的时间线索，再补足画面位置。'}</p></div>
      <div className="s6-trace-detail">{selected < 2 ? <><h4>{rows[selected].title} <span>{rows[selected].sub}</span></h4><dl><div><dt>Planner</dt><dd>{rows[selected].plan}<small>{rows[selected].range} · {rows[selected].setting}</small></dd></div><div><dt>Observer</dt><dd>{rows[selected].evidence}</dd></div><div><dt>Reflector</dt><dd className={selected === 1 ? 'positive' : 'pending'}>{rows[selected].reflect}</dd></div></dl></> : <><h4>Final Answer <span>停止观察</span></h4><div className="s6-final-evidence"><p><b>第一轮</b>锁定 1:00–1:10</p><p><b>第二轮</b>确认左上方背景的纪念碑</p></div><div className="s6-final-answer">D <span>左上方背景</span></div><p className="s6-final-reason">Reflector 置信度 0.7，已有时间与空间证据，因此在第二轮结束。</p></>}</div></div>
  </div>;
}
