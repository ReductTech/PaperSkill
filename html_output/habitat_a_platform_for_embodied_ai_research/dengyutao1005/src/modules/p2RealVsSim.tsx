import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const ROWS = [
  { pain: '慢：不比实时更快，无法并行', cure: '快数量级，可集群并行' },
  { pain: '危险：训练不足会伤己伤人', cure: '仿真里安全试错' },
  { pain: '资源密集：机器与环境都烧钱', cure: '虚拟环境几乎零成本' },
  { pain: '难控制：边角场景难复现', cure: '条件可精确设置' },
  { pain: '难复现：跨实验跨机构难一致', cure: '标准条件、公平对比' },
];

// P2 点击切换：真实世界五大痛点 vs 仿真对应收益（§1）。
export const P2RealVsSim: React.FC<WidgetProps> = () => {
  const [side, setSide] = useState<'real' | 'sim'>('real');
  return (
    <div className="mod-toggle">
      <div className="toggle-switch">
        <button className={`tgl ${side === 'real' ? 'active' : ''}`} onClick={() => setSide('real')}>
          真实世界训练
        </button>
        <button className={`tgl ${side === 'sim' ? 'active' : ''}`} onClick={() => setSide('sim')}>
          Habitat 仿真
        </button>
      </div>
      <ul className="toggle-list">
        {ROWS.map((r, i) => (
          <li key={i} className={`toggle-row ${side === 'sim' ? 'good' : 'bad'}`}>
            <span className="toggle-idx">{i + 1}</span>
            <span className="toggle-text">{side === 'real' ? r.pain : r.cure}</span>
          </li>
        ))}
      </ul>
      <div className="feedback good">
        {side === 'sim'
          ? '仿真把五大痛点逐一化解——这正是 Habitat 的价值起点（§1）。'
          : '真实世界训练又慢又危险又贵——为什么要用仿真，从这里开始（§1）。'}
      </div>
    </div>
  );
};

export default P2RealVsSim;
