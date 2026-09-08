import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type RouteKey = 'reconstruct' | 'decoupled' | 'unified';

const routes: Record<RouteKey, {
  tab: string;
  eyebrow: string;
  title: string;
  summary: string;
  representation: string;
  objective: string;
  reconstruction: string;
  note: string;
}> = {
  reconstruct: {
    tab: '重建型 Token', eyebrow: '已有路线 A', title: '一个重建码本，同时承担语义理解',
    summary: 'MMaDA、Lumina-DiMOO 等路线使用以图像重建为主要目标的 VQ-VAE Token。',
    representation: '偏重低层像素重建', objective: '视觉 Token 的语义表达受限', reconstruction: 'VQ / VAE 解码器',
    note: '论文动机：仅把重建型 Token 接入统一主干，并不能保证强视觉理解。',
  },
  decoupled: {
    tab: '双视觉模块', eyebrow: '已有路线 B', title: '理解走 ViT，生成走 VAE',
    summary: 'LLaDA-o、BAGEL 等路线分别保留面向理解和生成的视觉模块。',
    representation: '语义特征与重建 Token 分离', objective: '两条视觉路径目标不同', reconstruction: '独立生成分支',
    note: '论文动机：能力看似统一，但视觉表示和建模目标之间仍存在鸿沟。',
  },
  unified: {
    tab: 'LLaDA2.0-Uni', eyebrow: '本文方案', title: '先统一语义离散表示，再共享 dLLM',
    summary: 'SigLIP-VQ 产生语义视觉 Token；文字与图像 Token 进入同一 16B MoE dLLM。',
    representation: 'SigLIP-VQ 语义离散 Token', objective: '共享块级 Mask 预测', reconstruction: '6B Diffusion Decoder',
    note: '统一发生在表示入口和预测主干；高清图像重建仍由专门的扩散解码器完成。',
  },
};

export const SystemContrastV4: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<RouteKey>('reconstruct');
  const current = useMemo(() => routes[mode], [mode]);
  return (
    <div className={`route-comparison is-${mode}`}>
      <div className="route-comparison__tabs" role="group" aria-label="选择多模态建模路线">
        {(Object.keys(routes) as RouteKey[]).map((key) => (
          <button key={key} type="button" className={mode === key ? 'is-active' : ''} aria-pressed={mode === key} onClick={() => setMode(key)}>{routes[key].tab}</button>
        ))}
      </div>
      <div className="route-comparison__heading"><span>{current.eyebrow}</span><strong>{current.title}</strong><p>{current.summary}</p></div>
      <div className="route-comparison__diagram" aria-live="polite">
        <div className="route-node is-input"><small>输入</small><b>图像 + 文本</b></div><i aria-hidden="true">→</i>
        {mode === 'reconstruct' ? (
          <div className="route-node-stack"><div className="route-node is-old"><small>视觉表示</small><b>重建型 VQ Token</b></div></div>
        ) : mode === 'decoupled' ? (
          <div className="route-node-stack is-split"><div className="route-node is-old"><small>理解</small><b>ViT 特征</b></div><div className="route-node is-old"><small>生成</small><b>VAE Token</b></div></div>
        ) : (
          <div className="route-node-stack"><div className="route-node is-paper"><small>统一视觉入口</small><b>SigLIP-VQ Token</b></div></div>
        )}
        <i aria-hidden="true">→</i>
        <div className={`route-node ${mode === 'unified' ? 'is-current' : 'is-old'}`}><small>预测主干</small><b>{mode === 'unified' ? '16B MoE dLLM' : '目标不完全对齐'}</b></div><i aria-hidden="true">→</i>
        <div className="route-output-stack"><div className="route-node is-text"><small>文本输出</small><b>Detokenizer</b></div><div className={`route-node ${mode === 'unified' ? 'is-decoder' : 'is-muted'}`}><small>图像输出</small><b>{mode === 'unified' ? '6B Diffusion Decoder' : '原生成分支'}</b></div></div>
      </div>
      <div className="route-comparison__facts"><div><small>视觉表示</small><b>{current.representation}</b></div><div><small>主干目标</small><b>{current.objective}</b></div><div><small>图像重建</small><b>{current.reconstruction}</b></div></div>
      <div className={`route-comparison__note ${mode === 'unified' ? 'is-success' : 'is-warning'}`}>{current.note}</div>
    </div>
  );
};
