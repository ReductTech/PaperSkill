import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const stops = [
  { key: 'text', title: '文字条件 c', question: '用户的文字如何进入骨干？', detail: 'GPT-OSS 文字编码器取第 4、12、18、24 层的特征，拼接并投影后，形成输入骨干的文字特征。这里的 c 会随 prompt 改变。', note: 'Reasoner 可以先改写用户请求，但它不是 GPT-OSS 编码器，也不是 MMDiT 内的一个参数。' },
  { key: 'image', title: '图像 token', question: '图像路径从哪里来？', detail: 'zₜ 是当前整幅图的带噪潜表示；它按空间位置分成小块，每块转换成一个数字向量，作为图像 token 送入 Transformer。生成时 zₜ 从随机噪声开始；训练时由目标图片的 VAE 编码结果加噪得到。', note: '一个图像 token 不是一小张可直接观看的图片；它是表示局部信息的数字向量。整个 zₜ 对应许多 token。' },
  { key: 'joint', title: '图文交互', question: '两路信息怎样影响彼此？', detail: '一个 MMDiT 块接收上一块传来的图像与文字特征，并用图像、文字两条分支处理。注意力让 token 根据彼此的信息更新表示。', note: '下方只画出一个代表性块。48 表示骨干有 48 个这样的块，不是要生成 48 张图，也不是 48 个采样步。' },
  { key: 'velocity', title: '预测方向', question: '最终输出用来做什么？', detail: '骨干根据当前潜表示、文字条件和时间位置，预测潜空间中的更新方向。采样器据此更新潜表示，最后交给 VAE 解码器。', note: '20 步 Lens / 4 步 Lens-Turbo 说的是生成采样步数；每一步都会调用骨干，和 48 个内部块是两个层级。' },
] as const;

export const MMDiTExplorer: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(0);
  const active = stops[selected];
  return (
    <div className="lens-mmdit lens-widget">
      <div className="lens-widget-kicker">跟着两条路径走进一个 MMDiT 块</div>
      <div className="lens-mmdit-primer" aria-label="潜表示与图像 token 的关系">
        <div><b>整幅潜表示 zₜ</b><div className="lens-mmdit-latent-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</div><small>当前整幅图的数字表示</small></div>
        <span className="lens-mmdit-primer-arrow" aria-hidden="true">→</span>
        <div><b>分块并转换</b><p>不是直接切原始图片，而是处理潜表示中的局部信息。</p></div>
        <span className="lens-mmdit-primer-arrow" aria-hidden="true">→</span>
        <div><b>多个图像 token</b><div className="lens-mmdit-token-row" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>…</span></div><small>每个 token 是数字向量</small></div>
      </div>
      <p className="lens-widget-instruction">按顺序点选“文字条件 → 图像 token → 图文交互 → 预测方向”，观察当前环节。</p>
      <div className="lens-mmdit-paths" role="group" aria-label="MMDiT 的图文路径">
        <button type="button" className={`lens-mmdit-path text ${selected === 0 ? 'is-active' : ''}`} onClick={() => setSelected(0)} aria-pressed={selected === 0}><span>文字路径</span><b>prompt → GPT-OSS → c</b><small>来自用户文字，不是模型权重</small></button>
        <button type="button" className={`lens-mmdit-path image ${selected === 1 ? 'is-active' : ''}`} onClick={() => setSelected(1)} aria-pressed={selected === 1}><span>图像路径</span><b>当前潜表示 zₜ → 图像 token</b><small>生成从随机 z 开始</small></button>
      </div>
      <div className="lens-mmdit-down" aria-hidden="true">文字分支 ↘　↙ 图像分支</div>
      <button type="button" className={`lens-mmdit-block ${selected === 2 ? 'is-active' : ''}`} onClick={() => setSelected(2)} aria-pressed={selected === 2}>
        <span>一个代表性的 MMDiT 块</span>
        <div><b>文字分支</b><em>注意力中的信息交互</em><b>图像分支</b></div>
        <small>骨干堆叠 48 个块；两路特征逐块更新</small>
      </button>
      <div className="lens-mmdit-down" aria-hidden="true">↓</div>
      <button type="button" className={`lens-mmdit-output ${selected === 3 ? 'is-active' : ''}`} onClick={() => setSelected(3)} aria-pressed={selected === 3}>预测潜空间更新方向 → 采样器更新 z → VAE 解码</button>
      <div className="lens-mmdit-detail" aria-live="polite"><span>{selected + 1} / 4 · {active.title}</span><h5>{active.question}</h5><p>{active.detail}</p></div>
      <div className="feedback good">{active.note}</div>
      <p className="lens-widget-source">依据：论文 §2.2 的模型结构说明；这是教学示意，不复刻内部矩阵运算。</p>
    </div>
  );
};
