import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const AsymflowRankLab: React.FC<WidgetProps> = () => {
  const [rank, setRank] = useState(100);
  const [selectedPatch, setSelectedPatch] = useState(5);
  const ratio = rank / 100;
  const dragRank = (event: React.PointerEvent<HTMLInputElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRank(Math.round(clamp01((event.clientX - rect.left) / rect.width) * 100));
  };
  const rays = Array.from({ length: 18 }, (_, index) => {
    const active = clamp01(ratio * 18 - index);
    const angle = index / 18 * Math.PI * 2;
    const length = 19 + active * 54;
    return {
      x2: 100 + Math.cos(angle) * length,
      y2: 100 + Math.sin(angle) * length,
      opacity: 0.07 + active * 0.76,
    };
  });

  return (
    <div className="af-mechanism-block af-rank-lab">
      <InteractiveActivity instruction="拖动 Rank：只看 Noise 方向变化，−x₀ 始终不动。">
        <div className="af-rank-core">
          <div className="af-rank-visual">
            <div className="af-rank-visual-label"><span>Noise</span><b>r / D = {ratio.toFixed(2)}</b></div>
            <svg viewBox="0 0 200 200" role="img" aria-label="Rank 降低时噪声方向连续收缩">
              <circle className="rank-orbit" cx="100" cy="100" r="74" />
              {rays.map((ray, index) => (
                <line key={index} x1="100" y1="100" x2={ray.x2} y2={ray.y2} style={{ opacity: ray.opacity }} />
              ))}
              <circle className="rank-center" cx="100" cy="100" r="11" />
              <text x="100" y="105" textAnchor="middle">{ratio > 0.995 ? 'ε' : 'Pε'}</text>
            </svg>
            <div className="af-full-data-band"><span>Data</span><strong>−x₀</strong></div>
          </div>

          <div className="af-target-morph-anchor" aria-live="polite">
            <span>u = ε − x₀</span><i>→</i>
            <strong className={ratio < 0.995 ? 'active' : ''}>u<sub>A</sub> = Pε − x₀</strong>
          </div>
        </div>

        <div className="af-rank-rail" style={{ '--rank': `${rank}%` } as React.CSSProperties}>
          <div className="af-rank-rail-labels"><span>r = 0</span><b>r</b><span>r = D</span></div>
          <div className="af-rank-track-decoration"><i /><i /><i /></div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={rank}
            aria-label="Rank ratio r over D"
            onChange={(event) => setRank(Number(event.target.value))}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRank(event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) dragRank(event);
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
          />
          <div className="af-rank-endpoint-copy"><span>(x₀)-prediction</span><span>(u)-prediction</span></div>
        </div>
        <p className="af-rank-observation">Data 不变，只限制 Noise。</p>
      </InteractiveActivity>

      <div className="af-scene-divider" />
      <div className="af-patch-source-strip">
        <section className="af-patch-zoom-scene">
          <div className={`af-patch-zoom-workspace ${selectedPatch !== null ? 'has-focus' : ''}`}>
            <div className="af-patch-grid" aria-label="Patch token grid">
              {Array.from({ length: 12 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={selectedPatch === index ? 'active' : ''}
                  aria-label={`Patch token ${index + 1}`}
                  aria-pressed={selectedPatch === index}
                  onClick={() => setSelectedPatch(index)}
                  onFocus={() => setSelectedPatch(index)}
                ><i /></button>
              ))}
            </div>
            <div className="af-patch-zoom-detail" aria-live="polite">
              <div className="af-patch-ladder" key={selectedPatch}>
                <span>patch</span><i>→</i><span>D 维</span><i>→</i><span>P</span><i>→</i><span>r 维</span>
              </div>
            </div>
          </div>
          <p>每个 patch 内投影；同一 P 共享，token 数不变。</p>
        </section>

        <section className="af-subspace-source">
          <div className="af-subspace-line">
            <span><b>From scratch</b>：PCA</span><i>|</i><span><b>Latent transfer</b>：Procrustes → Innovation II</span>
          </div>
          <details className="af-deep-dive"><summary>数学展开</summary><div className="af-compact-equations"><span>A = U<sub>r</sub></span><i>·</i><span>AᵀA = I<sub>r</sub></span></div></details>
        </section>
      </div>
    </div>
  );
};
