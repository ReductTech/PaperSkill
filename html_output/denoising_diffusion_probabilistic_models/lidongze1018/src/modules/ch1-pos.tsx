import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Module 1.2 — positioning & contributions. Answers "what exactly did this paper
// solve and improve compared with earlier diffusion models?" (Introduction / §3 / §4).

interface Card {
  tag: string;
  title: string;
  body: string;
  source: string;
}

const CARDS: Card[] = [
  {
    tag: '起点（不是本文）',
    title: '扩散概率模型最早由 Sohl-Dickstein 等人于 2015 年提出',
    body:
      '他们定义了「逐步加噪 + 反向去噪」的马尔可夫链，并证明它可训练。但此前的扩散模型规模小，从未展示过有竞争力的图像质量。',
    source: '论文 Introduction；参考文献 [53]',
  },
  {
    tag: '本文要解决的问题',
    title: '「定义简单、训练高效」并不能换来「高质量样本」',
    body:
      '论文原话：扩散模型容易定义、训练高效，但据作者所知，没有任何工作证明它能生成高质量样本。本文的工作就是填上这个空白。',
    source: '论文 Introduction',
  },
  {
    tag: '改进 1',
    title: 'ε 参数化：让网络只预测「这一步注入的噪声」',
    body:
      '通过推导（Eq. (9)–(11)）把反向均值 μθ 改写为预测噪声的形式。它同时与多噪声尺度的去噪分数匹配、退火 Langevin 采样建立联系 —— 论文自认的核心贡献之一。',
    source: '论文 Section 3.2；Eq. (11)',
  },
  {
    tag: '改进 2',
    title: 'L_simple：简化并重新加权的训练目标',
    body:
      '丢掉 Eq. (12) 的权重、把小 t 简单任务降权、集中训练大 t 难任务。它是对原始变分界各项的重新加权（非标准 VLB 本身），实测样本质量最好（FID 13.51 → 3.17）。',
    source: '论文 Section 3.4；Eq. (14)',
  },
  {
    tag: '结果与新解释',
    title: '首次展示高质量图像生成，并把采样解释为渐进解码',
    body:
      '无条件 CIFAR10：FID 3.17 / IS 9.46（2020 年时点）；LSUN 256×256 接近 ProgressiveGAN。同时给出渐进有损压缩视角：生成过程类似一种「比特顺序被泛化」的自回归解码。',
    source: '论文 Abstract；Section 4；Section 4.3',
  },
];

export const Ch1Pos: React.FC<WidgetProps> = ({ chapterId }) => {
  const [i, setI] = useState(0);
  const cur = CARDS[i];
  return (
    <div key={`${chapterId}-pos`}>
      <div className="derive-card">
        <div className="derive-head">
          <span className="derive-step-no">{cur.tag}</span>
          <span className="derive-title">{cur.title}</span>
        </div>
        <div className="derive-why">{cur.body}</div>
        <div className="derive-source">
          <span className="source-tag">{cur.source}</span>
        </div>
      </div>
      <div className="chip-row">
        <button type="button" className="tiny ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
          上一条
        </button>
        {CARDS.map((_c, k) => (
          <button key={k} type="button" className={`chip ${k === i ? 'selected' : ''}`} onClick={() => setI(k)}>
            {k + 1}
          </button>
        ))}
        <button type="button" className="tiny" onClick={() => setI(Math.min(CARDS.length - 1, i + 1))} disabled={i === CARDS.length - 1}>
          下一条
        </button>
      </div>
    </div>
  );
};

export default Ch1Pos;
