import React, { useState } from 'react';

const sample = {
  image: `${import.meta.env.BASE_URL}images/lens-official-sample-001.png`,
  source: 'https://github.com/dxqb/Lens/blob/main/assets/gallery/001-1440x1440.png',
};

function SampleCard() {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="model-gallery-card">
      <div className="model-gallery-card-head">Lens 生成样图</div>
      <div className="model-gallery-image-wrap">
        {failed ? (
          <div className="model-gallery-image-fallback">图片暂时无法加载，请查看原始来源。</div>
        ) : (
          <img
            src={sample.image}
            alt="Lens 模型图库样图：夕阳下的伦敦大本钟与威斯敏斯特桥"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption>
        <span>模型图库 Sample 001 · 1440 × 1440</span>
        <a href={sample.source} target="_blank" rel="noopener noreferrer">查看来源 ↗</a>
      </figcaption>
    </figure>
  );
}

export function ModelGallery() {
  return (
    <section className="model-gallery">
      <h2>结论</h2>
      <div className="model-gallery-grid">
        <SampleCard />
      </div>
      <p className="model-gallery-footnote">图片来自 Lens 模型图库，仅展示生成效果，不是本网页现场运行模型的结果。</p>
      <div className="model-gallery-conclusion">
        <h3>论文结论</h3>
        <p>Lens 用 3.8B 参数规模，结合详细描述、多分辨率与多长宽比训练，以及更合适的 VAE 和文字编码器，在较低训练成本下获得了有竞争力的文生图能力。</p>
        <p>论文还通过 Lens-RL-8K 后训练、Reasoner、免训练的系统提示词搜索和少步蒸馏继续提升质量与效率；Lens-Turbo 用 4 步生成，在较快推理的同时大体保留原模型的图像质量和提示词遵循能力。</p>
        <a href="https://arxiv.org/html/2605.21573" target="_blank" rel="noopener noreferrer">阅读论文结论 ↗</a>
      </div>
    </section>
  );
}
