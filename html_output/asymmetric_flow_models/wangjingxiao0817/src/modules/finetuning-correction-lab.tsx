import React, { useMemo, useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const LAMBDA_STAR = 0.75;

export const FinetuningCorrectionLab: React.FC<WidgetProps> = () => {
  const [lambda, setLambda] = useState(0.22);
  const [geometryDragging, setGeometryDragging] = useState(false);
  const [phase, setPhase] = useState(0.14);
  const [handoffDragging, setHandoffDragging] = useState(false);

  const origin = { x: 92, y: 286 };
  const dL = { x: 420, y: 0 };
  const d = { x: 315, y: -188 };
  const marker = { x: origin.x + lambda * dL.x, y: origin.y };
  const dEnd = { x: origin.x + d.x, y: origin.y + d.y };
  const residualLength = Math.hypot(dEnd.x - marker.x, dEnd.y - marker.y);
  const maxResidual = Math.hypot(dEnd.x - origin.x, dEnd.y - origin.y);
  const snapped = Math.abs(lambda - LAMBDA_STAR) < 0.012;

  const handoff = useMemo(() => {
    const alpha = phase;
    const sigma = 1 - phase;
    const kappa = 0.3;
    const omega = alpha * alpha / Math.max(0.0001, alpha * alpha + (kappa * sigma) ** 2);
    return { omega, variance: 1 - omega };
  }, [phase]);

  const updateLambda = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = (event.clientX - rect.left) / rect.width * 640;
    const raw = clamp01((viewX - origin.x) / dL.x);
    setLambda(Math.abs(raw - LAMBDA_STAR) < 0.035 ? LAMBDA_STAR : raw);
  };

  const updatePhase = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPhase(clamp01((event.clientX - rect.left) / rect.width));
  };

  return (
    <div className="af-mechanism-block af-finetuning-lab">
      <InteractiveActivity instruction="A：拖 λ 让 d−λdᴸ 最短；B：拖时间看 VR → LPIPS。">
        <section className="af-finetuning-step">
          <header className="af-step-heading"><span>A</span><h3>Control Variate：减小 Residual</h3></header>
          <div className="af-residual-geometry">
            <div className="af-residual-legend"><span><b>d</b>：Pixel Residual</span><span><b>dᴸ</b>：Low-rank Residual</span></div>
            <svg
              viewBox="0 0 640 360"
              role="slider"
              aria-label="沿 d L 方向拖动 lambda projection marker"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(lambda * 100)}
              tabIndex={0}
              onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setGeometryDragging(true); updateLambda(event); }}
              onPointerMove={(event) => { if (geometryDragging) updateLambda(event); }}
              onPointerUp={(event) => { setGeometryDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const next = clamp01(lambda + (event.key === 'ArrowRight' ? 0.025 : -0.025));
                setLambda(Math.abs(next - LAMBDA_STAR) < 0.035 ? LAMBDA_STAR : next);
              }}
            >
              <defs>
                <marker id="af-geometry-arrow-data" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" /></marker>
                <marker id="af-geometry-arrow-lowrank" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" /></marker>
              </defs>
              <line className="geometry-axis" x1="55" y1={origin.y} x2="575" y2={origin.y} />
              <line className="vector-dl" x1={origin.x} y1={origin.y} x2={origin.x + dL.x} y2={origin.y} markerEnd="url(#af-geometry-arrow-lowrank)" />
              <line className="vector-d" x1={origin.x} y1={origin.y} x2={dEnd.x} y2={dEnd.y} markerEnd="url(#af-geometry-arrow-data)" />
              <line className="vector-residual" x1={marker.x} y1={marker.y} x2={dEnd.x} y2={dEnd.y} />
              <line className="projection-guide" x1={dEnd.x} y1={dEnd.y} x2={origin.x + LAMBDA_STAR * dL.x} y2={origin.y} />
              <circle className={`lambda-marker ${snapped ? 'snapped' : ''}`} cx={marker.x} cy={marker.y} r="14" />
              <circle className="geometry-origin" cx={origin.x} cy={origin.y} r="5" />
              <text className="geometry-label data" x={dEnd.x + 14} y={dEnd.y}>d</text>
              <text className="geometry-label lowrank" x={origin.x + dL.x - 4} y={origin.y + 34}>dᴸ</text>
              <text className="geometry-label residual" x={(marker.x + dEnd.x) / 2 + 12} y={(marker.y + dEnd.y) / 2}>d−λdᴸ</text>
            </svg>
            <div className="af-residual-meter"><span>Residual</span><i><b style={{ width: `${Math.max(5, residualLength / maxResidual * 100)}%` }} /></i><strong>{snapped ? '最小' : ''}</strong></div>
            {snapped ? (
              <div className="af-lambda-solution revealed" aria-live="polite">
                <span>λ<sup>★</sup> =</span><span className="fraction"><b>⟨d,dᴸ⟩</b><i>‖dᴸ‖²</i></span>
              </div>
            ) : null}
            <p className="af-step-note">沿 dᴸ 方向减去相关误差，使 Residual 最小。</p>
          </div>
        </section>

        <div className="af-step-divider" />

        <section className="af-finetuning-step">
          <header className="af-step-heading"><span>B</span><h3>Low-noise：LPIPS 接管</h3></header>
          <div className="af-loss-handoff" style={{ '--phase': `${phase * 100}%`, '--vr': `${handoff.variance * 100}%`, '--lpips': `${handoff.omega * 100}%` } as React.CSSProperties}>
            <div
              className="af-handoff-rail"
              role="slider"
              aria-label="Diffusion time loss handoff"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(phase * 100)}
              tabIndex={0}
              onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setHandoffDragging(true); updatePhase(event); }}
              onPointerMove={(event) => { if (handoffDragging) updatePhase(event); }}
              onPointerUp={(event) => { setHandoffDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                setPhase(clamp01(phase + (event.key === 'ArrowRight' ? 0.035 : -0.035)));
              }}
            >
              <header><span>Noise</span><span>Data</span></header>
              <div className="rail"><i /></div>
            </div>
            <div className="af-loss-weights">
              <div className="variance"><span>VR</span><i><b /></i></div>
              <div className="lpips"><span>LPIPS</span><i><b /></i></div>
            </div>
            <p className="af-step-note">Low-noise 端降低 VR，转向 LPIPS。</p>
          </div>
        </section>

        <details className="af-deep-dive af-finetuning-math">
          <summary>数学展开</summary>
          <div className="af-variance-equations">
            <span>E[x₀<sup>L</sup> − E[x₀<sup>L</sup>|x<sub>t</sub>] | x<sub>t</sub>] = 0</span>
            <strong>d<sub>effective</sub> = d − λdᴸ</strong>
            <span>ω<sub>t</sub> = α<sub>t</sub>² / [α<sub>t</sub>² + (κσ<sub>t</sub>)²]</span>
          </div>
        </details>
      </InteractiveActivity>
    </div>
  );
};
