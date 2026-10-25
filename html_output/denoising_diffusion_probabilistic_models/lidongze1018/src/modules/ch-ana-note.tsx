import React from 'react';
import type { WidgetProps } from './registry';

// Generic chapter-guide card for chapters whose analogy slot is intentionally NOT a
// life metaphor: math / ablation / training / architecture / engineering chapters.
// Renders a compact "本章速览" panel (DOM only, fits the analogy visual area).

const NOTES: Record<string, { intro: string; points: string[] }> = {
  'chap-4': {
    intro: '本章以公式与精确数值为主：',
    points: [
      'βₜ / αₜ / ᾱₜ 全部按论文线性 β 表精确累计（无近似）',
      '闭式采样 xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε（Eq. (4)）',
      '单步后验 Eq. (6)–(7)；t=1 边界：采样 z=0，似然用 L₀',
    ],
  },
  'chap-5': {
    intro: '本章以消融证据为主：',
    points: [
      '消融三要素：预测目标 × 协方差 × 训练目标',
      '每个数字都对应完整的实验条件（Table 2 逐值转写）',
      '论文留白的组合 = 训练不稳定/未报告：本页不补造数值',
    ],
  },
  'chap-7': {
    intro: '本章以训练算法为主：',
    points: [
      '一次迭代 = Algorithm 1 的全部步骤（逐行对照）',
      '每轮：随机 t、随机 ε、预测噪声并计算 ‖ε−εθ‖²（Eq. (14)）',
      'Loss 曲线为教学示意 —— 论文未公开训练日志',
    ],
  },
  'chap-8': {
    intro: '本章以网络结构为主：',
    points: [
      'U-Net 骨干：CIFAR10 型号 4 级分辨率（32×32 → 4×4）',
      '16×16 分辨率自注意力 + 跳连',
      '时间由正弦位置嵌入注入每个残差块',
    ],
  },
  'chap-9': {
    intro: '本章以复现细节为主：',
    points: [
      '技巧清单：组归一化 / dropout 0.1 / 水平翻转 / EMA 0.9999',
      '每项技巧均标注论文口径（含「论文未做消融」的诚实标注）',
      '散布与轨迹动画为教学示意',
    ],
  },
};

export const ChAnaNote: React.FC<WidgetProps> = ({ chapterId }) => {
  const note = NOTES[chapterId] ?? {
    intro: '本章速览：',
    points: ['内容以公式与真实数据为主。'],
  };
  return (
    <div className="ana-note">
      <div className="ana-note-intro">{note.intro}</div>
      <ul>
        {note.points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
};

export default ChAnaNote;
