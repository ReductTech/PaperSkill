import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Row = { label: string; value: number | null; tone?: 'green' | 'red' | 'orange' | 'blue'; note?: string };

function Segments({ items, value, onChange }: { items: string[]; value: number; onChange: (index: number) => void }) {
  return <div className="sv-segments">{items.map((item, index) => <button type="button" key={item} className={value === index ? 'active' : ''} onClick={() => onChange(index)}>{item}</button>)}</div>;
}

function Bars({ rows, max = 100, selected }: { rows: Row[]; max?: number; selected?: string }) {
  return <div className="sv-bars" role="img" aria-label="论文结果柱状图">{rows.map((row) => <div className={`sv-bar-row ${selected === row.label ? 'focus' : ''}`} key={row.label}>
    <div className="sv-bar-label"><span>{row.label}</span><b>{row.value === null ? '未报告' : row.value.toFixed(1)}</b></div>
    <div className="sv-bar-track"><i className={row.tone || 'blue'} style={{ width: row.value === null ? '0%' : `${Math.max(2, row.value / max * 100)}%` }} /></div>
    {row.note ? <small className="sv-row-note">{row.note}</small> : null}
  </div>)}</div>;
}

function Feedback({ tone = 'blue', children }: { tone?: 'blue' | 'green' | 'red' | 'orange'; children: React.ReactNode }) {
  return <div className={`sv-feedback ${tone}`}>{children}</div>;
}

export function HeroOld(_: WidgetProps) {
  const items = [
    ['架构', 'VLM、动作头各不相同'], ['预训练', '数据来源与规模不同'],
    ['机器人', '形态与动作接口不同'], ['评测', '基准优化与协议不同'],
  ];
  return <div className="sv-hero-board old"><div className="sv-hero-kicker">CURRENT LANDSCAPE</div><h3>复杂化与碎片化</h3><div className="sv-hero-grid">{items.map(([a, b]) => <div key={a}><b>{a}</b><span>{b}</span></div>)}</div><p>结果很强，但难以判断<strong>哪些复杂设计真正必要</strong>。</p></div>;
}

export function HeroNew(_: WidgetProps) {
  return <div className="sv-hero-board new"><div className="sv-hero-kicker">STARVLA-α</div><h3>强 VLM 驱动的极简基线</h3><div className="sv-formula-free"><b>Qwen3-VL</b><i>+</i><b>简单 MLP</b><i>+</i><b>最小处理</b></div><div className="sv-hero-proof"><span><b>98.8</b> LIBERO</span><span><b>53.8</b> RoboCasa</span><span><b>33.6</b> ARX5 实机</span></div><p>无需额外架构复杂度或重度工程技巧，也能取得<strong>有竞争力的性能</strong>。</p></div>;
}

export function EvidenceStub(_: WidgetProps) { return <div aria-hidden="true" />; }

export function IntroProblem(_: WidgetProps) {
  const cards = [
    { title: '数据与机器人异质性', points: ['预训练数据不同', '机器人形态不同', '动作接口不同'], result: '同一个分数可能来自完全不同的数据和机器人条件。' },
    { title: '建模与训练异质性', points: ['动作表示不同', '动作头不同', '训练策略不同'], result: '复杂模块与训练配方一起变化，无法拆出单项贡献。' },
    { title: '评测实践异质性', points: ['协议不同', '基准专属优化', '报告方式不同'], result: '跨论文排名不能直接说明某个设计更有效。' },
  ];
  const [idx, setIdx] = useState(0);
  return <div className="sv-panel"><div className="sv-three-cards">{cards.map((card, i) => <button type="button" key={card.title} onClick={() => setIdx(i)} className={idx === i ? 'active' : ''}><span>0{i + 1}</span><b>{card.title}</b>{card.points.map((point) => <small key={point}>{point}</small>)}</button>)}</div><Feedback tone="orange"><b>为什么难比较：</b>{cards[idx].result}</Feedback></div>;
}

export function Contributions(_: WidgetProps) {
  const items = [
    { n: '贡献一', title: '建立极简强基线', body: '提出一个简洁且强劲的 VLA 基线，排除关键混淆变量，证明精简的 VLM 设计可在覆盖 5 种机器人形态的 4 个基准上达到领先性能。' },
    { n: '贡献二', title: '重评三类常见实践', body: '在主干、数据与训练设置受控的条件下，系统重估常见 VLA 设计选型，发现额外的架构 / 数据工程复杂度带来的增益比通常认为的更小，且高度依赖场景。' },
    { n: '贡献三', title: '构建单一 Generalist', body: '进一步证明：跨基准联合训练的单一通用模型，无需任务专属适配，即可实现跨任务与跨形态泛化，其支撑来自强初始化与标准化流水线。' },
  ];
  const [idx, setIdx] = useState(0); const item = items[idx];
  return <div className="sv-panel"><div className="sv-stepper">{items.map((x, i) => <button type="button" key={x.n} className={i <= idx ? 'done' : ''} onClick={() => setIdx(i)}><span>{i + 1}</span><b>{x.n}</b></button>)}</div><div className="sv-detail-card"><small>{item.n}</small><h3>{item.title}</h3><p>{item.body}</p></div><Feedback tone="green">三项贡献共同指向同一目标：把 StarVLA-α 建成<b>简单、强劲、可系统分析</b>的 VLA 研究基线。</Feedback></div>;
}

export function Pipeline(_: WidgetProps) {
  const nodes = [
    { title: 'RGB + 指令', role: '唯一默认观测输入', detail: '直接使用原始 RGB 图像与自然语言指令，不依赖额外默认状态输入。' },
    { title: 'Qwen3-VL', role: '强 VLM 主干', detail: '负责统一理解视觉场景与语言任务，是性能能力的核心来源。' },
    { title: '动作 token', role: '动作语义汇聚', detail: '读取指定动作 token 的隐藏状态，作为动作预测的紧凑表示。' },
    { title: '简单 MLP', role: '轻量动作头', detail: '不引入双系统或复杂生成模块，直接把隐藏状态映射到动作。' },
    { title: '连续动作块', role: '机器人控制输出', detail: '一次输出一段连续动作；不同机器人只使用轻量接口适配。' },
  ];
  const [idx, setIdx] = useState(1); const node = nodes[idx];
  return <div className="sv-panel"><div className="sv-pipeline">{nodes.map((n, i) => <React.Fragment key={n.title}><button type="button" onClick={() => setIdx(i)} className={idx === i ? 'active' : ''}><span>{i + 1}</span><b>{n.title}</b><small>{n.role}</small></button>{i < nodes.length - 1 ? <i>→</i> : null}</React.Fragment>)}</div><div className="sv-detail-card compact"><small>当前节点</small><h3>{node.title}</h3><p>{node.detail}</p></div><Feedback tone="green">极简的关键不是删掉能力，而是把主要能力交给<b>强 VLM 主干</b>，动作侧只保留必要映射。</Feedback></div>;
}

export function BaselineResults(_: WidgetProps) {
  const sets = [
    { name: 'LIBERO', rows: [['OpenVLA-OFT', 97.1], ['π₀.₅', 96.9], ['GR00T', 97.0], ['StarVLA-α', 98.8]], note: 'StarVLA-α 达到 98.8，为该组最高。' },
    { name: 'WidowX', rows: [['OpenVLA-OFT', 31.3], ['π₀.₅', 46.9], ['GR00T', 62.0], ['StarVLA-α', 64.6]], note: '简单基线超过三种代表方法。' },
    { name: 'Google VM', rows: [['OpenVLA-OFT', 63.0], ['π₀.₅', 72.7], ['GR00T', 67.7], ['StarVLA-α', 76.0]], note: '在 Google VM 上达到 76.0。' },
    { name: 'RoboCasa', rows: [['OpenVLA-OFT', null], ['π₀.₅', 37.0], ['GR00T', 47.6], ['StarVLA-α', 53.8]], note: 'RoboCasa 上达到 53.8；未报告值不会被当作 0。' },
  ] as const;
  const [idx, setIdx] = useState(0); const set = sets[idx];
  const rows: Row[] = set.rows.map(([label, value]) => ({ label, value, tone: label === 'StarVLA-α' ? 'green' : 'blue' }));
  return <div className="sv-panel"><Segments items={sets.map((x) => x.name)} value={idx} onChange={setIdx} /><Bars rows={rows} selected="StarVLA-α" /><Feedback tone="green"><b>主结果：</b>{set.note}</Feedback><div className="sv-source">成功率（越高越好）· 论文 Table 1 · 只在同一基准内比较</div></div>;
}

export function HeadDesigns(_: WidgetProps) {
  const designs = [
    { name: 'MLP', type: '连续动作', level: 1, mechanism: '动作 token 隐藏状态 → 简单 MLP → 连续动作块', judgment: '本文默认设计：结构最简单，直接回归连续动作。' },
    { name: 'FAST', type: '离散动作', level: 2, mechanism: '动作序列离散化，再进行自回归预测', judgment: '额外引入动作 tokenizer 与离散生成。' },
    { name: 'GR00T-style', type: '连续动作', level: 3, mechanism: 'VLM 与流匹配动作专家组成双系统', judgment: '复杂度更高，但是否更强必须由 Table 2 回答。' },
    { name: 'π-style', type: '连续动作', level: 3, mechanism: '采用 diffusion-style flow matching 生成动作', judgment: '同样属于复杂连续动作头。' },
  ];
  const [idx, setIdx] = useState(0); const x = designs[idx];
  return <div className="sv-panel"><Segments items={designs.map((x) => x.name)} value={idx} onChange={setIdx} /><div className="sv-head-map"><div className="sv-node fixed"><small>固定</small><b>Qwen3-VL</b></div><i>→</i><div className={`sv-node level-${x.level}`}><small>{x.type}</small><b>{x.name}</b><span>{x.mechanism}</span></div><i>→</i><div className="sv-node fixed"><small>固定目标</small><b>机器人动作</b></div></div><Feedback tone={idx === 0 ? 'green' : 'blue'}>{x.judgment}</Feedback></div>;
}

export function HeadResults(_: WidgetProps) {
  const sets = [
    { name: 'LIBERO', values: [98.8, 97.8, 98.7, 98.1] },
    { name: 'WidowX', values: [64.6, 35.6, 65.3, 65.9] },
    { name: 'Google VM', values: [76.0, 60.1, 75.3, 76.6] },
    { name: 'RoboCasa', values: [53.8, 45.0, 52.8, 48.9] },
  ];
  const labels = ['MLP', 'FAST', 'GR00T-style', 'π-style']; const [idx, setIdx] = useState(1); const set = sets[idx];
  const rows: Row[] = labels.map((label, i) => ({ label, value: set.values[i], tone: label === 'MLP' ? 'green' : label === 'FAST' ? 'red' : 'blue' }));
  const complexBest = Math.max(set.values[2], set.values[3]); const mlp = set.values[0];
  return <div className="sv-panel"><Segments items={sets.map((x) => x.name)} value={idx} onChange={setIdx} /><Bars rows={rows} selected="MLP" /><div className="sv-comparison-strip"><span>MLP <b>{mlp.toFixed(1)}</b></span><span>最佳复杂连续头 <b>{complexBest.toFixed(1)}</b></span><span>差值 <b className={complexBest > mlp ? 'sv-red' : 'sv-green'}>{(complexBest - mlp >= 0 ? '+' : '') + (complexBest - mlp).toFixed(1)}</b></span></div><Feedback tone="green"><b>结论：</b>连续动作预测对高性能至关重要，始终优于离散 token 方法；当 VLM 足够强大时，连续动作头的具体选型影响有限。</Feedback><div className="sv-source">成功率（越高越好）· 论文 Table 2</div></div>;
}

export function Pretrain(_: WidgetProps) {
  const names = ['无额外预训练', 'OXE', 'InternData-A1', 'RoboTwin-Rand'];
  const datasets = [
    { name: 'RoboTwin', values: [[50.3, 78.5, 88.2], [30.2, 40.6, 83.6], [63.6, 80.4, 88.6], [79.7, 84.1, 88.8]] },
    { name: 'RoboCasa', values: [[9.8, 39.4, 53.8], [1.2, 17.7, 27.8], [2.8, 27.6, 35.4], [2.2, 27.3, 33.3]] },
  ];
  const [dataset, setDataset] = useState(0); const [amount, setAmount] = useState(0); const [selected, setSelected] = useState(3); const current = datasets[dataset]; const base = current.values[0][amount];
  const rows: Row[] = names.map((label, i) => ({ label, value: current.values[i][amount], tone: i === 0 ? 'blue' : current.values[i][amount] >= base ? 'green' : 'red', note: i === selected ? `相对无额外预训练 ${(current.values[i][amount] - base >= 0 ? '+' : '')}${(current.values[i][amount] - base).toFixed(1)}` : undefined }));
  const delta = current.values[selected][amount] - base;
  const amountLabels = dataset === 0 ? ['Clean 50×50', '+Random×100', '+Random×500'] : ['24×10', '24×100', '24×1000'];
  return <div className="sv-panel"><div className="sv-toolbar"><div><small>目标任务</small><Segments items={datasets.map((x) => x.name)} value={dataset} onChange={(i) => { setDataset(i); setSelected(i === 0 ? 3 : 1); }} /></div><div><small>目标数据量</small><Segments items={amountLabels} value={amount} onChange={setAmount} /></div></div><div onClick={(event) => { const target = (event.target as HTMLElement).closest('[data-row]') as HTMLElement | null; if (target) setSelected(Number(target.dataset.row)); }}>{rows.map((row, i) => <button type="button" className={`sv-selectable-bar ${selected === i ? 'active' : ''}`} data-row={i} key={row.label}><span>{row.label}</span><div><i className={row.tone} style={{ width: `${Math.max(2, (row.value || 0))}%` }} /></div><b>{row.value?.toFixed(1)}</b></button>)}</div><Feedback tone={delta > 1 ? 'green' : delta < -1 ? 'red' : 'blue'}><b>{names[selected]}</b> 相对无额外预训练：<strong>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}</strong>。{dataset === 0 && selected === 3 && amount === 0 ? '预训练数据与目标任务高度匹配时可明显提升性能。' : dataset === 1 && selected > 0 ? '额外动作预训练跨到未见领域时可能损害泛化。' : '强 VLM 已提供扎实基础，进一步预训练需结合数据匹配程度谨慎判断。'}</Feedback><div className="sv-source">成功率（越高越好）· 论文 Table 3</div></div>;
}

export function DataEngineering(_: WidgetProps) {
  const names = ['基线', '本体状态', '历史帧', 'Delta action', 'Relative action'];
  const values = [[9.8, 39.4, 53.8], [12.5, 42.1, 54.2], [10.2, 33.2, 52.6], [15.8, 43.2, 54.8], [13.6, 40.6, 55.5]];
  const [amount, setAmount] = useState(0); const base = values[0][amount];
  const rows: Row[] = names.map((label, i) => ({ label, value: values[i][amount], tone: i === 0 ? 'blue' : values[i][amount] >= base ? 'green' : 'red', note: i === 0 ? '参照' : `${values[i][amount] - base >= 0 ? '+' : ''}${(values[i][amount] - base).toFixed(1)}` }));
  return <div className="sv-panel"><div className="ctrl"><label>RoboCasa 目标数据量</label><input aria-label="RoboCasa 目标数据量" type="range" min="0" max="2" step="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><span className="val">{['24×10', '24×100', '24×1000'][amount]}</span></div><Bars rows={rows} /><Feedback tone={amount === 0 ? 'green' : amount === 1 ? 'blue' : 'orange'}>{amount === 0 ? '24×10 表示 24 个任务、每个任务 10 条演示；任务数据有限时，工程技巧可带来适度收益。' : amount === 1 ? '24×100 表示 24 个任务、每个任务 100 条演示；部分设计仍有小幅差异。' : '24×1000 表示 24 个任务、每个任务 1000 条演示；任务数据充足后，工程设计的影响可忽略不计。'}</Feedback><div className="sv-source">成功率（越高越好）· 论文 Table 4</div></div>;
}

export function GeneralistProtocol(_: WidgetProps) {
  const modes = [
    { name: 'Specialist', rows: [['训练方式', '每个基准单独训练'], ['模型数量', '多个模型'], ['评测方式', '各自最擅长的基准'], ['能说明什么', '单基准专门能力']], feedback: 'Specialist 的单点高分不能直接回答一个模型是否同时保持多任务能力。' },
    { name: 'Generalist', rows: [['训练方式', '四类基准联合训练'], ['模型数量', '一个模型'], ['评测方式', '不做基准特定微调'], ['能说明什么', '多任务、多形态同时保持']], feedback: 'Generalist 用一个模型接受所有目标基准的联合检验，更接近论文所说的通用智能体评估。' },
  ];
  const [idx, setIdx] = useState(1); const x = modes[idx];
  return <div className="sv-panel"><Segments items={modes.map((x) => x.name)} value={idx} onChange={setIdx} /><div className="sv-protocol-grid">{x.rows.map(([a, b]) => <div key={a}><small>{a}</small><b>{b}</b></div>)}</div><Feedback tone={idx === 1 ? 'green' : 'orange'}>{x.feedback}</Feedback>{idx === 1 ? <div className="sv-boundary"><b>证据边界</b><span>所有目标 benchmark 数据都参加联合训练；这不是对未见机器人或未见基准的零样本测试。</span></div> : null}</div>;
}

export function GeneralistResults(_: WidgetProps) {
  const benchmarks = [
    ['LIBERO', 98.8, 97.8], ['WidowX', 64.6, 65.2], ['Google VA', 70.2, 69.8], ['Google VM', 76.0, 74.3], ['RoboTwin clean*', 88.2, 88.7], ['RoboTwin random*', 88.3, 87.8], ['RoboCasa', 53.8, 57.3],
  ] as const;
  const interfaces = [
    { name: 'RDT', values: [97.2, 63.9, 68.2, 71.4, 87.2, 86.6, 52.3] },
    { name: 'Multi Head', values: [97.2, 60.6, 66.3, 67.8, 85.6, 86.1, 53.5] },
    { name: 'Simple Padding', values: [97.8, 65.2, 69.8, 74.3, 88.7, 87.8, 57.3] },
  ];
  const [view, setView] = useState(0); const [idx, setIdx] = useState(6); const b = benchmarks[idx];
  const rows: Row[] = view === 0 ? [{ label: 'Specialist', value: b[1], tone: 'blue' }, { label: 'Generalist', value: b[2], tone: 'green' }] : interfaces.map((x) => ({ label: x.name, value: x.values[idx], tone: x.name === 'Simple Padding' ? 'green' : 'blue' }));
  return <div className="sv-panel"><Segments items={['Specialist vs Generalist', '跨机器人动作接口']} value={view} onChange={setView} /><Segments items={benchmarks.map((x) => x[0])} value={idx} onChange={setIdx} /><Bars rows={rows} selected={view === 0 ? 'Generalist' : 'Simple Padding'} /><Feedback tone="green">{view === 0 ? `在 ${b[0]} 上，Generalist 为 ${b[2].toFixed(1)}，Specialist 为 ${b[1].toFixed(1)}；一个模型总体保持了竞争力。` : `在 ${b[0]} 上，简单补零接口达到 ${interfaces[2].values[idx].toFixed(1)}，并在 Table 6 所列结果中整体最稳。`}</Feedback><div className="sv-source">成功率（越高越好）· 论文 Tables 5–6</div><Feedback tone="blue">单一模型可有效处理多样任务与机器人形态，为具身 AI 发展更统一的评估范式提供了支撑。对于高难度跨形态任务，复杂的专家式设计或许并非必需。</Feedback></div>;
}

export function GeneralistFactors(_: WidgetProps) {
  return <div className="sv-panel"><figure className="paper-figure"><a href="/images/starvla-figure5.png" target="_blank" rel="noreferrer" aria-label="打开论文 Figure 5 原图"><img src="/images/starvla-figure5.png" alt="论文 Figure 5：VLA 训练中的模型大小与批大小扩展趋势" /></a><figcaption>来源：论文 Figure 5</figcaption></figure><Feedback tone="green"><b>模型规模：</b>2B 到 4B 提升明显，而 4B 到 8B 的进一步增益不足 1%。</Feedback><Feedback tone="blue"><b>批大小：</b>性能随批大小增大持续提升，说明训练多样性是通用设置中的关键因素。</Feedback></div>;
}

export function RealWorld(_: WidgetProps) {
  const modes = [
    { name: '平均成功率', rows: [['StarVLA-α', 33.6], ['π₀.₅', 12.7], ['π₀', 3.6]], note: 'StarVLA-α 比 π₀.₅ 高 20.9 个百分点。' },
    { name: '平均进度分', rows: [['StarVLA-α', 54.5], ['π₀.₅', 27.6], ['π₀', 14.7]], note: '即使任务未完全成功，StarVLA-α 也能取得更高完成进度。' },
  ] as const;
  const [idx, setIdx] = useState(0); const x = modes[idx]; const rows: Row[] = x.rows.map(([label, value]) => ({ label, value, tone: label === 'StarVLA-α' ? 'green' : 'blue' }));
  return <div className="sv-panel"><Segments items={modes.map((x) => x.name)} value={idx} onChange={setIdx} /><div className="sv-real-grid"><div><h3>ARX5 · RoboChallenge</h3><p>11 个真实机器人任务</p><span>统一比较 StarVLA-α、π₀.₅ 与 π₀</span></div><Bars rows={rows} max={100} selected="StarVLA-α" /></div><Feedback tone="green">{x.note}</Feedback><div className="sv-boundary"><b>现实边界</b><span>33.6% 是明显的相对优势，但绝对成功率仍不足以支持可靠部署。</span></div><div className="sv-source">成功率 / 进度分（越高越好）· 论文 Table 7</div></div>;
}

export function Conclusion(_: WidgetProps) {
  const steps = [
    { title: '极简基线先证明“足够强”', body: 'Qwen3-VL + 简单连续 MLP + 最小处理，在四类公开基准上达到高度竞争的性能。' },
    { title: '三类常见复杂设计被重新评估', body: '复杂连续动作头没有稳定优势；专属预训练与数据工程的价值都依赖域匹配和数据量。' },
    { title: 'Generalist 与实机补上可推广证据', body: '单一模型联合覆盖多基准、多形态，并在 ARX5 真实机器人上显著超过对照。' },
    { title: '论文最终结论', body: '复杂动作头、重度数据工程与任务专属预训练，并非构建通用机器人智能体的严格必要条件。' },
  ];
  const [idx, setIdx] = useState(0); const x = steps[idx];
  return <div className="sv-panel"><div className="sv-stepper conclusion">{steps.map((step, i) => <button type="button" key={step.title} onClick={() => setIdx(i)} className={i <= idx ? 'done' : ''}><span>{i + 1}</span><b>{i === 3 ? '结论' : `证据 ${i + 1}`}</b></button>)}</div><div className="sv-detail-card final"><small>{idx === 3 ? '论文 §7' : '证据链'}</small><h3>{x.title}</h3><p>{x.body}</p></div><div className="sv-final-line">依托<strong>强大的 VLM 主干、简单的 MLP 动作头与最小数据处理</strong>，StarVLA-α 为简洁、可复现、可推广的 VLA 研究提供了坚实起点。</div></div>;
}
