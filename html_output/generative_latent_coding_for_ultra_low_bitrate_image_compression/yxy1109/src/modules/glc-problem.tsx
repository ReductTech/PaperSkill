import React, { useState } from 'react';
import { MosaicArtwork, StageBadge, StudioPanel, clamp, fmt } from './glc-kit';

type Mode = 'pixel' | 'latent';

export function GlcProblem() {
  const [budget, setBudget] = useState(30);
  const [mode, setMode] = useState<Mode>('pixel');
  const coarse = budget < 38;
  const high = budget > 74;
  const feedback = high
    ? '预算充足时，两种表示都更完整，差距会缩小。'
    : mode === 'pixel'
      ? coarse
        ? '局部像素被压扁，山的轮廓和河岸先断开。'
        : '像素块更密，但纹理增加也持续消耗预算。'
      : coarse
        ? '语义骨架仍在，纹理由生成式解码补全。'
        : '更多色块进入潜空间，细节更丰富但码流也更大。';
  return <div className="glc-scene glc-problem">
    <aside className="glc-problem-controls">
      <div className="glc-kicker">修补预算</div>
      <strong className="glc-huge-number">{fmt(budget, 0)}<small>%</small></strong>
      <label className="glc-range-label">
        <span>可见细节预算</span>
        <input aria-label="调整可见细节预算" type="range" min="0" max="100" value={budget}
          onChange={event => setBudget(Number(event.target.value))} />
      </label>
      <div className="glc-segmented" role="group" aria-label="选择空间表示">
        <button className={mode === 'pixel' ? 'is-active is-red' : ''} onClick={() => setMode('pixel')}>
          像素空间
        </button>
        <button className={mode === 'latent' ? 'is-active is-green' : ''} onClick={() => setMode('latent')}>
          生成式潜空间
        </button>
      </div>
      <div className={`glc-feedback is-${mode === 'pixel' ? 'red' : 'green'}`} aria-live="polite">
        {feedback}
      </div>
      <p className="glc-note">预算仅为教学变量，不是论文实测码率曲线。</p>
    </aside>
    <div className="glc-problem-compare">
      <StudioPanel className={`glc-compare-card ${mode === 'pixel' ? 'is-selected is-red' : ''}`} tone="red">
        <div className="glc-card-title">
          <span>像素空间变换编码</span>
          <StageBadge tone="red">低预算先丢结构</StageBadge>
        </div>
        <MosaicArtwork detail={clamp(budget - 10, 0, 100)} mode="pixel" generative={false}
          label={`像素空间在细节预算 ${budget}% 下的示意`} />
        <div className="glc-stat-line">
          <span>保留内容</span><b>局部像素块</b>
          <span>主要风险</span><b className="is-red">轮廓与纹理同时退化</b>
        </div>
      </StudioPanel>
      <StudioPanel className={`glc-compare-card ${mode === 'latent' ? 'is-selected is-green' : ''}`} tone="green">
        <div className="glc-card-title">
          <span>生成式潜空间编码</span>
          <StageBadge tone="green">语义优先</StageBadge>
        </div>
        <MosaicArtwork detail={clamp(46 + budget * .26, 0, 100)} mode="latent" generative
          label={`生成式潜空间在细节预算 ${budget}% 下的示意`} />
        <div className="glc-stat-line">
          <span>保留内容</span><b>语义与主体结构</b>
          <span>主要风险</span><b className="is-green">纹理可能被生成而非精确还原</b>
        </div>
      </StudioPanel>
    </div>
  </div>;
}
