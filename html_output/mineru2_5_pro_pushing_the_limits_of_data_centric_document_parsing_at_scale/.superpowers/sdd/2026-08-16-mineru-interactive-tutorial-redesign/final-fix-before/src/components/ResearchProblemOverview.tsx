import React, { useEffect, useRef, useState } from 'react';
import '../styles/research-overview.css';
import { GlossaryText } from './Glossary';

const ABSTRACT_URL = 'https://arxiv.org/html/2604.04771v2#abstract';

const FLOW_STEPS = [
  {
    short: '现象',
    title: '不同模型，一起卡在同样的难题上',
    answer: '先观察跨架构、跨规模模型的共同失败。',
  },
  {
    short: '诊断',
    title: '瓶颈更可能藏在训练数据里',
    answer: '重点检查覆盖不足与难例标注不可靠。',
  },
  {
    short: '方案',
    title: '把数据、训练和评测连成闭环',
    answer: 'Data Engine、三阶段训练与 v1.6 评测共同工作。',
  },
  {
    short: '证据',
    title: '固定 1.2B 架构，Full 提升 2.71',
    answer: '92.98 → 95.69，增益来自数据工程与训练策略。',
  },
] as const;

function SharedFailureFigure() {
  return (
    <div className="research-overview__failure-figure" aria-label="不同架构和规模的模型在同一类困难文档上共同失败">
      <div className="research-overview__model-stack">
        {['专用解析模型', '不同规模模型', '通用 VLM'].map((label, index) => (
          <div className="research-overview__model" key={label} style={{ '--model-order': index } as React.CSSProperties}>
            <span aria-hidden="true" />
            <b><GlossaryText text={label} /></b>
            <small>输出有误</small>
          </div>
        ))}
      </div>
      <div className="research-overview__converge" aria-hidden="true">
        <i /><i /><i />
      </div>
      <div className="research-overview__hard-page">
        <span className="research-overview__page-line" />
        <span className="research-overview__page-line research-overview__page-line--short" />
        <span className="research-overview__formula">∑ xᵢ = α · β</span>
        <span className="research-overview__table-grid" aria-hidden="true"><i /><i /><i /><i /></span>
        <b>同一个 Hard 样本</b>
        <em aria-label="解析失败">×</em>
      </div>
    </div>
  );
}

function DataProblemFigure() {
  return (
    <div className="research-overview__problem-pair">
      <article className="research-overview__problem-card research-overview__problem-card--coverage">
        <div className="research-overview__sample-cloud" aria-hidden="true">
          {Array.from({ length: 11 }, (_, index) => <i key={index} />)}
          <i className="is-tail" /><i className="is-tail" />
        </div>
        <div>
          <span>问题 01</span>
          <h4>覆盖不足</h4>
          <p><GlossaryText text="普通单栏页面很多，复杂表格、密集公式等长尾场景太少。" /></p>
        </div>
      </article>
      <article className="research-overview__problem-card research-overview__problem-card--label">
        <div className="research-overview__annotation-sheet" aria-hidden="true">
          <code>{'\\begin{aligned}'}</code>
          <code>L = L₁ + L₂</code>
          <code className="is-error">{'\\end{array}'}</code>
          <span>?</span>
        </div>
        <div>
          <span>问题 02</span>
          <h4>难例标注不可靠</h4>
          <p>越有训练价值的困难样本，主流模型越难自动给出可信答案。</p>
        </div>
      </article>
    </div>
  );
}

function CoreWorkFigure() {
  const works = [
    {
      index: '01',
      name: 'Data Engine',
      detail: 'DDAS 扩覆盖 · CMCV 判难度 · Judge-and-Refine 保标注',
      visual: <><i /><i /><i /><b>DATA</b></>,
    },
    {
      index: '02',
      name: '三阶段训练',
      detail: '大规模预训练 → Hard 微调 → GRPO 对齐',
      visual: <><i /><i /><i /><b>TRAIN</b></>,
    },
    {
      index: '03',
      name: 'OmniDocBench v1.6',
      detail: '修正元素匹配偏差 · 加入更有区分度的 Hard 子集',
      visual: <><i /><i /><i /><b>EVAL</b></>,
    },
  ];

  return (
    <div className="research-overview__works">
      {works.map((work, index) => (
        <article className="research-overview__work-card" key={work.name} style={{ '--work-order': index } as React.CSSProperties}>
          <div className="research-overview__work-visual" aria-hidden="true">{work.visual}</div>
          <span>{work.index} · 核心工作</span>
          <h4><GlossaryText text={work.name} /></h4>
          <p><GlossaryText text={work.detail} /></p>
        </article>
      ))}
    </div>
  );
}

function ResultFigure() {
  return (
    <div className="research-overview__result-figure">
      <div className="research-overview__locked-architecture">
        <span className="research-overview__lock" aria-hidden="true"><i /></span>
        <div><small>架构保持不变</small><strong>1.2B</strong><b>MinerU2.5</b></div>
      </div>
      <div className="research-overview__score-track" aria-label="OmniDocBench v1.6 Full 分数从 92.98 提升到 95.69">
        <div><small>同架构基线</small><b>92.98</b></div>
        <span aria-hidden="true"><i /></span>
        <div className="is-pro"><small>MinerU2.5-Pro</small><b>95.69</b></div>
      </div>
      <div className="research-overview__gain"><strong>+2.71</strong><span>OmniDocBench v1.6 · Full</span></div>
    </div>
  );
}

const STAGE_FIGURES = [
  <SharedFailureFigure key="failure" />,
  <DataProblemFigure key="problems" />,
  <CoreWorkFigure key="works" />,
  <ResultFigure key="result" />,
];

export function ResearchProblemOverview() {
  const rootRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = rootRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      setHasEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered || reduceMotionRef.current) return;
    setAutoRunning(true);
  }, [hasEntered]);

  useEffect(() => {
    if (!autoRunning) return undefined;
    if (activeStep >= FLOW_STEPS.length - 1) {
      setAutoRunning(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setActiveStep((step) => step + 1), 1550);
    return () => window.clearTimeout(timer);
  }, [activeStep, autoRunning]);

  const chooseStep = (index: number) => {
    setAutoRunning(false);
    setActiveStep(index);
  };

  const replay = () => {
    setActiveStep(0);
    if (!reduceMotionRef.current) setAutoRunning(true);
  };

  const step = FLOW_STEPS[activeStep];

  return (
    <section className="research-overview" id="research-problem" ref={rootRef} aria-labelledby="research-overview-title">
      <header className="research-overview__intro">
        <span className="eyebrow">先读懂问题，再进入方法</span>
        <h2 id="research-overview-title">这篇论文解决的，不是“怎样换一个更大的模型”</h2>
        <p>
          <GlossaryText text="文档解析要把 PDF 等页面恢复成机器可读的内容与结构，是大模型训练数据管线和检索增强生成的重要基础设施。论文追问的是：当主流模型在普通测试上已经十分接近，剩下的困难错误究竟卡在哪里？" />
        </p>
      </header>

      <div className="research-overview__thesis">
        <div>
          <span>论文观察</span>
          <strong><GlossaryText text="不同架构、不同参数规模的先进模型，经常在同一批困难样本上一起失败。" /></strong>
        </div>
        <i aria-hidden="true">→</i>
        <div>
          <span>核心洞察</span>
          <strong><GlossaryText text="共同缺失的训练数据，可能比架构差异更接近当前性能瓶颈。" /></strong>
        </div>
      </div>
      <p className="research-overview__boundary">
        <b>证据边界：</b>共同失败支持“数据瓶颈”假设，但不等于证明架构已经不重要，或数据是唯一瓶颈。
      </p>

      <div
        className={`research-overview__interactive research-overview__interactive--step-${activeStep}`}
        onClickCapture={(event) => {
          if ((event.target as Element).closest('.glossary-term')) setAutoRunning(false);
        }}
      >
        <div className="research-overview__visual-head">
          <div>
            <span className="source-tag teaching">基于论文 Abstract 重绘 · 教学示意</span>
            <h3>点击一条因果链，看论文具体解决什么</h3>
          </div>
          <button type="button" className="research-overview__replay" onClick={replay}>
            {autoRunning ? '从头播放' : '重播因果链'}
          </button>
        </div>

        <nav className="research-overview__flow" aria-label="论文问题与贡献因果链">
          {FLOW_STEPS.map((item, index) => (
            <button
              type="button"
              key={item.short}
              className={index === activeStep ? 'is-active' : index < activeStep ? 'is-passed' : ''}
              aria-pressed={index === activeStep}
              onClick={() => chooseStep(index)}
            >
              <i>{index + 1}</i>
              <span><b>{item.short}</b><small>{item.title}</small></span>
            </button>
          ))}
        </nav>

        <div className="research-overview__stage" key={activeStep} aria-live="polite">
          <div className="research-overview__stage-copy">
            <span>{String(activeStep + 1).padStart(2, '0')} / {String(FLOW_STEPS.length).padStart(2, '0')}</span>
            <h3><GlossaryText text={step.title} /></h3>
            <p><GlossaryText text={step.answer} /></p>
          </div>
          <div className="research-overview__stage-figure">
            {STAGE_FIGURES[activeStep]}
          </div>
        </div>

        <footer className="research-overview__summary">
          <b>一句话读懂：</b>
          <span><GlossaryText text="作者固定 MinerU2.5 的 1.2B 架构，集中解决“数据覆盖不够、难例标不准、评测不够公平”，再用分层训练把不同质量的数据用在正确阶段。" /></span>
          <a href={ABSTRACT_URL} target="_blank" rel="noreferrer">查看论文 Abstract</a>
        </footer>
      </div>
    </section>
  );
}
