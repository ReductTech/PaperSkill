import { useState } from 'react';
import './evidence-memory.css';

type ClipId = 'A' | 'B';
type Subject = { id: string; appearance: string; interval: string; identity: string; source: ClipId };
type Evidence = { kind: 'candidate' | 'verify'; clip: ClipId; start: number; end: number; times: number[]; appearance: string; cue: string; identity?: string };

const observations: Evidence[][] = [
  [{ kind: 'candidate', clip: 'A', start: 160, end: 176, times: [160, 168, 176], appearance: '蓝衣服、深色毛发', cue: '蓝衣服的小动物' }],
  [{ kind: 'candidate', clip: 'B', start: 310, end: 330, times: [310, 320, 330], appearance: '白衣服、棕色毛发', cue: '白衣服的小动物' }],
  [
    { kind: 'verify', clip: 'A', start: 160, end: 176, times: [168], appearance: '蓝衣服、深色毛发', cue: '尖鼻、无外露耳', identity: '鼹鼠' },
    { kind: 'verify', clip: 'B', start: 310, end: 330, times: [320], appearance: '白衣服、棕色毛发', cue: '圆耳、钝口鼻、细尾', identity: '水䶄' },
  ],
];

const formatTime = (time: number) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
const interval = (evidence: Evidence) => `${evidence.start}–${evidence.end}s`;

function updateMemory(previous: Subject[], newEvidence: Evidence[]): Subject[] {
  return newEvidence.reduce<Subject[]>((memory, evidence) => {
    const id = evidence.clip === 'A' ? 'Subject_01' : 'Subject_02';
    const existing = memory.find(subject => subject.id === id);
    if (existing) return memory.map(subject => subject.id === id
      ? { ...subject, identity: evidence.identity ?? subject.identity }
      : subject);
    return [...memory, {
      id, appearance: evidence.appearance, interval: interval(evidence),
      identity: evidence.identity ?? '待核实', source: evidence.clip,
    }];
  }, previous);
}

function Frame({ evidence, time, anchors }: { evidence: Evidence; time: number; anchors: boolean }) {
  // S7-local redraw of S6's animal scene. Scene geometry and anchor use the same simulated video time.
  const local = time - evidence.start;
  const x = Math.sin(local * 1.35) * 8;
  const bob = Math.sin(local * 2.7) * 3;
  const arm = Math.sin(local * 2.7 + 1) * 10;
  const vole = evidence.clip === 'B';
  const fur = vole ? '#a18b79' : '#79746e';
  const dark = vole ? '#6c554a' : '#4f504f';
  return <svg className="evidence-frame-svg" viewBox="0 0 320 190" role="img" aria-label={`${evidence.clip} 片段 ${formatTime(time)}，${evidence.cue}${anchors ? '；帧内可见时间戳' : '；帧内时间戳已隐藏'}`}>
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
    </g>
  </svg>;
}

function EvidenceFrames({ evidence, anchors }: { evidence: Evidence[]; anchors: boolean }) {
  return <div className={`evidence-frames${evidence.length === 2 ? ' verify' : ''}`}>
    {evidence.flatMap(item => item.times.map(time => <figure key={`${item.clip}-${time}`}>
      <div className="evidence-frame-view"><Frame evidence={item} time={time} anchors={anchors}/>{anchors && <span className="evidence-frame-anchor" aria-hidden="true">{formatTime(time)}</span>}</div>
      <figcaption>{item.clip} · {item.cue}</figcaption>
    </figure>))}
  </div>;
}

function SubjectRecords({ subjects, revised = false }: { subjects: Subject[]; revised?: boolean }) {
  return <div className="evidence-records" aria-live="polite">{subjects.map(subject => <div className={`evidence-record${revised ? ' revised' : ''}`} key={subject.id}>
    <div><strong>{subject.id}</strong><span>{subject.identity}</span></div>
    <p>{subject.appearance}</p><small>出现 {subject.interval} · 来源 {subject.source}</small>
  </div>)}</div>;
}

function reasonerLines(subjects: Subject[]) {
  return subjects.map(subject => `${subject.id}：${subject.identity === '待核实' ? subject.appearance : `${subject.identity}，${subject.appearance.split('、')[0]}`}，${subject.interval}`).join('。') + '。';
}

export function EvidenceMemoryLesson({ onComplete }: { onComplete: () => void }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [timestampAnchorsEnabled, setTimestampAnchorsEnabled] = useState(true);
  const visibleEvidence = observations[roundIndex];
  const subjectMemory = observations.slice(0, roundIndex + 1).reduce(updateMemory, [] as Subject[]);
  const next = () => {
    if (roundIndex < 2) {
      setRoundIndex(roundIndex + 1);
      if (roundIndex === 1) onComplete();
    }
  };
  const reset = () => { setRoundIndex(0); setTimestampAnchorsEnabled(true); };

  return <div className="evidence-memory-lesson">
    <p className="evidence-question">多轮观察后，怎样把看到的角色与发生时间留给下一轮推理？</p>
    <div className="evidence-lab">
      <div className="evidence-topline">
        <div><span className="eyebrow">EVIDENCE GROUNDING · {roundIndex + 1} / 3</span><strong>{['时间戳进入画面', '新增候选主体', '补充证据，修正记忆'][roundIndex]}</strong></div>
        <span className="source-badge demo">Figure 2 重绘 · 教学模拟</span>
      </div>
      <div className="evidence-columns">
        <section className="evidence-visual" aria-label="当前 Observer 可见视频帧">
          <div className="evidence-column-title"><strong>Observer 可见的采样帧</strong><span>{roundIndex === 2 ? '补充核验线索' : '片段 ' + visibleEvidence[0].clip + ' · ' + interval(visibleEvidence[0])}</span></div>
          <EvidenceFrames evidence={visibleEvidence} anchors={timestampAnchorsEnabled}/>
          <label className="evidence-toggle"><input type="checkbox" checked={timestampAnchorsEnabled} onChange={event => setTimestampAnchorsEnabled(event.target.checked)}/>显示时间戳</label>
          <p className="evidence-observation" role="status" aria-live="polite">{roundIndex === 2
            ? '沿用 S6 的补充核验结果：A 为尖鼻、无外露耳；B 为圆耳、钝口鼻、细尾。结合已观察片段核验身份。'
            : timestampAnchorsEnabled
              ? '有锚点：可将' + visibleEvidence[0].cue + '的观察描述追溯到 ' + interval(visibleEvidence[0]) + '。'
              : '无锚点：仍可描述' + visibleEvidence[0].cue + '；但这条观察描述缺少帧内时间来源，难以直接追溯。'}</p>
        </section>
        <section className="evidence-memory" aria-label="当前主体记忆表">
          <div className="evidence-column-title"><strong>Subject Memory Table</strong><span>本轮更新后 · {subjectMemory.length} 条</span></div>
          <div key={roundIndex}><SubjectRecords subjects={subjectMemory} revised={roundIndex === 2}/></div>
        </section>
      </div>
      <div className="evidence-reasoner" aria-live="polite"><strong>Observer 新证据 → Subject Memory 更新 → 下一轮 Reasoner 读取</strong><p>{reasonerLines(subjectMemory)}</p></div>
      <div className="evidence-actions"><button className="button-outline" type="button" disabled={roundIndex === 0} onClick={() => setRoundIndex(roundIndex - 1)}>上一步</button>{roundIndex < 2 ? <button className="button-primary" type="button" onClick={next}>下一轮观察 →</button> : <button className="button-primary" type="button" onClick={reset}>重新演示</button>}</div>
    </div>
    <p className="evidence-summary">时间锚点让观察可追溯；主体记忆保留并更新跨轮线索，供下一轮 Reasoner 规划观察。</p>
  </div>;
}
