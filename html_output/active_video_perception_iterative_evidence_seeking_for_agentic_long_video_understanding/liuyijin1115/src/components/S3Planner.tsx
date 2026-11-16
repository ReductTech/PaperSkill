import { useEffect, useMemo, useRef, useState } from 'react';
import { RoomFrame } from './S1VideoLab';
import './s3-planner.css';

const DURATION = 8;
const ACTION_START = 3.55;
const ACTION_END = 4.12;
type Range = [number, number];
type Detail = 'low' | 'medium';
type Focus = 'entrance' | 'handoff' | 'key';
const fmt = (time: number) => `${time.toFixed(1)}s`;
const position = (time: number) => `${time / DURATION * 100}%`;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function samplesFor([start, end]: Range, fps: number) {
  const count = Math.floor((end - start) * fps + 1e-7) + 1;
  return Array.from({ length: count }, (_, index) => Number((start + index / fps).toFixed(3)));
}

function useClip(range: Range, initial: number) {
  const [time, setTime] = useState(initial);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min((now - previous) / 1000, .12);
      previous = now;
      setTime(current => {
        const next = Math.min(range[1], current + delta);
        if (next >= range[1]) setPlaying(false);
        return next;
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [playing, range[0], range[1]]);
  function select(next: Range) { setPlaying(false); setTime(next[0]); }
  function toggle() {
    if (time < range[0] || time >= range[1]) setTime(range[0]);
    setPlaying(value => !value);
  }
  return { time, setTime, playing, setPlaying, select, toggle };
}

function Video({ time, detail = 'medium', focus }: { time: number; detail?: Detail; focus?: Focus }) {
  const target = focus ?? 'handoff';
  return <div className={`s3-video s3-${detail} s3-focus-${target}`}>
    <div className="s3-main-scene"><RoomFrame time={time} focus={target} /></div>
    <div className="s3-magnifier"><span>{target === 'entrance' ? '入口 · 进入顺序' : target === 'key' ? '桌面 · 最终位置' : '手部 · 放置动作'}</span><DetailView time={time} focus={target}/></div>
    <span className="s3-video-time">{fmt(time)}</span>
  </div>;
}

function DetailView({ time, focus }: { time: number; focus: Focus }) {
  if (time < .65 || (focus === 'handoff' && time < 1.9) || (focus === 'key' && time < 4.12)) return <svg viewBox="0 0 360 205" role="img" aria-label="目标尚未进入当前画面"><rect width="360" height="205" fill="#eaf2fa"/><path d="M25 157H335 M54 157V205 M307 157V205" stroke="#8da2b5" strokeWidth="15" strokeLinecap="round"/><text x="180" y="98" textAnchor="middle" fill="#667b91" fontSize="19" fontWeight="800">目标尚未出现</text></svg>;
  if (focus === 'entrance') return <svg viewBox="0 0 360 205" role="img" aria-label="放大的入口与人物"><rect width="360" height="205" fill="#eaf2fa"/><path d="M48 12V194H201V12Z" fill="#fff" stroke="#7792af" strokeWidth="9"/><circle cx="159" cy="70" r="30" fill="#efc6a6"/><path d="M159 104V175 M159 127L114 156 M159 127L205 153" stroke="#c46b37" strokeWidth="28" strokeLinecap="round"/><text x="258" y="97" fill="#a4582a" fontSize="30" fontWeight="800">B</text><text x="258" y="130" fill="#50647a" fontSize="16">先进入</text></svg>;
  if (focus === 'key') return <svg viewBox="0 0 360 205" role="img" aria-label="放大的桌面钥匙"><rect width="360" height="205" fill="#eaf2fa"/><path d="M28 155H332 M58 155V205 M304 155V205" stroke="#667d91" strokeWidth="18" strokeLinecap="round"/><g transform="translate(120 132)" stroke="#b67529" strokeWidth="10" fill="none"><circle r="21"/><path d="M21 0H113V18H91V0"/></g><circle cx="166" cy="131" r="56" fill="none" stroke="#228d5c" strokeWidth="5"/></svg>;
  const released = time >= 4.12;
  return <svg viewBox="0 0 360 205" role="img" aria-label={released ? '放大后可见钥匙留在桌上，手已离开' : '放大的手部和钥匙动作'}><rect width="360" height="205" fill="#eaf2fa"/><path d="M15 163H345 M48 163V205 M319 163V205" stroke="#71869b" strokeWidth="16" strokeLinecap="round"/><path d={released ? 'M13 17L98 91L143 94' : 'M13 17L117 91L208 115'} stroke="#3d75ab" strokeWidth="37" fill="none" strokeLinecap="round"/><circle cx={released ? 144 : 210} cy={released ? 94 : 115} r="20" fill="#efc6a6"/><g transform={released ? 'translate(242 145)' : 'translate(235 125)'} stroke="#ae762c" strokeWidth="8" fill="none"><circle r="13"/><path d="M13 0H71V13H58V0"/></g><circle cx="242" cy="141" r="64" fill="none" stroke={released ? '#228d5c' : '#f07e47'} strokeWidth="5"/></svg>;
}

function Timeline({ range, time, samples = [], marker }: { range: Range; time: number; samples?: number[]; marker?: Range }) {
  return <div className="s3-timeline">
    <div className="s3-track" aria-label={`视频 0 至 8 秒；观察 ${fmt(range[0])} 至 ${fmt(range[1])}；播放位置 ${fmt(time)}`}>
      {marker && <span className="s3-event" style={{ left: position(marker[0]), width: `${(marker[1] - marker[0]) / DURATION * 100}%` }} />}
      <span className="s3-window" style={{ left: position(range[0]), width: `${(range[1] - range[0]) / DURATION * 100}%` }} />
      {samples.map((point, i) => <span className="s3-tick" key={`${point}-${i}`} style={{ left: position(point) }} title={`采样 ${fmt(point)}`} />)}
      <span className="s3-head" style={{ left: position(time) }} />
    </div>
    <div className="s3-ruler"><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span></div>
  </div>;
}

function ClipControls({ clock, range }: { clock: ReturnType<typeof useClip>; range: Range }) {
  return <div className="s3-play-controls">
    <button type="button" onClick={clock.toggle}>{clock.playing ? '暂停片段' : '播放片段'}</button>
    <button type="button" onClick={() => clock.select(range)}>回到片段起点</button>
    <span>{fmt(range[0])}–{fmt(range[1])}</span>
  </div>;
}

const questions: { text: string; focus: Focus; range: Range; what: string; evidence: string }[] = [
  { text: '谁最先进入房间？', focus: 'entrance', range: [.5, 2], what: '比较入口处人物出现的先后', evidence: '寻找两人先后越过入口的画面。' },
  { text: '谁把钥匙放在桌上？', focus: 'handoff', range: [3.2, 4.7], what: '确认手部与钥匙的转移', evidence: '寻找钥匙在手中、移向桌面、留在桌上的连续画面。' },
  { text: '钥匙最后在哪里？', focus: 'key', range: [4.3, 8], what: '核对末段钥匙的位置', evidence: '寻找视频末段能看清钥匙位置的画面。' }
];

export function S3What({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState(1);
  const question = questions[selected];
  const clock = useClip(question.range, 3.9);
  function choose(index: number) {
    setSelected(index);
    clock.select(questions[index].range);
    clock.setTime([1.15, 3.9, 7.2][index]);
    onComplete();
  }
  return <div className="s3-lab">
    <p className="s3-intro">同一段视频，问题改变后，Planner 会寻找不同的画面线索。</p>
    <div className="s3-questions" role="group" aria-label="选择观察问题">{questions.map((item, index) => <button key={item.text} type="button" aria-pressed={selected === index} className={selected === index ? 'selected' : ''} onClick={() => choose(index)}>{item.text}</button>)}</div>
    <Video time={clock.time} focus={question.focus} />
    <ClipControls clock={clock} range={question.range} />
    <Timeline range={question.range} time={clock.time} />
    <div className="s3-summary" aria-live="polite"><b>What · {question.what}</b><span>{question.evidence}</span></div>
  </div>;
}

function FrameStrip({ samples, detail, focus }: { samples: number[]; detail: Detail; focus?: Focus }) {
  return <div className="s3-frame-strip" aria-label={`${samples.length} 张实际采样帧`}>
    {samples.map((point, index) => <div className={`s3-frame ${point >= ACTION_START && point <= ACTION_END ? 'action' : ''}`} key={`${point}-${index}`}>
      <div className={`s3-frame-image s3-${detail}`}><RoomFrame time={point} compact focus={focus && point >= ACTION_START && point <= ACTION_END ? focus : undefined} /></div>
      <span>{fmt(point)}</span>
    </div>)}
  </div>;
}

function observationResult(range: Range, samples: number[], detail: Detail) {
  const coversAction = range[0] <= ACTION_START && range[1] >= ACTION_END;
  if (!coversAction) return { level: 'missing', title: '未覆盖完整的放置时段', description: '移动观察窗口，纳入桌边动作前后。' };
  const before = samples.some(t => t < ACTION_START);
  const during = samples.some(t => t >= ACTION_START && t < ACTION_END);
  const after = samples.some(t => t >= ACTION_END && t <= 4.8);
  if (!before || !during || !after) return { level: 'partial', title: '覆盖时段，动作证据仍不足', description: '采样帧尚未连起手持、移动与留在桌上的变化。' };
  if (detail === 'low') return { level: 'partial', title: '采到动作，细节仍模糊', description: '手部和钥匙的位置关系还不够清楚。' };
  return { level: 'supported', title: '取得支持判断的动作画面', description: '画面连续显示钥匙在手中、移向桌面，随后留在桌上。' };
}

export function S3WhereHow({ onComplete }: { onComplete: () => void }) {
  const [range, setRange] = useState<Range>([3.1, 5.1]);
  const [fps, setFps] = useState(2);
  const [detail, setDetail] = useState<Detail>('medium');
  const samples = useMemo(() => samplesFor(range, fps), [range, fps]);
  const result = observationResult(range, samples, detail);
  const clock = useClip(range, 3.8);
  function changeRange(next: Range) {
    setRange(next);
    clock.setPlaying(false);
    clock.setTime(next[0]);
    onComplete();
  }
  return <div className="s3-lab">
    <p className="s3-intro">选择桌边动作的观察范围，再调整每秒取帧数与画面精度。下方帧带直接显示 Observer 将看到的画面。</p>
    <div className="s3-workbench"><div className="s3-workbench-main"><Video time={clock.time} detail={detail} focus="handoff" /><Timeline range={range} time={clock.time} samples={samples} marker={[ACTION_START, ACTION_END]} /><ClipControls clock={clock} range={range} /></div>
    <div className="s3-control-panel"><h4>观察计划</h4><b>Where · 时间窗口</b><div className="s3-range-controls"><label>起点 <strong>{fmt(range[0])}</strong><input type="range" min="0" max="7.5" step="0.1" value={range[0]} aria-label="观察起点" onChange={event => changeRange([Math.min(Number(event.target.value), range[1] - .5), range[1]])}/></label><label>终点 <strong>{fmt(range[1])}</strong><input type="range" min="0.5" max="8" step="0.1" value={range[1]} aria-label="观察终点" onChange={event => changeRange([range[0], Math.max(Number(event.target.value), range[0] + .5)])}/></label></div>
    <div className="s3-how"><fieldset><legend>How · FPS</legend>{[.5, 1, 2].map(value => <button type="button" key={value} className={fps === value ? 'selected' : ''} aria-pressed={fps === value} onClick={() => { setFps(value); clock.setTime(samplesFor(range, value).find(t => t >= ACTION_START) ?? range[0]); onComplete(); }}>{value}</button>)}</fieldset><fieldset><legend>How · 分辨率</legend>{(['low', 'medium'] as Detail[]).map(value => <button type="button" key={value} className={detail === value ? 'selected' : ''} aria-pressed={detail === value} onClick={() => { setDetail(value); onComplete(); }}>{value === 'low' ? 'Low' : 'Medium'}</button>)}</fieldset></div><p>更密的采样增加动作前后画面；Medium 让手部与钥匙更易分辨。</p></div></div>
    <div className="s3-frames-heading"><b>实际采样帧</b><span>{samples.length} 帧 · 约 {samples.length * (detail === 'low' ? 66 : 258)} 视觉 Token</span></div>
    <FrameStrip samples={samples} detail={detail} focus="handoff" />
    <div className={`s3-result ${result.level}`} aria-live="polite"><strong>{result.title}</strong><span>{result.description}</span></div>
  </div>;
}

const rounds: { what: string; range: Range; fps: number; detail: Detail; feedback: string }[] = [
  { what: '寻找人物与钥匙相关的候选片段', range: [2.2, 6.2], fps: .5, detail: 'low', feedback: '还需要确认钥匙是否从手中转移到桌面。' },
  { what: '确认钥匙放置动作', range: [3.2, 4.7], fps: 2, detail: 'medium', feedback: '采样显示钥匙从手中移向桌面，并在手离开后留在桌上。' }
];

export function S3Replanning({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const [visible, setVisible] = useState(false);
  const plan = rounds[round];
  const clock = useClip(plan.range, plan.range[0]);
  const samples = useMemo(() => samplesFor(plan.range, plan.fps), [plan.range, plan.fps]);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: .3 });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || round !== 0 || touched.current) return;
    const timer = window.setTimeout(() => { if (!touched.current && !prefersReducedMotion()) { setRound(1); clock.select(rounds[1].range); clock.setTime(3.9); onComplete(); } }, 4500);
    return () => window.clearTimeout(timer);
  }, [round, visible]);
  function setPlan(next: number) {
    touched.current = true;
    setRound(next);
    clock.select(rounds[next].range);
    if (!prefersReducedMotion()) clock.setPlaying(true);
    onComplete();
  }
  return <div className="s3-lab s3-replan" ref={host}>
    <p className="s3-intro">问题：谁把钥匙放在桌上？第一轮只定位候选片段，证据缺口随后改变下一轮的观察参数。</p>
    <div className="s3-round-actions"><button type="button" className={round === 0 ? 'selected' : ''} aria-pressed={round === 0} onClick={() => setPlan(0)}>第一轮 · 定位</button><button type="button" className={round === 1 ? 'selected' : ''} aria-pressed={round === 1} onClick={() => setPlan(1)}>第二轮 · 确认动作</button></div>
    <div className="s3-plan-line"><span><b>What</b>{plan.what}</span><span><b>Where</b>{fmt(plan.range[0])}–{fmt(plan.range[1])}</span><span><b>How</b>{plan.fps} FPS · {plan.detail === 'low' ? 'Low' : 'Medium'}</span></div>
    <Video time={clock.time} detail={plan.detail} focus="handoff" />
    <Timeline range={plan.range} time={clock.time} samples={samples} marker={[ACTION_START, ACTION_END]} />
    <div className="s3-frames-heading"><b>本轮观察到的帧</b><span>{samples.length} 帧</span></div>
    <FrameStrip samples={samples} detail={plan.detail} focus={round === 1 ? 'handoff' : undefined} />
    <div className={`s3-result ${round === 1 ? 'supported' : 'partial'}`} aria-live="polite"><strong>{round === 0 ? '证据缺口 → 更新计划' : '第二轮新增动作证据'}</strong><span>{plan.feedback}</span></div>
  </div>;
}
