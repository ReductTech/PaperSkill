import React from 'react';
import type { WidgetProps } from './registry';

// §10 问题与局限性：把论文结论的边界说清楚——单一种子、单一数据集、
// 收益集中在效率而非精度、单向扫描缺未来上下文、CPU FPS 数据不全。
const ITEMS: Array<{ title: string; desc: string }> = [
  {
    title: '单一种子，方向性趋势',
    desc: '所有精度差异（P4 +0.9、MambaPSA −0.1 等）都来自单一种子的单次训练，没有多种子统计，无法给出方差。这些数字只能当作方向性趋势，不能当作定论。',
  },
  {
    title: '只在 VOC 2007 验证',
    desc: '评测局限于 PASCAL VOC 2007 test，未在 COCO 等更大、更难的基准上测试。COCO 与更多数据集的验证在论文中留待未来工作。',
  },
  {
    title: '收益在效率，不在精度',
    desc: 'MambaPSA 的 mAP 基本持平（−0.1），收益集中在参数（−2.9%）、FLOPs（−12.1%）和 CPU 推理（+17.6%）。它不是精度提升型改动，而是一次「省计算、保精度」的替换。',
  },
  {
    title: '单向扫描缺未来信息',
    desc: '单向 Mamba 只读取已处理的历史，看不到尚未读到的位置；自注意力可以同时看到两侧。BiViM 用双向扫描补全这一点，但只在颈部插入一层，并未铺满整网。',
  },
  {
    title: 'CPU FPS 数据不全',
    desc: 'Table 2 的 CPU 推理只报告了基线与 MambaPSA 两项，三个 BiViM 变体（P3/P4/P5）没有 FPS 数据。推理侧收益的完整横向对比因此还缺一块。',
  },
];

export const Limitations: React.FC<WidgetProps> = () => {
  return (
    <div className="lim-list">
      {ITEMS.map((it, i) => (
        <div className="lim-item" key={i}>
          <span className="lim-num">{String(i + 1).padStart(2, '0')}</span>
          <div className="lim-body">
            <div className="lim-title">{it.title}</div>
            <div className="lim-desc">{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
