import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type MemoryKind = 'none' | 'rgb' | 'latent';

const laneCopy: Record<MemoryKind, {
  index: string;
  title: string;
  subtitle: string;
  chip: string;
  memoryTitle: string;
  memoryMeta: string;
  memoryFlow: string[];
  firstOutput: string;
  revisitOutput: string;
  note: string;
}> = {
  none: {
    index: 'A', title: '无持久 3D 表示', subtitle: '只保留短期上下文', chip: '记忆：无',
    memoryTitle: '短上下文窗口', memoryMeta: '最近几帧 · 没有世界坐标', memoryFlow: ['t−2', 't−1', 't'],
    firstOutput: '当前片段可生成', revisitOutput: '旧区域缺少空间锚点',
    note: '离开窗口后，早期墙面和门框没有可查询的三维状态。',
  },
  rgb: {
    index: 'B', title: '传统 RGB 三维缓存', subtitle: '保存颜色点云，再往返编码', chip: '记忆：RGB · 3 ch',
    memoryTitle: 'RGB 点云', memoryMeta: '位置 pᵢ + 颜色 · 3 通道', memoryFlow: ['目标视角', 'Render', 'RGB 图', 'VAE Encode'],
    firstOutput: '能重建目标视角', revisitOutput: '可查到，但要重新编码',
    note: '持久保存了几何位置，但每次读出都要经过像素中间层。',
  },
  latent: {
    index: 'C', title: '本文 Latent 三维缓存', subtitle: '位置直接绑定原生特征', chip: '记忆：Latent · C=48',
    memoryTitle: 'Latent 点云', memoryMeta: '位置 pᵢ + 特征 fᵢ · C 通道', memoryFlow: ['目标视角', '直接投影检索Latent 特征'],
    firstOutput: '直接作为条件输入', revisitOutput: '命中同一空间锚点',
    note: '三维位置和模型原生 latent 一起保存，按目标视角直接投影读取。',
  },
};

function SequenceStack({ output, revisit }: { output: boolean; revisit: boolean }) {
  return (
    <div className={`c1-sequence-stack ${output ? 'output' : ''} ${revisit && output ? 'revisit' : ''}`}>
      <span className="c1-frame back" /><span className="c1-frame middle" />
      <span className="c1-frame front">{output ? (revisit ? '重访' : '生成') : '序列'}</span>
    </div>
  );
}

function MemoryLane({ kind, revisit }: { kind: MemoryKind; revisit: boolean }) {
  const copy = laneCopy[kind];
  return (
    <article className={`c1-memory-lane ${kind} ${revisit ? 'revisit' : 'initial'}`}>
      <header className="c1-lane-head">
        <span className="c1-lane-index">{copy.index}</span>
        <div><strong>{copy.title}</strong><span>{copy.subtitle}</span></div>
        <span className="c1-lane-chip">{copy.chip}</span>
      </header>
      <div className="c1-main-flow">
        <div className="c1-flow-node input-node"><SequenceStack output={false} revisit={revisit} /><b>输入序列</b><small>当前 chunk</small></div>
        <span className="c1-flow-arrow" aria-hidden="true">→</span>
        <div className="c1-dit-node"><b>DIT</b><small>视频生成骨干</small></div>
        <span className="c1-flow-arrow" aria-hidden="true">→</span>
        <div className="c1-flow-node output-node"><SequenceStack output revisit={revisit} /><b>{revisit ? copy.revisitOutput : copy.firstOutput}</b><small>{revisit ? '重访旧区域' : '新片段'}</small></div>
      </div>
      <div className="c1-memory-connector" aria-hidden="true"><span /><b>{kind === 'none' ? '不写入持久三维状态' : '读写长期记忆'}</b><span /></div>
      <div className="c1-memory-rail">
        <div className="c1-memory-rail-head"><div><b>{copy.memoryTitle}</b><span>{copy.memoryMeta}</span></div><span className="c1-memory-status">{kind === 'none' ? '离开即忘' : revisit ? '重访中' : '已保存'}</span></div>
        <div className="c1-memory-flow">
          {copy.memoryFlow.map((step, index) => <React.Fragment key={step}><span className={`c1-memory-step ${revisit && kind !== 'none' && index > 0 ? 'active' : ''}`}>{step}</span>{index < copy.memoryFlow.length - 1 ? <i aria-hidden="true">→</i> : null}</React.Fragment>)}
        </div>
      </div>
      <p className="c1-lane-note">{revisit ? copy.note : kind === 'none' ? '模型只依赖当前窗口，生成完成后不留下长期三维索引。' : '新观察到的内容被写进长期记忆，供之后的目标视角查询。'}</p>
    </article>
  );
}

export const LsmC1Main: React.FC<WidgetProps> = () => {
  const [revisit, setRevisit] = useState(false);
  return (
    <div className="c1-memory-lab">
      <div className="c1-lab-toolbar"><div><b>同一条相机轨迹</b><span>先生成新片段，再绕行回到旧区域</span></div><div className="c1-lab-actions"><button type="button" className={!revisit ? 'active' : ''} onClick={() => setRevisit(false)}>① 初次生成</button><button type="button" className={revisit ? 'active' : ''} onClick={() => setRevisit(true)}>② 重访旧区域</button></div></div>
      <div className="c1-memory-lanes"><MemoryLane kind="none" revisit={revisit} /><MemoryLane kind="rgb" revisit={revisit} /><MemoryLane kind="latent" revisit={revisit} /></div>
      <div className={`feedback ${revisit ? 'good' : ''}`}>{revisit ? '看同一条“重访”指令：无持久记忆在窗口外失去锚点；RGB 记忆找得到位置但要 Render → Encode；Latent 记忆直接投影到 ẑ 与 m。' : '三条主流程共享同一个 DIT；真正不同的是 DIT 身边有没有持久三维记忆，以及记忆以什么信号保存。'}</div>
    </div>
  );
};
