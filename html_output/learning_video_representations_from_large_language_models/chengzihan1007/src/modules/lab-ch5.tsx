import React, { useState } from 'react';

type Props = { chapterId: string; moduleId: string };
const blue = '#2766aa';
const green = '#258263';
const red = '#bd4859';
const orange = '#d88133';
const paper = '#17304e';
const muted = '#62748a';
const panel: React.CSSProperties = { border: '1px solid #d7e4ee', borderRadius: 16, padding: 18, background: '#f9fcff', margin: '14px 0' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' };
const pill = (active: boolean, color = blue): React.CSSProperties => ({ border: '1px solid ' + (active ? color : '#cbd8e3'), background: active ? color : '#fff', color: active ? '#fff' : paper, borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontWeight: 650 });
const note: React.CSSProperties = { color: muted, fontSize: 13, lineHeight: 1.55 };

const slotCaptions = [
  '他拿起杯子。', '他把杯子放到水槽。', '他打开水龙头。', '水流冲过杯口。',
  '他关上水龙头。', '他拿起毛巾。', '他擦干杯子。', '他把杯子放回架上。'
];
function FillGaps() {
  const human = [0, 4];
  const [filled, setFilled] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [recaption, setRecaption] = useState<number[]>([]);
  const click = (i: number) => {
    setSelected(i);
    if (human.includes(i)) setRecaption(prev => prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i]);
    else setFilled(prev => prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i]);
  };
  return <div className="lv-lab" style={panel}>
    <div style={note}>教学示意：8 个等分区间，并非论文数据量。点有人工标注的位置得到 recaption；点空白位置切换 pseudo-caption。</div>
    <div style={{ ...row, marginTop: 14, marginBottom: 10 }}><span style={{ color: blue }}>● 人工标注</span><span style={{ color: green }}>● 伪描述</span><span style={{ color: '#7855a1' }}>● 已重新描述</span></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,minmax(34px,1fr))', gap: 5 }}>{slotCaptions.map((_, i) => {
      const isHuman = human.includes(i);
      const isPseudo = filled.includes(i);
      const isRecaption = recaption.includes(i);
      const bg = isRecaption ? '#eae2f5' : isHuman ? '#e8f1fb' : isPseudo ? '#e7f5ed' : '#f2f4f6';
      return <button type="button" key={i} onClick={() => click(i)} aria-label={`选择第${i + 1}个时间段`} style={{ border: selected === i ? '3px solid ' + orange : '1px solid #cbd8e3', background: bg, borderRadius: 9, minHeight: 70, padding: 4, color: paper, cursor: 'pointer' }}><small>{i * 5}–{(i + 1) * 5}s</small><div style={{ marginTop: 5 }}>{isHuman ? '人工' : isPseudo ? '伪描述' : '空白'}</div></button>;
    })}</div>
    <div style={{ ...panel, background: '#eef7f1' }}><b>时间轴反馈</b><p>{selected === null ? '选择任意时间段，查看生成方法。' : human.includes(selected) ? recaption.includes(selected) ? `第 ${selected + 1} 段已有人工标注：Narrator 补了一条 recaption，例如“${slotCaptions[selected]}”。再次点击可移除改写。` : `第 ${selected + 1} 段已有人工标注。点击可让 Narrator 在同一位置再写一条 recaption。` : filled.includes(selected) ? `第 ${selected + 1} 段原来空白：现加入 pseudo-caption“${slotCaptions[selected]}”。再次点击可移除。` : '这个区间尚无文字监督。'}</p><strong style={{ color: green }}>示意覆盖：{human.length + filled.length} / 8 段</strong></div>
    <button type="button" onClick={() => { setFilled([]); setRecaption([]); setSelected(null); }}>重置时间轴</button>
  </div>;
}

type Clip = { start: number; end: number };
function ClipDuration() {
  const [clips, setClips] = useState<Clip[]>([{ start: 0, end: 4 }, { start: 7, end: 13 }, { start: 18, end: 23 }]);
  const valid = clips.every(c => Number.isFinite(c.start) && Number.isFinite(c.end) && c.end > c.start && c.start >= 0);
  const mean = valid ? clips.reduce((sum, c) => sum + c.end - c.start, 0) / clips.length : null;
  const edit = (index: number, key: keyof Clip, value: number) => setClips(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c));
  return <div className="lv-lab" style={panel}>
    <div style={note}>三个可编辑片段均为教学示意。单位为秒；结束时间需晚于开始时间。</div>
    <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>{clips.map((c, i) => <div key={i} style={{ ...panel, margin: 0, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}><b>片段 {i + 1}</b><label>开始 <input type="number" min="0" step="0.5" value={c.start} onChange={e => edit(i, 'start', Number(e.target.value))} style={{ width: 72, marginLeft: 5 }}/></label><label>结束 <input type="number" min="0" step="0.5" value={c.end} onChange={e => edit(i, 'end', Number(e.target.value))} style={{ width: 72, marginLeft: 5 }}/></label><span style={{ marginLeft: 'auto', color: c.end > c.start ? green : red }}>时长 {Math.max(0, c.end - c.start).toFixed(1)} s</span></div>)}</div>
    <div style={{ ...panel, background: valid ? '#eaf6ef' : '#fff1f0', marginBottom: 0 }}><strong style={{ color: valid ? green : red }}>{valid ? `Δ = [${clips.map(c => (c.end - c.start).toFixed(1)).join(' + ')}] ÷ 3 = ${mean?.toFixed(2)} 秒` : '请修正片段：开始不能小于 0，且结束必须晚于开始。'}</strong><p style={{ marginBottom: 0 }}>论文用已标注片段平均时长作为采样尺度；这里的三个时间值只是计算练习。</p></div>
  </div>;
}

function QualityGate() {
  const [threshold, setThreshold] = useState(.5);
  const pairs = [
    { video: '画面：拿起苹果', caption: '文字：拿起水果', score: .82 },
    { video: '画面：打开抽屉', caption: '文字：拉开抽屉', score: .61 },
    { video: '画面：擦拭桌面', caption: '文字：移动盘子', score: .48 },
    { video: '画面：关闭柜门', caption: '文字：倒入水', score: .26 }
  ];
  const accepted = pairs.filter(x => x.score >= threshold).length;
  return <div className="lv-lab" style={panel}>
    <div style={note}>论文用已训练基线编码器的相似度筛选伪配对，实验门槛 0.5。这里每个分数都是教学示意，用来观察门槛机制。</div>
    <label style={{ display: 'block', marginTop: 14 }}>相似度门槛 <strong style={{ color: blue }}>{threshold.toFixed(2)}</strong><input type="range" min="0" max="1" step=".05" value={threshold} onChange={e => setThreshold(Number(e.target.value))} style={{ width: '100%', accentColor: blue }}/></label>
    <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>{pairs.map((x, i) => <div key={i} style={{ borderLeft: '5px solid ' + (x.score >= threshold ? green : red), background: x.score >= threshold ? '#edf8f1' : '#fff1f1', borderRadius: 8, padding: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 7 }}><span>{x.video} · {x.caption}</span><b>{x.score.toFixed(2)} · {x.score >= threshold ? '通过' : '过滤'}</b></div>)}</div>
    <p className="lv-feedback" style={{ color: green }}>通过 {accepted} / {pairs.length} 组教学示意配对。{Math.abs(threshold - .5) < .001 ? '当前为论文实验使用的 0.5。' : '改变阈值只演示接受数量变化，不预测真实训练结果。'}</p>
  </div>;
}

const judgeCases = [
  { video: '她把书放进书架。', text: '一个人把书放到架子上。', aligned: true, why: '动作与对象都一致：放书、书架。' },
  { video: '他正在切黄瓜。', text: '他把锅放在炉子上。', aligned: false, why: '文字说的是锅和炉子，画面动作是切黄瓜。' },
  { video: '一只手打开冰箱。', text: '有人拉开冰箱门。', aligned: true, why: '表达不同，但仍指同一视觉动作。' },
  { video: '她正在倒咖啡。', text: '她跑出了房间。', aligned: false, why: '文字描述的奔跑在画面中没有出现。' }
];
function HumanFilter() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null, null]);
  const item = judgeCases[index];
  const answer = answers[index];
  const vote = (value: boolean) => setAnswers(prev => prev.map((v, i) => i === index ? value : v));
  return <div className="lv-lab" style={panel}>
    <div style={note}>四个教学示意案例。先读画面和候选字幕，再决定是否作为训练配对保留。</div>
    <div style={{ ...row, marginTop: 12 }}>{judgeCases.map((_, i) => <button key={i} type="button" onClick={() => setIndex(i)} style={pill(index === i, answers[i] === null ? blue : answers[i] === judgeCases[i].aligned ? green : red)}>案例 {i + 1}{answers[i] === null ? '' : answers[i] === judgeCases[i].aligned ? ' ✓' : ' ×'}</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 9, marginTop: 15 }}><div style={{ ...panel, margin: 0, background: '#eaf3fa' }}><b>视频内容</b><p>{item.video}</p></div><div style={{ ...panel, margin: 0, background: '#f4eef9' }}><b>候选字幕</b><p>{item.text}</p></div></div>
    <div style={{ ...row, marginTop: 14 }}><button type="button" onClick={() => vote(true)} style={pill(answer === true, green)}>保留配对</button><button type="button" onClick={() => vote(false)} style={pill(answer === false, red)}>过滤配对</button></div>
    <p className="lv-feedback" style={{ color: answer === null ? paper : answer === item.aligned ? green : red }}>{answer === null ? '选择“保留”或“过滤”，立即查看依据。' : `${answer === item.aligned ? '判断正确。' : '再看一眼动作和对象。'} ${item.why} 论文方法使用基线编码器相似度进行自动筛选（p5 §4.1）。`}</p>
  </div>;
}

export const Ch5Lab: React.FC<Props> = ({ moduleId }) => {
  if (moduleId === '5.1') return <FillGaps />;
  if (moduleId === '5.2') return <ClipDuration />;
  if (moduleId === '5.3') return <QualityGate />;
  if (moduleId === '5.4') return <HumanFilter />;
  return null;
};
