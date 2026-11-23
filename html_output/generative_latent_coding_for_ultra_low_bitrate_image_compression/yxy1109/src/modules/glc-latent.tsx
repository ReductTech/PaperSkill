import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel, clamp } from './glc-kit';

const sizes = [256, 1024, 16384] as const;
const swatchColors = [
  '#d7e9e4', '#a8c7bd', '#7da593', '#527e6d', '#2f5f53',
  '#eadfbe', '#d2b378', '#d58d59', '#7e765e', '#92b9c2',
  '#5c8493', '#27446e'
];

export function GlcLatent() {
  const [bookSize, setBookSize] = useState<(typeof sizes)[number]>(16384);
  const bits = Math.log2(bookSize);
  const activeSwatches = bookSize === 256 ? 5 : bookSize === 1024 ? 8 : 12;
  const detail = bookSize === 256 ? 42 : bookSize === 1024 ? 64 : 92;
  const nature = bookSize === 16384;
  const face = bookSize === 1024;
  return <div className="glc-scene glc-latent-page">
    <StudioFrameArt detail={detail} activeSwatches={activeSwatches} />
    <aside className="glc-latent-side">
      <StageBadge tone="purple">离散码本 C</StageBadge>
      <h3>选择色卡容量</h3>
      <div className="glc-book-options" role="group" aria-label="选择 VQ 码本大小">
        {sizes.map(size => <button key={size} className={bookSize === size ? 'is-active' : ''}
          onClick={() => setBookSize(size)} aria-pressed={bookSize === size}>
          <b>{size.toLocaleString('zh-CN')}</b>
          <span>{Math.log2(size)} bit / 索引</span>
        </button>)}
      </div>
      <StudioPanel className="glc-formula-card" tone="purple">
        <div className="glc-formula">
          bits = log₂(<SymbolHint meaning="M：码本 C 中的离散码字数量；自然图像配置为 16384，人脸配置为 1024。">M</SymbolHint>)
        </div>
        <p>
          <CodeChip tone="purple">M = {bookSize.toLocaleString('zh-CN')}</CodeChip>
          <CodeChip tone="blue">{bits} bit / 索引</CodeChip>
        </p>
      </StudioPanel>
      <div className="glc-feedback is-purple" aria-live="polite">
        {nature
          ? '自然图像配置使用 M=16384：表达更细，但每个主索引本身占 14 bit。'
          : face
            ? '人脸配置使用 M=1024：码本更小，索引为 10 bit，适合高度受限的低码率。'
            : '小块码本只有 8 bit/索引，语义单元更少，生成式补全承担更多细节。'}
      </div>
      <p className="glc-note">码本更大不保证总码流更小；GLC 仍要对索引图做潜空间变换编码。</p>
    </aside>
  </div>;
}

function StudioFrameArt({ detail, activeSwatches }: { detail: number; activeSwatches: number }) {
  return <div className="glc-latent-stage">
    <div className="glc-easel">
      <MosaicArtwork detail={clamp(detail, 0, 100)} mode="latent" generative
        label="不同码本容量下，语义色块数量与纹理细节的示意" />
      <span className="glc-pin is-left" /><span className="glc-pin is-right" />
    </div>
    <StudioPanel className="glc-swatch-tray" tone="neutral">
      <div className="glc-tray-title">
        <span>已学到的语义色卡</span><b>{detail}% 细节</b>
      </div>
      <div className="glc-swatch-grid">
        {swatchColors.map((color, index) => <span key={color}
          className={index < Math.round(activeSwatches * (detail / 100)) ? 'is-used' : ''}
          style={{ backgroundColor: color }}>{String(index + 1).padStart(2, '0')}</span>)}
      </div>
    </StudioPanel>
  </div>;
}
