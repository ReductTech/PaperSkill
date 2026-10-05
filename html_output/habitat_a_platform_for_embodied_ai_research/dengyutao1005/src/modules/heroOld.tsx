import React from 'react';
import type { WidgetProps } from './registry';

// Hero 左：真实世界训练——静态精制场景卡（慢 · 危险 · 贵 · 难控 · 难复现），无自动动画。
export const HeroOld: React.FC<WidgetProps> = () => (
  <svg viewBox="0 0 360 140" className="hero-scene old" role="img" aria-label="真实世界训练：慢、危险、贵">
    <defs>
      <linearGradient id="oldBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3ece0" />
        <stop offset="1" stopColor="#ece2d0" />
      </linearGradient>
    </defs>
    <rect width="360" height="140" rx="14" fill="url(#oldBg)" />
    {/* 真实公寓地板线 */}
    <line x1="12" y1="118" x2="348" y2="118" stroke="#d8cbb4" strokeWidth="2" />
    {/* 挂钟（慢） */}
    <circle cx="52" cy="34" r="16" fill="#fff" stroke="#cbbfa8" strokeWidth="2" />
    <line x1="52" y1="34" x2="52" y2="24" stroke="#8a7d66" strokeWidth="2" />
    <line x1="52" y1="34" x2="60" y2="38" stroke="#8a7d66" strokeWidth="2" />
    {/* 送货员（慢步） */}
    <g>
      <circle cx="150" cy="102" r="12" fill="#9aa5b1" />
      <rect x="139" y="74" width="22" height="28" rx="8" fill="#8a93a1" />
      <rect x="142" y="96" width="16" height="8" rx="3" fill="#b0803a" />
      {/* 汗滴 */}
      <circle cx="164" cy="86" r="2.5" fill="#8ec8d8" />
    </g>
    {/* 速度标注：慢 */}
    <text x="150" y="52" textAnchor="middle" fontSize="12" fill="#8a7d66">很慢</text>
    <g transform="translate(150,58)">
      <path d="M 0 0 l 26 0" stroke="#d8cbb4" strokeWidth="2" strokeLinecap="round" />
      <path d="M 20 0 l -6 -3 M 20 0 l -6 3" stroke="#cbbfa8" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* 危险标 */}
    <g transform="translate(272,34)">
      <rect x="-13" y="-13" width="26" height="26" rx="5" fill="#fff" stroke="#c9a84b" strokeWidth="2" />
      <text x="0" y="6" textAnchor="middle" fontSize="18" fill="#c9a84b" fontWeight="700">!</text>
    </g>
  </svg>
);

export default HeroOld;
