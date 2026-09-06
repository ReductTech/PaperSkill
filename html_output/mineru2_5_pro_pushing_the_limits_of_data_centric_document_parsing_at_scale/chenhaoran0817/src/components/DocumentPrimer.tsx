import React, { useEffect, useState } from 'react';
import { getMediaAsset } from '../data/media';
import { Term } from './Glossary';
import { PaperMedia } from './PaperMedia';

type Region = 'text' | 'formula' | 'table' | 'layout';
type FigureRegion = 'originalPdf' | 'outputA' | 'outputB';

const REGION_COPY: Record<Region, { label: string; output: string; answer: string }> = {
  text: {
    label: '正文段落',
    output: 'type: "text"\ncontent: "数据质量决定了模型能学到什么。"',
    answer: '不仅识别字，还要保留段落边界和阅读顺序。',
  },
  formula: {
    label: '多行公式',
    output: 'type: "formula"\nlatex: "\\begin{aligned} L &= L_{sft} \\\\ R &= CDM(y, ŷ) \\end{aligned}"',
    answer: '公式需要恢复符号、行间关系和可渲染结构。',
  },
  table: {
    label: '嵌套表格',
    output: 'type: "table"\nhtml: "<table><tr><td rowspan=2>…"',
    answer: '表格解析必须恢复行列、合并单元格和内容对应关系。',
  },
  layout: {
    label: '版面结构',
    output: 'type: "layout"\nbbox: [x₁, y₁, x₂, y₂]\norder: 03',
    answer: '位置与阅读顺序决定这些内容如何重新组成一份文档。',
  },
};

const OMNI_OUTPUT = getMediaAsset('omni-output');
const FIGURE_REGION_COPY: Record<FigureRegion, { label: string; explanation: string }> = {
  originalPdf: {
    label: '原始 PDF',
    explanation: '原始 PDF 区域保留页面中的段落、公式、表格和版面位置。',
  },
  outputA: {
    label: '输出 A',
    explanation: '输出 A 是一种结构化结果：内容相近，但块边界与标记方式可能不同。',
  },
  outputB: {
    label: '输出 B',
    explanation: '输出 B 是另一种结构化结果：同一页面可以有不同但可比较的表达粒度。',
  },
};

export function DocumentPrimer({
  guidedState,
  onInteract,
  onStateChange,
}: {
  guidedState?: string;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
}) {
  const [active, setActive] = useState<Region>('text');
  const [figureRegion, setFigureRegion] = useState<FigureRegion>('originalPdf');

  useEffect(() => {
    if (guidedState && guidedState in REGION_COPY) setActive(guidedState as Region);
  }, [guidedState]);

  const choose = (region: Region) => {
    setActive(region);
    onInteract?.();
    onStateChange?.(region);
  };

  return (
    <section className="primer" id="document-primer" data-module-id="document-primer" data-region={active} aria-labelledby="primer-title">
      <header className="primer-head">
        <div>
          <span className="eyebrow">先建立任务直觉</span>
          <h2 id="primer-title">一张页面，究竟要解析出什么？</h2>
        </div>
        <span className="source-tag teaching">教学示意</span>
      </header>

      <div className="primer-grid">
        <div
          className="primer-source-compare"
          role="region"
          aria-label="真实 PDF 与结构化输出对照"
        >
          <div className="primer-figure-stage">
            <div className="primer-figure-canvas">
              <PaperMedia
                assetId="omni-output"
                label="论文原图节选"
                caption="Figure S3：原始 PDF 与两种结构化输出的完整横向对照"
                variant="stage"
                viewer="full"
                chrome={false}
                className="primer-figure-media"
              />
              <div className="primer-figure-hotspots" aria-label="Figure S3 区域讲解">
                {(Object.keys(FIGURE_REGION_COPY) as FigureRegion[]).map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={`primer-figure-hotspot primer-figure-hotspot--${region}`}
                    aria-label={`查看${FIGURE_REGION_COPY[region].label} 区域`}
                    aria-pressed={figureRegion === region}
                    onClick={() => setFigureRegion(region)}
                  ><span aria-hidden="true">{FIGURE_REGION_COPY[region].label}</span></button>
                ))}
              </div>
            </div>
          </div>
          <p className="primer-figure-explanation" role="status" aria-live="polite">
            <strong>{FIGURE_REGION_COPY[figureRegion].label}</strong>
            <span>{FIGURE_REGION_COPY[figureRegion].explanation}</span>
          </p>
          {OMNI_OUTPUT.source ? <a className="primer-figure-source" href={OMNI_OUTPUT.source.url} target="_blank" rel="noreferrer">来源：{OMNI_OUTPUT.source.title}</a> : null}
        </div>
        <aside className="primer-source-boundary" aria-label="OmniDocBench 事实边界">
          <span className="source-tag research">来源边界</span>
          <p>
            <span>{OMNI_OUTPUT.allowedClaim}</span>
            {(OMNI_OUTPUT.forbiddenClaims ?? []).map((claim) => <span key={claim}>{claim}</span>)}
          </p>
        </aside>

        <div className="document-demo" aria-label="可点击的复杂文档页面">
          <div className="doc-running-head">DATA-CENTRIC DOCUMENT PARSING</div>
          <button className={`doc-region doc-text ${active === 'text' ? 'active' : ''}`} type="button" aria-pressed={active === 'text'} onClick={() => choose('text')}>
            <span>数据质量决定模型能学到什么</span>
            <i>正文</i>
          </button>
          <button className={`doc-region doc-formula ${active === 'formula' ? 'active' : ''}`} type="button" aria-pressed={active === 'formula'} onClick={() => choose('formula')}>
            <span>L = L<sub>sft</sub> + λR</span>
            <small>R = CDM(y, ŷ)</small>
            <i>公式</i>
          </button>
          <button className={`doc-region doc-table ${active === 'table' ? 'active' : ''}`} type="button" aria-pressed={active === 'table'} onClick={() => choose('table')}>
            <span className="cell wide">Method</span><span className="cell">Base</span><span className="cell">Hard</span>
            <span className="cell wide">MinerU2.5-Pro</span><span className="cell">96.12</span><span className="cell">94.08</span>
            <i>表格</i>
          </button>
          <button className={`doc-region doc-layout ${active === 'layout' ? 'active' : ''}`} type="button" aria-pressed={active === 'layout'} onClick={() => choose('layout')}>
            <span>1 → 2 → 3</span><i>版面</i>
          </button>
        </div>

        <div className="structured-output" aria-live="polite">
          <div className="output-kicker"><Term id="structured-output">结构化输出</Term><span>{REGION_COPY[active].label}</span></div>
          <pre key={active}>{REGION_COPY[active].output}</pre>
          <p>{REGION_COPY[active].answer}</p>
          <div className="primer-equation">
            <span>页面图像</span><b>→</b><span>内容</span><b>+</b><span>类型</span><b>+</b><span>位置</span><b>+</b><span>结构</span>
          </div>
        </div>
      </div>

      <p className="primer-conclusion"><b>一句话：</b><Term id="document-parsing">文档解析</Term>不是“把字抄出来”，而是把页面重新变成机器可读、可验证的结构。</p>
    </section>
  );
}
