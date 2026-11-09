import { useState } from 'react';
const mmss = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function Timeline({ intervals, density, muted = false }: { intervals: [number, number][]; density: number; muted?: boolean }) {
  const markers = intervals.flatMap(([start, end], intervalIndex) => {
    const count = Math.max(2, Math.round((end - start) / (26 - density * 4)));
    return Array.from({ length: count }, (_, i) => ({ id:`${intervalIndex}-${i}`, x:start + (end - start) * i / Math.max(1, count - 1) }));
  });
  return <div className={`timeline ${muted ? 'muted' : ''}`} role="img" aria-label={`教学时间轴：观察 ${intervals.map(([a,b]) => `${mmss(a)} 到 ${mmss(b)}`).join('、')}，采样密度等级 ${density}`}>
    <div className="timeline-track"><div className="timeline-ruler"/>
      {[0,120,240,360,480,600].map(t => <div className="timeline-tick" style={{ left:`${t / 6}%` }} key={t}><i/><span>{mmss(t)}</span></div>)}
      <div className="timeline-event" style={{ left:'39%' }}><i/><span>候选线索</span></div><div className="timeline-event secondary" style={{ left:'81%' }}><i/><span>验证时刻</span></div>
      {intervals.map(([a,b],i) => <div className="observation-window" style={{ left:`${a / 6}%`, width:`${Math.max(1,(b-a)/6)}%` }} key={`${a}-${b}-${i}`}/>)}
      {markers.map(mark => <i className="sample-mark" style={{ left:`${mark.x / 6}%` }} key={mark.id}/>)}
    </div><div className="timeline-foot"><span>00:00 · 源视频</span><span>10:00</span></div>
  </div>;
}

type Step = { label:string; stage:string; thought:string; plan:string; call:string; evidence:string; intervals:[number,number][]; density:number };
const steps: Step[] = [
  { label:'读问题',stage:'QUESTION',thought:'视频里同一个物体在前后时刻是否被放回原处？目前没有视觉证据。',plan:'先找物体出现的候选区间。',call:'尚未调用',evidence:'无',intervals:[],density:1 },
  { label:'宽范围粗扫',stage:'SCAN SEARCH',thought:'需要定位物体及人物活动的大致时间。',plan:'对 00:00–10:00 做广域分片扫描。',call:'scan_observer · broad interval',evidence:'教学示意：02:20 左右发现拿起物体的线索。',intervals:[[0,600]],density:1 },
  { label:'局部细看',stage:'SEGMENT FOCUS',thought:'粗扫仅给出候选线索，拿起动作还需确认。',plan:'收窄到 02:12–02:40，并提高采样密度。',call:'segment_observer · 02:12–02:40',evidence:'教学示意：02:24 人物拿起物体；仍不知道后面是否放回。',intervals:[[132,160]],density:4 },
  { label:'回看后段',stage:'REPLAN',thought:'当前证据只回答了“拿起”，没有回答“放回”。',plan:'到后半段寻找状态改变的候选时间。',call:'scan_observer · 07:30–09:00',evidence:'教学示意：08:18 可能出现同一物体。',intervals:[[450,540]],density:2 },
  { label:'跨时刻核查',stage:'STITCHED VERIFY',thought:'要联合比较前后状态，避免只凭语言记录推断。',plan:'把 02:12–02:40 与 08:10–08:30 一起观察。',call:'stitched_observer · two intervals',evidence:'教学示意：联合证据支持物体被放回原位。',intervals:[[132,160],[490,510]],density:4 },
  { label:'结束',stage:'FINISH',thought:'关键前后状态已有相互对应的视觉证据。',plan:'给出基于证据的回答，标明时间。',call:'finish',evidence:'教学示意结论：02:24 拿起，08:18 左右放回。',intervals:[[132,160],[490,510]],density:3 }
];

export function InferenceSimulator({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const go = (index: number) => { setStep(index); if (index===steps.length-1) onComplete(); };
  return <div className="lab-card major-lab"><div className="lab-head"><div><span className="eyebrow">REASON–PLAN–OBSERVE SIMULATOR</span><h3>沿证据走完一次问答</h3></div><span className="tag-demo">教学示意</span></div><p className="lab-intro">该过程用于解释论文机制，不代表论文中某个具体样例的原始日志。真实代理可跳过或重排工具。</p>
    <div className="stepper" role="group" aria-label="模拟推理步骤">{steps.map((item,i) => <button className={step===i?'active':i<step?'done':''} onClick={() => go(i)} key={item.label}><span>{String(i+1).padStart(2,'0')}</span><small>{item.label}</small></button>)}</div>
    <div className="sim-grid"><div className="sim-main"><div className="sim-stage"><span>{current.stage}</span><strong>{current.label}</strong></div><Timeline intervals={current.intervals} density={current.density}/><div className="sim-question"><strong>QUESTION</strong><p>视频里同一个物体在前后时刻是否被放回原处？</p></div></div><div className="sim-log"><div><span>AGENT THOUGHT</span><p>{current.thought}</p></div><div><span>NEXT OBSERVATION PLAN</span><p>{current.plan}</p></div><div><span>TOOL CALL</span><code>{current.call}</code></div><div className="evidence"><span>TIMESTAMPED EVIDENCE</span><p>{current.evidence}</p></div></div></div>
    <div className="sim-controls"><button className="button-outline" disabled={step===0} onClick={() => go(step-1)}>← 上一步</button><span>{step+1} / {steps.length}</span><button className="button-primary" disabled={step===steps.length-1} onClick={() => go(step+1)}>下一步 →</button></div>
    <p className="source-caption">论文报告：§3 的工具及 §4.4 的多种行为；人物与物体情节、时间戳、调用顺序均为教学示意。</p></div>;
}
