import React, { useEffect, useRef, useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

type Point = { x: number; y: number };
const FLOW_CELLS = Array.from({ length: 49 }, (_, index) => {
  const x = index % 7;
  const y = Math.floor(index / 7);
  return Math.max(0.1, 1 - Math.abs(x - 3) * 0.17 - Math.abs(y - 3) * 0.12);
});
const NOISE_CELLS = [0.81, 0.14, 0.62, 0.35, 0.91, 0.46, 0.08, 0.72, 0.23, 0.87, 0.39, 0.56, 0.11, 0.76, 0.51, 0.28, 0.96, 0.43, 0.67, 0.19, 0.85, 0.34, 0.59, 0.06, 0.78, 0.48, 0.22, 0.9, 0.54, 0.15, 0.65, 0.32, 0.83, 0.41, 0.73, 0.1, 0.94, 0.26, 0.57, 0.04, 0.7, 0.37, 0.89, 0.18, 0.61, 0.29, 0.8, 0.45, 0.12];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const FlowProjectionTools: React.FC<WidgetProps> = () => {
  const [time, setTime] = useState(0.36);
  const [velocityStage, setVelocityStage] = useState<'hidden' | 'derivative' | 'final'>('hidden');
  const [epsilon, setEpsilon] = useState<Point>({ x: 398, y: 82 });
  const [draggingVector, setDraggingVector] = useState(false);
  const velocityTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (velocityTimer.current !== null) window.clearTimeout(velocityTimer.current);
  }, []);

  const revealVelocity = () => {
    if (velocityStage !== 'hidden') return;
    setVelocityStage('derivative');
    velocityTimer.current = window.setTimeout(() => setVelocityStage('final'), 720);
  };

  const updateTime = (next: number) => {
    setTime(clamp(next, 0, 1));
    revealVelocity();
  };

  const scrubTime = (event: React.PointerEvent<HTMLInputElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    updateTime((event.clientX - rect.left) / rect.width);
  };

  const updateVector = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setEpsilon({
      x: clamp((event.clientX - rect.left) / rect.width * 520, 54, 466),
      y: clamp((event.clientY - rect.top) / rect.height * 320, 42, 278),
    });
  };

  const center = { x: 260, y: 180 };
  const angle = -0.42;
  const basis = { x: Math.cos(angle), y: Math.sin(angle) };
  const vector = { x: epsilon.x - center.x, y: epsilon.y - center.y };
  const dot = vector.x * basis.x + vector.y * basis.y;
  const projected = { x: center.x + dot * basis.x, y: center.y + dot * basis.y };
  const stateLabel = time < 0.18 ? 'Data' : time > 0.82 ? 'Noise' : '混合';

  return (
    <div className="af-mechanism-block af-flow-projection-tools">
      <div className="af-tools-grid">
        <InteractiveActivity
          className="af-flow-tool"
          instruction="拖动 t：左端是 Data，右端是 Noise。"
        >
          <div className="af-tool-title"><h3>Flow 时间</h3></div>
          <div className="af-flow-state" style={{ '--flow-t': time } as React.CSSProperties}>
            <div className="af-flow-mixture" aria-label={`${stateLabel}, t=${time.toFixed(2)}`}>
              <div className="af-flow-data-layer">
                {FLOW_CELLS.map((value, index) => <i key={index} style={{ '--value': value } as React.CSSProperties} />)}
              </div>
              <div className="af-flow-noise-layer">
                {NOISE_CELLS.map((value, index) => <i key={index} style={{ '--value': value } as React.CSSProperties} />)}
              </div>
              <strong>{stateLabel}</strong>
            </div>
            <div className="af-flow-equation" aria-label="x t equals one minus t times x zero plus t epsilon">
              <span>x<sub>t</sub> =</span>
              <b className="data-term" style={{ opacity: 0.35 + (1 - time) * 0.65, transform: `scale(${0.92 + (1 - time) * 0.08})` }}>(1−t)x₀</b>
              <span>+</span>
              <b className="noise-term" style={{ opacity: 0.35 + time * 0.65, transform: `scale(${0.92 + time * 0.08})` }}>tε</b>
            </div>
          </div>
          <div className="af-time-scrubber">
            <div className="af-time-labels"><span>Data</span><b>t = {time.toFixed(2)}</b><span>Noise</span></div>
            <input
              aria-label="Flow time t"
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={time}
              onChange={(event) => updateTime(Number(event.target.value))}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                scrubTime(event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) scrubTime(event);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              }}
            />
            <div className="af-time-endpoints"><span>t = 0</span><span>t = 1</span></div>
          </div>
          <div className={`af-velocity-morph is-${velocityStage}`} aria-live="polite">
            {velocityStage === 'hidden' ? <span className="af-scrub-cue">拖动后显示 Velocity</span> : null}
            {velocityStage !== 'hidden' ? <span className="derivative">u = dx<sub>t</sub>/dt</span> : null}
            {velocityStage === 'final' ? <><i>→</i><span className="final">u = ε − x₀</span></> : null}
          </div>
        </InteractiveActivity>

        <InteractiveActivity
          className="af-projection-tool"
          instruction="拖动 ε 端点：看 Pε 始终落在 Low-rank Subspace。"
        >
          <div className="af-tool-title"><h3>空间 Projection</h3></div>
          <svg
            className="af-projection-plane"
            viewBox="0 0 520 320"
            role="img"
            aria-label="拖动 epsilon 向量并观察它在低秩子空间上的投影"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setDraggingVector(true);
              updateVector(event);
            }}
            onPointerMove={(event) => { if (draggingVector) updateVector(event); }}
            onPointerUp={(event) => {
              setDraggingVector(false);
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => setDraggingVector(false)}
          >
            <defs>
              <marker id="af-arrow-noise" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker>
              <marker id="af-arrow-lowrank" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker>
            </defs>
            <rect className="orthogonal-region" x="34" y="30" width="452" height="258" rx="12" />
            <line className="axis" x1="46" y1={center.y} x2="474" y2={center.y} />
            <line className="axis" x1={center.x} y1="42" x2={center.x} y2="278" />
            <line className="basis-band" x1={center.x - basis.x * 235} y1={center.y - basis.y * 235} x2={center.x + basis.x * 235} y2={center.y + basis.y * 235} />
            <line className="basis-line" x1={center.x - basis.x * 235} y1={center.y - basis.y * 235} x2={center.x + basis.x * 235} y2={center.y + basis.y * 235} />
            <line className="projection-helper" x1={epsilon.x} y1={epsilon.y} x2={projected.x} y2={projected.y} />
            <line className="projected-vector" x1={center.x} y1={center.y} x2={projected.x} y2={projected.y} markerEnd="url(#af-arrow-lowrank)" />
            <line className="epsilon-vector" x1={center.x} y1={center.y} x2={epsilon.x} y2={epsilon.y} markerEnd="url(#af-arrow-noise)" />
            <circle className="vector-origin" cx={center.x} cy={center.y} r="5" />
            <circle className="vector-handle" cx={epsilon.x} cy={epsilon.y} r="12" />
            <text className="epsilon-label" x={epsilon.x + 12} y={epsilon.y - 12}>ε</text>
            <text className="projected-label" x={projected.x + 10} y={projected.y + 18}>Pε</text>
            <text className="subspace-label" x="48" y="64">Low-rank Subspace</text>
          </svg>
        </InteractiveActivity>
      </div>

      <div className="af-tools-transition" aria-label="Flow velocity plus spatial projection leads to asymmetric flow parameterization">
        <strong>Velocity + Projection → AsymFlow</strong>
      </div>
    </div>
  );
};
