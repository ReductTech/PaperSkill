import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ModelKind = 'neo' | 'native' | 'modular-a' | 'modular-b' | 'specialist';

interface ModelSpec {
  name: string;
  kind: ModelKind;
}

interface BenchmarkRow {
  name: string;
  scores: Record<string, number | null>;
}

interface ResultDomain {
  id: string;
  kicker: string;
  title: string;
  source: string;
  models: ModelSpec[];
  benchmarks: BenchmarkRow[];
  conclusion: string;
}

const RESULT_DOMAINS: ResultDomain[] = [
  {
    id: 'image',
    kicker: 'A · 单图 / 通用理解',
    title: '单图能力：Native 已经追到哪里？',
    source: 'Table 1 · Instruct-8B',
    models: [
      { name: 'NEO-ov', kind: 'neo' },
      { name: 'NEO', kind: 'native' },
      { name: 'InternVL3.5', kind: 'modular-a' },
      { name: 'Qwen3-VL', kind: 'modular-b' },
    ],
    benchmarks: [
      { name: 'MMMU', scores: { 'NEO-ov': 68.1, NEO: 54.6, 'InternVL3.5': 68.1, 'Qwen3-VL': 69.6 } },
      { name: 'HallusionBench', scores: { 'NEO-ov': 59.8, NEO: 46.4, 'InternVL3.5': 54.5, 'Qwen3-VL': 61.1 } },
      { name: 'OCRBench', scores: { 'NEO-ov': 81.6, NEO: 77.7, 'InternVL3.5': 84.0, 'Qwen3-VL': 89.6 } },
    ],
    conclusion: '单图结果呈现出一个清楚的趋势：NEO-ov 大幅推进此前 native baseline，在推理与感知任务上已经接近甚至超过部分强 modular 模型，但 OCR-heavy 任务仍有明显差距。',
  },
  {
    id: 'video',
    kicker: 'B · 多图 + 视频',
    title: '多图与视频：统一主干真的扩展过去了吗？',
    source: 'Table 2 · Instruct-8B',
    models: [
      { name: 'NEO-ov', kind: 'neo' },
      { name: 'ELVA', kind: 'native' },
      { name: 'InternVL3.5', kind: 'modular-a' },
      { name: 'Qwen3-VL', kind: 'modular-b' },
    ],
    benchmarks: [
      { name: 'BLINK', scores: { 'NEO-ov': 62.8, ELVA: null, 'InternVL3.5': 59.5, 'Qwen3-VL': 69.1 } },
      { name: 'MUIRBench', scores: { 'NEO-ov': 58.2, ELVA: null, 'InternVL3.5': 55.8, 'Qwen3-VL': 64.4 } },
      { name: 'VideoMME', scores: { 'NEO-ov': 67.4, ELVA: 47.1, 'InternVL3.5': 66.0, 'Qwen3-VL': 71.4 } },
      { name: 'LongVideoBench', scores: { 'NEO-ov': 63.5, ELVA: null, 'InternVL3.5': 62.1, 'Qwen3-VL': 63.6 } },
    ],
    conclusion: '多图与视频结果说明 native modeling 已经从单图扩展到跨图关系与视频时序任务，并取得有竞争力的表现，但还没有全面超过最强 modular VLM。',
  },
  {
    id: 'spatial',
    kicker: 'C · 空间智能',
    title: '空间智能：为什么这是最值得注意的结果？',
    source: 'Table 3 · Instruct-8B',
    models: [
      { name: 'NEO-ov', kind: 'neo' },
      { name: 'InternVL3.5', kind: 'modular-a' },
      { name: 'Qwen3-VL', kind: 'modular-b' },
      { name: 'GeoThinker', kind: 'specialist' },
    ],
    benchmarks: [
      { name: 'Mindcube', scores: { 'NEO-ov': 90.0, 'InternVL3.5': 40.4, 'Qwen3-VL': 29.6, GeoThinker: 83.0 } },
      { name: 'ViewSpatial', scores: { 'NEO-ov': 55.2, 'InternVL3.5': 40.0, 'Qwen3-VL': 41.9, GeoThinker: 45.9 } },
      { name: '3DSR', scores: { 'NEO-ov': 61.7, 'InternVL3.5': 35.3, 'Qwen3-VL': 52.9, GeoThinker: 51.9 } },
      { name: 'SPAR', scores: { 'NEO-ov': 48.8, 'InternVL3.5': 38.2, 'Qwen3-VL': 40.3, GeoThinker: 68.2 } },
    ],
    conclusion: '空间智能是论文最突出的结果之一：NEO-ov 在多项细粒度空间 benchmark 上表现非常强，并在部分任务上达到或超过强 general-purpose / spatial-specialist 模型，但这种优势并非覆盖所有 spatial benchmark。',
  },
];

function ResultChart({ domain }: { domain: ResultDomain }) {
  const [focusedModel, setFocusedModel] = useState<string | null>(null);

  return (
    <article className={`ch8v2-result-domain is-${domain.id}`}>
      <header className="ch8v2-domain-title">
        <small>{domain.kicker}</small>
        <h6>{domain.title}</h6>
      </header>

      <div className="ch8v2-chart" aria-label={`${domain.title}，数值越高越好`}>
        <div className="ch8v2-chart-topline">
          <span>Higher is better</span>
          <span>source: {domain.source}</span>
        </div>
        <div className="ch8v2-legend" aria-label="模型图例">
          {domain.models.map((model) => (
            <button
              type="button"
              className={`is-${model.kind} ${focusedModel === model.name ? 'is-active' : ''}`}
              aria-pressed={focusedModel === model.name}
              onClick={() => setFocusedModel((current) => current === model.name ? null : model.name)}
              key={model.name}
            >
              <i />{model.name}
            </button>
          ))}
        </div>

        <div className="ch8v2-benchmarks">
          {domain.benchmarks.map((benchmark) => (
            <section className="ch8v2-benchmark" key={benchmark.name}>
              <h6>{benchmark.name}</h6>
              <div>
                {domain.models.map((model) => {
                  const score = benchmark.scores[model.name];
                  const dimmed = focusedModel !== null && focusedModel !== model.name;
                  return (
                    <div className={`ch8v2-score-row is-${model.kind} ${dimmed ? 'is-dimmed' : ''}`} key={model.name}>
                      <span>{model.name}</span>
                      <i className={score === null ? 'is-missing' : ''}>
                        {score !== null && <em style={{ width: `${score}%` }} />}
                      </i>
                      <strong>{score === null ? '—' : score.toFixed(1)}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <p className="ch8v2-domain-conclusion">{domain.conclusion}</p>
    </article>
  );
}

const ANALYSIS_FIGURES = [
  {
    number: '①',
    title: 'Native Pre-Buffer 能不能替代传统视觉前端的角色？',
    source: 'Figure 4 · Pre-Buffer vs. VEs on diverse tasks',
    image: `${import.meta.env.BASE_URL}images/neo-ov-figure-4.png`,
    alt: '论文 Figure 4：随机初始化的 Image Encoder、Video Encoder 与 Pre-Buffer 在 VQA、OCR、Video 和 SI 上的平均准确率比较',
    look: '比较 Pre-Buffer 与随机初始化 Image / Video Encoder 在 VQA、OCR、Video 和 SI 上的整体表现。',
    read: 'Pre-Buffer 在多类任务上保持竞争力，并在 OCR / SI 上显示出明显优势信号，支持 native visual interaction 是可行的替代方向。',
  },
  {
    number: '②',
    title: '额外 Spatial Intelligence supervision，谁获益更多？',
    source: 'Figure 5 · Finetuned on SI data',
    image: `${import.meta.env.BASE_URL}images/neo-ov-figure-5.png`,
    alt: '论文 Figure 5：InternVL3.5、Qwen3-VL 与 NEO 在增加空间智能数据前后的平均准确率比较',
    look: '比较的是额外 SI supervision 带来的增益，而不是 tuned 后谁的绝对分数最高。',
    read: 'NEO 从相同类型的空间监督中获得更大的提升，这支持作者关于更深 native interaction 有利于空间学习的解释。',
  },
  {
    number: '③',
    title: '渐进式训练有没有真正带来能力增长？',
    source: 'Figure 6 · Three stages',
    image: `${import.meta.env.BASE_URL}images/neo-ov-figure-6.png`,
    alt: '论文 Figure 6：NEO-ov 2B 与 9B 在训练阶段推进过程中的平均准确率变化',
    look: '比较同一模型从 Stage 1 到 Stage 2 后的跨任务表现变化。',
    read: '两个模型规模都继续提升，较小模型的增益尤其明显，说明 progressive training 的阶段推进对应了实际能力增长。',
  },
];

function ResultsSection() {
  return (
    <section className="ch8v2-section ch8v2-results" aria-labelledby="ch8-results-title">
      <h5 id="ch8-results-title"><span>8.1</span> NEO-ov 到底有多强？</h5>
      <div className="ch8v2-result-stack">
        {RESULT_DOMAINS.map((domain) => <ResultChart domain={domain} key={domain.id} />)}
      </div>
      <p className="ch8v2-overall-result">主结果给出的不是“NEO-ov 全面第一”，而是更重要的信号：Native One-Vision 已经能够同时覆盖单图、多图、视频和空间智能，并把此前 native VLM 的性能边界明显向前推进。</p>
    </section>
  );
}

function AnalysisSection() {
  return (
    <section className="ch8v2-section ch8v2-analysis" aria-labelledby="ch8-analysis-title">
      <h5 id="ch8-analysis-title"><span>8.2</span> 前面的关键设计，实验支持了吗？</h5>
      <p className="ch8v2-section-intro">主结果告诉我们“模型能不能做”；下面三组分析进一步看“为什么值得相信前面的设计”。</p>
      <div className="ch8v2-analysis-stack">
        {ANALYSIS_FIGURES.map((item) => (
          <article className="ch8v2-analysis-unit" key={item.number}>
            <h6><span>{item.number}</span>{item.title}</h6>
            <small>{item.source}</small>
            <img src={item.image} alt={item.alt} />
            <div className="ch8v2-figure-reading">
              <p><b>看哪里</b>{item.look}</p>
              <p><b>读到什么</b>{item.read}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="ch8v2-analysis-summary">三组分析分别给出三类支持：native visual interaction 可以工作，空间监督对 native 模型带来的收益尤其明显，而渐进式训练会继续强化这些能力。</p>
    </section>
  );
}

function BoundarySection() {
  return (
    <section className="ch8v2-section ch8v2-boundaries" aria-labelledby="ch8-boundaries-title">
      <h5 id="ch8-boundaries-title"><span>8.3</span> 实验仍留下哪些差距？</h5>
      <div className="ch8v2-boundary-list">
        <p><b>① 部分单图与视频任务仍有差距</b><span>在部分 benchmark 上，NEO-ov 仍落后于 Qwen3-VL 等强 modular VLM。</span></p>
        <p><b>② OCR / Document 仍是明显短板</b><span>OCR-intensive 与 document-centric tasks 仍有较大的提升空间。</span></p>
      </div>
      <p className="ch8v2-final-judgment">这些结果说明，NEO-ov 已经展现出很强的综合竞争力，但不同能力域的发展仍不均衡。</p>
    </section>
  );
}

export const NeoCh8Main: React.FC<WidgetProps> = () => (
  <div className="ch8v2-lesson">
    <ResultsSection />
    <AnalysisSection />
    <BoundarySection />
  </div>
);
