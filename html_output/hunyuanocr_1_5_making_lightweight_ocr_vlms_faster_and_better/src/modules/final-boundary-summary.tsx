import React from 'react';
import type { PaperWidgetProps } from './cascade-vs-unified';

const sections = [
  {
    id: 'fit',
    icon: '✓',
    eyebrow: '什么时候值得采用？',
    title: '适用场景',
    headline: '完整长结构输出，或存在可以被明确描述的能力缺口',
    items: [
      '需要完整生成文档、长表格、公式或密集 Markdown',
      '低资源语言、古文字或多页理解缺口能够被具体定义',
      '轻量端到端约束重要，并愿意在目标环境验证收益',
    ],
  },
  {
    id: 'requirements',
    icon: '⌁',
    eyebrow: '落地前需要准备什么？',
    title: '采用前提',
    headline: '草拟模型、任务材料、工具质检与人工复核缺一不可',
    items: [
      '额外训练并部署约 90.7M 参数的 DFlash 草拟模型',
      '具备任务材料、OCR／VLM／脚本工具和人工质量复核',
      '按目标后端、输出长度与并发重新测量延迟和吞吐',
    ],
  },
  {
    id: 'limits',
    icon: '!',
    eyebrow: '论文还没有证明什么？',
    title: '主要局限',
    headline: '没有固定倍率、零成本部署或绝对视觉忠实的保证',
    items: [
      '短输出未必获得与长输出相同的加速收益',
      '某一后端的倍率不能推广到任意硬件、长度和并发',
      'CHAOS 14.15 的绝对召回仍低，视觉忠实性远未解决',
    ],
  },
] as const;

export const FinalBoundarySummary: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => (
  <div className="paper-widget final-boundary-page" aria-label={`${chapterId}-${moduleId} 适用条件与主要局限总结`}>
    <div className="final-boundary-intro">
      <strong>读完这篇论文，最后请记住三个边界</strong>
      <span>它适合解决什么、落地需要什么，以及哪些结论仍不能承诺。</span>
    </div>
    <div className="final-boundary-grid">
      {sections.map((section) => (
        <section key={section.id} className={`final-boundary-card is-${section.id}`}>
          <div className="final-boundary-card-head">
            <span className="final-boundary-icon" aria-hidden="true">{section.icon}</span>
            <div>
              <span>{section.eyebrow}</span>
              <h5>{section.title}</h5>
            </div>
          </div>
          <p className="final-boundary-headline">{section.headline}</p>
          <ul>
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
    </div>
    <div className="final-boundary-conclusion">
      <strong>一句话结论：</strong>
      HunyuanOCR-1.5 在明确协议和部署条件下让轻量端到端 OCR 更快、更强，但收益并非无条件通用，视觉忠实性也仍未解决。
    </div>
  </div>
);

export default FinalBoundarySummary;
