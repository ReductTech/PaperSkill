import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const upgrades = [
  ['数据', 'Humans-300M', 'Humans-1B'],
  ['最大规模', '2B', '5B'],
  ['预训练目标', 'MAE', 'MAE + Self-distillation + KoLeo'],
  ['主要能力', '局部纹理与结构', '局部细节 + 全局语义'],
  ['分辨率', '原生 1K', '1K + 分层 4K'],
  ['任务', 'Pose / Parsing / Depth / Normal', 'Pose / Seg / Pointmap / Normal / Albedo'],
];

export const UpgradeMatrix: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setActive((value) => (value + 1) % upgrades.length), 1100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="upgrade-layout">
      <div className="upgrade-table"><div className="upgrade-head"><b>维度</b><b>Sapiens v1</b><b>Sapiens2</b></div>{upgrades.map((row, index) => <button onClick={() => setActive(index)} className={active === index ? 'active' : ''} key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</button>)}</div>
      <svg viewBox="0 0 300 330" className="four-k-svg" role="img" aria-label="4K 分层注意力路线">
        <rect width="300" height="330" rx="14" fill="#fff" />
        <text x="150" y="30" textAnchor="middle" className="svg-kicker">4K：49,152 tokens</text>
        <g transform="translate(32 52)">{Array.from({ length: 64 }, (_, index) => <rect key={index} x={(index % 8) * 12} y={Math.floor(index / 8) * 12} width="10" height="10" fill={index % 9 < 3 ? '#f9c8d3' : '#c7dcea'} />)}<rect x="0" y="0" width="46" height="46" fill="none" stroke="#ec265a" strokeWidth="3" /><text x="48" y="116" textAnchor="middle" className="svg-small">局部窗口</text></g>
        <path d="M140 102 H188" stroke="#2177b3" strokeWidth="3" markerEnd="url(#k-arrow)" />
        <defs><marker id="k-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#2177b3" /></marker></defs>
        <g transform="translate(198 66)">{Array.from({ length: 16 }, (_, index) => <rect key={index} x={(index % 4) * 18} y={Math.floor(index / 4) * 18} width="14" height="14" rx="2" fill="#fccb89" />)}<text x="28" y="100" textAnchor="middle" className="svg-small">压缩表示</text></g>
        <path d="M150 196 V236" stroke="#2177b3" strokeWidth="3" markerEnd="url(#k-arrow)" />
        <circle cx="150" cy="272" r="46" fill="#aebcbc" stroke="#13494b" strokeWidth="3" /><path d="M120 266 Q150 236 180 266 M120 280 Q150 310 180 280" fill="none" stroke="#13494b" strokeWidth="2" /><text x="150" y="325" textAnchor="middle" className="svg-small">高层全局交互</text>
      </svg>
    </div>
  );
};
