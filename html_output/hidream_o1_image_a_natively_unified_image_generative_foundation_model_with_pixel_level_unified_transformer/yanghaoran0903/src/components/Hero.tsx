import { useState } from 'react';
import { LegacyPipelineCanvas } from './legacy-pipeline-canvas';
import { UnifiedPipelineCanvas } from './unified-pipeline-canvas';

const TAGS = ['统一Token空间', '像素空间扩散', '混合统一注意力', 'Prompt Agent', '2048×2048'];

export function Hero({ onStart }: { onStart?: () => void }) {
  const [ctaHidden, setCtaHidden] = useState(false);

  const scrollToFirst = () => {
    setCtaHidden(true);
    onStart?.();
    document.getElementById('chap-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero">
      <div className="hero-inner">
        <span className="hero-venue">HIDREAM-O1-IMAGE</span>
        <h1>HiDream-O1-Image</h1>
        <p className="hero-sub">像素级统一 Transformer 的原生统一图像生成基础模型</p>

        <p className="hero-abs">
          HiDream-O1-Image 把文本、条件图像和待生成图像都映射到同一个 Token 空间，让统一 Transformer 端到端理解、推理并生成高保真图像。
        </p>

        <ul className="hero-meta">
          {TAGS.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>

        <div className="hero-compare">
          <article className="bg-side old">
            <header className="bg-side-head">旧路线：模块化流水线</header>
            <div className="bg-side-canvas">
              <LegacyPipelineCanvas />
            </div>
            <div className="bg-side-tag">先压缩、再分开编码，信息在搬运中损耗。</div>
          </article>

          <article className="bg-side new">
            <header className="bg-side-head">新路线：统一 Token 空间</header>
            <div className="bg-side-canvas">
              <UnifiedPipelineCanvas />
            </div>
            <div className="bg-side-tag">三种输入汇入同一空间，由统一主干直接生成。</div>
          </article>
        </div>

        {!ctaHidden ? (
          <div className="hero-start">
            <p className="hero-start-question">准备好了解 UiT 的奥秘了吗</p>
            <button type="button" className="hero-start-btn" onClick={scrollToFirst}>
              开始学习 §1 <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
