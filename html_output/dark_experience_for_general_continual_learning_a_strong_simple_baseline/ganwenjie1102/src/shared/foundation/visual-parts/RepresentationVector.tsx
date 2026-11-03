import './visual-parts.css';

export function RepresentationVector({ values, label, extent = Math.max(1, ...values.map(Math.abs)) }: { values: number[]; label: string; extent?: number }) {
  if (!values.length || !Number.isFinite(extent) || extent <= 0 || values.some(v => !Number.isFinite(v) || Math.abs(v) > extent)) return <span role="alert">向量须为有限值，extent 须覆盖全部绝对值。</span>;
  return <figure className="rk-representation-vector" aria-label={`${label}: [${values.join(', ')}]`}>
    <div className="rk-representation-vector__coordinates">{values.map((v, i) => <div className="rk-vector-coordinate" key={i} data-value={v}>
      <span className="rk-vector-coordinate__positive" aria-hidden="true">{v > 0 && <i style={{ height: `${v / extent * 100}%` }} />}</span>
      <span className="rk-vector-coordinate__negative" aria-hidden="true">{v < 0 && <i style={{ height: `${-v / extent * 100}%` }} />}</span>
      <span>{v}</span>
    </div>)}</div><figcaption>{label}</figcaption>
  </figure>;
}
