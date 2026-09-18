import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Focus = 'train' | 'test';

export const UnifiedCoverage: React.FC<WidgetProps> = () => {
  const [focus, setFocus] = useState<Focus>('train');
  const feedback = focus === 'train'
    ? '训练阶段汇集 4 个 deep datasets：25 名被试、451.6 小时 fMRI。'
    : '外部测试使用 4 个完全未参与训练的 broad datasets：695 名被试、666.1 小时 fMRI。';

  return (
    <div className="chapter1-generalization">
      <div className="visual-source-tag teaching">教学示意 · 非论文原图</div>
      <div className="chapter1-study-flow" aria-label="TRIBE v2 跨研究训练与独立测试流程">
        <section className={`chapter1-study-card train ${focus === 'train' ? 'is-active' : ''}`}>
          <span>训练研究</span>
          <strong>4 个 deep datasets</strong>
          <div><b>25</b> 名被试</div>
          <div><b>451.6</b> 小时 fMRI</div>
        </section>
        <div className="chapter1-flow-arrow" aria-hidden="true">→</div>
        <div className="chapter1-model-node">
          <span>统一脑编码模型</span>
          <strong>TRIBE v2</strong>
        </div>
        <div className="chapter1-flow-arrow" aria-hidden="true">→</div>
        <section className={`chapter1-study-card test ${focus === 'test' ? 'is-active' : ''}`}>
          <span>外部测试研究</span>
          <strong>4 个 broad datasets</strong>
          <div><b>695</b> 名被试</div>
          <div><b>666.1</b> 小时 fMRI</div>
        </section>
      </div>

      <div className="segmented chapter1-focus-controls" role="group" aria-label="查看训练与外部测试数据">
        <button type="button" aria-pressed={focus === 'train'} onClick={() => setFocus('train')}>查看训练研究</button>
        <button type="button" aria-pressed={focus === 'test'} onClick={() => setFocus('test')}>查看外部测试</button>
      </div>
      <div className="feedback good" aria-live="polite">{feedback}</div>

      <div className="chapter1-total-card">
        <span>全部研究总计</span>
        <strong><b>720</b> 名被试</strong>
        <strong><b>1117.7</b> 小时 fMRI</strong>
      </div>
      <p className="chapter1-ood-note">
        <b>注意：</b>这里是 <span>study-level held-out / OOD</span> 外部测试，而不是普通随机 train/test split。
      </p>
    </div>
  );
};
