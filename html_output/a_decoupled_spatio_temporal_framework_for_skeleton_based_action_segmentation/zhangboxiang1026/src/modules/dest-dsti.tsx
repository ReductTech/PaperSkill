// Refinement 2026-10-22. Mechanism follows arXiv v1 §3.2–3.4, Eqs. 3, 7 and Figs. 3–4.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const descriptions = [
  '先做一次统一空间建模，得到整段序列的空间表示 S。这里学的是关节之间的关系；不是每经过一个时间层，就重新做一次空间建模。',
  '空间表示沿通道分成 M 组。第一组变换后的特征送入第一个 JTM，产生初始时间特征 H₁。每一组仍包含多个关节的信息，不是把手、脚分别切成一组。',
  '下一组空间子特征与上一层的 H₁ 通过交叉注意力交互，得到 R₁，再送入下一层 JTM。空间支路持续补充线索，时间主干继续积累上下文。',
  '更深层重复“新一组空间线索 + 当前时间特征”的交互。最后的时间表示用于类别和边界预测：解耦的是建模组织方式，时空信息仍然结合。',
];
export const DestDsti: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const stages = ['一次空间建模', '第一组与首层', '第二组与后层', '多层交互与输出'];
  return <div className="dest-refined">
    <p className="dest-eyebrow">从空间分组看懂时间主干 · 三组仅为结构示意</p>
    <div className="dest-network" role="img" aria-label={`当前查看：${stages[active]}。一次空间建模产生不同子特征，分别与时间主干的不同层交互。`}>
      <div className={'dest-spatial-source' + (active === 0 ? ' is-focus' : '')}>
        <strong>一次空间建模 S</strong><span>整段骨架序列 → 关节关系表示</span>
      </div>
      <div className="dest-split-caption">沿通道分组，再做特征变换 ↓</div>
      <div className="dest-network-grid">
        {[0, 1, 2].map(i => <div key={i} className={'dest-feature-group' + (active === i + 1 ? ' is-focus' : '')}>
          <span>空间子特征</span><strong>Ŝ{i + 1}</strong>
        </div>)}
        {[0, 1, 2].map(i => <div key={`link-${i}`} className={'dest-injection' + (active === i + 1 ? ' is-focus' : '')}>{i === 0 ? '↓ 首层输入' : '↓ 自适应注入'}</div>)}
        {[0, 1, 2].map(i => <div key={`layer-${i}`} className={'dest-temporal-layer' + (active === i + 1 ? ' is-focus' : '')}>
          {i > 0 && <span className="dest-layer-in">上一层 H{i} → 交互 R{i}</span>}
          <strong>JTM {i + 1}</strong><span>产生 H{i + 1}</span>
          {i < 2 && <span className="dest-layer-arrow" aria-hidden="true">→</span>}
        </div>)}
      </div>
      <div className={'dest-network-output' + (active === 3 ? ' is-focus' : '')}>最后时间表示 → 动作类别与边界</div>
    </div>
    <div className="ctrl">{stages.map((label, i) => <button key={label} className={'chip' + (active === i ? ' active' : '')} aria-pressed={active === i} onClick={() => setActive(i)}>{label}</button>)}</div>
    <div className="feedback" aria-live="polite"><strong>{stages[active]}：</strong>{descriptions[active]}</div>
    <details className="dest-details"><summary>交叉注意力到底做了什么？</summary>
      <p>式（3）先由映射后的空间子特征与时间特征计算注意力权重 A，再用 A 重组时间特征，并保留残差：<strong>R = AH + H</strong>。因此它会根据当前输入调整交互，而不是把两个表示直接相加。</p>
      <p>注意力中的映射 Wᶜ 对齐特征维度；温度 τ 控制权重的尖锐程度。这里省略层下标，只解释原式结构，没有运行论文模型或生成真实注意力图。</p>
    </details>
    <p className="module-note">来源：§3.2–3.4，Figures 3–4、式（3）（7）。图示只展开三个组；不是论文网络的完整层数。子特征按通道划分，不能当成身体部位分组。</p>
  </div>;
};
