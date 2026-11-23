import React, { useState } from 'react';
import { Feedback, PhotoButton } from './photo-kit';

const methods = [
  { id: 'input', label: '输入', feedback: '输入：模糊、低对比与蓝色偏色仍在。' },
  { id: 'deblur', label: 'DeblurGAN-v2', feedback: 'DeblurGAN-v2：论文认为视觉改善很小。' },
  { id: 'srgan', label: 'SRGAN', feedback: 'SRGAN：主要放大，仍缺少明显恢复。' },
  { id: 'esrgan', label: 'Real-ESRGAN', feedback: 'Real-ESRGAN：高对比处更锐，低对比区域恢复有限。' },
  { id: 'ours', label: '本文', feedback: '本文：真实视频退化训练后，结构与染色更接近参考。' },
  { id: 'scanned', label: '扫描参考', feedback: '扫描参考：这是 40× 扫描图像，不是模型输出。' },
] as const;

export function Ch4Visual() {
  const [method, setMethod] = useState<(typeof methods)[number]['id']>('ours');
  const index = methods.findIndex(item => item.id === method);
  const current = methods[index];
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene" style={{ padding: 16 }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
        <img className="photo-figure" src="./images/figure-3.png" alt="输入、DeblurGAN、SRGAN、ESRGAN、本文和扫描参考的恢复对比" />
        <div aria-hidden="true" style={{
          position: 'absolute', left: `${3 + index * 16.2}%`, top: '14%', width: '15.2%', height: '58%',
          border: '5px solid #27446e', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(20,35,55,.04)', pointerEvents: 'none',
        }} />
        <span className="photo-badge" style={{ position: 'absolute', left: 12, top: 12, background: '#fffdf7ee' }}>原论文图 3 · 未做滤镜增强</span>
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">真实显微视频样本</span>
      <div className="photo-chip-row" style={{ marginTop: 16 }}>
        {methods.map(item => <PhotoButton key={item.id} selected={method === item.id} onClick={() => setMethod(item.id)}>{item.label}</PhotoButton>)}
      </div>
      <p>这组比较保留论文图中原始输入、竞争者、本文方法与扫描参考。代表性裁剪用于解释差异，不建立跨中心普遍优势。</p>
      <div className="photo-stack" style={{ marginTop: 14 }}>
        <div className="photo-stat"><strong>{current.label}</strong><span>{method === 'scanned' ? '参照对象' : method === 'ours' ? '论文方法输出' : '对比方法输出'}</span></div>
      </div>
      <Feedback tone={method === 'ours' ? 'green' : method === 'scanned' ? 'blue' : 'orange'}>{current.feedback}</Feedback>
    </aside>
  </div>;
}
