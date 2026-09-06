import React from 'react';
import type { WidgetProps } from './registry';

const STACKS = [
  { name: 'Tiny', blocks: 2, className: 'tiny' },
  { name: 'Small', blocks: 4, className: 'small' },
  { name: 'Medium', blocks: 6, className: 'medium' },
];

export const Analogy8: React.FC<WidgetProps> = () => (
  <div className="r9-hook" aria-label="Tiny、Small、Medium 使用相同块基元，但具有不同深度和宽度配置">
    <div className="r9-hook-stacks">
      {STACKS.map((stack) => (
        <div className={stack.className} key={stack.name}>
          <span>{stack.name}</span>
          <div>{Array.from({ length: stack.blocks }, (_, index) => <i key={index} />)}</div>
          <small>LCNetV4 primitive</small>
        </div>
      ))}
    </div>
    <p><strong>primitive 相同</strong><span>depth / width 独立配置</span></p>
  </div>
);
