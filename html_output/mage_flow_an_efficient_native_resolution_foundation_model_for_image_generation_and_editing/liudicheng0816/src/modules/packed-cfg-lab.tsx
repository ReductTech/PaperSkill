import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export function PackedCfgLab(_: WidgetProps) {
  const [packed, setPacked] = useState(false);
  return (
    <div className="framework-lab">
      <div className="chip-row" role="group" aria-label="CFG 执行方式">
        <button className={`chip${!packed ? ' active' : ''}`} onClick={() => setPacked(false)}>分开执行</button>
        <button className={`chip${packed ? ' active' : ''}`} onClick={() => setPacked(true)}>打包执行</button>
      </div>
      <div className={`cfg-route${packed ? ' is-packed' : ''}`}>
        <div><span>条件分支</span><b>{packed ? '同一次前向' : '第 1 次前向'}</b></div>
        <div><span>无条件分支</span><b>{packed ? '同一次前向' : '第 2 次前向'}</b></div>
        <div className="cfg-result"><span>去噪轨迹</span><b>保持一致</b></div>
      </div>
      <div className={`feedback ${packed ? 'good' : 'warn'}`}>
        {packed
          ? '两条分支在一次变长前向中得到 v_cond 与 v_uncond，CFG 轨迹不变；论文报告约 1.09×–1.15× 加速。'
          : '分开执行需要两次独立调度同一骨干；输出定义相同，但 kernel launch、padding 与调度开销更高。'}
      </div>
      <p className="module-note">打包不会消除条件与无条件分支的全部算术量，也不会改变总采样步数；它优化的是一次采样步内部的执行组织。</p>
    </div>
  );
}
