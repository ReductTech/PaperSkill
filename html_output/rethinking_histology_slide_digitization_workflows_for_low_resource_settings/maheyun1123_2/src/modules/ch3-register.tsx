import React, { useState } from 'react';
import { Feedback, PhotoButton, TissueFrame } from './photo-kit';

export function Ch3Register() {
  const [caseIndex, setCaseIndex] = useState(0);
  const split = caseIndex < 2 ? '训练' : '测试';
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 22 }}>
      <div className="photo-compare" style={{ height: '100%', gridTemplateRows: 'minmax(0,1fr) auto', alignContent: 'stretch' }}>
        <TissueFrame state={caseIndex % 2 ? 'low' : 'mid'} label="视频拼接 WSI" />
        <TissueFrame state="clean" label="40× 扫描参考" />
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, index) => <PhotoButton key={index} selected={caseIndex === index} onClick={() => setCaseIndex(index)}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span>配对 {index + 1}</span><span className={`photo-badge ${index < 2 ? 'is-green' : ''}`}>{index < 2 ? '训练' : '测试'}</span>
            </span>
          </PhotoButton>)}
        </div>
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">仿射配准</span>
      <h3>真实视频 → 扫描外观</h3>
      <div className="photo-legend" style={{ marginTop: 8 }}>
        <span><b>2 例</b> 训练</span>
        <span><b>4 例</b> 测试</span>
        <span><b>另 6 例</b> 附加验证 / 定性</span>
      </div>
      <p>先对齐同一组织位置，模型才能学习真实模糊、光照与染色差异。</p>
      <Feedback tone={split === '训练' ? 'green' : 'blue'}>{
        split === '训练'
          ? `配对 ${caseIndex + 1}：用于学习真实视频退化到扫描外观的映射。`
          : `配对 ${caseIndex + 1}：留作测试，不参与更新参数。`
      }</Feedback>
    </aside>
  </div>;
}
