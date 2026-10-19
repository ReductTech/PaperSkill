import React from 'react';
import type { WidgetProps } from './registry';

// Hero 右：Habitat 仿真——动漫插画（快 · 安全 · 便宜 · 可复现），无自动动画。
export const HeroNew: React.FC<WidgetProps> = () => (
  <img
    src="./images/hero/hero-new.jpg"
    alt="Habitat 仿真：快、安全、可复现"
    className="hero-scene new"
  />
);

export default HeroNew;
