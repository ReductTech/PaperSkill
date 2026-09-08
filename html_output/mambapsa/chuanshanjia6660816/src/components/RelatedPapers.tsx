import React from 'react';

// Three papers this tutorial belongs to / builds on, shown at the end of §10:
// the paper itself (MambaPSA), the detector it modifies (YOLO26), and the SSM
// family it uses (Mamba). Each card links out to the source.
interface PaperCard {
  tag: string;
  title: string;
  venue: string;
  url: string;
  img: string;
  linkLabel?: string; // 卡片链接文案，默认「阅读原文 →」
}

const PAPERS: PaperCard[] = [
  {
    tag: '本文',
    title: 'MambaPSA: A Mamba-based Replacement for C2PSA in YOLO26',
    venue: 'arXiv 2607.12681 · 用 Mamba 替换主干末尾的 C2PSA',
    url: 'https://arxiv.org/abs/2607.12681',
    img: '/images/paper-mambapsa.svg',
  },
  {
    tag: '官方代码',
    title: 'MambaPSA 官方代码仓库',
    venue: 'GitHub · 模型代码 + VOC 权重（13 个 .pt）+ 训练/推理脚本',
    url: 'https://github.com/henrychan0719/MambaPSA',
    img: '/images/paper-github.svg',
    linkLabel: '前往仓库 →',
  },
  {
    tag: '基座模型',
    title: 'Ultralytics YOLO26',
    venue: 'GitHub · NMS-free 目标检测框架',
    url: 'https://github.com/ultralytics/ultralytics',
    img: 'https://repository-images.githubusercontent.com/535360445/2a2c855b-932c-4625-a30d-3a0b475f1051',
  },
  {
    tag: 'SSM 基础',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    venue: 'arXiv 2312.00752 · 选择性状态空间模型',
    url: 'https://arxiv.org/abs/2312.00752',
    img: '/images/paper-mamba.svg',
  },
];

export function RelatedPapers() {
  return (
    <section className="dl-related-section">
      <h3>相关论文与开源资源</h3>
      <div className="related-papers-grid">
        {PAPERS.map((p) => (
          <a key={p.title} className="paper-card" href={p.url} target="_blank" rel="noopener">
            <span className="paper-card-thumb">
              <img
                src={p.img}
                alt={p.title}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="paper-card-tag">{p.tag}</span>
            </span>
            <span className="paper-card-body">
              <span className="paper-card-title">{p.title}</span>
              <span className="paper-card-venue">{p.venue}</span>
              <span className="paper-card-link">{p.linkLabel ?? '阅读原文 →'}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
