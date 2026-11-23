import React, { useState } from 'react';
import { CameraGlyph, Feedback, PhotoButton } from './photo-kit';

type Stage = 'stitch' | 'train' | 'infer';

export function Ch5Runtime() {
  const [stage, setStage] = useState<Stage>('stitch');
  const content = stage === 'stitch'
    ? { title: '递归拼接', value: '约 5–10 分钟', detail: '从扫片画面生成单张 WSI；论文比较的是数小时的朴素拼接。' }
    : stage === 'train'
      ? { title: '训练', value: '约 84 小时', detail: '2 张 A100 40GB；平均每 epoch 约 60 秒，训练显存约 32.5GB。' }
      : { title: '推理', value: '约 0.26 秒/块', detail: '每块推理显存约 1.9GB；实际吞吐取决于硬件与分块大小。' };
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 24 }}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center' }}><CameraGlyph /></div>
        <div style={{ position: 'relative', height: 420, borderRadius: 22, background: '#fffdf7', border: '1px solid #d7deea', padding: 24 }}>
          <div className="photo-badge" style={{ marginBottom: 20 }}>{stage === 'stitch' ? '光桌拼接' : stage === 'train' ? 'GPU 工作站' : '逐块推理'}</div>
          <div style={{ fontSize: 'var(--ppt-body-heading)', color: '#27446e', lineHeight: 1.35 }}>
            {stage === 'stitch' && '若干帧 → 局部图 → 一张 WSI'}
            {stage === 'train' && '两卡 GPU 持续优化 400 个 epoch'}
            {stage === 'infer' && '每块组织图像经过同一恢复路径'}
          </div>
          <div style={{ marginTop: 30, height: 150, borderRadius: 15, background: '#e8f1ef', position: 'relative', overflow: 'hidden' }}>
            {stage === 'stitch' && <div className="photo-frame-strip" style={{ position: 'absolute', inset: 30 }}>{Array.from({ length: 4 }).map((_, i) => <span key={i} className={i === 3 ? 'is-active' : ''}><i /></span>)}</div>}
            {stage === 'train' && <><div style={{ position: 'absolute', left: 45, bottom: 26, height: 65, width: 85, background: '#c43f52', borderRadius: 8 }} /><div style={{ position: 'absolute', right: 45, bottom: 26, height: 95, width: 85, background: '#27446e', borderRadius: 8 }} /><span style={{ position: 'absolute', left: 45, bottom: 102, color: '#8c2e3f', fontWeight: 800 }}>40 GB</span><span style={{ position: 'absolute', right: 45, bottom: 132, color: '#27446e', fontWeight: 800 }}>40 GB</span></>}
            {stage === 'infer' && <div style={{ position: 'absolute', inset: 30, background: 'repeating-linear-gradient(90deg,#b98ba7 0 25px,#d7c0d3 25px 50px)', borderRadius: 8 }} />}
          </div>
        </div>
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">资源账本</span>
      <div className="photo-stack" style={{ marginTop: 14 }}>
        <PhotoButton selected={stage === 'stitch'} onClick={() => setStage('stitch')}>拼接</PhotoButton>
        <PhotoButton selected={stage === 'train'} onClick={() => setStage('train')}>训练</PhotoButton>
        <PhotoButton selected={stage === 'infer'} onClick={() => setStage('infer')}>推理</PhotoButton>
      </div>
      <div className="photo-stat" style={{ marginTop: 15 }}><strong>{content.value}</strong><span>{content.title}</span></div>
      <p>{content.detail}</p>
      <Feedback tone="blue">{stage === 'stitch'
        ? '递归批次把生成 WSI 的时间降到论文报告的约 5–10 分钟。'
        : stage === 'train'
          ? '训练仍需两片 A100、约 84 小时和 32.5 GB 显存。'
          : '每块约 0.26 秒、1.9 GB 显存，实际吞吐仍取决于设备和分块大小。'}</Feedback>
    </aside>
  </div>;
}
