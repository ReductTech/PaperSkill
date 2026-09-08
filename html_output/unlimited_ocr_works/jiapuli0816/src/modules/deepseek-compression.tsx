import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Stage = 0 | 1 | 2 | 3;

const stages: Array<{ label: string; feedback: string }> = [
  { label: '页面', feedback: 'Base 页面｜1024×1024' },
  { label: 'DeepEncoder', feedback: 'DeepEncoder｜先提取高分辨率视觉特征' },
  { label: '16×压缩', feedback: '16×桥接｜把视觉序列缩短到原来的 1/16' },
  { label: '256 tokens', feedback: '压缩结果｜256 个视觉 token，送入 3B MoE' },
];

const compressionCells = Array.from({ length: 16 }, (_, index) => index);
const visualTokens = Array.from({ length: 256 }, (_, index) => index);

function cardClass(stage: Stage, index: Stage) {
  if (stage === index) return `dsc-card is-active ${index === 3 ? 'is-result' : ''}`;
  if (stage > index) return 'dsc-card is-past';
  return 'dsc-card is-future';
}

function Connector({ active }: { active: boolean }) {
  return <div className={`dsc-connector ${active ? 'is-active' : ''}`} aria-hidden="true" />;
}

export const DeepSeekCompression: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<Stage>(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) {
      setStage(3);
      setManual(true);
      return undefined;
    }
    if (manual) return undefined;
    const timer = window.setInterval(() => {
      setStage((current) => ((current + 1) % stages.length) as Stage);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [manual]);

  const chooseStage = (nextStage: Stage) => {
    setStage(nextStage);
    setManual(true);
  };

  return (
    <div className="deepseek-compression-widget">
      <div className="dsc-kicker">
        <span>DeepSeek-OCR · Base 路径</span>
        <span>输入侧</span>
      </div>

      <div className="dsc-pipeline" aria-label="DeepSeek-OCR Base 模式视觉压缩结构">
        <section className={cardClass(stage, 0)} aria-current={stage === 0 ? 'step' : undefined}>
          <div className="dsc-card-head">
            <span className="dsc-index">01</span>
            <span className="dsc-badge">1024×1024</span>
          </div>
          <div className="dsc-document" aria-hidden="true">
            <span className="dsc-doc-title" />
            <span className="dsc-doc-rule is-long" />
            <span className="dsc-doc-rule" />
            <span className="dsc-doc-rule is-mid" />
            <span className="dsc-doc-table">
              {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
            </span>
            <span className="dsc-doc-equation">a² + b²</span>
            <span className="dsc-page-scan" />
          </div>
          <div className="dsc-card-copy">
            <strong>Base 页面</strong>
            <span>高分辨率文档输入</span>
          </div>
        </section>

        <Connector active={stage >= 1} />

        <section className={cardClass(stage, 1)} aria-current={stage === 1 ? 'step' : undefined}>
          <div className="dsc-card-head">
            <span className="dsc-index">02</span>
            <span className="dsc-badge">特征提取</span>
          </div>
          <div className="dsc-encoder" aria-hidden="true">
            <div className="dsc-encoder-layer is-sam">
              <span>SAM-ViT</span>
              <small>窗口注意力</small>
            </div>
            <span className="dsc-layer-link" />
            <div className="dsc-encoder-layer is-clip">
              <span>CLIP-ViT</span>
              <small>全局注意力</small>
            </div>
          </div>
          <div className="dsc-card-copy">
            <strong>DeepEncoder</strong>
            <span>先编码，再压缩</span>
          </div>
        </section>

        <Connector active={stage >= 2} />

        <section className={cardClass(stage, 2)} aria-current={stage === 2 ? 'step' : undefined}>
          <div className="dsc-card-head">
            <span className="dsc-index">03</span>
            <span className="dsc-badge">16 → 1</span>
          </div>
          <div className="dsc-compression-mark" aria-hidden="true">
            <div className="dsc-grid-16">
              {compressionCells.map((index) => (
                <i key={index} style={{ animationDelay: `${index * 38}ms` }} />
              ))}
            </div>
            <span className="dsc-compress-arrow">↓</span>
            <span className="dsc-one-token" />
          </div>
          <div className="dsc-card-copy">
            <strong>16×桥接</strong>
            <span>序列缩至 1/16</span>
          </div>
        </section>

        <Connector active={stage >= 3} />

        <section className={cardClass(stage, 3)} aria-current={stage === 3 ? 'step' : undefined}>
          <div className="dsc-card-head">
            <span className="dsc-index">04</span>
            <span className="dsc-badge">16 × 16</span>
          </div>
          <div className="dsc-token-field" aria-hidden="true">
            {visualTokens.map((index) => (
              <i key={index} style={{ animationDelay: `${Math.floor(index / 16) * 24}ms` }} />
            ))}
          </div>
          <div className="dsc-card-copy is-token-copy">
            <strong>256 visual tokens</strong>
            <span className="dsc-moe-line"><b>3B MoE</b><em>≈0.5B 激活</em></span>
          </div>
        </section>
      </div>

      <div className="dsc-controls" role="group" aria-label="查看压缩阶段">
        {stages.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`chip dsc-stage-chip ${stage === index ? 'selected' : ''}`}
            aria-pressed={stage === index}
            onClick={() => chooseStage(index as Stage)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className={`feedback ${stage === 3 ? 'good' : ''}`} aria-live="polite">
        {stages[stage].feedback}
      </div>
      <p className="dsc-boundary">以上均为 DeepSeek-OCR 底座；Unlimited OCR 的核心改动从 R-SWA 开始。</p>
    </div>
  );
};

export default DeepSeekCompression;
