import React, { useState } from 'react';
import { Feedback, PhotoButton } from './photo-kit';

const tissues = ['利什曼病', '乳腺', '十二指肠', '胃', '肝', '淋巴结'] as const;

export function Ch5Expert() {
  const [view, setView] = useState<'stitched' | 'generated'>('generated');
  const [tissue, setTissue] = useState<(typeof tissues)[number]>('利什曼病');
  const special = tissue === '利什曼病';
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene" style={{ padding: 14 }}>
      <div style={{ position: 'relative', height: '100%', borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
        {special
          ? <img className="photo-figure" src="./images/figure-4.png" alt="专家标注的肉芽肿与跨组织定性结果" />
          : <img className="photo-figure" src="./images/figure-5.png" alt={`${tissue}的视频拼接与生成 WSI 定性对照`} />}
        {special && <div aria-hidden="true" style={{
          position: 'absolute', left: '5%', right: '5%', top: view === 'stitched' ? '14%' : '40%', height: '24%',
          border: `5px solid ${view === 'generated' ? '#228d5c' : '#f07e47'}`, borderRadius: 8, pointerEvents: 'none',
        }} />}
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">专家复核</span>
      <div className="photo-chip-row" style={{ marginTop: 14 }}>
        <PhotoButton selected={view === 'stitched'} onClick={() => setView('stitched')}>视频拼接</PhotoButton>
        <PhotoButton selected={view === 'generated'} onClick={() => setView('generated')}>生成 WSI</PhotoButton>
      </div>
      <div className="photo-chip-row" style={{ marginTop: 14 }}>
        {tissues.map(item => <PhotoButton key={item} selected={tissue === item} onClick={() => setTissue(item)}>{item}</PhotoButton>)}
      </div>
      <p>{special
        ? '专家在两类图像中标注肉芽肿与 LD 小体，并讨论更小的 LD 小体在什么尺度下更容易看到。'
        : '论文图为该组织给出定性视觉示例，没有提供和其他组织共用的量化基准。'}</p>
      <Feedback tone={view === 'generated' ? 'blue' : 'orange'}>{special
        ? view === 'stitched'
          ? '这是拼接结果，尚未经过 pix2pix 恢复；专家标注用于复核可见结构。'
          : '这是生成 WSI，视觉更清楚，但不等于诊断准确率。'
        : `${tissue}：论文展示定性结果；不能据图推导诊断精度或跨设备稳定性。`}</Feedback>
    </aside>
  </div>;
}
