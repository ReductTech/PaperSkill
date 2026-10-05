import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CARDS = [
  { f: 'Task', b: '扩展观测与动作空间；提供终止条件与成功度量（如导航的 goal 与 SPL）。只读访问 Simulator 与 Episode-Dataset。', icon: '🧩' },
  { f: 'Episode', b: '一次任务实例：agent 初始位置与朝向、场景 id、目标位置，可选最短路径。', icon: '📋' },
  { f: 'Environment', b: 'Habitat 的基础环境概念，抽象出在模拟器上完成具身任务所需的全部信息。', icon: '🏗️' },
];

export const P12TaskCards: React.FC<WidgetProps> = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flip-grid">
      {CARDS.map((c, i) => (
        <div
          key={c.f}
          className={`flip-card ${open === i ? 'open' : ''}`}
          onClick={() => setOpen(open === i ? null : i)}
        >
          <div className="flip-inner">
            <div className="flip-front">
              <span className="flip-icon">{c.icon}</span>
              <span className="flip-f">{c.f}</span>
            </div>
            <div className="flip-back">
              <strong>{c.f}</strong>
              <p>{c.b}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="feedback good">
        点击翻卡：Task（任务与评测）→ Episode（实例）→ Environment（运行环境），三层模块化抽象（§3）。
      </div>
    </div>
  );
};

export default P12TaskCards;
