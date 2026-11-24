import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { BirderBadge, C } from './rex-kit';

// Table 16: F1@IoU=0.5 of SFT, GRPO and SFT high-temperature sampling (8 samples, T=1.2, top-k 50, top-p 0.99).
const T16: Record<string, number[]> = { COCO: [68.2, 72.0, 64.6, 72.6], LVIS: [60.3, 64.3, 56.6, 59.8], Dense200: [60.2, 78.4, 38.2, 50.6] };
const NAMES = ['SFT', 'GRPO', 'SFT 采样·最好一轮', 'SFT 采样·逐题挑最好'];
const COLORS = ['#a7c4b4', C.green, '#b8c4d6', C.blue];
// Table 15: F1@mIoU on samples where both models match GT count and IoU threshold.
const T15 = [{ ds: 'COCO', a: 63.0, b: 63.5 }, { ds: 'LVIS', a: 56.6, b: 56.9 }, { ds: 'HumanRef', a: 60.0, b: 61.2 }];
const NOTE: Record<string, string> = {
  COCO: 'COCO 上，从 SFT 的 8 个采样里逐题挑最好的（72.6）甚至略高于 GRPO（72.0）：SFT 其实“会”，只是不一定采到。GRPO 在简单数据上主要提高了采到好答案的概率。',
  LVIS: 'LVIS 上，逐题挑最好也只有 59.8，低于 GRPO 的 64.3：类别多、长尾时，GRPO 带来的提升超出了 SFT 采样能达到的范围。',
  Dense200: 'Dense200 上差距最大：逐题挑最好 50.6，GRPO 78.4。密集场景里 SFT 很难自己避免重复和大框，GRPO 从根本上改善了输出质量。',
};

export function S11Precision(_: WidgetProps) {
  const [ds, setDs] = useState('COCO');
  const v = T16[ds];
  return <div className="rx-page rx-s11">
    <div className="rx-s11-left">
      <div className="rx-row" role="group" aria-label="选择数据集">
        {Object.keys(T16).map(d => <button key={d} className={`rx-chip ${ds === d ? 'is-on' : ''}`} aria-pressed={ds === d} onClick={() => setDs(d)}>{d}</button>)}
        <span className="rx-text rx-muted">F1@IoU0.5（%）</span>
      </div>
      <div className="rx-hbars">
        {NAMES.map((n, i) => <div key={n} className="rx-hbar">
          <span className="rx-text">{n}</span>
          <span className="rx-hbar-track"><span style={{ width: `${v[i] / 80 * 100}%`, background: COLORS[i] }} /></span>
          <b className="rx-text">{v[i].toFixed(1)}</b>
        </div>)}
      </div>
      <p className="rx-text" aria-live="polite">{NOTE[ds]}</p>
      <p className="rx-text rx-muted">“逐题挑最好”要事先知道真值才能挑，只是估计 SFT 的上限，不能实际部署。</p>
    </div>
    <div className="rx-s11-right">
      <h3 className="rx-h">坐标精度的变化</h3>
      <p className="rx-text">只看两种模型框数都对、且都匹配上的样本（F1@mIoU）：</p>
      {T15.map(r => <div key={r.ds} className="rx-dumb">
        <span className="rx-text">{r.ds}</span>
        <span className="rx-dumb-track"><i style={{ left: `${(r.a - 50) / 20 * 100}%`, background: '#a7c4b4' }} /><i style={{ left: `${(r.b - 50) / 20 * 100}%`, background: C.green }} /></span>
        <b className="rx-text">{r.a.toFixed(1)} → {r.b.toFixed(1)}</b>
      </div>)}
      <p className="rx-text">只提高 0.3–1.2 分。论文据此认为：GRPO 的主要作用不是让坐标更精确，而是纠正行为。</p>
      <div className="rx-row"><BirderBadge size={84} /><p className="rx-text rx-muted">训练曲线（图 16）也一致：SFT 慢慢涨到平台，GRPO 只用几万条数据就跳了一截。</p></div>
    </div>
  </div>;
}
