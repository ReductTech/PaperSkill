import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// P9 开关对比：分开多次渲染 vs uber-shader 单 pass 多输出（§3 Rendering engine）。
export const P9UberShader: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'old' | 'new'>('old');
  return (
    <div className="mod-toggle">
      <div className="toggle-switch">
        <button className={`tgl ${mode === 'old' ? 'active' : ''}`} onClick={() => setMode('old')}>
          分开渲染（3 次）
        </button>
        <button className={`tgl ${mode === 'new' ? 'active' : ''}`} onClick={() => setMode('new')}>
          uber-shader（1 次）
        </button>
      </div>
      <div className="pass-visual">
        {(mode === 'old' ? ['color', 'depth', 'semantic'] : ['color+depth+semantic']).map((ch, i) => (
          <div key={i} className={`pass-bubble ${mode === 'new' ? 'new' : ''}`}>
            {ch}
          </div>
        ))}
        <div className="pass-cost">
          开销：{mode === 'old' ? '3× 渲染开销' : '1× 渲染开销（共享参数同一 render pass）'}
        </div>
      </div>
      <div className="feedback good">
        {mode === 'new'
          ? '单 pass 多输出：color/depth/semantic 一次生成，避免重复开销（§3）。'
          : '旧方式：每个通道单独渲染，参数共享时产生额外开销。'}
      </div>
    </div>
  );
};

export default P9UberShader;
