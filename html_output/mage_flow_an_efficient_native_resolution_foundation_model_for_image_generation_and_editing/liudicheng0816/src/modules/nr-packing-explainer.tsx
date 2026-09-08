import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const images = [
  { size: '512 × 512', grid: '32 × 32', tokens: '1,024' },
  { size: '768 × 1024', grid: '48 × 64', tokens: '3,072' },
  { size: '1024 × 1024', grid: '64 × 64', tokens: '4,096' },
] as const;

export const BucketMismatchLab: React.FC<WidgetProps> = () => {
  const [native, setNative] = useState(false);
  return (
    <div className="packing-story-card">
      <div className="token-count-grid">
        {images.map((image) => <div key={image.size}><strong>{image.size}</strong><span>↓ 16× 下采样</span><b>{image.grid}</b><em>{image.tokens} tokens</em></div>)}
      </div>
      <div className="ctrl" role="group" aria-label="比较分桶训练与原生打包">
        <button type="button" className={`chip ${!native ? 'active' : ''}`} onClick={() => setNative(false)}>传统分辨率桶</button>
        <button type="button" className={`chip ${native ? 'active' : ''}`} onClick={() => setNative(true)}>原生分辨率打包</button>
      </div>
      <div className={`batch-contrast ${native ? 'is-native' : ''}`}>
        <div className="batch-step-label">同一个训练 step</div>
        {(native ? images : [images[0], images[0], images[0]]).map((image, index) => (
          <div className="batch-sample" key={`${image.size}-${index}`}><span>样本 {index + 1}</span><strong>{image.size}</strong><small>{image.tokens} tokens</small></div>
        ))}
      </div>
      <p className={`feedback ${native ? 'good' : 'warn'}`} aria-live="polite">
        {native
          ? '同一步可混合不同分辨率、长宽比和文本长度；小图占用较少 token，因此固定预算内可容纳更多样本。'
          : '定长堆叠很方便，但一个 step 只能取同一桶；连续的真实尺寸分布被映射到有限桶，极端画幅还需要专门设桶。'}
      </p>
    </div>
  );
};

const samples = [
  { id: 1, text: '|τ₁|', image: '1,024', label: '512²' },
  { id: 2, text: '|τ₂|', image: '3,072', label: '768×1024' },
  { id: 3, text: '|τ₃|', image: '4,096', label: '1024²' },
] as const;

export const PackingBoundaryLab: React.FC<WidgetProps> = () => {
  const active = 2;
  return (
    <div className="packing-story-card">
      <div className="sample-sequences">
        {samples.map((sample) => (
          <div key={sample.id} className={`sample-sequence-row ${active === sample.id ? 'active' : ''}`}>
            <span>S{sample.id} · {sample.label}</span><i className="text-segment">τ{sample.id}</i><i className="image-segment">Z{sample.id} · {sample.image}</i>
          </div>
        ))}
      </div>
      <div className="packed-sequence" aria-label="三个样本连续存放的 packed sequence">
        {samples.map((sample) => <div key={sample.id} className={`packed-sample ${active === sample.id ? 'active' : ''}`}><i>τ{sample.id}</i><b>Z{sample.id}</b></div>)}
      </div>
      <div className="cu-seqlens">cu_seqlens = [0, |S₁|, |S₁| + |S₂|, |S₁| + |S₂| + |S₃|]</div>
      <div className="attention-boundary"><strong>当前查看 S{active}</strong><span>FlashAttention 只读取该边界内的 τ{active} 与 Z{active}；不会关注相邻样本。</span></div>
      <p className="module-note">连续存放只改变显存布局。variable-length kernel 直接读取累计边界，无需把短序列 padding 到最长序列，也无需显式构造巨大块对角 mask。</p>
    </div>
  );
};

export const SpatialPositionLab: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'packed' | 'image' | 'edit'>('image');
  const copy = {
    packed: ['错误参照：packed 一维位置', '第二张图会从前面所有 token 之后继续计数，无法表达它自身的二维邻接关系。'],
    image: ['生成：每样本 2D RoPE', '每张图都从自己的 (h,w) 网格开始；累计边界隔离样本，2D RoPE 只负责图像内部空间。'],
    edit: ['编辑：(h,w,f)', '在二维空间坐标外增加 frame 维 f，用来区分源图与目标图。'],
  } as const;
  const coords = mode === 'packed'
    ? [['0', '1', '2', '3'], ['4', '5', '6', '7']]
    : mode === 'image'
      ? [['(0,0)', '(0,1)', '(1,0)', '(1,1)'], ['(0,0)', '(0,1)', '(1,0)', '(1,1)']]
      : [['(0,0,0)', '(0,1,0)', '(1,0,0)', '(1,1,0)'], ['(0,0,1)', '(0,1,1)', '(1,0,1)', '(1,1,1)']];
  return (
    <div className="packing-story-card">
      <div className="ctrl" role="tablist" aria-label="选择位置编码方式">
        <button type="button" role="tab" aria-selected={mode === 'packed'} className={`chip ${mode === 'packed' ? 'active' : ''}`} onClick={() => setMode('packed')}>Packed 一维位置</button>
        <button type="button" role="tab" aria-selected={mode === 'image'} className={`chip ${mode === 'image' ? 'active' : ''}`} onClick={() => setMode('image')}>2D RoPE</button>
        <button type="button" role="tab" aria-selected={mode === 'edit'} className={`chip ${mode === 'edit' ? 'active' : ''}`} onClick={() => setMode('edit')}>编辑 3D 位置</button>
      </div>
      <h5 className="packing-story-title">{copy[mode][0]}</h5>
      <div className="coordinate-samples">
        {coords.map((sample, sampleIndex) => <div key={sampleIndex}><strong>{mode === 'edit' ? (sampleIndex ? '目标图 f=1' : '源图 f=0') : `样本 ${sampleIndex + 1}`}</strong><div>{sample.map((coord) => <span key={coord}>{coord}</span>)}</div></div>)}
      </div>
      <p className={`feedback ${mode === 'packed' ? 'bad' : 'good'}`}>{copy[mode][1]}</p>
    </div>
  );
};
