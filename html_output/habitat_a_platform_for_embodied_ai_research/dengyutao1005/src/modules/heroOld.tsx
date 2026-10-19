import React from 'react';
import type { WidgetProps } from './registry';

// Hero 左：真实世界训练——动漫插画（慢 · 危险 · 贵 · 难控 · 难复现），无自动动画。
export const HeroOld: React.FC<WidgetProps> = () => (
  <img
    src="./images/hero/hero-old.jpg"
    alt="真实世界训练：慢、危险、贵"
    className="hero-scene old"
  />
);

export default HeroOld;
