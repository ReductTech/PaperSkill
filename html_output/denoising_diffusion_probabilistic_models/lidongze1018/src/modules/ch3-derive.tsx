import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { ZoomImg } from './zoom-img';

// Module 3.2 — six-step derivation walk-through (Definition → closed form →
// variational bound → posterior → ε-parameterization → L_simple). Every step cites
// the exact paper equation; Figure 2 from the original paper is shown at step 1.
// NOTE: `why` and `title` are rendered as PLAIN TEXT (no HTML) — keep them tag-free;
// formulas are rendered as HTML on purpose.

interface Step {
  title: string;
  formula: string;
  why: string;
  source: string;
  table?: { headers: string[]; rows: string[][] };
  figure?: { src: string; caption: string; alt: string };
}

const STEPS: Step[] = [
  {
    title: '前向扩散：逐步加噪的马尔可夫链',
    formula:
      'q(xₜ | xₜ₋₁) = N( √αₜ · xₜ₋₁ , βₜ·I )，&nbsp; q(x₁:ₜ | x₀) = ∏<span class="lim-stack"><sup>t</sup><sub>s=1</sub></span> q(xₛ | xₛ₋₁)',
    why: '每步只加一点点高斯噪声；方差表 β₁…β_T 是固定超参数（本文不做学习）。前向过程是固定的（Eq. (2)），反向过程（Eq. (1)）被训练来近似其逆方向转移 —— 并非天然精确互逆。',
    source: '论文 Eq. (2)（前向）；Figure 2（实线 pθ 为反向 xₜ→xₜ₋₁；虚线 q 为前向 xₜ₋₁→xₜ）',
    figure: {
      src: './images/fig2-graphical-model.png',
      caption:
        '原论文 Figure 2（自 PDF 第 2 页裁剪、去除页边距；内容未修改）：实线箭头 pθ 为学习的反向生成（x_T→…→x₀，向左/后），虚线箭头 q 为固定的前向加噪（x₀→…→x_T，向右/前）。',
      alt: '原论文 Figure 2 概率图模型',
    },
  },
  {
    title: '闭式直达：任意时刻一步采样',
    formula: 'q(xₜ | x₀) = N( √ᾱₜ · x₀ , (1−ᾱₜ)·I ) &nbsp;⟹&nbsp; xₜ = √ᾱₜ · x₀ + √(1−ᾱₜ) · ε',
    why: 'ᾱₜ = ∏(1−βₛ) 允许从 x₀ 直接得到任意 t 的带噪样本——训练时随机抽一个 t 就够了，不必逐步模拟 1000 次前向。式中的 ε ~ N(0, I) 是直接构造 xₜ 的累计等效噪声（后续 εθ 学习的目标就是它，而不是某一次转移的噪声增量）。',
    source: '论文 Eq. (4)',
  },
  {
    title: '训练目标：变分上界拆成三项',
    formula:
      'L = L_T + Σ<sub>t&gt;1</sub> Lₜ₋₁ + L₀，&nbsp; L_T = D_KL( q(x_T|x₀) ‖ p(x_T) )，&nbsp; Lₜ₋₁ = D_KL( q(xₜ₋₁|xₜ,x₀) ‖ pθ(xₜ₋₁|xₜ) )，&nbsp; L₀ = −log pθ(x₀|x₁)',
    why: '三项性质不同：L_T 是前向终点分布与标准高斯先验之间的 KL（固定前向过程时不依赖可训练参数 θ，为常数）；Lₜ₋₁ 是真实后验与学习反向转移之间的 KL（可闭式计算）；L₀ 是重建/解码的负对数似然项，不是 KL 项。',
    source: '论文 Eq. (5)；Appendix A 的完整推导',
    table: {
      headers: ['项', '比较 / 定义', '性质'],
      rows: [
        ['L_T', 'q(x_T|x₀) vs p(x_T) = N(0, I)', 'KL 项；固定前向下与 θ 无关（常数）'],
        ['Lₜ₋₁（t>1）', 'q(xₜ₋₁|xₜ,x₀) vs pθ(xₜ₋₁|xₜ)', 'KL 项；两个高斯，可闭式计算'],
        ['L₀', 'pθ(x₀|x₁)（离散解码器，Eq. (13)）', '重建项（负对数似然），非 KL'],
      ],
    },
  },
  {
    title: '关键一步：后验是闭式高斯',
    formula:
      'q(xₜ₋₁|xₜ,x₀) = N( μ̃ₜ , β̃ₜ·I )，&nbsp; μ̃ₜ = [ √ᾱₜ₋₁·βₜ·x₀ + √αₜ(1−ᾱₜ₋₁)·xₜ ] / (1−ᾱₜ)',
    why: '因为可以直接算出，Lₜ₋₁ 的 KL 有闭式表达（不必蒙特卡洛）——这就是可以稳定训练的原因。t=1 时后验退化为点质量：对应的似然项 L₀ 采用离散解码器（Eq. (13)）处理；采样循环的最后一步则是 z=0（见第 6 章）。',
    source: '论文 Eq. (6)–(7)',
  },
  {
    title: '噪声预测参数化：把 μθ 改写为「以 ε 预测为参数」',
    formula:
      'μθ(xₜ,t) = (1/√αₜ) · ( xₜ − βₜ/√(1−ᾱₜ) · εθ(xₜ,t) )',
    why: 'Eq. (9)–(10) 的推导表明：用「xₜ 减去一个噪声估计」重写 μθ 时，训练信号自然落在噪声上，实现也更简单。εθ 的学习目标正是 Eq. (4) 中构造 xₜ 的累计等效噪声 ε。这是本文采用并验证有效的设计选择 —— 论文同样比较了预测 μ̃ 与 x₀（§3.2；表 2），并非唯一允许的参数化。',
    source: '论文 Eq. (10)–(11)',
  },
  {
    title: '简化目标 L_simple：丢掉权重，反而更好',
    formula: 'L_simple(θ) = E_{t,x₀,ε} ‖ ε − εθ( √ᾱₜ·x₀ + √(1−ᾱₜ)·ε , t ) ‖²',
    why: '去掉 Eq. (12) 的权重后，小 t（简单任务）被降权、大 t（难任务）被相对重视：这是对原始变分界各项的重新加权（论文称其为 a weighted variational bound），但 L_simple 不等于标准的严格变分上界目标（t=1 项还做了近似）。在论文的加权设定下，它与多噪声尺度的去噪分数匹配建立等价关系（§3.2）。论文实测样本质量最好（FID 13.51→3.17，见第 5 章消融）。式中的 ε 同样是构造 xₜ 的累计等效噪声。',
    source: '论文 Eq. (14)；Section 3.4',
  },
];

export const Ch3Derive: React.FC<WidgetProps> = ({ chapterId }) => {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  return (
    <div key={`${chapterId}-derive`}>
      <div className="derive-card">
        <div className="derive-head">
          <span className="derive-step-no">第 {step + 1} / {STEPS.length} 步</span>
          <span className="derive-title">{cur.title}</span>
        </div>
        <div className="derive-formula" dangerouslySetInnerHTML={{ __html: cur.formula }} />
        <div className="derive-why">{cur.why}</div>
        {cur.table ? (
          <table className="paper derive-table">
            <thead>
              <tr>
                {cur.table.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cur.table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div className="derive-source">
          <span className="source-tag">{cur.source}</span>
        </div>
        {cur.figure ? (
          <figure className="fig-embed">
            <ZoomImg src={cur.figure.src} alt={cur.figure.alt} caption={cur.figure.caption} />
            <figcaption>{cur.figure.caption}</figcaption>
          </figure>
        ) : null}
      </div>
      <div className="chip-row">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          上一步
        </button>
        {STEPS.map((_s, i) => (
          <button
            key={i}
            type="button"
            className={`chip ${i === step ? 'selected' : ''}`}
            onClick={() => setStep(i)}
            aria-label={`第 ${i + 1} 步`}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          className="tiny"
          onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
          disabled={step === STEPS.length - 1}
        >
          下一步
        </button>
      </div>
    </div>
  );
};

export default Ch3Derive;
