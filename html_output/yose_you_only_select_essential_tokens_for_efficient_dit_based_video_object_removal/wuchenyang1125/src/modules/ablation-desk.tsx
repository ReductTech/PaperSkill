import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, T, btn, green } from './ui';

const rows = [
  { id: '完整', noise: true, mask: true, fuse: true, dyn: 0.5778, aes: 0.4432, psnr: 29.5855, ssim: 0.8703 },
  { id: '只用残差', noise: true, mask: false, fuse: true, dyn: 0.5444, aes: 0.4316, psnr: 27.6164, ssim: 0.8559 },
  { id: '只用原图', noise: false, mask: true, fuse: true, dyn: 0.5778, aes: 0.4382, psnr: 27.6686, ssim: 0.8559 },
  { id: '关掉融合', noise: true, mask: true, fuse: false, dyn: 0.5667, aes: 0.432, psnr: 28.4222, ssim: 0.8606 },
];

export function AblationDesk(_props: WidgetProps) {
  const [index, setIndex] = useState(0);
  const row = rows[index];
  const height = row.psnr / 32 * 240;
  return <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', columnGap: 20 }}>
    <svg viewBox="0 0 640 622" width="100%" height="100%" role="img" aria-label="从零开始绘制的 PSNR 柱">
      <rect width="640" height="622" fill="#f5f8f0" />
      <line x1="80" y1="500" x2="520" y2="500" stroke="#d7deea" strokeWidth="3" />
      <rect x="230" y={500 - height} width="120" height={height} fill="#228d5c" />
      <text x="290" y="460" textAnchor="middle" fill="#fff" fontSize="28">{row.psnr.toFixed(1)}</text>
      <text x="290" y="550" textAnchor="middle" fill="#68778f" fontSize="28">PSNR 从 0 画起</text>
    </svg>
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
      <H>拿掉一项，数字就掉下去</H>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {rows.map((item, itemIndex) => <button key={item.id} type="button" style={btn(index === itemIndex)} onClick={() => setIndex(itemIndex)}>{item.id}</button>)}
      </div>
      <Big color={green}>{row.psnr.toFixed(4)}</Big>
      <T>动态程度 {row.dyn.toFixed(4)}，美学质量 {row.aes.toFixed(4)}，SSIM {row.ssim.toFixed(4)}。都是 DAVIS、MiniMax 版本，越高越好。</T>
      <T>论文没有报告“只留一项而且关掉融合”的格子，所以这里不编那组数字。柱从 0 分起，27 和 29 的柱高很接近，请读数字。</T>
    </div>
  </div>;
}
