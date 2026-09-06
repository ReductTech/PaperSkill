import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ReadoutKind = 'none' | 'rgb' | 'latent';
const readout = {
  none: { label: '无持久 3D', tone: 'none', path: ['短上下文', '无3D Cache', '只能猜旧区域'], result: '没有可查询的三维锚点', detail: '早期内容已离开上下文窗口，模型只能依赖当前帧继续生成。' },
  rgb: { label: 'RGB 点云', tone: 'rgb', path: ['查询 pᵢ', '渲染 RGB', 'VAE Encode'], result: '找到位置，但多一次像素往返', detail: '点云保留了颜色和位置；读出时先合成像素，再压回 latent 条件。' },
  latent: { label: 'Latent 点云（本文）', tone: 'latent', path: ['查询 pᵢ', '目标视角投影直接得到 Latent 特征'], result: '直接命中原生 latent 特征', detail: '点的位置决定“看哪里”，特征令牌决定“送什么给骨干”。' },
} as const;

export const LsmC1Compare: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<ReadoutKind>('latent');
  const current = readout[selected];
  return (
    <div className="c1-readout-demo">
      <div className="c1-readout-tabs" role="tablist" aria-label="选择记忆读出方式">
        {(Object.keys(readout) as ReadoutKind[]).map((key) => <button type="button" key={key} role="tab" aria-selected={selected === key} className={`${selected === key ? 'active' : ''} ${readout[key].tone}`} onClick={() => setSelected(key)}>{readout[key].label}</button>)}
      </div>
      <div className={`c1-readout-stage ${current.tone}`}>
        <div className="c1-query-card"><span className="c1-query-camera" aria-hidden="true">⌁</span><div><small>目标视角 t</small><b>重访旧区域</b></div></div>
        <span className="c1-readout-arrow" aria-hidden="true">→</span>
        <div className="c1-readout-path">{current.path.map((step, index) => <React.Fragment key={step}><span className="c1-readout-step"><i>{index + 1}</i>{step}</span>{index < current.path.length - 1 ? <span className="c1-readout-mini-arrow" aria-hidden="true">→</span> : null}</React.Fragment>)}</div>
        <span className="c1-readout-arrow" aria-hidden="true">→</span>
        <div className="c1-readout-result"><span className="c1-result-dot" aria-hidden="true" /><b>{current.result}</b></div>
      </div>
      <div className={`feedback ${selected === 'latent' ? 'good' : selected === 'none' ? 'bad' : ''}`}>{current.detail}</div>
    </div>
  );
};
