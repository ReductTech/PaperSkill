import React from 'react';
import type { WidgetProps } from './registry';

const Arrow = () => <span className="af-arrow" aria-hidden="true">→</span>;

function InnovationOnePreview() {
  return (
    <div className="af-hero-innovation-one" aria-label="Innovation I 非对称 Flow 参数化预览">
      <div className="af-hero-formula-line">
        <span className="noise">ε</span><span>−</span><span className="data">x₀</span>
        <Arrow />
        <span className="lowrank">Pε</span><span>−</span><span className="data">x₀</span>
      </div>
      <div className="af-hero-mini-facts">
        <span><b>Noise</b>：Full → Low-rank</span>
        <span><b>Data</b>：Full-rank</span>
      </div>
    </div>
  );
}

function InnovationTwoPreview() {
  return (
    <div className="af-hero-transfer" aria-label="Innovation II Latent-to-Pixel 迁移预览">
      <span className="af-transfer-node latent">Latent Flow</span>
      <Arrow />
      <span className="af-transfer-node lowrank">Low-rank Pixel</span>
      <Arrow />
      <span className="af-transfer-node data">Pixel</span>
    </div>
  );
}

export const LandingKnowledgePreview: React.FC<WidgetProps> = ({ moduleId }) =>
  moduleId === 'old' ? <InnovationOnePreview /> : <InnovationTwoPreview />;
