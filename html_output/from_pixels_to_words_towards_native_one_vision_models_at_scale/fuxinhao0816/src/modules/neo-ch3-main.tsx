import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { StreetThumbnail } from './neo-ch2-shared';

type Architecture = 'modular' | 'native';
type TokenStep = 0 | 1 | 2;

function Arrow() {
  return <span className="ch3-arrow" aria-hidden="true">→</span>;
}

function BasicNode({ title, note, tone = 'blue', children }: { title: string; note: string; tone?: 'blue' | 'orange' | 'green' | 'purple'; children?: React.ReactNode }) {
  return (
    <div className={`ch3-arch-node is-${tone}`}>
      {children}<strong>{title}</strong><small>{note}</small>
    </div>
  );
}

function ArchitectureDiagram({ architecture }: { architecture: Architecture }) {
  if (architecture === 'modular') {
    return (
      <div className="ch3-arch-track is-modular" aria-label="传统 Modular VLM 架构：图片经过独立 Vision Encoder 和 Projector Adapter，再进入 LLM">
        <BasicNode title="图片" note="视觉输入"><StreetThumbnail /></BasicNode><Arrow />
        <BasicNode title="独立 Vision Encoder" note="形成视觉表示" /><Arrow />
        <BasicNode title="Projector / Adapter" note="映射表示" tone="orange" /><Arrow />
        <BasicNode title="LLM" note="语言理解与生成" />
      </div>
    );
  }

  return (
    <div className="ch3-arch-track is-native" aria-label="NEO-ov 架构：图片经过轻量视觉入口后进入包含 Pre-Buffer 的统一主干">
      <BasicNode title="图片" note="视觉输入"><StreetThumbnail /></BasicNode><Arrow />
      <BasicNode title="轻量视觉入口" note="patch embedding" tone="green" /><Arrow />
      <div className="ch3-native-core">
        <span className="ch3-core-label">统一架构内部</span>
        <div className="ch3-prebuffer"><strong>Pre-Buffer</strong><small>内部组成部分</small></div>
        <Arrow />
        <div className="ch3-backbone"><strong>统一主干</strong><span>视觉 + 语言共同建模</span></div>
        <div className="ch3-text-entry"><span>文本 tokens</span><i aria-hidden="true">↑</i></div>
      </div>
    </div>
  );
}

export const NeoCh3Main: React.FC<WidgetProps> = () => {
  const [architecture, setArchitecture] = useState<Architecture>('modular');
  const native = architecture === 'native';

  return (
    <div className="ch3-tool ch3-architecture-tool">
      <div className="ch3-mode-switch" role="group" aria-label="切换架构">
        <button type="button" className={!native ? 'is-active' : ''} aria-pressed={!native} onClick={() => setArchitecture('modular')}>传统 Modular VLM</button>
        <button type="button" className={native ? 'is-active' : ''} aria-pressed={native} onClick={() => setArchitecture('native')}>NEO-ov</button>
      </div>

      <ArchitectureDiagram architecture={architecture} />

      <p className="ch3-arch-feedback" aria-live="polite">
        {native ? '轻量视觉入口仍然存在；visual tokens 随后由统一主干继续处理。' : '视觉表示先在独立视觉模块中形成，再进入语言模型。'}
      </p>

      <div className={`ch3-change-summary ${native ? 'is-native' : ''}`}>
        <div><span>独立 Vision Encoder</span><b>{native ? '移除独立边界' : '独立存在'}</b></div>
        <div><span>独立 Projector / Adapter</span><b>{native ? '移除独立边界' : '负责映射'}</b></div>
        <div><span>视觉表示学习</span><b>{native ? '重新组织进统一模型' : '先由独立视觉模型承担'}</b></div>
      </div>

      <p className="ch3-section-takeaway">Encoder-Free 去掉的是“独立视觉编码器”，不是视觉输入处理本身。</p>
    </div>
  );
};

const stepLabels = ['① 原始图片', '② 形成局部视觉单元', '③ 得到 visual tokens'] as const;

function RegionLink({ step, selectedRegion, onSelect }: { step: TokenStep; selectedRegion: number; onSelect: (index: number) => void }) {
  return (
    <div className={`ch3-region-link is-step-${step}`}>
      <div className="ch3-image-side">
        <span className="ch3-side-label">{step === 0 ? '原始视觉输入 I' : '同一张街景 · 局部区域'}</span>
        <div className="ch3-image-grid-wrap">
          <StreetThumbnail detailed />
          {step > 0 ? (
            <div className="ch3-region-grid" aria-label="图像局部区域">
              {Array.from({ length: 12 }, (_, index) => (
                <button key={index} type="button" disabled={step !== 2} className={step === 2 && selectedRegion === index ? 'is-selected' : ''} aria-label={`区域 ${index + 1}`} aria-pressed={step === 2 ? selectedRegion === index : undefined} onClick={() => onSelect(index)} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {step === 1 ? (
        <div className="ch3-visual-route" aria-label="视觉映射过程">
          <span>图像 I</span><Arrow /><span>Conv₁</span><Arrow /><span>局部视觉特征</span><Arrow /><span>GELU + PE</span><Arrow /><span>Conv₂</span>
        </div>
      ) : null}

      {step === 2 ? (
        <>
          <div className="ch3-region-correspondence" aria-hidden="true">↕</div>
          <div className="ch3-token-side">
            <span className="ch3-side-label">visual tokens xᵥ</span>
            <div className="ch3-token-grid">
              {Array.from({ length: 12 }, (_, index) => (
                <button key={index} type="button" className={selectedRegion === index ? 'is-selected' : ''} aria-label={`visual token ${index + 1}`} aria-pressed={selectedRegion === index} onClick={() => onSelect(index)}>v{index + 1}</button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FormulaAndMapping() {
  return (
    <section className="ch3-formula-section" aria-labelledby="ch3-equation-title">
      <h5 id="ch3-equation-title">论文怎样精确定义这个视觉入口？</h5>
      <div className="ch3-equation" aria-label="视觉入口公式">
        <code>xᵥ = Conv₂(GELU(Conv₁(I)) + PE),</code>
        <code>xₜ = Tokenizer(T).</code>
      </div>

      <div className="ch3-paper-settings" aria-label="论文中的具体设置">
        <span><b>Conv₁</b> stride = 16</span>
        <span><b>Conv₂</b> stride = 2</span>
        <span>每个 visual token 对应 <b>32×32</b> 图像区域</span>
      </div>

      <div className="ch3-equation-map">
        <div className="ch3-equation-branch is-visual">
          <strong>视觉支路</strong>
          <div><span><b>I</b><small>原始图像</small></span><Arrow /><span><b>Conv₁</b><small>局部特征</small></span><Arrow /><span><b>GELU + PE</b><small>非线性 + 二维位置</small></span><Arrow /><span><b>Conv₂</b><small>局部聚合</small></span><Arrow /><span><b>xᵥ</b><small>视觉 tokens · nᵥ×d</small></span></div>
        </div>
        <div className="ch3-equation-branch is-text">
          <strong>文本支路</strong>
          <div><span><b>T</b><small>输入文本</small></span><Arrow /><span><b>Tokenizer</b><small>原 LLM tokenizer</small></span><Arrow /><span><b>xₜ</b><small>文本 tokens · nₜ×d</small></span></div>
        </div>
        <div className="ch3-branch-join"><span>xᵥ</span><b>+</b><span>xₜ</span><Arrow /><strong>统一模型</strong></div>
      </div>

      <p className="ch3-position-forward">PE 为视觉表示加入二维位置信息。“位置”究竟怎样被编码，我们会在后面的空间—时间建模章节专门展开。</p>

    </section>
  );
}

export const NeoCh3Tokens: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState<TokenStep>(0);
  const [selectedRegion, setSelectedRegion] = useState(7);

  return (
    <div className="ch3-tool ch3-token-tool">
      <div className="ch3-step-switch" role="group" aria-label="从图片形成视觉 token 的三个状态">
        {stepLabels.map((label, index) => <button key={label} type="button" className={step === index ? 'is-active' : ''} aria-pressed={step === index} onClick={() => setStep(index as TokenStep)}>{label}</button>)}
      </div>
      <RegionLink step={step} selectedRegion={selectedRegion} onSelect={(index) => { setSelectedRegion(index); setStep(2); }} />
      <FormulaAndMapping />
    </div>
  );
};
