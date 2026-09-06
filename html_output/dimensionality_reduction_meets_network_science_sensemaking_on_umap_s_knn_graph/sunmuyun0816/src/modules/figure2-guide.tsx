import React from 'react';
import type { WidgetProps } from './registry';

const readingSteps = [
  {
    label: 'A',
    title: '原始空间',
    text: '两簇点数相同，但左侧稀疏、右侧密集；叠加的 15-NN 边直接保留了距离差异。',
  },
  {
    label: 'B',
    title: 'UMAP 二维布局',
    text: '局部距离归一化后，两簇看起来大小相近，说明二维布局弱化了原始距离与密度。',
  },
  {
    label: 'C',
    title: '点位不变，只换颜色',
    text: '按原始空间平均 kNN 距离的倒数着色，密集簇重新变深，说明 kNN graph 仍保留原始密度线索。',
  },
];

export const Figure2Guide: React.FC<WidgetProps> = () => (
  <div className="figure2-guide" aria-label="论文中的 Figure 2 阅读说明">
    <div className="figure2-reading">
      {readingSteps.map((step) => (
        <div className="figure2-reading-step" key={step.label}>
          <span className="figure2-reading-label">{step.label}</span>
          <div>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </div>
        </div>
      ))}
    </div>
    <p className="figure2-conclusion"><b>Figure 2 的结论：</b>二维布局负责展示位置，投影前的 kNN graph 补回二维没有直接呈现的结构信息。</p>
  </div>
);
