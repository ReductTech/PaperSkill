import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const OFFICIAL_REPO = 'https://github.com/PaddlePaddle/PaddleOCR';

const SERIES = [
  {
    version: 'v1',
    year: '2020',
    short: '实用轻量 OCR',
    title: 'PP-OCR: A Practical Ultra Lightweight OCR System',
    contribution:
      '建立实用的超轻量检测、方向分类与识别流水线，并用模型裁剪、量化与知识蒸馏兼顾模型大小、精度和多语言部署。',
    href: 'https://arxiv.org/abs/2009.09941',
    linkLabel: '查看 arXiv',
  },
  {
    version: 'v2',
    year: '2021',
    short: '训练技巧',
    title: 'PP-OCRv2: Bag of Tricks for Ultra Lightweight OCR System',
    contribution:
      '引入 CML、CopyPaste、LCNet、U-DML 与 Enhanced CTC Loss 等训练技巧，在推理成本基本不变时提升检测与识别精度。',
    href: 'https://arxiv.org/abs/2109.03144',
    linkLabel: '查看 arXiv',
  },
  {
    version: 'v3',
    year: '2022',
    short: 'SVTR / LK-PAN',
    title: 'PP-OCRv3: More Attempts for the Improvement of Ultra Lightweight OCR System',
    contribution:
      '围绕检测与识别完成九项升级：检测侧加入 LK-PAN、RSE-FPN 与 DML，识别侧转向 SVTR_LCNet，并结合 GTC、数据增强和蒸馏。',
    href: 'https://arxiv.org/abs/2206.03001',
    linkLabel: '查看 arXiv',
  },
  {
    version: 'v4',
    year: '2023',
    short: '更强 backbone',
    title: 'PP-OCRv4（官方版本技术说明，无独立论文标题）',
    contribution:
      '沿用两阶段流水线并完成十项优化：检测侧采用 LCNetV3、PFHead、DSR 与 CML，识别侧采用 Lite-Neck、GTC-NRTR、多尺度训练、数据筛选与蒸馏。',
    href: 'https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version2.x/ppocr/blog/PP-OCRv4_introduction.md',
    linkLabel: '查看官方说明',
  },
  {
    version: 'v5',
    year: '2026',
    short: '数据驱动优化',
    title: 'PP-OCRv5: A Specialized 5M-Parameter Model Rivaling Billion-Parameter Vision-Language Models on OCR Tasks',
    contribution:
      '以约 5M 参数的专用两阶段 OCR 对比十亿级 VLM，并从数据难度、标注准确性与多样性三方面说明数据质量怎样抬高轻量 OCR 的性能上限。',
    href: 'https://arxiv.org/abs/2603.24373',
    linkLabel: '查看 arXiv',
  },
  {
    version: 'v6',
    year: '2026',
    short: '统一可缩放架构',
    title: 'PP-OCRv6: From 1.5M to 34.5M Parameters, Surpassing Billion-Scale VLMs on OCR Tasks',
    contribution:
      '用统一、可缩放的 LCNetV4 基元重构骨干网络，并为检测与识别设计专用 neck；三档模型覆盖 1.5M–34.5M 参数。',
    href: 'https://arxiv.org/abs/2606.13108',
    linkLabel: '查看 arXiv',
  },
] as const;

export const PpOcrSeries: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const item = selected === null ? null : SERIES[selected];

  return (
    <div className="ppocr-timeline-shell">
      <div className="ppocr-timeline" role="list" aria-label="PP-OCR v1 到 v6 研究演进">
        {SERIES.map((entry, index) => (
          <button
            type="button"
            role="listitem"
            key={entry.version}
            className={`ppocr-timeline-node ${selected === index ? 'selected' : ''}`}
            aria-pressed={selected === index}
            aria-expanded={selected === index}
            onClick={() => setSelected((current) => current === index ? null : index)}
          >
            <span>{entry.year}</span>
            <i aria-hidden="true" />
            <strong>{entry.version}</strong>
            <b>{entry.short}</b>
          </button>
        ))}
      </div>

      <div className={`ppocr-timeline-detail ${item ? 'visible' : ''}`} aria-live="polite">
        {item ? (
          <>
            <div>
              <span>{item.year} · PP-OCR {item.version.toUpperCase()}</span>
              <h5>{item.title}</h5>
              <p>{item.contribution}</p>
            </div>
            <div className="ppocr-timeline-links">
              <a href={item.href} target="_blank" rel="noreferrer">{item.linkLabel}</a>
              <a href={OFFICIAL_REPO} target="_blank" rel="noreferrer">官方仓库</a>
            </div>
          </>
        ) : (
          <p>点击任一版本，展开论文标题、主要贡献与继续阅读入口。</p>
        )}
      </div>
      <p className="ppocr-timeline-note">v4 没有独立 arXiv 预印本，因此该节点链接到 PaddleOCR 官方技术说明。</p>
    </div>
  );
};
