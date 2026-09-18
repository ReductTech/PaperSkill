import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const panels = {
  'GPU 结果': <><b>GPU 案例：</b>在 4× NVIDIA A40、Triton 3.2.0、PyTorch 2.6.0+cu124、157 个算子和五次迭代的报告条件下，匹配基线的几何平均加速为 <b>1.52×</b>；排除退化基线后为 <b>1.18×</b>。</>,
  '代理评审': <><b>PaperReview.ai 代理评审：</b>ICLR 目标会场设定下，GPU 与生物医学案例分别为 <b>6.3/10</b> 与 <b>5.8/10</b>。这不是正式同行评审，也不是录用结果。</>,
  '作者局限': <><b>两项关键边界：</b>当前实现是构建在通用编码/推理代理之上的 skill package，尚非科学专用代理底座；完整研究系统各项能力的评测基准仍不充分。</>
};

export const EvidenceTabs: React.FC<WidgetProps> = () => {
  const [tab, setTab] = useState<keyof typeof panels>('GPU 结果');
  return <div className="evidence-tabs"><div className="lab-chips">{(Object.keys(panels) as Array<keyof typeof panels>).map(name => <button key={name} className={tab === name ? 'selected' : ''} onClick={() => setTab(name)}>{name}</button>)}</div><div className="evidence-panel">{panels[tab]}</div></div>;
};
