import React from 'react';
import type { WidgetProps } from './registry';

/** Chapter 1 figure note: the paper image itself is rendered by the framework. */
export const PaperFigureOnly: React.FC<WidgetProps> = () => (
  <>
    <div className="chapter1-mobile-figure" aria-label="论文 Figure 1B 移动端放大视图">
      <div className="chapter1-mobile-figure-label">论文 Fig.1B · 原图</div>
      <div className="chapter1-mobile-crop architecture">
        <img src="./images/fig1-annotated.jpg" alt="冻结编码器、共享 Transformer 与 Subject Block" />
      </div>
      <div className="chapter1-mobile-crop output">
        <img src="./images/fig1-annotated.jpg" alt="Subject Block 输出预测脑活动" />
      </div>
    </div>
    <p className="chapter1-figure-note">
      冻结的多模态编码器负责理解刺激，共享 Transformer 学习跨时间脑编码规律，被试映射负责输出对应脑活动。
    </p>
  </>
);
