import React, { useState } from 'react';

type Props = { chapterId: string; moduleId: string };
const blue = '#2766aa';
const green = '#258263';
const red = '#bd4859';
const orange = '#d88133';
const purple = '#7855a1';
const paper = '#17304e';
const muted = '#62748a';
const panel: React.CSSProperties = { border: '1px solid #d7e4ee', borderRadius: 16, padding: 18, background: '#f9fcff', margin: '14px 0' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' };
const pill = (active: boolean, color = blue): React.CSSProperties => ({ border: '1px solid ' + (active ? color : '#cbd8e3'), background: active ? color : '#fff', color: active ? '#fff' : paper, borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontWeight: 650 });
const note: React.CSSProperties = { color: muted, fontSize: 13, lineHeight: 1.55 };

const rewrites = [
  { text: '一个人把杯子放到桌上。', change: '把“她”换成“一个人”，保留放置动作与位置。' },
  { text: '杯子被她放在桌面上。', change: '调换语序，改成被动表达，动作和对象仍相同。' },
  { text: '她将杯子置于桌面。', change: '把“放到”换成“置于”，词汇更书面。' }
];
function RewriteTree() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  return <div className="lv-lab" style={panel}>
    <div style={note}>教学示意：论文 Rephraser 从已有文字生成改写，去重后保留三条候选。点根句展开，再选分支读差异。</div>
    <button type="button" onClick={() => { setOpen(!open); setSelected(null); }} style={{ ...pill(open, purple), width: '100%', textAlign: 'left', marginTop: 14 }}>原句：她把杯子放到桌上。 {open ? '− 收起分支' : '+ 展开三条改写'}</button>
    {open && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, marginTop: 14 }}>{rewrites.map((x, i) => <button type="button" key={i} onClick={() => setSelected(i)} style={{ ...panel, margin: 0, textAlign: 'left', cursor: 'pointer', background: selected === i ? '#e9f5ed' : '#f4eef9', borderColor: selected === i ? green : '#d9cbe9' }}><small style={{ color: purple }}>分支 {i + 1}</small><p style={{ marginBottom: 0 }}>{x.text}</p></button>)}</div>}
    <p className="lv-feedback" style={{ color: selected === null ? paper : green }}>{!open ? '展开原句，探索同一动作的三种说法。' : selected === null ? '三个分支都描述同一动作；点击任一分支查看变化。' : rewrites[selected].change}</p>
  </div>;
}

const changes = [
  { token: '一个人', kind: '指代', before: '她', after: '一个人', why: '人物指代更宽泛，但仍是同一个动作。' },
  { token: '杯子被她', kind: '语序', before: '她把杯子', after: '杯子被她', why: '主动/被动语序改变，杯子仍被放到桌面。' },
  { token: '置于', kind: '近义词', before: '放到', after: '置于', why: '词汇更书面，核心放置动作不变。' }
];
function WhatChanged() {
  const [index, setIndex] = useState(0);
  const active = changes[index];
  return <div className="lv-lab" style={panel}>
    <div style={note}>教学示意：试着找出每句发生变化的部分。Rephraser 追求措辞多样，保留视觉语义。</div>
    <div style={{ ...row, marginTop: 14 }}>{changes.map((x, i) => <button type="button" key={i} onClick={() => setIndex(i)} style={pill(index === i, purple)}>{x.token}</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 15 }}><div style={{ ...panel, margin: 0 }}><b>原来</b><p style={{ color: blue, fontSize: 21 }}>{active.before}</p></div><div style={{ ...panel, margin: 0, background: '#f5effa' }}><b>改写后</b><p style={{ color: purple, fontSize: 21 }}>{active.after}</p></div></div>
    <p className="lv-feedback" style={{ color: green }}><strong>{active.kind}变化：</strong>{active.why}</p>
  </div>;
}

const roleCases = [
  { input: '一段没有文字的视频片段', output: '她打开柜门。', answer: 'Narrator', why: '以视频为条件写出新文字，是 Narrator 的工作。' },
  { input: '已有文字：她打开柜门。', output: '一个人拉开橱柜门。', answer: 'Rephraser', why: '以已有文字为条件换一种说法，是 Rephraser 的工作。' },
  { input: '未标注的时间区间及其视频画面', output: '他从桌上拿起钥匙。', answer: 'Narrator', why: '在空白区间看画面生成 pseudo-caption，仍由 Narrator 负责。' },
  { input: '已有文字：他从桌上拿起钥匙。', output: '他拿起桌上的钥匙。', answer: 'Rephraser', why: '只改写已有句子，视频不是直接输入。' }
];
function WhichModel() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null, null]);
  const active = roleCases[index];
  const answer = answers[index];
  const choose = (model: string) => setAnswers(prev => prev.map((x, i) => i === index ? model : x));
  return <div className="lv-lab" style={panel}>
    <div style={note}>判断关键：模型的直接输入是视频还是文字。这里的示例句均为教学示意。</div>
    <div style={{ ...row, marginTop: 12 }}>{roleCases.map((_, i) => <button type="button" key={i} onClick={() => setIndex(i)} style={pill(index === i, answers[i] === null ? blue : answers[i] === roleCases[i].answer ? green : red)}>情境 {i + 1}{answers[i] === null ? '' : answers[i] === roleCases[i].answer ? ' ✓' : ' ×'}</button>)}</div>
    <div style={{ ...panel, background: '#eef5fb' }}><b>输入：</b>{active.input}<br/><b>候选输出：</b>{active.output}</div>
    <div style={row}><button type="button" onClick={() => choose('Narrator')} style={pill(answer === 'Narrator', blue)}>Narrator</button><button type="button" onClick={() => choose('Rephraser')} style={pill(answer === 'Rephraser', purple)}>Rephraser</button></div>
    <p className="lv-feedback" style={{ color: answer === null ? paper : answer === active.answer ? green : red }}>{answer === null ? '选择一个模型，查看依据。' : `${answer === active.answer ? '判断正确。' : '输入类型看反了。'} ${active.why} 论文定位：p4–5 §§4.1–4.2。`}</p>
  </div>;
}

function DriftMeter() {
  const [distance, setDistance] = useState(35);
  const sample = distance < 20
    ? { text: '她把杯子放到桌上。', label: '几乎没有改写', color: blue, why: '保留原义，但语言形式变化少。' }
    : distance < 50
    ? { text: '她将杯子置于桌面。', label: '适度换说法', color: green, why: '用近义表达，动作、对象和位置保持一致。' }
    : distance < 75
    ? { text: '她把东西放到附近。', label: '细节变模糊', color: orange, why: '杯子与桌面两个细节丢失，需要仔细检查。' }
    : { text: '她把盘子扔进水槽。', label: '偏离原义', color: red, why: '对象、动作、位置都变了，不宜当作同一片段的改写。' };
  return <div className="lv-lab" style={panel}>
    <div style={note}>概念教学示意；滑杆数值不是论文的语义相似度，也不是 Rephraser 的实测阈值。</div>
    <div style={{ ...panel, background: '#eff6fc', marginTop: 13 }}><b>原句</b><p>她把杯子放到桌上。</p></div>
    <label style={{ display: 'block' }}>示意改写距离 <strong style={{ color: purple }}>{distance}%</strong><input type="range" min="0" max="100" step="5" value={distance} onChange={e => setDistance(Number(e.target.value))} style={{ width: '100%', accentColor: purple }}/></label>
    <div style={{ ...panel, borderColor: sample.color, background: '#fff' }}><small style={{ color: sample.color }}>{sample.label}</small><p style={{ color: sample.color, fontSize: 20, fontWeight: 700, marginBottom: 0 }}>{sample.text}</p></div>
    <p className="lv-feedback" style={{ color: sample.color }}>{sample.why} 论文的要点是增加措辞多样性，同时保持描述与原视频语义一致。</p>
  </div>;
}

export const Ch6Lab: React.FC<Props> = ({ moduleId }) => {
  if (moduleId === '6.1') return <RewriteTree />;
  if (moduleId === '6.2') return <WhatChanged />;
  if (moduleId === '6.3') return <WhichModel />;
  if (moduleId === '6.4') return <DriftMeter />;
  return null;
};
