import type { ReactNode } from 'react';
import './visual-parts.css';

/** Caller owns identity, provenance and contents. No built-in dataset sample. */
export function SampleToken({ sampleId, label, pixels, columns = 6, children }: { sampleId: string; label: string; pixels?: number[]; columns?: number; children?: ReactNode }) {
  if (pixels && (!Number.isInteger(columns) || columns < 1 || pixels.length === 0 || pixels.some(v => !Number.isFinite(v) || v < 0 || v > 1))) return <span role="alert">输入图块需要非空的 [0, 1] 像素与正整数列数。</span>;
  return <figure className="rk-sample-token" data-sample-id={sampleId}>
    <div className="rk-sample-token__image" role={pixels ? 'img' : undefined} aria-label={pixels ? label : undefined}>
      {pixels ? <span className="rk-sample-token__pixels" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>{pixels.map((v, i) => <i key={i} aria-hidden="true" style={{ opacity: .12 + .88 * v }} />)}</span> : children}
    </div><figcaption>{label}</figcaption>
  </figure>;
}
