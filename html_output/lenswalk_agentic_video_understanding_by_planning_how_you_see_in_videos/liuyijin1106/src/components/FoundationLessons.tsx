import { useEffect, useRef, useState } from 'react';
import { S3Formula } from './S3Formula';

const DURATION = 12;
const formatTime = (time: number) => `${time.toFixed(1)}s`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function actionAt(time: number) {
  if (time < 4.5) return '钥匙仍在桌上';
  if (time < 5.5) return '人物靠近钥匙';
  if (time < 6) return '伸手接近钥匙';
  if (time < 6.5) return '拿起钥匙';
  if (time < 7.5) return '拿着钥匙离开';
  return '桌上的钥匙已不在';
}

/** One continuous, deterministic teaching video shared by the three lessons. */
function KeyScene({ time, label }: { time: number; label?: string }) {
  const approach = clamp((time - 1) / 4.2, 0, 1);
  const departure = clamp((time - 6.2) / 4, 0, 1);
  const personX = 76 + approach * 274 + departure * 172;
  const holding = time >= 6;
  const keyX = holding ? personX + 32 : 386;
  const keyY = holding ? 116 : 161;
  const armX = time >= 5.2 && time < 6 ? 386 : personX + 29;
  return <svg className="foundation-scene" viewBox="0 0 600 240" role="img" aria-label={`${formatTime(time)}：${actionAt(time)}`}>
    <rect width="600" height="240" fill="#f7f9fc"/>
    <rect y="189" width="600" height="51" fill="#e8edf5"/>
    <path d="M0 189H600" stroke="#cbd5e3" strokeWidth="2"/>
    <rect x="331" y="151" width="113" height="12" rx="5" fill="#a4b3c7"/>
    <path d="M346 163v27m82-27v27" stroke="#7489a4" strokeWidth="8" strokeLinecap="round"/>
    <circle cx={personX} cy="91" r="19" fill="#385a82"/>
    <path d={`M${personX} 113v45 M${personX} 129L${personX-29} 148 M${personX} 129L${armX} ${time >= 5.2 && time < 6.2 ? 157 : 146} M${personX} 157L${personX-18} 188 M${personX} 157L${personX+22} 188`} fill="none" stroke="#385a82" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    <g transform={`translate(${keyX} ${keyY})`}>
      <circle cx="-8" cy="0" r="7" fill="none" stroke="#db873c" strokeWidth="5"/>
      <path d="M-1 0h25m-5 0v8m5-8v6" stroke="#db873c" strokeWidth="5" strokeLinecap="round"/>
    </g>
    <text x="20" y="29" fill="#68778f" fontSize="14" fontWeight="700">教学模拟 · 同一段连续视频</text>
    {label && <text x="580" y="29" textAnchor="end" fill="#27446e" fontSize="14" fontWeight="700">{label}</text>}
  </svg>;
}

export function FixedObservationLesson({ onComplete }: { onComplete: () => void }) {
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPlaying(false); setTime(6); return; }
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setTime(previous => (previous + .08) % DURATION), 80);
    return () => window.clearInterval(timer);
  }, [playing]);
  const samples = [offset, offset + 4, offset + 8];
  // In the shared deterministic scene the key first moves from the table at 6.0s.
  const covered = samples.some(sample => sample >= 6 && sample < 6.5);
  return <div className="lab-card foundation-lab foundation-fixed">
    <p className="foundation-intro">同一段视频中，人物约在 6.0 秒拿起桌上的钥匙。固定每隔 4 秒取一帧：改变起始偏移，看看三张画面能否覆盖抓握时刻。</p>
    <div className="foundation-fixed-video"><div className="foundation-video-heading"><strong>原始视频 · 12 秒</strong><span>{formatTime(time)} · {actionAt(time)}</span></div><KeyScene time={time}/></div>
    <div className="foundation-fixed-control">
      <div className="foundation-fixed-control-head"><label htmlFor="s1-sampling-offset">Sampling Offset · 采样偏移</label><output htmlFor="s1-sampling-offset">{formatTime(offset)}</output></div>
      <input id="s1-sampling-offset" aria-describedby="s1-offset-hint" type="range" min="0" max="3" step="0.5" value={offset} onChange={event => { setOffset(Number(event.target.value)); onComplete(); }}/>
      <p id="s1-offset-hint">始终取 3 帧，间隔 4 秒；拖动或使用方向键调整偏移。</p>
      <div className="foundation-fixed-timeline" role="img" aria-label={`12 秒时间轴；关键抓握时刻约 6.0 秒；采样时刻 ${samples.map(formatTime).join('、')}`}>
        <span className="foundation-fixed-event" style={{ left:'50%' }} aria-hidden="true"/>
        {samples.map((sample, index) => <span className="foundation-fixed-mark" style={{ left:`${sample / DURATION * 100}%` }} key={index} aria-hidden="true"><i>{index + 1}</i></span>)}
      </div>
      <div className="foundation-fixed-ruler"><span>0s</span><span>6s · 抓握</span><span>12s</span></div>
    </div>
    <div className="foundation-video-heading"><strong>本次实际采样帧</strong><span>{samples.map(formatTime).join(' · ')}</span></div>
    <div className="foundation-fixed-frames">{samples.map((sample, index) => {
      const isKeyMoment = sample >= 6 && sample < 6.5;
      return <figure className={`foundation-fixed-frame${isKeyMoment ? ' key-moment' : ''}`} key={index}><KeyScene time={sample}/><figcaption><b>{formatTime(sample)}</b><span>{actionAt(sample)}</span>{isKeyMoment && <em>覆盖抓握时刻</em>}</figcaption></figure>;
    })}</div>
    <p className="foundation-fixed-result" role="status" aria-live="polite"><strong>{covered ? '本次采样覆盖了关键阶段。' : '本次采样未覆盖抓握时刻。'}</strong> {covered ? '选中的画面包含钥匙离开桌面的时刻，可用于判断动作发生；仍不保证模型答对。' : '原视频中的动作仍发生了；当前帧只能看到动作前后的状态，不能直接定位抓握瞬间。'}</p>
  </div>;
}

type LoopStep = { title: string; prompt: string; active: string; edge: string; time: number };
const loopSteps: LoopStep[] = [
  { title:'初步推理', prompt:'当前视觉证据不足，需要进一步观察。', active:'reasoner', edge:'', time:4 },
  { title:'规划观察', prompt:'选择可能发生关键动作的时间范围。', active:'reasoner', edge:'reasoner-toolkit', time:4 },
  { title:'执行视觉观察', prompt:'补充关键时间段的视觉画面。', active:'observer', edge:'toolkit-observer', time:6 },
  { title:'更新证据', prompt:'将行动与观察结果写入 History。', active:'history', edge:'observer-history', time:6 },
  { title:'重新推理', prompt:'利用新增证据修正判断。', active:'reasoner', edge:'history-reasoner', time:6 },
  { title:'Finish', prompt:'依据观察到的视觉证据，结束本次演示。', active:'finish', edge:'reasoner-finish', time:6 }
];

const diagramNodes = [
  { id:'reasoner', label:'Reasoner', sub:'分析与规划', x:25,y:120,w:134,h:62 },
  { id:'toolkit', label:'Observation Toolkit', sub:'准备视频画面', x:214,y:24,w:194,h:62 },
  { id:'observer', label:'Observer', sub:'理解视觉证据', x:275,y:141,w:133,h:62 },
  { id:'history', label:'History / Evidence', sub:'保存行动与结果', x:214,y:258,w:194,h:62 },
  { id:'finish', label:'Finish', sub:'终止动作', x:25,y:258,w:134,h:62 }
];
const diagramEdges = [
  { id:'reasoner-toolkit', d:'M159 137L214 74' },
  { id:'toolkit-observer', d:'M322 86L337 141' },
  { id:'observer-history', d:'M337 203L322 258' },
  { id:'history-reasoner', d:'M214 288H184Q171 288 171 275V192Q171 181 159 171' },
  { id:'reasoner-finish', d:'M92 182V258' }
];
const newObservationTimes = [5.6, 6, 6.6];
const loopFrameLabel = (time: number) => time === 5.6 ? '伸手靠近钥匙' : time === 6 ? '拿起钥匙' : time === 6.6 ? '持钥匙离开' : actionAt(time);

export function ObservationLoopLesson({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = loopSteps[step];
  const next = () => { if (step < loopSteps.length - 1) { setStep(step + 1); if (step + 1 === loopSteps.length - 1) onComplete(); } };
  const previous = () => setStep(value => Math.max(0, value - 1));
  const restart = () => setStep(0);
  return <div className="lab-card foundation-lab foundation-loop" onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
  }}>
    <div className="foundation-loop-heading"><span>问题：人物何时拿起钥匙？</span><strong>步骤 {step + 1} / 6 · {current.title}</strong></div>
    <div className="foundation-loop-grid">
      <div className="foundation-loop-diagram" aria-label="Reasoner 到 Toolkit、Observer、History 再返回 Reasoner；Finish 从 Reasoner 分支结束">
        <svg viewBox="0 0 433 344" role="img" aria-label={`推理观察闭环，当前：${current.title}`}>
          <defs><marker id="foundation-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="#8fa3bc" strokeWidth="1.5"/></marker><marker id="foundation-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="#ed7b42" strokeWidth="1.8"/></marker></defs>
          {diagramEdges.map(edge => <path key={edge.id} d={edge.d} className={current.edge === edge.id ? 'active' : ''} markerEnd={`url(#foundation-arrow${current.edge === edge.id ? '-active' : ''})`}/>)}
          {diagramNodes.map(node => <g key={node.id} className={`foundation-node ${current.active === node.id ? 'active' : ''}`}><rect x={node.x} y={node.y} width={node.w} height={node.h} rx="10"/><text x={node.x + node.w / 2} y={node.y + 27} textAnchor="middle" className="node-title">{node.label}</text><text x={node.x + node.w / 2} y={node.y + 47} textAnchor="middle" className="node-sub">{node.sub}</text></g>)}
        </svg>
      </div>
      <div className="foundation-loop-observation">
        <div className="foundation-loop-video-label"><strong>视频观察窗</strong><span>{formatTime(current.time)} / 12.0s</span></div>
        <KeyScene time={current.time}/>
        <div className="foundation-loop-timeline" aria-label={`视频时间轴，${step >= 1 ? '候选观察区间 5.2 至 7.0 秒' : '尚未选择候选观察区间'}`}>
          {step >= 1 && <span className="foundation-loop-window" style={{ left:`${5.2 / DURATION * 100}%`, width:`${1.8 / DURATION * 100}%` }}/ >}
          {[4, 8].map(time => <span key={time} className="foundation-loop-tick sparse" style={{ left:`${time / DURATION * 100}%` }}/ >)}
          {step >= 2 && newObservationTimes.map(time => <span key={time} className="foundation-loop-tick new" style={{ left:`${time / DURATION * 100}%` }}/ >)}
        </div>
        <div className="foundation-loop-ruler"><span>0s</span><span>{step >= 1 ? '候选 5.2–7.0s' : '已有稀疏帧 4.0s、8.0s'}</span><span>12s</span></div>
        <div className="foundation-loop-frames" aria-label={step >= 2 ? '新获取的关键采样帧' : '已有的稀疏采样帧'}>
          {(step >= 2 ? newObservationTimes : [4, 8]).map(time => <div className="foundation-loop-frame" key={time}><KeyScene time={time}/><span>{formatTime(time)} · {loopFrameLabel(time)}</span></div>)}
        </div>
        <p className="foundation-loop-evidence" aria-live="polite"><strong>{step < 3 ? '当前证据' : step === 3 ? 'History · 行动 + 观察' : '已保存证据'}</strong><span>{step < 2 ? '4.0s 钥匙在桌上；8.0s 钥匙已离开桌面。拿起过程未见。' : step === 2 ? '新增 5.6s 伸手、6.0s 拿起、6.6s 持钥匙离开。' : '观察 5.2–7.0s：约 6.0s 人物拿起钥匙。'}</span></p>
      </div>
    </div>
    <div className="foundation-loop-bottom"><p aria-live="polite">{current.prompt}{step === 5 && <strong> 答案：约 6.0 秒。</strong>}</p><div className="foundation-step-control"><button className="button-outline" onClick={previous} disabled={step === 0}>← 上一步</button><button className="button-primary" onClick={next} disabled={step === loopSteps.length - 1}>下一步 →</button><button className="button-outline" onClick={restart}>重新演示</button></div></div>
  </div>;
}

function sampledTimes(start: number, end: number, fps: number, budget: number) {
  const requested = Math.ceil((end - start) * fps);
  const count = Math.min(requested, budget, 32);
  return { requested, times: Array.from({ length: count }, (_, index) => start + (index + .5) * (end - start) / count) };
}

type DragMode = 'start' | 'end' | 'window';
export function ParameterPlanningLesson({ onComplete }: { onComplete: () => void }) {
  const [start, setStart] = useState(4);
  const [end, setEnd] = useState(8);
  const [fps, setFps] = useState(1);
  const [budget, setBudget] = useState(32);
  const [formulaFocus, setFormulaFocus] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; originX: number; start: number; end: number } | null>(null);
  const { requested, times } = sampledTimes(start, end, fps, budget);
  const eventSeen = times.some(time => time >= 6 && time < 6.5);
  const representativeIndexes = times.length <= 6 ? times.map((_, index) => index) : Array.from({ length: 6 }, (_, index) => Math.round(index * (times.length - 1) / 5));
  if (eventSeen && !representativeIndexes.some(index => times[index] >= 6 && times[index] < 6.5)) {
    const eventIndex = times.findIndex(time => time >= 6 && time < 6.5);
    const replace = representativeIndexes.slice(1, -1).reduce((best, index) => Math.abs(index - eventIndex) < Math.abs(best - eventIndex) ? index : best);
    representativeIndexes[representativeIndexes.indexOf(replace)] = eventIndex;
    representativeIndexes.sort((a, b) => a - b);
  }
  const visibleTimes = representativeIndexes.map(index => times[index]);
  const updateStart = (value: number) => { setStart(clamp(value, 0, end - .5)); onComplete(); };
  const updateEnd = (value: number) => { setEnd(clamp(value, start + .5, DURATION)); onComplete(); };
  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>, edge: 'start' | 'end') => {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? DURATION : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? (edge === 'start' ? start : end) - .5 : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? (edge === 'start' ? start : end) + .5 : null;
    if (next === null) return;
    event.preventDefault();
    if (edge === 'start') updateStart(next); else updateEnd(next);
  };
  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, mode: DragMode) => { dragRef.current = { mode, originX: event.clientX, start, end }; event.currentTarget.setPointerCapture(event.pointerId); };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const width = trackRef.current?.getBoundingClientRect().width;
    if (!drag || !width) return;
    const delta = (event.clientX - drag.originX) / width * DURATION;
    if (drag.mode === 'start') setStart(clamp(Math.round((drag.start + delta) * 2) / 2, 0, drag.end - .5));
    if (drag.mode === 'end') setEnd(clamp(Math.round((drag.end + delta) * 2) / 2, drag.start + .5, DURATION));
    if (drag.mode === 'window') { const next = clamp(Math.round((drag.start + delta) * 2) / 2, 0, DURATION - (drag.end - drag.start)); setStart(next); setEnd(next + drag.end - drag.start); }
    onComplete();
  };
  return <div className="foundation-planner">
    <p className="foundation-planner-intro">调整 Segment Focus 的观察窗口、采样率和帧数预算，看看 Observer 实际能收到哪些画面。</p>
    <div className="foundation-planner-grid"><div className="foundation-planner-controls">
      <div className="foundation-planner-heading"><strong className={formulaFocus === 'tool' ? 's3-formula-linked' : undefined}>观察计划 · Segment Focus</strong><span>连续视频 · 0–12 秒</span></div>
      <div className={`foundation-planner-label${formulaFocus === 'scope' ? ' s3-formula-linked' : ''}`}><strong>观察时间窗口</strong><span>{formatTime(start)}–{formatTime(end)}</span></div>
      <div className={`foundation-range-track${formulaFocus === 'scope' ? ' s3-formula-linked' : ''}`} ref={trackRef} role="group" aria-label="观察时间窗口；拖动橙色区域移动窗口，或用两端手柄调整">
        <div className="foundation-key-event" style={{ left:'45.8%', width:'16.7%' }}>拿起动作</div>
        <div className="foundation-selection" style={{ left:`${start / DURATION * 100}%`, width:`${(end-start) / DURATION * 100}%` }} onPointerDown={event => beginDrag(event, 'window')} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
          <div className="foundation-handle start" role="slider" tabIndex={0} aria-label="观察窗口起点" aria-valuemin={0} aria-valuemax={end - .5} aria-valuenow={start} aria-valuetext={formatTime(start)} aria-orientation="horizontal" onKeyDown={event => handleKey(event, 'start')} onPointerDown={event => { event.stopPropagation(); beginDrag(event, 'start'); }} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }}/>
          <div className="foundation-handle end" role="slider" tabIndex={0} aria-label="观察窗口终点" aria-valuemin={start + .5} aria-valuemax={DURATION} aria-valuenow={end} aria-valuetext={formatTime(end)} aria-orientation="horizontal" onKeyDown={event => handleKey(event, 'end')} onPointerDown={event => { event.stopPropagation(); beginDrag(event, 'end'); }} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }}/>
        </div>
      </div>
      <div className="foundation-ruler"><span>0s</span><span>3s</span><span>6s</span><span>9s</span><span>12s</span></div>
      <fieldset className={`foundation-planner-fps${formulaFocus === 'scope' || formulaFocus === 'specific' ? ' s3-formula-linked' : ''}`}><legend>FPS · 每秒请求帧数</legend>{[.5, 1, 2, 4].map(option => <label key={option}><input type="radio" name="scope-fps" checked={fps === option} onChange={() => { setFps(option); onComplete(); }}/><span>{option}{option === 1 && <small>论文默认</small>}</span></label>)}</fieldset>
      <label className={`foundation-planner-budget${formulaFocus === 'scope' || formulaFocus === 'specific' ? ' s3-formula-linked' : ''}`}><span>最大帧数 <output>{budget} 帧</output></span><input type="range" min="2" max="32" step="1" value={budget} onChange={event => { setBudget(Number(event.target.value)); onComplete(); }}/></label>
    </div><div className="foundation-planner-result">
      <div className="foundation-planner-heading"><strong>实际采样画面</strong><span>请求 {requested} 帧 · 实际 {times.length} 帧</span></div>
      <div className="foundation-planner-frames" aria-label={`实际采样 ${times.length} 帧，画廊展示 ${visibleTimes.length} 帧`}>
        {visibleTimes.map(time => <figure className="foundation-planner-frame" key={time}><KeyScene time={time}/><figcaption><b>{formatTime(time)}</b><span>{actionAt(time)}</span></figcaption></figure>)}
      </div>
      <p className="foundation-planner-coverage" aria-live="polite">{eventSeen ? '采样帧覆盖拿起阶段；这些画面可供 Observer 判断。' : '采样帧未覆盖拿起阶段；仅凭当前画面无法确认拿取动作。'}{times.length > visibleTimes.length && ` 画廊仅展示 ${visibleTimes.length} 帧代表画面。`}</p>
    </div></div>
    <div className="foundation-planner-action"><div className="foundation-equation"><S3Formula onActiveChange={setFormulaFocus}/><span className="s3-fe-hint">悬停或点击符号；键盘可用 Tab、Enter、Esc</span></div><p aria-live="polite">Segment Focus · <span className={formulaFocus === 'question' ? 's3-formula-linked' : undefined}>检查人物拿钥匙</span> · 观察区间 {formatTime(start)}–{formatTime(end)} · {fps} FPS · 最多 {budget} 帧。</p></div>
  </div>;
}
