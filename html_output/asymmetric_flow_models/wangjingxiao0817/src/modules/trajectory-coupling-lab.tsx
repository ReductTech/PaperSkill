import React, { useMemo, useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const TrajectoryCouplingLab: React.FC<WidgetProps> = () => {
  const [progress, setProgress] = useState(0.22);
  const [dragging, setDragging] = useState(false);
  const time = 1 - progress;
  const endpointReached = progress > 0.96;

  const point = useMemo(() => {
    const x = 80 + progress * 600;
    const latentY = 107 - Math.sin(progress * Math.PI) * 24;
    const liftedY = 248 - Math.sin(progress * Math.PI) * 16;
    // Schematic direction for the orthogonal residual. Its magnitude follows σ_t exactly.
    const residualOffset = time * 42;
    return {
      x,
      latentY,
      liftedY,
      pixelY: liftedY + residualOffset,
      residualOffset,
    };
  }, [progress, time]);

  const updateProgress = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setProgress(clamp01(((event.clientX - rect.left) / rect.width * 760 - 80) / 600));
  };

  return (
    <div className="af-mechanism-block af-trajectory-coupling">
      <InteractiveActivity instruction="把 zₜ 向右拖到 t→0：看正交 Noise residual 缩短并消失。">
        <div className="af-trajectory-stage" style={{ '--sigma': time } as React.CSSProperties}>
          <svg
            className="af-paired-trajectories"
            viewBox="0 0 760 350"
            role="slider"
            aria-label="拖动 z t，观察 Az t 与 orthogonal residual 合成 lifted pixel state"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            tabIndex={0}
            onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); updateProgress(event); }}
            onPointerMove={(event) => { if (dragging) updateProgress(event); }}
            onPointerUp={(event) => { setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
              event.preventDefault();
              setProgress(clamp01(progress + (event.key === 'ArrowRight' ? 0.035 : -0.035)));
            }}
          >
            <defs>
              <marker id="af-residual-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker>
            </defs>
            <rect className="trajectory-surface latent" x="25" y="45" width="710" height="114" rx="12" />
            <rect className="trajectory-surface pixel" x="25" y="188" width="710" height="132" rx="12" />
            <text className="trajectory-title latent" x="44" y="72">Latent Flow</text>
            <text className="trajectory-title pixel" x="44" y="215">Pixel Flow</text>
            <path className="trajectory-rail latent" d="M80 107 C250 54 510 54 680 107" />
            <path className="trajectory-rail pixel" d="M80 248 C250 210 510 210 680 248" />
            <text className="endpoint" x="62" y="137">z₁</text><text className="endpoint" x="672" y="137">z₀</text>
            <text className="endpoint" x="50" y="306">x₁ᴸ</text><text className="endpoint" x="665" y="306">x₀ᴸ</text>

            {/* A maps z_t to the lifted low-rank component A z_t. */}
            <path className="mapping-ribbon" d={`M${point.x} ${point.latentY + 13} C${point.x + 34} ${point.latentY + 54}, ${point.x - 34} ${point.liftedY - 54}, ${point.x} ${point.liftedY - 13}`} />
            <circle className="trajectory-node latent" cx={point.x} cy={point.latentY} r="15" />
            <circle className="trajectory-node lifted" cx={point.x} cy={point.liftedY} r="10" />
            <circle className="trajectory-node pixel" cx={point.x} cy={point.pixelY} r="14" />
            <line
              className="orthogonal-residual-vector"
              x1={point.x}
              y1={point.liftedY}
              x2={point.x}
              y2={point.pixelY}
              markerEnd={point.residualOffset > 5 ? 'url(#af-residual-arrow)' : undefined}
              style={{ opacity: 0.28 + time * 0.72 }}
            />
            <text className="moving-label latent" x={point.x} y={point.latentY - 23} textAnchor="middle">zₜ</text>
            <text className="moving-label lifted" x={point.x + 18} y={point.liftedY - 11}>Azₜ</text>
            <text className="moving-label pixel" x={point.x + 18} y={point.pixelY + 24}>xₜᴸ</text>
            {time > 0.08 ? <text className="residual-vector-label" x={point.x + 18} y={(point.liftedY + point.pixelY) / 2 + 5}>σₜ(I−P)ε</text> : null}
          </svg>

          <div className="af-trajectory-core-formula">
            x<sub>t</sub><sup>L</sup> = Az<sub>t</sub> + <b style={{ opacity: 0.38 + time * 0.62 }}>σ<sub>t</sub>(I−P)ε</b>
          </div>
          <p className="af-trajectory-result" aria-live="polite">
            {endpointReached ? <>t→0：正交 Noise 消失，x₀<sup>L</sup> = Az₀。</> : <>σₜ 变小，正交 Noise 同步缩短。</>}
          </p>
        </div>

        <details className="af-deep-dive">
          <summary>数学展开</summary>
          <div className="af-proof-skeleton">
            <span>Aᵀx<sub>t</sub><sup>L</sup> = z<sub>t</sub></span><i>→</i>
            <span>Au<sub>z</sub> = Pε − x₀<sup>L</sup></span><i>→</i>
            <strong>x<sub>t</sub><sup>L</sup> = Az<sub>t</sub> + σ<sub>t</sub>(I−P)ε</strong>
          </div>
          <p className="af-deep-dive-note">A / Aᵀ 融入 input / output linear layers。</p>
        </details>

        <div className="af-pixel-gap-bridge">剩余差异：<strong>x₀ − x₀<sup>L</sup></strong></div>
      </InteractiveActivity>
    </div>
  );
};
