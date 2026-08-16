import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const LENS_RANK = 38;

export const SpatialDecompositionLab: React.FC<WidgetProps> = () => {
  const [rank, setRank] = useState(38);
  const [lens, setLens] = useState(22);
  const [dragging, setDragging] = useState(false);
  const inLowRank = lens <= LENS_RANK;

  const updateLens = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLens(clamp((event.clientX - rect.left) / rect.width * 100, 3, 97));
  };

  const dragRank = (event: React.PointerEvent<HTMLInputElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRank(Math.round(clamp((event.clientX - rect.left) / rect.width * 100, 0, 100)));
  };

  const endpoint = rank === 0
    ? { title: '(x₀)-prediction', formula: 'P = 0 · u_A = −x₀' }
    : rank === 100
      ? { title: '(u)-prediction', formula: 'P = I · u_A = ε − x₀ = u' }
      : { title: '当前占比', formula: `r / D = ${(rank / 100).toFixed(2)}` };

  return (
    <div className="af-mechanism-block af-spatial-lab">
      <InteractiveActivity instruction="先拖观察点看 P / I−P；再拖 Rank 看两类行为占比。">
        <div className="af-spatial-step-label"><b>① 拖动观察点</b><span>上图固定 r / D = 0.38，只比较空间方向</span></div>
        <div className="af-spatial-lens-layout">
          <div
            className={`af-spatial-field ${inLowRank ? 'lens-lowrank' : 'lens-orthogonal'}`}
            style={{ '--rank': `${LENS_RANK}%`, '--lens': `${lens}%` } as React.CSSProperties}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              updateLens(event);
            }}
            onPointerMove={(event) => { if (dragging) updateLens(event); }}
            onPointerUp={(event) => {
              setDragging(false);
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => setDragging(false)}
          >
            <div className="af-spatial-region lowrank"><span>P：Low-rank 区域</span><div className="af-region-signals"><i className="noise" /><i className="data" /></div></div>
            <div className="af-spatial-region orthogonal"><span>I−P：正交补</span><div className="af-region-signals"><i className="data" /></div></div>
            <div className="af-analysis-lens" aria-hidden="true"><span>观察点</span></div>
          </div>

          <div className={`af-lens-readout ${inLowRank ? 'is-lowrank' : 'is-orthogonal'}`} aria-live="polite">
            <span>{inLowRank ? 'P' : 'I − P'}</span>
            <div className="af-lens-formula">
              {inLowRank ? <>Pu<sub>A</sub> = Pu</> : <>(I−P)u<sub>A</sub> = −(I−P)x₀</>}
            </div>
            <strong>{inLowRank ? 'velocity-like' : 'x₀-like'}</strong>
            <div className="af-lens-components">
              {inLowRank ? <i className="noise">Noise</i> : null}
              <i className="data">Data</i>
            </div>
          </div>
        </div>

        <div className="af-spatial-step-label second"><b>② 再改变 Rank</b><span>只看 velocity-like / x₀-like 各占多少空间方向</span></div>
        <div className="af-continuous-rank" style={{ '--rank': `${rank}%` } as React.CSSProperties}>
          <div className="af-continuous-rank-head"><b>Rank · r / D</b></div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={rank}
            aria-label="Continuous rank ratio"
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
          <div className="af-continuous-endpoints"><span>0 · x₀-like</span><span>1 · velocity-like</span></div>
          <div className="af-behavior-allocation" aria-label="rank 改变两个空间 behavior 的占比">
            <div className="velocity" style={{ width: `${rank}%` }}><span>velocity-like</span></div>
            <div className="xzero" style={{ width: `${100 - rank}%` }}><span>x₀-like</span></div>
          </div>
          <div className="af-rank-endpoint-state"><strong>{endpoint.title}</strong><span>{endpoint.formula}</span></div>
        </div>
      </InteractiveActivity>
    </div>
  );
};
