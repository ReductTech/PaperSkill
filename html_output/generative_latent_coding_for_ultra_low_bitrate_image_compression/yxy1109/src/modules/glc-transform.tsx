import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MetricBar, MosaicArtwork, StageBadge, StudioPanel, clamp, fmt } from './glc-kit';

const indexColors = ['#8aa89b', '#6d8c80', '#c9b98f', '#7299a5', '#4e7368', '#d8c7a4'];

export function GlcTransform() {
  const [reuse, setReuse] = useState(72);
  const indexTokens = 40;
  const transformTokens = Math.max(4, Math.round(indexTokens * (1 - .8 * reuse / 100)));
  const savings = Math.round((1 - transformTokens / indexTokens) * 100);
  return <div className="glc-scene glc-transform-page">
    <StudioPanel className="glc-transform-control" tone="orange">
      <StageBadge tone="orange">空间冗余复用</StageBadge>
      <strong className="glc-huge-number">{fmt(reuse, 0)}<small>%</small></strong>
      <label className="glc-range-label">
        <span>上下文可预测程度</span>
        <input aria-label="调整空间冗余复用强度" type="range" min="0" max="100" value={reuse}
          onChange={event => setReuse(Number(event.target.value))} />
      </label>
      <div className="glc-transform-art">
        <MosaicArtwork detail={clamp(52 + reuse * .35, 0, 100)} mode="latent" generative
          label="相邻马赛克块之间的重复结构逐渐被空间上下文预测" />
      </div>
      <div className="glc-feedback is-orange" aria-live="polite">
        {reuse < 24
          ? '上下文利用很弱：重复的墙、山脊和水面仍逐项占码。'
          : reuse < 70
            ? '相邻位置开始预测彼此；只给难以预料的残差更多码字。'
            : '空间上下文很强：重复结构被大量消去，码流集中记录新信息。'}
      </div>
    </StudioPanel>
    <div className="glc-transform-main">
      <div className="glc-transform-columns">
        <StudioPanel className="glc-token-panel" tone="red">
          <div className="glc-card-title"><span>索引图直传</span><CodeChip tone="red">{indexTokens} 个位置码</CodeChip></div>
          <div className="glc-token-grid is-index">
            {Array.from({ length: indexTokens }, (_, index) => <span key={index}
              style={{ backgroundColor: indexColors[index % indexColors.length] }} />)}
          </div>
          <p>重复的局部结构不会被充分消去，码字数量基本随位置展开。</p>
        </StudioPanel>
        <StudioPanel className="glc-token-panel" tone="green">
          <div className="glc-card-title"><span>潜空间变换编码</span><CodeChip tone="green">{transformTokens} 个残差码</CodeChip></div>
          <div className="glc-token-grid is-residual">
            {Array.from({ length: indexTokens }, (_, index) => <span key={index}
              className={index < transformTokens ? 'is-live' : ''}
              style={{ backgroundColor: index < transformTokens ? indexColors[index % indexColors.length] : undefined }} />)}
          </div>
          <p>分析变换与空间上下文利用邻域关系，使重复位置变成可预测的小残差。</p>
        </StudioPanel>
      </div>
      <StudioPanel className="glc-transform-evidence" tone="green">
        <div className="glc-evidence-copy">
          <span className="glc-section-label">CLIC2020 · FID–BPP · BD-Rate 越低越好</span>
          <div className="glc-formula">
            <SymbolHint meaning="R(ŷ)：量化变换码 ŷ 的估计码率，进入率失真目标。">R(ŷ)</SymbolHint>
            <span> = −log p(ŷ | ẑ, 已解码上下文)</span>
          </div>
          <p>变换编码相对索引图直传的实测优势：索引图变体有 <b>66.2%</b> BD-Rate 损失。</p>
        </div>
        <MetricBar label="索引图直传" value={66.2} max={70} suffix="% BD-Rate" tone="red" />
        <MetricBar label="GLC 变换编码" value={0} max={70} suffix="%" tone="green"
          caption="0% 是变换编码参考点。" />
        <div className="glc-tech-note">当前示意节省 {savings}% 位置码 · 教学模型</div>
      </StudioPanel>
    </div>
  </div>;
}
