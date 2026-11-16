import { useEffect, useMemo, useState } from 'react';
import './s1-video-lab.css';

const DURATION = 8;
const EVENT_START = 3.55;
const EVENT_END = 4.2;
const pct = (time: number) => `${time / DURATION * 100}%`;
const stamp = (time: number) => `${time.toFixed(1)}s`;

function useVideoClock(start = 0) {
  const [time, setTime] = useState(start);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - previous) / 1000;
      previous = now;
      setTime(current => {
        const next = Math.min(DURATION, current + delta);
        if (next >= DURATION) setPlaying(false);
        return next;
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [playing]);
  return { time, setTime, playing, setPlaying, replay: () => { setTime(0); setPlaying(true); } };
}

type Focus = 'entrance' | 'handoff' | 'key' | undefined;
export function RoomFrame({ time, focus, compact = false }: { time: number; focus?: Focus; compact?: boolean }) {
  const bX = time < .65 ? -32 : time < 1.65 ? -32 + (time - .65) * 220 : 188;
  const aX = time < 1.9 ? -28 : time < 3.1 ? -28 + (time - 1.9) / 1.2 * 380 : 352;
  const handX = time < 3.45 ? aX + 38 : time < 4.12 ? aX + 38 + (time - 3.45) / .67 * 85 : aX + 123;
  const handY = time < 3.45 ? 119 : time < 4.12 ? 119 + (time - 3.45) / .67 * 31 : 150;
  const keyOnTable = time >= 4.12;
  const armEndX = time > 4.55 ? aX + 40 : handX;
  const armEndY = time > 4.55 ? 115 : handY;
  return <svg className={`s1-room ${compact ? 's1-room-compact' : ''}`} viewBox="0 0 640 220" role="img" aria-label={`${stamp(time)}：${time < .65 ? '房间尚无人进入' : time < 1.9 ? '橙衣人物 B 进入房间' : time < 3.45 ? '蓝衣人物 A 持钥匙走向桌边' : time < 4.12 ? '蓝衣人物 A 将钥匙移向桌面' : '钥匙留在桌上，人物手部离开'}`}>
    <rect width="640" height="220" fill="#f7f9fc" />
    <path d="M0 187H640 M32 28V187 M32 28H116V187" fill="none" stroke="#d7deea" strokeWidth="3" />
    <path d="M94 30V183" stroke="#e1e7ef" strokeWidth="3" />
    <rect x="466" y="151" width="146" height="10" rx="4" fill="#8c9bab" />
    <path d="M480 160V218 M598 160V218" stroke="#8c9bab" strokeWidth="7" />
    <g transform={`translate(${bX} 0)`}>
      <circle cx="0" cy="72" r="17" fill="#f2d4b9" stroke="#bd9273" strokeWidth="2" />
      <path d="M-13 62Q0 48 13 62" stroke="#5c4850" strokeWidth="8" fill="none" />
      <path d="M0 92V148 M0 111L-28 134 M0 111L27 130 M0 148L-20 185 M0 148L21 185" fill="none" stroke="#c46b37" strokeWidth="13" strokeLinecap="round" />
      <text x="0" y="205" textAnchor="middle" fill="#96502b" fontSize="18" fontWeight="800">B</text>
    </g>
    <g>
      <circle cx={aX} cy="70" r="17" fill="#efd0b5" stroke="#bd9273" strokeWidth="2" />
      <path d={`M${aX - 13} 60Q${aX} 45 ${aX + 13} 60`} stroke="#4b5360" strokeWidth="8" fill="none" />
      <path d={`M${aX} 91V146 M${aX} 146L${aX - 19} 185 M${aX} 146L${aX + 20} 185 M${aX - 4} 107L${aX - 29} 132 M${aX + 4} 107L${armEndX} ${armEndY}`} fill="none" stroke="#3d75ab" strokeWidth="13" strokeLinecap="round" />
      <circle cx={armEndX} cy={armEndY} r="6" fill="#efd0b5" />
      <text x={aX} y="205" textAnchor="middle" fill="#28547e" fontSize="18" fontWeight="800">A</text>
    </g>
    <g transform={`translate(${keyOnTable ? 492 : handX + 8} ${keyOnTable ? 147 : handY + 2})`}>
      <circle cx="0" cy="0" r="6" fill="none" stroke="#b67529" strokeWidth="4" />
      <path d="M6 0H27V6H21V0" fill="none" stroke="#b67529" strokeWidth="4" strokeLinejoin="round" />
    </g>
    {focus === 'entrance' && <rect x="34" y="24" width="178" height="166" rx="16" fill="none" stroke="#f07e47" strokeWidth="5" />}
    {focus === 'handoff' && <ellipse cx="445" cy="131" rx="96" ry="43" fill="none" stroke="#f07e47" strokeWidth="5" />}
    {focus === 'key' && <ellipse cx="510" cy="146" rx="51" ry="25" fill="none" stroke="#f07e47" strokeWidth="5" />}
  </svg>;
}

function Track({ time, range, samples, focus }: { time: number; range: [number, number]; samples?: number[]; focus?: Focus }) {
  return <div className="s1-timeline">
    <div className="s1-track" aria-label={`播放位置 ${stamp(time)}；重点区间 ${stamp(range[0])} 至 ${stamp(range[1])}`}>
      <span className={`s1-track-range ${focus ?? ''}`} style={{ left: pct(range[0]), width: `${(range[1] - range[0]) / DURATION * 100}%` }} />
      {samples?.map((point, i) => <span key={`${point}-${i}`} className="s1-sample-mark" style={{ left: pct(point) }} title={`采样 ${stamp(point)}`} />)}
      <span className="s1-playhead" style={{ left: pct(time) }} />
    </div>
    <div className="s1-track-labels"><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span></div>
  </div>;
}

function Controls({ clock }: { clock: ReturnType<typeof useVideoClock> }) {
  return <div className="s1-play-controls"><button type="button" onClick={() => { if (clock.time >= DURATION) clock.setTime(0); clock.setPlaying(!clock.playing); }}>{clock.playing ? '暂停' : '播放'}</button><button type="button" onClick={clock.replay}>重新播放</button><span>{stamp(clock.time)} / 8.0s</span></div>;
}

export function SamplingLab({ onComplete }: { onComplete: () => void }) {
  const clock = useVideoClock();
  const [fps, setFps] = useState(.5);
  const [offset, setOffset] = useState(.4);
  const samples = useMemo(() => {
    const points: number[] = [];
    for (let n = 0; offset + n / fps <= DURATION + 1e-6; n++) points.push(Number((offset + n / fps).toFixed(3)));
    return points;
  }, [fps, offset]);
  const before = samples.some(t => t >= 3.2 && t < EVENT_START);
  const during = samples.some(t => t >= EVENT_START && t <= EVENT_END);
  const after = samples.some(t => t > EVENT_END && t <= 4.8);
  const result = !during ? '没有采到放置动作' : before && after ? '采到了动作前、动作中和动作后的连续证据' : '只采到动作期间的部分画面';
  function adjustFps(value: number) { setFps(value); onComplete(); }
  function adjustOffset(value: number) { setOffset(value); onComplete(); }
  return <div className="s1-lab">
    <p className="s1-intro">原视频中有放钥匙动作。改变采样间隔和起点，看看送入视觉输入的画面是否包含动作。</p>
    <div className="s1-screen"><RoomFrame time={clock.time} /><span className="s1-screen-label">原视频 · {stamp(clock.time)}</span></div>
    <Controls clock={clock} />
    <div className="s1-params"><fieldset><legend>采样 FPS</legend>{[.5, 1, 2, 5].map(value => <button type="button" key={value} className={fps === value ? 'selected' : ''} aria-pressed={fps === value} onClick={() => adjustFps(value)}>{value}</button>)}</fieldset><label>采样起点 <strong>{stamp(offset)}</strong><input type="range" min="0" max="1.5" step="0.1" value={offset} onChange={e => adjustOffset(Number(e.target.value))} /></label></div>
    <div className="s1-track-heading"><span>橙色：放置动作 3.55–4.20s</span><span>蓝线：采样时刻</span></div>
    <Track time={clock.time} range={[EVENT_START, EVENT_END]} samples={samples} />
    <div className="s1-result" aria-live="polite"><strong>{result}</strong><span>{samples.length} 帧进入观察；{!during ? '采样间隔覆盖了短暂动作。' : before && after ? '这些帧可以比较钥匙在手中、移动中与桌上的位置。' : '单张动作画面仍不足以确认钥匙如何转移。'}</span></div>
    <div className="s1-frame-heading">实际采样帧 · {samples.length} 张</div>
    <div className="s1-frame-strip">{samples.map((point, i) => <div className={`s1-frame ${point >= EVENT_START && point <= EVENT_END ? 'during' : ''}`} key={`${point}-${i}`}><RoomFrame time={point} compact /><span>{stamp(point)}</span></div>)}</div>
    <p className="s1-conclusion">提高 FPS 会增加观察机会，也会读取更多帧；是否足以判断动作，取决于采到的画面是否形成有用的变化证据。</p>
  </div>;
}

const questions = [
  { text: '谁最先进入房间？', focus: 'entrance' as Focus, range: [0.65, 1.65] as [number, number], moments: [.5, 1.05, 1.65], goal: '观察入口，比较人物进入房间的先后。' },
  { text: '谁把钥匙放在桌上？', focus: 'handoff' as Focus, range: [3.3, 4.5] as [number, number], moments: [3.3, 3.85, 4.5], goal: '确认钥匙从人物手中转移到桌面。' },
  { text: '钥匙最后在哪里？', focus: 'key' as Focus, range: [4.3, 8] as [number, number], moments: [4.4, 6, 7.8], goal: '观察末段桌面，确认钥匙最终位置。' }
];

export function QuestionLab({ onComplete }: { onComplete: () => void }) {
  const clock = useVideoClock(1.05);
  const [selected, setSelected] = useState(0);
  const question = questions[selected];
  function choose(index: number) {
    setSelected(index);
    clock.setTime(questions[index].moments[1]);
    clock.setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    onComplete();
  }
  return <div className="s1-lab">
    <p className="s1-intro">同一段视频，不同问题需要不同证据。切换问题，观察时间和画面重点怎样改变。</p>
    <div className="s1-question-tabs" role="group" aria-label="选择问题">{questions.map((item, i) => <button type="button" key={item.text} className={selected === i ? 'selected' : ''} aria-pressed={selected === i} onClick={() => choose(i)}>{item.text}</button>)}</div>
    <div className="s1-screen"><RoomFrame time={clock.time} focus={question.focus} /><span className="s1-screen-label">{stamp(clock.time)} · {question.focus === 'entrance' ? '入口与人物' : question.focus === 'handoff' ? '人物手部与钥匙' : '桌面与钥匙'}</span></div>
    <Controls clock={clock} />
    <div className="s1-track-heading"><span>当前问题的候选区间</span><span>{stamp(question.range[0])}–{stamp(question.range[1])}</span></div>
    <Track time={clock.time} range={question.range} focus={question.focus} />
    <div className="s1-result" aria-live="polite"><strong>观察目标</strong><span>{question.goal}</span></div>
    <div className="s1-frame-heading">相关画面</div>
    <div className="s1-frame-strip s1-related-frames">{question.moments.map(point => <div className="s1-frame" key={point}><RoomFrame time={point} focus={question.focus} compact /><span>{stamp(point)}</span></div>)}</div>
    <p className="s1-conclusion">主动观察根据当前问题选择候选位置，再从画面核实证据；候选区间本身不是答案。</p>
  </div>;
}
