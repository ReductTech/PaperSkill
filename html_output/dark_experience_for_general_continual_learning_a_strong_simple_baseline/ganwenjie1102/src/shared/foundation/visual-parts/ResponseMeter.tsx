import { useId } from 'react';
import './visual-parts.css';

/** No sigmoid, softmax, normalization or prediction policy lives here. */
export function ResponseMeter({ value, min, max, label, showScale = true }: { value: number; min: number; max: number; label: string; showScale?: boolean }) {
  const id = useId();
  if (![value, min, max].every(Number.isFinite) || min >= max || value < min || value > max) return <span role="alert">响应值须位于明确的有限尺度 [min, max] 内。</span>;
  const origin = Math.max(min, Math.min(0, max));
  const percent = (n: number) => (n - min) / (max - min) * 100;
  return <div className="rk-response-meter" data-value={value}>
    {showScale && <small>尺度：{min} 至 {max}</small>}
    <label htmlFor={id}>{label}</label>
    <meter id={id} value={value} min={min} max={max} />
    <span className="rk-response-meter__track" aria-hidden="true">
      <span className="rk-response-meter__fill" data-negative={value < 0} style={{ left: `${percent(Math.min(origin, value))}%`, width: `${Math.abs(value - origin) / (max - min) * 100}%` }} />
      {min < 0 && max > 0 && <span className="rk-response-meter__zero" style={{ left: `${percent(0)}%` }} />}
    </span>
    <output htmlFor={id}>{Number(value.toFixed(3))}</output>
  </div>;
}
