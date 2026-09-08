import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const pairs = [
  ['缺失区域可能是什么纹理？', '不同裁剪是否具有相同语义？'],
  ['身体边界如何延续？', '局部身体部位属于什么整体？'],
  ['人体结构如何补全？', '图像在全局特征空间中如何组织？'],
];

export const MaeGap: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setActive((value) => (value + 1) % pairs.length), 1100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="gap-panel">
      <div className="gap-head"><strong>MAE 擅长回答</strong><strong>MAE 没有直接优化</strong></div>
      {pairs.map((pair, index) => <button className={`gap-row ${active === index ? 'active' : ''}`} onClick={() => setActive(index)} key={pair[0]}><span>{pair[0]}</span><span>{pair[1]}</span></button>)}
      <div className="central-question">能够重建人体，是否等于真正理解人体语义？</div>
    </div>
  );
};
