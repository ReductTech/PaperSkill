import type { CSSProperties, ReactNode } from 'react';
import { useCanvasScene } from '../../animation/useCanvasScene';
import { useContinuousControl } from '../../animation/useContinuousControl';
import { clear } from './canvasDrawing';

export type Tone = 'good' | 'bad' | 'warn' | 'info';

export function LabCanvas({
  width = 560,
  height = 260,
  draw,
  labelText,
  onOutOfView,
}: {
  width?: number;
  height?: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
  labelText: string;
  onOutOfView?: () => void;
}) {
  const { canvasRef, ready, contextUnavailable, fallbackText } = useCanvasScene({
    width,
    height,
    model: draw,
    onOutOfView,
    draw: (ctx, paint) => {
      clear(ctx, width, height);
      paint(ctx);
    },
  });

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`paper-lab-canvas ${ready ? 'is-ready' : ''}`}
        aria-label={labelText}
        role="img"
      >
        {fallbackText}
      </canvas>
      {contextUnavailable && <p className="canvas-fallback">{fallbackText}</p>}
    </>
  );
}

export function ChipRow({
  labelText,
  options,
  value,
  onChange,
}: {
  labelText: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="lab-chip-group" aria-label={labelText}>
      <span className="lab-control-label">{labelText}</span>
      <div className="chip-row">
        {options.map((option) => (
          <button
            type="button"
            className={`chip ${value === option.value ? 'selected' : ''}`}
            aria-pressed={value === option.value}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Feedback({ tone, children }: { tone: Tone; children: ReactNode }) {
  const className = tone === 'info' ? 'feedback' : `feedback ${tone}`;
  return <div className={className} role="status" aria-live="polite" aria-atomic="true">{children}</div>;
}

export function LabShell({ children }: { children: ReactNode }) {
  return <div className="paper-lab">{children}</div>;
}

export function ContinuousSlider({
  label,
  value,
  min,
  max,
  step,
  valueText,
  onChange,
  onTakeControl,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueText: string;
  onChange: (value: number) => void;
  onTakeControl?: () => void;
}) {
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const { bindings, dragging } = useContinuousControl({
    value,
    min,
    max,
    step,
    onValueChange: onChange,
    onTakeControl,
  });
  const style = { '--control-progress': `${progress * 100}%` } as CSSProperties;

  return (
    <div className="continuous-control-group">
      <div className="continuous-control-label">
        <span>{label}</span>
        <output>{valueText}</output>
      </div>
      <div
        className={`continuous-control ${dragging ? 'is-dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        style={style}
        {...bindings}
      >
        <i className="continuous-control-thumb" aria-hidden="true" />
      </div>
    </div>
  );
}
