import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chips, Feedback, Source } from './kit';

// 模块 3.1：原文图 1 的逐列对照。左列是输入与真值，中列是可切换的对照方法，右列固定为 SCTransNet。
// 每列上方是该方法的连接结构示意（原文图 1 上半部），下方是输出结果与解码器 L1–L4 的特征图。

type M = 'acm' | 'dna' | 'uiu' | 'mtu';

const META: Record<M, { name: string; group: string; fa: boolean; note: string }> = {
  acm: {
    name: 'ACM',
    group: 'CNN 方法',
    fa: true,
    note: 'ACM 通过非对称的自顶向下 / 自底向上路径做跨层融合（§I）。这张例图中它在建筑处给出一处虚警（Result 行的 FA 框内有白色区域）；L4 没有对应特征图，原图标为 None。',
  },
  dna: {
    name: 'DNA-Net',
    group: 'CNN 方法',
    fa: false,
    note: 'DNA-Net 用密集嵌套的交互模块逐步融合高低层特征（§I）。这张例图的 Result 行 FA 框内为空，即这里没有出现该虚警；但它的 L3 特征图上有许多分散的局部响应。',
  },
  uiu: {
    name: 'UIU-Net',
    group: 'CNN 方法',
    fa: true,
    note: 'UIU-Net 在 U-Net 中嵌入更小的 U-Net 学习目标局部对比（§I）。这张例图中出现虚警；L3 的强响应集中在建筑下沿的局部区域。',
  },
  mtu: {
    name: 'MTU-Net',
    group: 'CNN 与 Transformer 混合',
    fa: true,
    note: 'MTU-Net 用多层 ViT-CNN 混合编码器聚合上下文（§I）。原图说明它比纯 CNN 方法更关注背景的全局信息，但这张例图中仍出现虚警。',
  },
};

// 行位置（以 maps 裁剪图的高度为 1）：Result、L1、L2、L3、L4
const ROWS: [string, number, number][] = [
  ['Result', 0.002, 0.179],
  ['L1', 0.191, 0.368],
  ['L2', 0.378, 0.555],
  ['L3', 0.563, 0.741],
  ['L4', 0.75, 1.0],
];

function Column({ k, title, sub, highlight, labels }: { k: string; title: string; sub: string; highlight?: 'good' | 'bad'; labels?: boolean }) {
  return (
    <div className={`f1-col f1-cmp ${highlight ?? ''}`}>
      <div className="f1-head">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <div className="f1-fwbox">
        <img className="f1-fw" src={`./images/fig1-fw-${k}.png`} alt={`${title} 的连接结构（原文图 1）`} />
      </div>
      <div className="f1-mapwrap">
        <img className="f1-maps" src={`./images/fig1-maps-${k}.jpg`} alt={`${title} 的结果与 L1–L4 特征图（原文图 1）`} />
        {labels
          ? ROWS.map(([l, a, b]) => (
              <span key={l} className="f1-rl" style={{ top: `${a * 100}%`, height: `${(b - a) * 100}%` }}>
                {l}
              </span>
            ))
          : null}
      </div>
    </div>
  );
}

export const Fig1Lab: React.FC<WidgetProps> = () => {
  const [m, setM] = useState<M>('uiu');
  const meta = META[m];
  return (
    <div className="sx-lab">
      <Chips
        label="对照方法"
        value={m}
        onChange={setM}
        options={(Object.keys(META) as M[]).map((k) => ({ value: k, label: META[k].name }))}
      />
      <div className="f1-grid">
        <div className="f1-col f1-input">
          <div className="f1-head">
            <b>输入与真值</b>
            <span>原文图 1(b)</span>
          </div>
          <img src="./images/fig1-b.jpg" alt="输入红外图像与真值（原文图 1(b)）" />
          <p className="f1-cap">
            蓝圈为目标（Target），红圈为容易被误检的建筑亮点（FA）。上图为输入，下图为真值掩码；右侧小框为两处的放大。
          </p>
        </div>
        <Column k={m} title={meta.name} sub={meta.group} highlight={meta.fa ? 'bad' : undefined} labels />
        <Column k="sct" title="SCTransNet" sub="本文" highlight="good" />
      </div>
      <Feedback tone={meta.fa ? 'bad' : 'info'}>{meta.note}</Feedback>
      <Feedback tone="good">
        SCTransNet 在这张图上没有出现该虚警；原文图注指出：只有它在高层语义图中把建筑与天空分开建模，从而把目标与背景区分开、减少虚警。
      </Feedback>
      <Source>
        图像裁自原文图 1（p.2）。L1–L4 为不同解码层的注意力 / 特征可视化，L4 最深。这是作者挑选的一张定性示例，不代表所有图像上的表现；论文没有说明这些特征图的具体可视化方法（通道选择或归一化）。
      </Source>
    </div>
  );
};
