import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Big, H, Page, T, btn, green, red } from './ui';

export function SeamBlend(_props: WidgetProps) {
  const [fuse, setFuse] = useState(true);
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="照片接缝在打开融合后变得连续">
    <rect width="900" height="622" fill="#f5f8f0" />
    <rect x="70" y="70" width="760" height="420" rx="14" fill="#fffdf8" stroke="#92400e" strokeWidth="4" />
    <rect x="90" y="90" width="340" height="380" fill={fuse ? '#8fbf9a' : '#6ea888'} />
    <rect x="430" y="90" width="370" height="380" fill={fuse ? '#8fbf9a' : '#d7c48a'} />
    <path d="M110 300 Q250 220 400 290 T760 270" fill="none" stroke="#76906a" strokeWidth="28" />
    <circle cx="300" cy="250" r="22" fill="#e5ae78" />
    {!fuse ? <rect x="418" y="90" width="16" height="380" fill="#c43f52" /> : <rect x="400" y="90" width="50" height="380" fill="#228d5c" opacity="0.25" />}
  </svg>}>
    <H>{fuse ? '重叠带已经对齐' : '接缝两边统计量不同'}</H>
    <T>示意图，不是论文原图。融合先在膨胀出来的重叠带上对齐均值和方差。</T>
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" style={btn(!fuse)} onClick={() => setFuse(false)}>关掉融合</button>
      <button type="button" style={btn(fuse)} onClick={() => setFuse(true)}>打开融合</button>
    </div>
    <Big color={fuse ? green : red}>{fuse ? 'PSNR 29.5855，SSIM 0.8703' : 'PSNR 28.4222，SSIM 0.8606'}</Big>
    <T>数字是 DAVIS 上 MiniMax 版本的表 2。<SymbolHint meaning="预测重叠区的标准差，对齐到周围原图">σ</SymbolHint> 只在重叠带上估计。</T>
  </Page>;
}
