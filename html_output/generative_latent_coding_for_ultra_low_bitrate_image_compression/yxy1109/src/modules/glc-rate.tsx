import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel, fmt } from './glc-kit';

export function GlcRate() {
  const [target, setTarget] = useState(42);
  const detail = Math.round(22 + target * .74);
  const extreme = target < 9;
  return <div className="glc-scene glc-rate-page">
    <aside className="glc-rate-control">
      <StageBadge tone="orange">单一模型 · 可变码率</StageBadge>
      <h3>目标档位</h3>
      <strong className="glc-huge-number">{fmt(target, 0)}<small>%</small></strong>
      <label className="glc-range-label">
        <span>从极低码率拖向较高码率</span>
        <input aria-label="调整目标码率档位" type="range" min="0" max="100" value={target}
          onChange={event => setTarget(Number(event.target.value))} />
      </label>
      <div className="glc-modulator-diagram">
        <div><CodeChip tone="orange">q_enc</CodeChip><span>编码侧调制</span></div>
        <b>→</b>
        <div className="is-quant"><span>Q</span><small>量化</small></div>
        <b>→</b>
        <div><CodeChip tone="blue">q_dec</CodeChip><span>解码侧调制</span></div>
      </div>
      <div className={`glc-feedback is-${extreme ? 'red' : target < 55 ? 'orange' : 'green'}`} aria-live="polite">
        {extreme
          ? '极低端优先守住语义骨架，但纹理与精细结构可能不足。'
          : target < 55
            ? '率与细节折中：主体稳定，纹理按预算逐步增加。'
            : '码率上升，更多纹理可被保留；质量改善不等于无限变好。'}
      </div>
      <p className="glc-note">档位是理解用归一化变量，不直接表示论文 bpp。</p>
    </aside>
    <div className="glc-rate-main">
      <StudioPanel className="glc-rate-photo" tone="blue">
        <div className="glc-card-title"><span>同一模型的率—细节变化</span>
          <CodeChip tone="orange">教学档位 {target}%</CodeChip>
        </div>
        <MosaicArtwork detail={detail} mode="latent" generative
          label={`同一 GLC 模型在目标档位 ${target}% 时的语义与纹理示意`} />
        <div className="glc-rate-tags">
          <span className={target < 28 ? 'is-active' : ''}>语义轮廓优先</span>
          <span className={target >= 28 && target < 68 ? 'is-active' : ''}>主体与纹理折中</span>
          <span className={target >= 68 ? 'is-active' : ''}>复杂纹理增加</span>
        </div>
      </StudioPanel>
      <StudioPanel className="glc-rate-formula" tone="purple">
        <span className="glc-section-label">潜空间变换中的码率调制</span>
        <div className="glc-formula">
          <SymbolHint meaning="l：生成式 VQ-VAE 潜码；变换编码的输入。">l</SymbolHint>
          <span> → </span>
          <SymbolHint meaning="gₐ：分析变换，先产生连续变换码。">gₐ</SymbolHint>
          <span>(l) → </span>
          <SymbolHint meaning="q_enc：训练得到的编码侧特征缩放器；同一模型可随目标码率改变其调制。">q_enc</SymbolHint>
          <span> → Q → </span>
          <SymbolHint meaning="q_dec：解码侧特征缩放器，与编码侧共同支持可变码率。">q_dec</SymbolHint>
        </div>
        <p>论文按不同码率训练，并在编码/解码变换中加入学习到的缩放器。你拖动的是一个档位示意；单模型可覆盖多个工作点这一结论来自论文结构与 Figure 14。</p>
        <div className="glc-rate-meter" aria-label={`相对码量示意 ${target + 20}%`}>
          <span style={{ width: `${target}%` }} />
        </div>
        <div className="glc-rate-caption"><b>相对码量示意</b><span>{target < 9 ? '极低端需检查结构保真' : '细节随预算增长'}</span></div>
      </StudioPanel>
    </div>
  </div>;
}
