import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, T, btn, green, red } from './ui';

const tables = {
  'YouTube-VOS': {
    MiniMax: { psnr: [30.3296, 31.0117], ssim: [0.9116, 0.912], lpips: [0.0615, 0.0642] },
    VACE: { psnr: [23.7225, 29.1917], ssim: [0.8322, 0.8994], lpips: [0.1322, 0.0746] },
  },
  DAVIS: {
    MiniMax: { psnr: [29.3671, 29.5855], ssim: [0.8723, 0.8703], lpips: [0.0836, 0.0826] },
    VACE: { psnr: [25.0868, 28.2804], ssim: [0.8221, 0.8604], lpips: [0.1228, 0.0896] },
  },
} as const;

type Dataset = keyof typeof tables;
type Base = keyof typeof tables['DAVIS'];

export function ResultBars(_props: WidgetProps) {
  const [dataset, setDataset] = useState<Dataset>('YouTube-VOS');
  const [base, setBase] = useState<Base>('MiniMax');
  const row = tables[dataset][base];
  const psnrDelta = row.psnr[1] - row.psnr[0];
  const ssimDelta = row.ssim[1] - row.ssim[0];
  const lpipsDelta = row.lpips[1] - row.lpips[0];
  const width = Math.max(8, Math.min(560, psnrDelta / 6 * 560));
  return <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,0.85fr)', columnGap: 20 }}>
    <div style={{ minWidth: 0 }}>
      <H>背景 PSNR 相对基座的变化</H>
      <T>0 表示和基座相同。横轴最大按 6 dB 画，只比较 PSNR，不与 SSIM、LPIPS 比柱长。</T>
      <svg viewBox="0 0 760 360" width="100%" height="320" role="img" aria-label="PSNR 相对基座增加的柱">
        <rect width="760" height="360" fill="#f5f8f0" />
        <line x1="80" y1="250" x2="700" y2="250" stroke="#d7deea" strokeWidth="3" />
        <rect x="80" y="150" width={width} height="80" fill="#228d5c" />
        <text x="80" y="120" fill="#21324a" fontSize="28">+{psnrDelta.toFixed(2)} dB</text>
        <text x="80" y="310" fill="#68778f" fontSize="28">越高越好</text>
      </svg>
    </div>
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['YouTube-VOS', 'DAVIS'] as Dataset[]).map(item => <button key={item} type="button" style={btn(dataset === item)} onClick={() => setDataset(item)}>{item}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['MiniMax', 'VACE'] as Base[]).map(item => <button key={item} type="button" style={btn(base === item)} onClick={() => setBase(item)}>{item}</button>)}
      </div>
      <Big color={green}>PSNR {row.psnr[0].toFixed(2)} → {row.psnr[1].toFixed(2)}</Big>
      <T>SSIM {row.ssim[0].toFixed(4)} → {row.ssim[1].toFixed(4)}（{ssimDelta >= 0 ? '升高' : '略降'}，越高越好）</T>
      <Big color={lpipsDelta <= 0 ? green : red}>LPIPS {row.lpips[0].toFixed(4)} → {row.lpips[1].toFixed(4)}</Big>
      <T>LPIPS 越低越好。测试分辨率统一为 480×832。</T>
    </div>
  </div>;
}
