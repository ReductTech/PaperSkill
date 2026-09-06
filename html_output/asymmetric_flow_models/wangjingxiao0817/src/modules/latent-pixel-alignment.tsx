import React, { useMemo, useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const LIFT_BASE_SCALE = 0.68;
const SCALE_TARGET = 1 / LIFT_BASE_SCALE;

export const LatentPixelAlignment: React.FC<WidgetProps> = () => {
  const [alignment, setAlignment] = useState(0.18);
  const [scale, setScale] = useState(1);
  const [time, setTime] = useState(0.62);
  const [alignDragging, setAlignDragging] = useState(false);
  const [scaleDragging, setScaleDragging] = useState(false);
  const [timeDragging, setTimeDragging] = useState(false);
  const [scaleTouched, setScaleTouched] = useState(false);

  const calibratedScale = Math.abs(scale - SCALE_TARGET) < 0.035 ? SCALE_TARGET : scale;
  const overlayScale = LIFT_BASE_SCALE * calibratedScale;
  const directionAligned = alignment > 0.86;
  const magnitudeAligned = scaleTouched && Math.abs(overlayScale - 1) < 0.065;
  const denominator = calibratedScale * (1 - time) + time;
  const tau = time / denominator;

  const mappedDirections = useMemo(() => {
    const center = { x: 690, y: 157 };
    const targetAngles = [-0.58, 0, 0.58];
    const mismatch = (1 - alignment) * 0.78;
    return targetAngles.map((angle) => ({
      targetX: center.x + Math.cos(angle) * 98,
      targetY: center.y + Math.sin(angle) * 98,
      mappedX: center.x + Math.cos(angle + mismatch) * 87,
      mappedY: center.y + Math.sin(angle + mismatch) * 87,
    }));
  }, [alignment]);

  const updateByPointer = (
    event: React.PointerEvent<HTMLElement>,
    setter: (value: number) => void,
    min = 0,
    max = 1,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setter(min + clamp((event.clientX - rect.left) / rect.width) * (max - min));
  };

  const keyboardAdjust = (
    value: number,
    setter: (value: number) => void,
    event: React.KeyboardEvent,
    step = 0.03,
    min = 0,
    max = 1,
  ) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setter(clamp(value + (event.key === 'ArrowRight' ? step : -step), min, max));
  };

  return (
    <div className="af-mechanism-block af-ltp-alignment">
      <InteractiveActivity instruction="按 ①方向 → ②尺度 → ③时间依次拖动：先重合，再同步。">
        <div className="af-alignment-steps">
          <section className={`af-alignment-step ${directionAligned ? 'is-aligned' : ''}`}>
            <header className="af-step-heading"><span>①</span><h3>方向对齐</h3></header>
            <div className={`af-dual-space-canvas ${directionAligned ? 'is-aligned' : ''}`}>
              <svg viewBox="0 0 900 315" role="img" aria-label="Latent directions 通过 A 对齐 Pixel patch directions">
                <rect className="latent-surface" x="20" y="22" width="330" height="270" rx="14" />
                <rect className="pixel-surface" x="550" y="22" width="330" height="270" rx="14" />
                <text className="space-title latent-title" x="42" y="54">Latent</text>
                <text className="space-title pixel-title" x="572" y="54">Pixel</text>
                <g className="latent-points">
                  <circle cx="112" cy="120" r="8" /><circle cx="178" cy="92" r="7" /><circle cx="235" cy="146" r="9" /><circle cx="154" cy="205" r="7" />
                  <text x="90" y="102">z₀</text>
                </g>
                <g className="latent-directions">
                  <line x1="185" y1="158" x2="274" y2="107" /><line x1="185" y1="158" x2="286" y2="158" /><line x1="185" y1="158" x2="270" y2="213" />
                </g>
                <path className="lift-arrow" d="M365 157 H525" />
                <circle className="lift-node" cx="445" cy="157" r="31" />
                <text className="lift-label" x="445" y="164" textAnchor="middle">A</text>
                <g className="target-directions">
                  {mappedDirections.map((d, index) => <line key={`target-${index}`} x1="690" y1="157" x2={d.targetX} y2={d.targetY} />)}
                </g>
                <g className="mapped-directions">
                  {mappedDirections.map((d, index) => <line key={`mapped-${index}`} x1="690" y1="157" x2={d.mappedX} y2={d.mappedY} />)}
                </g>
                <text className="distribution-label target" x="800" y="78">X</text>
                <text className="distribution-label mapped" x="612" y="256">AZ</text>
              </svg>
              <div className="af-dual-mobile" aria-hidden="true">
                <div className="mobile-space latent"><span>Latent · z₀</span><div className="mobile-directions"><i /><i /><i /></div></div>
                <b>↓ A</b>
                <div className="mobile-space pixel"><span>Pixel</span><div className="mobile-target"><i /><i /><i /></div><div className="mobile-mapped" style={{ transform: `rotate(${(1 - alignment) * 45}deg)` }}><i /><i /><i /></div></div>
              </div>
              <div
                className="af-alignment-rail"
                role="slider"
                aria-label="Continuous direction alignment"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(alignment * 100)}
                tabIndex={0}
                style={{ '--alignment': `${alignment * 100}%` } as React.CSSProperties}
                onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setAlignDragging(true); updateByPointer(event, setAlignment); }}
                onPointerMove={(event) => { if (alignDragging) updateByPointer(event, setAlignment); }}
                onPointerUp={(event) => { setAlignDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
                onKeyDown={(event) => keyboardAdjust(alignment, setAlignment, event)}
              >
                <span>未对齐</span><i /><span>已对齐</span>
              </div>
            </div>
            {directionAligned ? (
              <div className="af-step-formula revealed" aria-live="polite">
                <div>A<sup>★</sup> = arg min<sub>AᵀA=I</sub> ‖X − AZ‖<sub>F</sub><sup>2</sup></div>
                <p>Procrustes 对齐方向。</p>
              </div>
            ) : null}
          </section>

          <section className="af-scale-step">
            <header className="af-step-heading"><span>②</span><h3>尺度校准</h3></header>
            <div className={`af-scale-overlay ${magnitudeAligned ? 'is-calibrated' : ''}`} style={{ '--lift-scale': overlayScale } as React.CSSProperties}>
              <div className="af-scale-shapes">
                <div className="real-shape"><span>Real Pixel</span></div>
                <div className="lifted-shape"><span>Lifted Pixel</span></div>
              </div>
              <div
                className="af-scale-handle"
                role="slider"
                aria-label="Scale calibration s"
                aria-valuemin={70}
                aria-valuemax={170}
                aria-valuenow={Math.round(calibratedScale * 100)}
                tabIndex={0}
                style={{ '--scale-position': `${(calibratedScale - 0.7) * 100}%` } as React.CSSProperties}
                onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setScaleDragging(true); setScaleTouched(true); updateByPointer(event, setScale, 0.7, 1.7); }}
                onPointerMove={(event) => { if (scaleDragging) updateByPointer(event, setScale, 0.7, 1.7); }}
                onPointerUp={(event) => { setScaleDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
                onKeyDown={(event) => { setScaleTouched(true); keyboardAdjust(scale, setScale, event, 0.025, 0.7, 1.7); }}
              ><span>s</span><i /></div>
            </div>
            <div className="af-scale-result"><span>Az₀ → sAz₀</span>{scaleTouched ? <strong>x₀<sup>L</sup> = sAz₀</strong> : null}</div>
          </section>

          <section className="af-snr-step">
            <header className="af-step-heading"><span>③</span><h3>时间同步</h3></header>
            <div
              className="af-coupled-time-rails"
              role="slider"
              aria-label="Pixel flow time t and coupled latent time tau"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(time * 100)}
              tabIndex={0}
              style={{ '--pixel-time': `${time * 100}%`, '--latent-time': `${tau * 100}%` } as React.CSSProperties}
              onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setTimeDragging(true); updateByPointer(event, setTime); }}
              onPointerMove={(event) => { if (timeDragging) updateByPointer(event, setTime); }}
              onPointerUp={(event) => { setTimeDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onKeyDown={(event) => keyboardAdjust(time, setTime, event)}
            >
              <div><b>Pixel</b><span className="rail"><i className="pixel-handle">t</i></span></div>
              <div><b>Latent</b><span className="rail"><i className="latent-handle">τ</i></span></div>
              <footer><span>Data</span><span>Noise</span></footer>
            </div>
            <div className="af-calibration-readout"><span>t → τ</span><i>·</i><span>x<sub>t</sub> → kx<sub>t</sub></span></div>
            <p className="af-step-note">Scale 改变后，同步校准 Flow 时间。</p>
          </section>
        </div>

        <details className="af-deep-dive af-alignment-math">
          <summary>数学展开</summary>
          <div className="af-alignment-equations">
            <span>XZᵀ = UΣVᵀ　→　A<sup>★</sup> = UVᵀ</span>
            <span>s = ‖AᵀX‖<sub>F</sub> / ‖Z‖<sub>F</sub></span>
            <span>τ = t / [s(1−t)+t]　·　k = 1 / [s(1−t)+t]</span>
          </div>
        </details>
      </InteractiveActivity>
    </div>
  );
};
