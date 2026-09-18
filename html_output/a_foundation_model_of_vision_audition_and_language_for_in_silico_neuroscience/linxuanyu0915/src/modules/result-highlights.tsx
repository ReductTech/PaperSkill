import { Figure } from '../components/Figure';
import React from 'react';
import type { WidgetProps } from './registry';

function EvidenceGrid({ items }: { items: Array<{ label: string; value: string; note: string }> }) {
  return (
    <div className="evidence-grid">
      {items.map((item) => (
        <div className="evidence-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.note}</p>
        </div>
      ))}
    </div>
  );
}

const figure2Facts = [
  { key: 'podcast', label: 'Podcast', value: '颞叶预测较强', note: '听觉与语言相关 temporal cortex 的 encoding score 较高。' },
  { key: 'video', label: 'Video', value: '视觉皮层预测较强', note: '自然视频条件下，occipital / visual cortex 的预测性能较高。' },
  { key: 'movie', label: 'Multimodal movie', value: '可预测范围更广', note: '同时包含视觉、音频与语言信息时，可显著预测更广泛的 cortical regions。' },
  { key: 'subcortex', label: 'Subcortex', value: '可预测，但整体较弱', note: '皮层下区域也有显著预测，但平均 encoding score 通常比 cortical regions 低约 2–3 倍。' },
] as const;

function PaperPanel({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="chapter3-paper-panel">
      <span className="chapter3-paper-label">论文 {caption} · 原图</span>
      <Figure src={src} alt={alt} />
    </figure>
  );
}

export const Figure2Highlights: React.FC<WidgetProps> = () => {
  const [focus, setFocus] = React.useState<(typeof figure2Facts)[number]['key']>('podcast');
  return (
    <div className="chapter3-results">
      <div className="chapter3-result-controls" aria-label="选择自然刺激结果">
        {figure2Facts.map((item) => (
          <button
            type="button"
            key={item.key}
            aria-pressed={focus === item.key}
            onClick={() => setFocus(item.key)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </button>
        ))}
      </div>
      <div className="chapter3-selected-evidence" aria-live="polite"><strong>{figure2Facts.find(item=>item.key===focus)?.value}</strong> · {figure2Facts.find(item=>item.key===focus)?.note}</div>
      <div className="chapter3-figure-group" aria-label="论文 Figure 2A 到 2C 分面原图">
        <div className="chapter3-figure-row metrics">
          <PaperPanel src="./images/fig2-a.png" alt="Figure 2A 皮层区域平均编码性能" caption="Fig.2A" />
          <PaperPanel src="./images/fig2-b.png" alt="Figure 2B 皮层下区域平均编码性能" caption="Fig.2B" />
        </div>
        <div className="chapter3-figure-row brains">
          <PaperPanel src="./images/fig2-c-left.png" alt="Figure 2C 电影与视频条件脑图" caption="Fig.2C · Podcast / Video" />
          <PaperPanel src="./images/fig2-c-right.png" alt="Figure 2C 多模态与皮层下脑图" caption="Fig.2C · Multimodal / Subcortex" />
        </div>
      </div>
      <p className="chapter3-anatomy-note">
        这些空间分布与刺激内容相符：听觉/语言刺激主要对应颞叶，视觉刺激主要对应视觉皮层，说明模型预测具有合理的神经解剖结构，而不是任意的统计拟合。
      </p>
    </div>
  );
};

export const Figure3Highlights: React.FC<WidgetProps> = () => (
  <EvidenceGrid
    items={[
      { label: 'Zero-shot', value: '超过多数单人记录', note: '模型预测更接近群体平均响应。' },
      { label: 'HCP', value: 'R_group ≈ 0.4', note: '约为中位被试 group-predictivity 的两倍。' },
      { label: '解释边界', value: '依赖高信噪比协议', note: 'HCP 含较多重复刺激，不能外推成通用倍数。' },
    ]}
  />
);
