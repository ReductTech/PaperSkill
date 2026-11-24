import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { BirderBadge, C } from './rex-kit';

// Table 13 (F1@IoU=0.5, duplicate removal) and Table 14 (Dense200 F1@mIoU, large-box removal). Values copied from the paper.
const T13 = [
  { ds: 'COCO', sft: [68.2, 70.1], grpo: [72.0, 72.6], rs: '1.23%', rg: '0.08%' },
  { ds: 'LVIS', sft: [60.3, 61.3], grpo: [64.3, 64.7], rs: '1.38%', rg: '0.06%' },
  { ds: 'VisDrone', sft: [55.6, 62.3], grpo: [61.6, 62.1], rs: '15.3%', rg: '0.1%' },
];
const SFT = '#a7c4b4';
const T14 = { sft: [44.9, 56.7], grpo: [58.3, 60.0], rs: '20.5%', rg: '3.5%' };
function Bars({ groups, k }: { groups: { label: string; bars: { v: number[]; color: string; cut: string }[] }[]; k: number }) {
  return <div className="rx-vchart">
    {groups.map(g => <div key={g.label} className="rx-vgroup">
      <div className="rx-vbars">{g.bars.map((b, i) => <div key={i} className="rx-vbar">
        <b>{b.v[k].toFixed(1)}</b>
        <span style={{ height: `${b.v[k] / 80 * 100}%`, background: b.color }}>{k === 1 && <em>删{b.cut}</em>}</span>
      </div>)}</div>
      <span className="rx-text rx-muted">{g.label}</span>
    </div>)}
  </div>;
}

export function S10Behavior(_: WidgetProps) {
  const [clean, setClean] = useState(false);
  const k = clean ? 1 : 0;
  return <div className="rx-page rx-s10">
    <div className="rx-row rx-s10-bar">
      <button className="rx-btn rx-btn-main" aria-pressed={clean} onClick={() => setClean(!clean)}>{clean ? '恢复原始输出' : '去掉重复框 / 大框后重新评测'}</button>
      <span className="rx-text">{clean ? '柱内白字 = 被删掉的预测占比　' : ''}<span className="rx-key" style={{ background: '#a7c4b4' }} />SFT　<span className="rx-key" style={{ background: C.green }} />GRPO（Rex-Omni）</span>
    </div>
    <div className="rx-s10-charts">
      <figure className="rx-chart rx-chart-wide">
        <figcaption className="rx-text">去掉重复预测：F1@IoU0.5（%）</figcaption>
        <Bars k={k} groups={T13.map(d => ({ label: d.ds, bars: [{ v: d.sft, color: SFT, cut: d.rs }, { v: d.grpo, color: C.green, cut: d.rg }] }))} />
      </figure>
      <figure className="rx-chart">
        <figcaption className="rx-text">Dense200 去掉大框：F1@mIoU（%）</figcaption>
        <Bars k={k} groups={[{ label: 'SFT', bars: [{ v: T14.sft, color: SFT, cut: T14.rs }] }, { label: 'GRPO', bars: [{ v: T14.grpo, color: C.green, cut: T14.rg }] }]} />
      </figure>
    </div>
    <div className="rx-s10-bottom">
      <BirderBadge size={96} />
      <p className="rx-text" aria-live="polite">{clean
        ? 'SFT 模型被删掉的多：VisDrone 上 15.3% 的预测是重复框，删后 F1 从 55.6 升到 62.3；Dense200 上 20.5% 是大框。GRPO 模型几乎没什么可删，分数也基本不变——GRPO 的提升主要来自不再重复、不再画大框。'
        : '先看原始结果：GRPO 在三个数据集上都高于 SFT，VisDrone 高 6.0 分。点击上方按钮，把两种模型输出中的重复框、大框删掉再评测，看看差距从哪里来。'}</p>
      <img className="rx-s10-fig" src="./images/figure-17.png" alt="论文图 17：SFT 与 GRPO 模型的重复框和大框对比" />
    </div>
  </div>;
}
