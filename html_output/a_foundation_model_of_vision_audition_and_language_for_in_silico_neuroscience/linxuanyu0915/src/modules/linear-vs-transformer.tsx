import { ContextWindowLab } from './lesson-labs';
import React from 'react';
import type { WidgetProps } from './registry';

type Focus = 'both' | 'fir' | 'transformer';

export const LinearVsTransformer: React.FC<WidgetProps> = () => {
  const [focus, setFocus] = React.useState<Focus>('both');
  return (
    <div className="chapter3-comparison">
      <div className="chapter3-comparison-controls segmented" aria-label="选择时间模型">
        <button type="button" aria-pressed={focus === 'both'} onClick={() => setFocus('both')}>并排比较</button>
        <button type="button" aria-pressed={focus === 'fir'} onClick={() => setFocus('fir')}>Deep FIR</button>
        <button type="button" aria-pressed={focus === 'transformer'} onClick={() => setFocus('transformer')}>TRIBE v2</button>
      </div>

      <ContextWindowLab />
      <div className="chapter3-shared-input">
        <span>公平比较</span>
        <strong>Same pretrained multimodal stimulus features</strong>
        <small>输入特征相同，主要差别在 temporal model</small>
      </div>

      <div className="chapter3-model-grid">
        <article className={`chapter3-model-card fir ${focus === 'transformer' ? 'is-muted' : 'is-active'}`}>
          <header><span>强线性 baseline</span><strong>Deep FIR</strong></header>
          <div className="chapter3-window short"><i /><b>9 TR</b></div>
          <div className="chapter3-model-step">Linear temporal convolution</div>
          <div className="chapter3-model-outcome">Local linear context</div>
        </article>
        <article className={`chapter3-model-card transformer ${focus === 'fir' ? 'is-muted' : 'is-active'}`}>
          <header><span>论文方法</span><strong>TRIBE v2</strong></header>
          <div className="chapter3-window long"><i /><b>100 s</b></div>
          <div className="chapter3-model-step">Transformer <small>8 layers · 8 heads</small></div>
          <div className="chapter3-model-outcome">Long-context nonlinear modeling</div>
        </article>
      </div>

      <p className="chapter3-epoch-note">补充：Deep FIR 最多训练约 30 epochs，TRIBE v2 最多约 15 epochs；训练轮数是各自优化设置的一部分，不是本节核心结论。模型比较遵循相同的 stimulus–BOLD 时间对齐策略。</p>

      <div className="chapter3-evidence-grid">
        <section>
          <figure className="chapter3-paper-panel">
            <span className="chapter3-paper-label">论文 Fig.2D · 原图</span>
            <img src="./images/fig2-d.png" alt="Figure 2D TRIBE v2 与 Deep FIR 的编码性能比较" loading="eager" />
          </figure>
          <div className="chapter3-evidence-copy">
            <strong>全部测试数据集上显著更高</strong>
            <p>在相同 pretrained features 下，TRIBE v2 的 encoding performance 均高于 Deep FIR。</p>
            <small>FDR-corrected <span>q &lt; 10<sup>−4</sup></span></small>
          </div>
        </section>
        <section>
          <figure className="chapter3-paper-panel">
            <span className="chapter3-paper-label">论文 Fig.2E · 原图</span>
            <img src="./images/fig2-e.png" alt="Figure 2E 训练数据规模与编码准确率的关系" loading="eager" />
          </figure>
          <div className="chapter3-evidence-copy">
            <strong>更多训练数据仍持续提升性能</strong>
            <p>随着训练数据量增加，encoding accuracy 近似呈 log-linear 增长；作者测试范围内尚未观察到明显平台期。</p>
          </div>
        </section>
      </div>

      <div className="chapter3-boundary-card">
        <b>解释边界</b>
        <span>TRIBE v2 优于线性 baseline 是模型比较结果，并不等价于证明人脑使用 Transformer 式计算。</span>
      </div>
    </div>
  );
};
