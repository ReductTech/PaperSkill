import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const results = [
  ['Pose · 1B · mAP ↑', '76.8', '80.4'],
  ['Segmentation · 1B · mIoU ↑', '53.8', '81.7'],
  ['Normal · 1B · MAE ↓', '13.62°', '7.12°'],
];

export const EvidenceConclusion: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setActive((value) => Math.min(results.length - 1, value + 1)), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="evidence-panel">
      <table className="compact-results evidence-table"><thead><tr><th>任务</th><th>Sapiens v1</th><th>Sapiens2</th></tr></thead><tbody>{results.map((row,index)=><tr className={active === index ? 'active' : ''} key={row[0]}>{row.map((cell)=><td key={cell}>{cell}</td>)}</tr>)}</tbody></table>
      <div className="evidence-columns">
        <section className="proved"><h3>论文较强地证明了</h3><ul><li>人体专属数据具有明显优势</li><li>Sapiens2 在多个密集人体任务上优于 v1</li><li>联合训练兼顾局部细节与全局语义</li></ul></section>
        <section className="mixed"><h3>尚未完全隔离证明</h3><ul><li>多少提升单独来自自蒸馏</li><li>多少来自 Humans-1B、更大模型、架构和标签变化</li></ul></section>
      </div>
      <div className="final-line">Sapiens v1 让模型“看清人体”，Sapiens2 进一步让模型“理解人体”。</div>
    </div>
  );
};
