import React from 'react';
import type { WidgetProps } from './registry';

// Hero 右：Habitat 仿真——静态精制场景卡（快 · 安全 · 便宜 · 可复现），无自动动画。
export const HeroNew: React.FC<WidgetProps> = () => (
  <svg viewBox="0 0 360 140" className="hero-scene new" role="img" aria-label="Habitat 仿真：快、安全、可复现">
    <defs>
      <linearGradient id="newBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e6f4ec" />
        <stop offset="1" stopColor="#d9ecdf" />
      </linearGradient>
    </defs>
    <rect width="360" height="140" rx="14" fill="url(#newBg)" />
    {/* 走廊地板 */}
    <line x1="12" y1="118" x2="348" y2="118" stroke="#bcd8c4" strokeWidth="2" />
    {/* 目标门 */}
    <rect x="296" y="62" width="44" height="70" rx="8" fill="#f2b23b" stroke="#d98f1f" strokeWidth="2" />
    <rect x="304" y="70" width="28" height="54" rx="5" fill="#fff8ea" />
    <circle cx="330" cy="97" r="3" fill="#d98f1f" />
    {/* 送货员（快速，带速度线） */}
    <g>
      <circle cx="150" cy="102" r="12" fill="#16a34a" />
      <rect x="139" y="74" width="22" height="28" rx="8" fill="#128a4a" />
      <rect x="142" y="96" width="16" height="8" rx="3" fill="#ea580c" />
      {/* 速度线 */}
      <path d="M 120 98 l -22 0 M 120 108 l -18 0 M 124 90 l -12 0" stroke="#7fbf96" strokeWidth="3" strokeLinecap="round" />
    </g>
    {/* 快标注 */}
    <text x="150" y="50" textAnchor="middle" fontSize="12" fill="#177245" fontWeight="700">数千~上万 fps</text>
    <g transform="translate(150,58)">
      <path d="M 0 0 l 30 0" stroke="#7fbf96" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 22 0 l 6 -3 M 22 0 l 6 3" stroke="#5aa874" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* 安全标 */}
    <g transform="translate(60,40)">
      <circle r="15" fill="#e9f7ef" stroke="#16a34a" strokeWidth="2" />
      <path d="M -5 0 l 4 4 l 8 -9" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export default HeroNew;
