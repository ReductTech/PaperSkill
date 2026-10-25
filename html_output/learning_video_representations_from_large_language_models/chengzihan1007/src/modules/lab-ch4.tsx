import React, { useMemo, useState } from 'react';

type Props = { chapterId: string; moduleId: string };
const paper = '#17304e';
const blue = '#2766aa';
const green = '#258263';
const orange = '#d88133';
const purple = '#7855a1';
const muted = '#62748a';
const panel: React.CSSProperties = { border: '1px solid #d7e4ee', borderRadius: 16, padding: 18, background: '#f9fcff', margin: '14px 0' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' };
const pill = (active: boolean, color = blue): React.CSSProperties => ({ border: '1px solid ' + (active ? color : '#cbd8e3'), background: active ? color : '#fff', color: active ? '#fff' : paper, borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontWeight: 650 });
const note: React.CSSProperties = { color: muted, fontSize: 13, lineHeight: 1.55 };

const words = ['她', '打开', '冰箱', '取出', '牛奶'];
const hints = ['画面里出现一个人', '她的手拉开门', '门后能看到冰箱内侧', '手从里面拿东西', '手中是一瓶牛奶'];
const candidates = [
  '她从冰箱取出一瓶牛奶。',
  '一个人打开冰箱，拿出牛奶。',
  '她伸手到冰箱里取牛奶。',
  '有人将牛奶从冰箱中拿出来。',
  '她打开冰箱门，拿出一瓶奶。',
  '一个人从冰箱取出饮品。',
  '她在厨房打开冰箱并拿出牛奶。',
  '有人从打开的冰箱里取出奶瓶。',
  '她拿起冰箱里的牛奶。',
  '冰箱门打开后，她拿出了牛奶。'
];

function WordGeneration() {
  const [step, setStep] = useState(0);
  return <div className="lv-lab" style={panel}>
    <div style={note}>教学示意：每次点击生成一个词；论文描述的是逐词条件概率，不是下面这段视频的真实模型输出。</div>
    <div style={{ ...row, marginTop: 16 }}>
      {words.map((word, index) => <button key={index} type="button" onClick={() => setStep(index + 1)} aria-label={`查看第${index + 1}个词`} style={pill(index < step, green)}>{index < step ? word : '···'}</button>)}
    </div>
    <div style={{ ...panel, background: '#eff6fc', minHeight: 90 }}>
      <strong style={{ color: blue }}>视觉线索：</strong>{step === 0 ? '先看视频片段，准备写旁白。' : hints[step - 1]}<br />
      <strong style={{ color: purple }}>已有词：</strong>{step === 0 ? '尚无' : words.slice(0, step).join(' / ')}
    </div>
    <div style={row}>
      <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一个词</button>
      <button type="button" onClick={() => setStep(Math.min(words.length, step + 1))} disabled={step === words.length}>生成下一个词 →</button>
      <button type="button" onClick={() => setStep(0)}>重新开始</button>
    </div>
    <p className="lv-feedback" style={{ color: step === words.length ? green : paper }}>{step === words.length ? '整句完成：视觉条件和前文共同参与了每一步。' : `进度 ${step}/${words.length}：下一个词仍要回看画面与先前词。`}</p>
  </div>;
}

function AttentionXray() {
  const regions = [
    { key: '冰箱', detail: '冰箱门与内部空间' },
    { key: '手', detail: '伸出并抓取的手' },
    { key: '牛奶', detail: '被取出的牛奶瓶' }
  ];
  const tokens = ['打开', '取出', '牛奶'];
  const matches: Record<string, string> = { 打开: '冰箱', 取出: '手', 牛奶: '牛奶' };
  const [region, setRegion] = useState('冰箱');
  const [token, setToken] = useState('打开');
  const linked = matches[token] === region;
  return <div className="lv-lab" style={panel}>
    <div style={note}>概念示意：高亮线只解释“文本可读取视觉特征”的机制，不是模型真实注意力或可解释性测量。</div>
    <div className="lv-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 14 }}>
      <div style={{ ...panel, margin: 0, background: '#eaf3fa' }}><b>视频中的区域</b><div style={{ ...row, marginTop: 12 }}>{regions.map(r => <button type="button" key={r.key} onClick={() => setRegion(r.key)} style={pill(region === r.key, blue)}>{r.key}</button>)}</div><p>{regions.find(r => r.key === region)?.detail}</p></div>
      <div style={{ ...panel, margin: 0, background: '#f2edf9' }}><b>正在写的词</b><div style={{ ...row, marginTop: 12 }}>{tokens.map(t => <button type="button" key={t} onClick={() => setToken(t)} style={pill(token === t, purple)}>{t}</button>)}</div><p>当前 token：<strong>{token}</strong></p></div>
    </div>
    <svg viewBox="0 0 600 64" role="img" aria-label={linked ? '区域和词在教学示意中相对应' : '区域和词在教学示意中不对应'} style={{ width: '100%', height: 64, marginTop: 10 }}>
      <circle cx="65" cy="32" r="9" fill={blue}/><line x1="74" y1="32" x2="526" y2="32" stroke={linked ? green : orange} strokeWidth="4" strokeDasharray={linked ? '0' : '12 8'}/><circle cx="535" cy="32" r="9" fill={purple}/>
      <text x="300" y="22" fill={linked ? green : orange} textAnchor="middle" fontSize="16">{linked ? '示意关联较直接' : '请选择更对应的视觉区域'}</text>
    </svg>
    <p className="lv-feedback" style={{ color: linked ? green : orange }}>{linked ? `“${token}”从“${region}”区域读取相关视觉线索；语言模型仍结合已写词决定输出。` : `当前是“${token}”与“${region}”：试着选择与词义更直接对应的画面区域。`}</p>
  </div>;
}

function BuildNarrator() {
  const path = ['视频帧', '视觉编码器', 'Cross-attention', '语言解码器', '生成旁白'];
  const [chosen, setChosen] = useState<string[]>([]);
  const [message, setMessage] = useState('从视频帧开始，依次把五个部件接起来。');
  const add = (part: string) => {
    const next = path[chosen.length];
    if (part !== next) { setMessage(`还不能接入“${part}”：下一步需要“${next}”。`); return; }
    const result = [...chosen, part];
    setChosen(result);
    setMessage(result.length === path.length ? '路径完整：视觉编码器产生特征，Cross-attention 接入语言解码过程，最终逐词形成旁白。' : `已接入 ${part}。下一步：${path[result.length]}。`);
  };
  return <div className="lv-lab" style={panel}>
    <div style={note}>依据 Figure 4 的概念路径。请按数据流顺序组装；这里把内部网络简化为五个可操作节点。</div>
    <div style={{ ...row, marginTop: 14 }}>{path.map(part => <button type="button" key={part} onClick={() => add(part)} disabled={chosen.includes(part)} style={pill(chosen.includes(part), chosen.includes(part) ? green : blue)}>{part}</button>)}</div>
    <div style={{ ...panel, background: '#eef7f1', minHeight: 70 }}><b>你组装的路径</b><div style={{ ...row, marginTop: 10 }}>{chosen.length ? chosen.map((part, i) => <React.Fragment key={part}><span style={{ color: green, fontWeight: 700 }}>{part}</span>{i < chosen.length - 1 && <span>→</span>}</React.Fragment>) : <span style={{ color: muted }}>等待第一步……</span>}</div></div>
    <button type="button" onClick={() => { setChosen([]); setMessage('路径已清空，从视频帧重新开始。'); }}>重置路径</button>
    <p className="lv-feedback" style={{ color: chosen.length === path.length ? green : paper }}>{message}</p>
  </div>;
}

function SamplingDuel() {
  const records = [
    { id: 'beam', label: 'Beam search · K=1', score: 27.9, output: '她从冰箱取出牛奶。', point: '确定性搜索倾向较集中的候选。' },
    { id: 'n1', label: 'Nucleus · K=1', score: 29.6, output: '一个人打开冰箱，拿出牛奶。', point: '在该表的同一条件下，nucleus K=1 高于 beam K=1。' },
    { id: 'n10', label: 'Nucleus · K=10', score: 29.7, output: '她伸手到冰箱里取出牛奶。', point: '该表所列 nucleus K=10 为 29.7；并不能推出任何数据集都提升。' }
  ];
  const [id, setId] = useState('n10');
  const active = records.find(r => r.id === id)!;
  return <div className="lv-lab" style={panel}>
    <div style={note}>论文实测：p8 Table 7b，EK-100 MIR、zero-shot、平均 mAP（数值越高越好）。下方示例句仅演示采样风格，不是论文输出。</div>
    <div style={{ ...row, marginTop: 14 }}>{records.map(r => <button type="button" key={r.id} onClick={() => setId(r.id)} style={pill(id === r.id, green)}>{r.label}</button>)}</div>
    <div style={{ display: 'grid', gap: 7, marginTop: 18 }}>{records.map(r => <div key={r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(115px,190px) 1fr 42px', alignItems: 'center', gap: 9, opacity: r.id === id ? 1 : .62 }}><span style={{ fontWeight: r.id === id ? 700 : 400 }}>{r.label}</span><div style={{ height: 16, borderRadius: 9, background: '#e6edf3' }}><div style={{ width: (r.score / 32 * 100) + '%', height: '100%', borderRadius: 9, background: r.id === id ? green : '#a9bdcd' }}/></div><b>{r.score}</b></div>)}</div>
    <div style={{ ...panel, background: '#eef7f1' }}><b>当前：{active.label}</b><p>教学示意候选：“{active.output}”</p><p style={{ marginBottom: 0 }}>{active.point}</p></div>
  </div>;
}

function TopPool() {
  const [p, setP] = useState(0.95);
  const tokens = [
    { text: '取出', n: 42 }, { text: '放入', n: 27 }, { text: '看着', n: 16 }, { text: '端起', n: 10 }, { text: '丢下', n: 5 }
  ];
  const pool = useMemo(() => {
    let sum = 0;
    const selected: string[] = [];
    for (const t of tokens) { sum += t.n; selected.push(t.text); if (sum >= p * 100 - 0.001) break; }
    return { selected, sum };
  }, [p]);
  return <div className="lv-lab" style={panel}>
    <div style={note}>教学示意概率分布，非论文真实 token 概率。Top-p 取累计概率达到 p 的最小前缀候选集；论文默认 p=0.95。</div>
    <label style={{ display: 'block', marginTop: 14 }}>候选池阈值 <strong style={{ color: blue }}>p={p.toFixed(2)}</strong><input type="range" min="0.4" max="1" step="0.05" value={p} onChange={e => setP(Number(e.target.value))} style={{ width: '100%', accentColor: blue }}/></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(95px,1fr))', gap: 8, marginTop: 13 }}>{tokens.map(t => <div key={t.text} style={{ ...panel, margin: 0, padding: 10, textAlign: 'center', background: pool.selected.includes(t.text) ? '#e8f4ed' : '#f4f6f8', borderColor: pool.selected.includes(t.text) ? green : '#d7e4ee' }}><b>{t.text}</b><div>{t.n}%</div><small>{pool.selected.includes(t.text) ? '在池中' : '池外'}</small></div>)}</div>
    <p className="lv-feedback" style={{ color: green }}>当前纳入 {pool.selected.length} 个词，累计概率 {pool.sum}%。{Math.abs(p - .95) < .001 ? '这正是论文默认 p=0.95。' : '改动 p 会改变抽样范围；图中不是模型性能预测。'}</p>
  </div>;
}

function KDial() {
  const [k, setK] = useState(10);
  return <div className="lv-lab" style={panel}>
    <div style={note}>教学示意：句子是为了展示候选数量，不是论文原文输出。论文默认每片段 K=10，生成候选再用于扩充监督。</div>
    <label style={{ display: 'block', marginTop: 14 }}>每片段生成句数 <strong style={{ color: purple }}>K={k}</strong><input type="range" min="1" max="10" step="1" value={k} onChange={e => setK(Number(e.target.value))} style={{ width: '100%', accentColor: purple }}/></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 8, marginTop: 14 }}>{candidates.slice(0, k).map((t, i) => <div key={i} style={{ border: '1px solid #d9cbe9', background: '#f7f2fb', padding: 11, borderRadius: 11 }}><small style={{ color: purple }}>候选 {i + 1}</small><div>{t}</div></div>)}</div>
    <p className="lv-feedback" style={{ color: paper }}>{k === 1 ? '只有一条表述，语言选择少。' : `可见 ${k} 条不同表述；候选增多可以扩展语言形式，同时仍需检查是否与画面相符。`} {k === 10 ? '当前是论文默认 K=10。' : ''}</p>
  </div>;
}

export const Ch4Lab: React.FC<Props> = ({ moduleId }) => {
  if (moduleId === '4.1') return <WordGeneration />;
  if (moduleId === '4.2') return <AttentionXray />;
  if (moduleId === '4.3') return <BuildNarrator />;
  if (moduleId === '4.4') return <SamplingDuel />;
  if (moduleId === '4.5') return <TopPool />;
  if (moduleId === '4.6') return <KDial />;
  return null;
};
