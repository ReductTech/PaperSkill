import React from 'react';
import type { WidgetProps } from './registry';

// Ch2 Module 2：DINO 与 iBOT 的流程图
// 配图：DINO/iBOT 双分支自蒸馏流程（Teacher 出题、Student 作答、stop-gradient + EMA）
export const M22Img: React.FC<WidgetProps> = () => {
  return (
    <div className="m22-img">
      <img src="/images/fig_pipeline.png" alt="DINO 与 iBOT 的流程图" style={{ width: '100%', borderRadius: 8 }} />
      <p className="m22-caption" style={{ marginTop: 8, fontSize: 13, color: '#556', lineHeight: 1.6 }}>
        <b>DINO</b>：同一物体不同视角 → CLS 整图语义蒸馏（学「整张图是什么」）；<br />
        <b>iBOT</b>：随机遮 patch → 凭上下文重建（学「每块局部是什么」）。<br />
        都靠 <b>Teacher 出题 / Student 作答 / stop-gradient + EMA</b> 保持稳定。
      </p>
    </div>
  );
};
