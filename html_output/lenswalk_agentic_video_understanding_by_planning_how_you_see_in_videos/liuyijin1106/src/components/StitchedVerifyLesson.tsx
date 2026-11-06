import { useEffect, useMemo, useRef, useState } from 'react';
import { LearningModule } from './LearningModule';
import './stitched-verify.css';

type ClipId = 'A' | 'B';
type Phase = 'separate' | 'gather' | 'joined';
const clips = {
  A: { start: 160, end: 176 },
  B: { start: 310, end: 330 },
} as const;
const ids: ClipId[] = ['A', 'B'];
const rates = [0.5, 1, 2];
const timeLabel = (time: number) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toFixed(1).padStart(4, '0')}`;

// The live window and every extracted thumbnail use the same absolute-time scene.
function AnimalScene({ clip, time, highlight = false }: { clip: ClipId; time: number; highlight?: boolean }) {
  const local = time - clips[clip].start;
  const x = Math.sin(local * 1.35) * 8;
  const bob = Math.sin(local * 2.7) * 3;
  const arm = Math.sin(local * 2.7 + 1) * 10;
  const vole = clip === 'B';
  const fur = vole ? '#a18b79' : '#79746e';
  const dark = vole ? '#6c554a' : '#4f504f';
  return <svg className="stitch-animal" viewBox="0 0 320 190" role="img" aria-label={`${timeLabel(time)}，${vole ? '棕灰色、圆耳、细尾的小动物穿白衣' : '灰棕色、无外露耳、尖鼻的小动物穿蓝衣'}，身体轻微移动`}>
    <rect width="320" height="190" fill={vole ? '#eef6f1' : '#edf2f9'}/>
    <path d="M0 145 Q80 136 160 145 T320 143 V190 H0Z" fill={vole ? '#dcebdd' : '#dce6f2'}/>
    <path d="M0 159 H320" stroke="#bdcfc6" strokeWidth="2"/>
    <g transform={`translate(${x} ${bob})`}>
      {vole && <path d="M207 125 Q264 104 278 140 Q286 158 274 174" fill="none" stroke={fur} strokeWidth="9" strokeLinecap="round"/>}
      <ellipse cx="160" cy="159" rx="63" ry="7" fill="#586273" opacity=".16"/>
      <path d={vole ? 'M124 107 Q111 149 127 173 H197 Q211 148 194 107Z' : 'M117 107 Q105 148 123 173 H199 Q215 146 199 107Z'} fill={fur}/>
      <path d={vole ? 'M130 111 Q116 144 133 168 H190 Q205 142 191 111Z' : 'M123 111 Q108 143 126 168 H193 Q209 142 195 111Z'} fill={vole ? '#fffefa' : '#497fb7'} stroke={vole ? '#9ead9f' : '#2a5d94'} strokeWidth="3"/>
      <path d={vole ? `M131 120 Q${112 + arm} 134 127 151` : `M112 119 Q${87 + arm} 131 111 149`} fill="none" stroke={fur} strokeWidth="16" strokeLinecap="round"/>
      <path d={vole ? `M191 120 Q${213 - arm} 135 195 150` : `M202 119 Q${226 - arm} 132 207 149`} fill="none" stroke={fur} strokeWidth="16" strokeLinecap="round"/>
      {vole ? <>
        <circle cx="124" cy="51" r="13" fill={fur}/><circle cx="124" cy="51" r="7" fill="#d9a68f"/>
        <circle cx="196" cy="51" r="13" fill={fur}/><circle cx="196" cy="51" r="7" fill="#d9a68f"/>
        <ellipse cx="160" cy="81" rx="47" ry="41" fill={fur}/>
        <path d="M135 89 Q160 111 187 88 Q180 111 160 116 Q143 108 135 89Z" fill="#cda58b"/>
        <circle cx="140" cy="77" r="4" fill={dark}/><circle cx="180" cy="77" r="4" fill={dark}/>
        <ellipse cx="160" cy="91" rx="6" ry="4" fill={dark}/>
      </> : <>
        <path d="M113 81 Q119 41 161 38 Q203 40 209 75 L230 94 Q216 108 198 106 Q182 119 149 116 Q113 106 113 81Z" fill={fur}/>
        <path d="M204 84 Q222 91 230 94 Q218 103 204 100Z" fill="#99958e"/>
        <circle cx="230" cy="94" r="4" fill="#c7838b"/>
        <circle cx="175" cy="76" r="4" fill="#f8f9f5"/><circle cx="176" cy="76" r="2" fill={dark}/>
        <path d="M114 83 Q107 96 119 102" fill="none" stroke={dark} strokeWidth="4"/>
      </>}
      <path d="M137 170 v10 M185 170 v10" stroke={dark} strokeWidth="12" strokeLinecap="round"/>
      {highlight && <><ellipse cx="160" cy="138" rx="43" ry="34" fill="none" stroke="#e48a45" strokeWidth="3" strokeDasharray="7 5"/><ellipse cx={vole ? 160 : 173} cy="80" rx={vole ? 50 : 61} ry="44" fill="none" stroke="#e48a45" strokeWidth="3"/></>}
    </g>
  </svg>;
}

function sample(id: ClipId, fps: number, count?: number) {
  const { start, end } = clips[id];
  const frameCount = count ?? Math.ceil((end - start) * fps);
  return Array.from({ length: frameCount }, (_, i) => Number((start + (i + .5) * (end - start) / frameCount).toFixed(2)));
}

function displayTimes(times: number[]) {
  if (times.length <= 2) return times;
  return [times[Math.floor((times.length - 1) / 4)], times[Math.floor(3 * (times.length - 1) / 4)]];
}

function Frames({ id, times, highlight }: { id: ClipId; times: number[]; highlight: boolean }) {
  const shown = displayTimes(times);
  return <div className="stitch-frames" aria-label={`来源 ${id}，实际采样 ${times.length} 帧，画布展示 ${shown.length} 帧`}>
    {shown.map((time, index) => <figure key={`${id}-${time}`}><AnimalScene clip={id} time={time} highlight={highlight && index === 0}/><figcaption>{timeLabel(time)}</figcaption></figure>)}
  </div>;
}

export function StitchedVerifyLesson({ onComplete }: { onComplete: () => void }) {
  const [ratesByClip, setRates] = useState<Record<ClipId, number>>({ A: 1, B: 1 });
  const [included, setIncluded] = useState<Record<ClipId, boolean>>({ A: true, B: true });
  const [active, setActive] = useState<ClipId>('A');
  const [seen, setSeen] = useState<Record<ClipId, boolean>>({ A: true, B: false });
  const [phase, setPhase] = useState<Phase>('separate');
  const [runId, setRunId] = useState(0);
  const timer = useRef<number | null>(null);
  const requested = useMemo(() => ({ A: Math.ceil(16 * ratesByClip.A), B: Math.ceil(20 * ratesByClip.B) }), [ratesByClip]);
  const requestedTotal = requested.A + requested.B;
  // The paper rescales interval budgets proportionally if one call exceeds 128 frames.
  const counts = useMemo(() => {
    if (requestedTotal <= 128) return requested;
    const a = Math.max(1, Math.floor(128 * requested.A / requestedTotal));
    return { A: a, B: 128 - a };
  }, [requested, requestedTotal]);
  const sampled = useMemo(() => ({ A: sample('A', ratesByClip.A, counts.A), B: sample('B', ratesByClip.B, counts.B) }), [ratesByClip, counts]);
  const visible = ids.filter(id => included[id]);
  const total = visible.reduce((sum, id) => sum + sampled[id].length, 0);
  const enough = visible.length === 2 && sampled.A.length >= 2 && sampled.B.length >= 2;
  const currentTime = sampled[active][Math.floor(sampled[active].length / 2)];
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const view = (id: ClipId) => { setActive(id); setSeen(current => ({ ...current, [id]: true })); };
  const run = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setRunId(value => value + 1);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhase(reduced ? 'joined' : 'gather');
    if (reduced) { onComplete(); return; }
    timer.current = window.setTimeout(() => { setPhase('joined'); onComplete(); }, 1450);
  };

  return <div className="stitch-lesson">
    <LearningModule number="6.1" title="Stitched Verify · 联合观察">
      <p className="stitch-intro">在已观察的两个片段中，哪位是水䶄，穿什么颜色？先分别看两个不连续片段，再把视觉证据放进同一次观察。</p>
      <div className="stitch-lab">
      <div className={`stitch-canvas ${phase}`} aria-label={phase === 'separate' ? `当前仅观察片段 ${active}` : '两段采样帧进入同一个 Observer 视觉上下文'}>
        {phase === 'separate' ? <>
          <div className="stitch-canvas-head"><span>当前 Observer 视野 · 单片段</span><div className="stitch-switch" role="group" aria-label="切换当前观察片段">{ids.map(id => <button key={id} type="button" aria-pressed={active === id} onClick={() => view(id)}>{id} · {clips[id].start}–{clips[id].end}s</button>)}</div></div>
          <div className="stitch-single"><AnimalScene clip={active} time={currentTime}/><span>{active} · {timeLabel(currentTime)}</span></div>
          <div className="stitch-records">{ids.map(id => <span key={id}><b>{id} · {clips[id].start}–{clips[id].end}s</b> {seen[id] ? `${id === 'A' ? '蓝' : '白'}衣服的小动物` : '尚未查看'}</span>)}</div>
        </> : <>
          <div className="stitch-canvas-head"><span>同一个 Observer 视觉上下文</span><small>实际采样 {total}/128 帧 · 画布展示 {visible.reduce((sum, id) => sum + displayTimes(sampled[id]).length, 0)} 帧{requestedTotal > 128 ? ' · 已按比例缩减' : ''}</small></div>
          <div className="stitch-context-groups" key={runId}>{visible.length ? visible.map(id => <div className={`stitch-context-group from-${id.toLowerCase()}`} key={id}><div className="stitch-group-title"><b>{id} · {clips[id].start}–{clips[id].end}s</b><span>采样 {sampled[id].length} 帧 · 展示 {displayTimes(sampled[id]).length} 帧</span></div><Frames id={id} times={sampled[id]} highlight={phase === 'joined'}/>{phase === 'joined' && <small className="stitch-cue">{id === 'A' ? '无外露耳 · 尖鼻' : '圆耳 · 钝口鼻 · 细尾'}</small>}</div>) : <p>当前没有可用视觉帧。</p>}</div>
          {phase === 'joined' && <div className={`stitch-verdict${enough ? '' : ' insufficient'}`} role="status">{enough ? <><strong>蓝衣服角色是鼹鼠，白衣服角色是水䶄。</strong><span>在这两段已观察画面中，水䶄穿<strong>白色</strong>；无法确定未观察时段中的首次出现。</span></> : <strong>证据不足：需要两段可辨认的视觉帧，才能核对身份。</strong>}</div>}
        </>}
      </div>
      <div className="stitch-action"><button type="button" onClick={run} disabled={phase === 'gather'}>{phase === 'joined' ? '重新演示' : '联合观察'}</button><span>{phase === 'separate' ? '从分离画面，进入一次联合视觉观察' : phase === 'gather' ? '采样帧正在汇入同一视野…' : '两组画面保留在同一视野中'}</span></div>
      <details className="stitch-settings"><summary>采样设置 · A {ratesByClip.A} / B {ratesByClip.B} FPS</summary><div>{ids.map(id => <div className="stitch-setting-row" key={id}><label>{id} · {clips[id].start}–{clips[id].end}s <select aria-label={`片段 ${id} 采样率`} value={ratesByClip[id]} onChange={event => setRates(current => ({ ...current, [id]: Number(event.target.value) }))}>{rates.map(rate => <option key={rate} value={rate}>{rate} FPS</option>)}</select></label><span>实际 {sampled[id].length} 帧</span><label className="stitch-include"><input type="checkbox" checked={included[id]} onChange={() => setIncluded(current => ({ ...current, [id]: !current[id] }))}/>纳入联合观察</label></div>)}</div></details>
    </div></LearningModule>
  </div>;
}
