import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const ops = ['Norm', 'Modulate', 'RoPE', 'Gate', 'Activation', 'Residual'] as const;

export const KernelTrafficLab: React.FC<WidgetProps> = () => {
  const [fused, setFused] = useState(false);
  return (
    <div className="cuda-story-card">
      <div className="ctrl" role="group" aria-label="比较独立 CUDA kernel 与融合 kernel">
        <button type="button" className={`chip ${!fused ? 'active' : ''}`} onClick={() => setFused(false)}>独立 kernels</button>
        <button type="button" className={`chip ${fused ? 'active' : ''}`} onClick={() => setFused(true)}>融合 kernel</button>
      </div>
      <div className={`kernel-chain ${fused ? 'is-fused' : ''}`}>
        {ops.map((op, index) => <React.Fragment key={op}><span>{op}</span>{index < ops.length - 1 && <b aria-hidden="true">{fused ? '→' : '↕ HBM ↕'}</b>}</React.Fragment>)}
      </div>
      <div className="traffic-summary">
        <div><span>kernel launch</span><strong>{fused ? '1 次' : `${ops.length} 次`}</strong></div>
        <div><span>中间激活</span><strong>{fused ? '尽量留在片上' : '反复写回 HBM'}</strong></div>
        <div><span>理论 FLOPs</span><strong>近似不变</strong></div>
      </div>
      <p className={`feedback ${fused ? 'good' : 'warn'}`}>
        {fused
          ? '融合把多道 memory-bound 操作放进同一个 kernel，中间值尽量停留在寄存器或共享内存，只把最终结果写回显存。'
          : '每个小算子的算术量并不大，但独立启动会重复搬运整块激活，并持续支付 kernel launch 开销。'}
      </p>
    </div>
  );
};

const stacks = {
  vae: {
    label: 'Mage-VAE',
    chain: ['Normalization', 'Activation', 'Residual'],
    why: '卷积扩散块在 encoder 与 decoder 中反复出现，融合 normalization–activation–residual 链以减少高分辨率激活往返。',
  },
  text: {
    label: 'Qwen3-VL',
    chain: ['Adaptive Norm', 'RoPE', 'Gated Residual'],
    why: '冻结文本编码器仍参与训练前向；融合 Transformer 侧的归一化、旋转位置编码与门控残差更新。',
  },
  dit: {
    label: '4B NR-MMDiT',
    chain: ['Adaptive Norm', 'RoPE', 'Gated Residual'],
    why: '同一类小算子存在于大量重复的 4B 主干 Block 中，并贯穿前向与反向，因此累积收益最大。',
  },
} as const;

export const FusionStackDetailLab: React.FC<WidgetProps> = () => {
  const [stack, setStack] = useState<keyof typeof stacks>('dit');
  const current = stacks[stack];
  return (
    <div className="cuda-story-card">
      <div className="ctrl" role="tablist" aria-label="查看三个子系统的融合链">
        {(Object.entries(stacks) as Array<[keyof typeof stacks, typeof stacks[keyof typeof stacks]]>).map(([id, item]) => (
          <button key={id} type="button" role="tab" aria-selected={stack === id} className={`chip ${stack === id ? 'active' : ''}`} onClick={() => setStack(id)}>{item.label}</button>
        ))}
      </div>
      <h5 className="cuda-story-title">{current.label} 的重复 Block</h5>
      <div className="fused-operator-box">{current.chain.map((op, index) => <React.Fragment key={op}><span>{op}</span>{index < current.chain.length - 1 && <b>+</b>}</React.Fragment>)}<em>一个融合 kernel</em></div>
      <p>{current.why}</p>
      <p className="module-note">融合改变执行路径，不改变模型参数、训练目标或这些操作在数学上的定义。</p>
    </div>
  );
};
