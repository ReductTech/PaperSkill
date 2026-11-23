import React, { useState } from 'react';
import { CodeChip, StageBadge, StudioPanel, clamp, fmt } from './glc-kit';

function ScreenContent({ shift }: { shift: number }) {
  const warp = shift / 100;
  const lines = [];
  for (let index = 0; index <= 10; index += 1) {
    const x = 58 + index * 74;
    lines.push(<path key={`v-${index}`}
      d={`M${x} 68 C${x + Math.sin(index) * 34 * warp} 165 ${x - Math.cos(index) * 46 * warp} 250 ${x + Math.sin(index * 1.7) * 58 * warp} 354`}
      fill="none" stroke={shift > 58 ? '#c43f52' : '#8fa9a2'} strokeWidth={shift > 58 ? 3 : 2} opacity=".85" />);
  }
  for (let index = 0; index <= 5; index += 1) {
    const y = 76 + index * 54;
    lines.push(<path key={`h-${index}`}
      d={`M52 ${y} C190 ${y + Math.sin(index) * 38 * warp} 354 ${y - Math.cos(index) * 42 * warp} 704 ${y + Math.sin(index * 1.3) * 54 * warp}`}
      fill="none" stroke={shift > 58 ? '#c43f52' : '#8fa9a2'} strokeWidth={shift > 58 ? 3 : 2} opacity=".85" />);
  }
  return <svg viewBox="0 0 760 430" className="glc-screen-art" role="img"
    aria-label={`屏幕内容示意，分布偏移 ${Math.round(shift)}%，网格与文字随偏移增加而失真`}>
    <defs>
      <filter id="glc-screen-glow"><feGaussianBlur stdDeviation={shift / 110} /></filter>
      <clipPath id="glc-screen-clip"><rect x="28" y="32" width="704" height="360" rx="18" /></clipPath>
    </defs>
    <rect x="0" y="0" width="760" height="430" rx="26" fill="#e6efec" />
    <rect x="28" y="32" width="704" height="360" rx="18" fill="#fbfdfa" stroke="#b8c9bf" strokeWidth="3" />
    <g clipPath="url(#glc-screen-clip)">{lines}</g>
    <g filter={shift > 70 ? 'url(#glc-screen-glow)' : undefined}>
      <text x="86" y="154" fontSize="56" fontWeight="850" fill={shift > 68 ? '#b95468' : '#27446e'}
        letterSpacing={shift * .24}>GLC</text>
      <text x="88" y="208" fontSize="28" fontWeight="650" fill="#68778f" letterSpacing={shift * .08}>screen content / grid test</text>
      <rect x="86" y="246" width={Math.max(110, 360 - shift * 1.2)} height="14" rx="7" fill={shift > 58 ? '#e59aaa' : '#9bb9c0'} />
      <rect x="86" y="274" width={Math.max(80, 248 - shift * .5)} height="14" rx="7" fill="#c9d8cd" />
    </g>
    <g transform="translate(560 60)">
      <rect width="132" height="48" rx="12" fill={shift > 58 ? '#f7dfe4' : '#e5f2e9'} />
      <text x="66" y="31" textAnchor="middle" fontSize="24" fontWeight="750"
        fill={shift > 58 ? '#c43f52' : '#228d5c'}>{shift > 58 ? '线条失稳' : '分布内'}</text>
    </g>
  </svg>;
}

export function GlcLimits() {
  const [shift, setShift] = useState(20);
  const high = shift > 66;
  const mid = shift > 42;
  return <div className="glc-scene glc-limits-page">
    <StudioPanel className="glc-limit-scene" tone={high ? 'red' : mid ? 'orange' : 'green'}>
      <ScreenContent shift={shift} />
      <div className="glc-limit-overlay">
        <StageBadge tone={high ? 'red' : mid ? 'orange' : 'green'}>{high ? '生成先验压过输入' : mid ? '边界压力增加' : '常见自然内容'}</StageBadge>
        <strong>{high ? '直线与字形被“合理地”猜错' : mid ? '细节开始交给生成先验' : '训练分布内的自然纹理'}</strong>
      </div>
    </StudioPanel>
    <aside className="glc-limit-control">
      <span className="glc-section-label">分布偏移</span>
      <strong className="glc-huge-number">{fmt(shift, 0)}<small>%</small></strong>
      <label className="glc-range-label">
        <span>自然照片 → 屏幕文本 / 网格</span>
        <input aria-label="调整从自然照片到屏幕内容的分布偏移" type="range" min="0" max="100" value={shift}
          onChange={event => setShift(Number(event.target.value))} />
      </label>
      <div className={`glc-feedback is-${high ? 'red' : mid ? 'orange' : 'green'}`} aria-live="polite">
        {high
          ? '直线弯曲、文字缺口和网格断裂：生成式真实感不能代替精确还原。'
          : mid
            ? '模型开始用熟悉的自然纹理补全不熟悉的结构，需人工抽查。'
            : '在常见自然照片范围内，语义与纹理先验更容易发挥作用。'}
      </div>
      <StudioPanel className="glc-limit-checks" tone="red">
        <div className="glc-card-title"><span>失败判据</span><CodeChip tone="red">高分辨率结构</CodeChip></div>
        <p className={high ? 'is-failed' : ''}>□ 横竖线是否保持直且连续</p>
        <p className={high ? 'is-failed' : ''}>□ 文字边缘是否可辨认</p>
        <p className={high ? 'is-failed' : ''}>□ 网格交点是否稳定</p>
        <small>论文 Figure 15 显示屏幕图像上的直线网格重建不足；画面为放大示意。</small>
      </StudioPanel>
      <p className="glc-note">常用 FID/DISTS 很难单独暴露局部文字错误，部署前需加入 OCR 与结构检查。</p>
    </aside>
  </div>;
}
