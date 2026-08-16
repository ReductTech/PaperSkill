import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { CookingIntro } from '../components/CookingIntro';

function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="hd-widget reveal-on-scroll">
      <header className="hd-widget-head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      <div className="hd-widget-body">{children}</div>
    </section>
  );
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return <span className={`hd-mini-pill ${active ? 'is-active' : ''}`}>{children}</span>;
}

export function DataSourcesDedupModule(_props: WidgetProps) {
  const sources = [
    { name: '网页图文', hint: '新闻站点、教程页、博客', tone: 'text' },
    { name: '社交图像', hint: '社区分享、短内容平台', tone: 'cond' },
    { name: '电商商品', hint: '商品页、详情页、主图', tone: 'gen' },
    { name: '学术图表', hint: '论文图、表格、插图', tone: 'text' },
    { name: '开源数据', hint: 'LAION、公开语料与合集', tone: 'cond' },
    { name: '合成数据', hint: '模型生成、筛选再入库', tone: 'gen' },
  ] as const;

  const steps = [
    { title: '六源汇总', body: '先把训练数据按来源分开看，避免把不同风格和场景混成一团。' },
    { title: 'SSCD 语义去重', body: '用语义相似度而不是文件名判断重复，保留真正有差异的样本。' },
    { title: 'Faiss 快速检索', body: '借助 Faiss 快速找近邻，让大规模去重可以跑得动。' },
    { title: '留下高价值样本', body: '删掉重复和近重复后，训练集会更稀疏，也更有信息量。' },
  ];

  const [active, setActive] = useState(1);
  const current = steps[active];

  return (
    <Frame title="S2. 数据获取和去重" subtitle="先看六大来源，再用 SSCD + Faiss 做语义去重。">
      <CookingIntro mode="source" />
      <div className="hd-section-note">
        <strong>核心要点</strong>
        <p>这一节先把训练语料的入口理清，再把重复和近重复样本清掉。</p>
      </div>

      <div className="hd-source-grid">
        {sources.map((item, idx) => (
          <div key={item.name} className="hd-source-card">
            <Pill active={idx < 2}>{item.name}</Pill>
            <div className="hd-source-hint">{item.hint}</div>
            <div className={`hd-source-line ${item.tone}`} />
          </div>
        ))}
      </div>

      <div className="hd-chip-row">
        {steps.map((step, idx) => (
          <button key={step.title} type="button" className={`chip ${idx === active ? 'selected' : ''}`} onClick={() => setActive(idx)}>
            {step.title}
          </button>
        ))}
      </div>

      <div className="hd-step-card">
        <strong>{current.title}</strong>
        <p>{current.body}</p>
      </div>
    </Frame>
  );
}

export function QualityFilterChallengeModule(_props: WidgetProps) {
  const items = [
    { name: '安全性', score: 0.12, tag: '风险', kind: 'bad' },
    { name: '审美性', score: 0.88, tag: '优质', kind: 'good' },
    { name: '图文一致', score: 0.91, tag: '优质', kind: 'good' },
    { name: '构图稳定', score: 0.83, tag: '优质', kind: 'good' },
    { name: '模糊样本', score: 0.27, tag: '风险', kind: 'bad' },
    { name: '细节丰富', score: 0.95, tag: '优质', kind: 'good' },
  ] as const;

  const modes = [
    { title: '安全过滤', desc: '先拦掉明显风险样本，减少训练中的安全问题。' },
    { title: '审美过滤', desc: '保留清晰、完整、构图稳定的样本。' },
    { title: '一致性过滤', desc: '让图像内容和文字描述尽量说同一件事。' },
  ];
  const [mode, setMode] = useState(0);

  return (
    <Frame title="S3. 数据质量过滤" subtitle="安全、审美和图文一致性三道关一起过。">
      <CookingIntro mode="filter" />
      <div className="hd-section-note">
        <strong>核心要点</strong>
        <p>去重之后还不够，还要继续做安全、审美和一致性过滤。</p>
      </div>

      <div className="hd-filter-grid">
        {items.map((item) => (
          <div key={item.name} className={`hd-filter-card ${item.kind}`}>
            <div className="hd-filter-top">
              <strong>{item.name}</strong>
              <span>{item.tag}</span>
            </div>
            <div className="hd-progress">
              <div className="hd-progress-bar" style={{ width: `${item.score * 100}%` }} />
            </div>
            <small>{Math.round(item.score * 100)}%</small>
          </div>
        ))}
      </div>

      <div className="hd-chip-row">
        {modes.map((m, idx) => (
          <button key={m.title} type="button" className={`chip ${idx === mode ? 'selected' : ''}`} onClick={() => setMode(idx)}>
            {m.title}
          </button>
        ))}
      </div>

      <div className="hd-step-card">
        <strong>{modes[mode].title}</strong>
        <p>{modes[mode].desc}</p>
      </div>
    </Frame>
  );
}

export function PromptConstructionWorkshop(_props: WidgetProps) {
  const templates = [
    { id: 't2i', title: 'T2I 提示', lead: '生成任务会强调主体、场景和风格。', text: '一只宇航员骑马的油画，星空背景，细腻笔触' },
    { id: 'edit', title: '编辑提示', lead: '编辑任务会强调“保留什么”和“替换什么”。', text: '保留人物姿态，替换背景为草地与夕阳' },
    { id: 'mmu', title: '多模态理解', lead: '理解任务会更关注对象、关系和属性。', text: '图中人物是谁？与场景中的物体有什么关系？' },
  ] as const;

  const [mode, setMode] = useState(0);
  const current = templates[mode];
  const cards = useMemo(
    () => [
      { title: '视觉输入', body: 'Qwen3-VL 先读取图像内容，再结合任务目标生成标注。' },
      { title: '任务类型', body: current.title },
      { title: '自动标注', body: current.lead },
      { title: '训练提示', body: current.text },
    ],
    [current],
  );

  return (
    <Frame title="S4. 提示词构建" subtitle="Qwen3-VL 不是只做图片描述，而是按任务生成不同格式的训练提示。">
      <CookingIntro mode="prompt" />
      <div className="hd-section-note">
        <strong>核心要点</strong>
        <p>同一张图在不同任务里需要不同的提示格式，自动标注要先识别任务，再生成提示。</p>
      </div>

      <div className="hd-chip-row">
        {templates.map((item, idx) => (
          <button key={item.id} type="button" className={`chip ${idx === mode ? 'selected' : ''}`} onClick={() => setMode(idx)}>
            {item.title}
          </button>
        ))}
      </div>

      <div className="hd-prompt-grid">
        {cards.map((card) => (
          <div key={card.title} className="hd-prompt-card">
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}
