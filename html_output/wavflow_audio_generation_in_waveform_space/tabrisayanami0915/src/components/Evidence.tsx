import React from 'react';
export function Choices<T extends string | number>({ label, options, value, onChange }: {
 label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void;
}) {
 return <div className="widget-controls" role="group" aria-label={label}><span>{label}</span>
 <div className="btn-group">{options.map(o => <button key={o.value}
 className={value === o.value ? 'btn-toggle active' : 'btn-toggle'} aria-pressed={value === o.value}
 onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}
export function Source({ children }: { children: React.ReactNode }) {
 return <p className="evidence-source">来源：WavFlow · arXiv:2605.18749v1 · {children}</p>;
}
export function MetricsTable({ caption, headers, rows, highlight }: {
 caption: string; headers: string[]; rows: (string | number)[][]; highlight?: string;
}) {
 const best = headers.map((h,i) => {
  if (!h.includes('↓') && !h.includes('↑')) return undefined;
  const v=rows.map(r=>Number(r[i])).filter(Number.isFinite);
  return h.includes('↓') ? Math.min(...v) : Math.max(...v);
 });
 return <><p className="evidence-source">宽表可左右滑动；键盘聚焦表格后可用左右方向键滚动。</p><div className="evidence-table-wrap" tabIndex={0} role="region" aria-label={caption}>
 <table className="evidence-table"><caption>{caption} · 粗体为本表该列最优（含并列）</caption>
 <thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
 <tbody>{rows.map(r=><tr key={r[0]} className={String(r[0])===highlight?'evidence-selected':''}>
 {r.map((v,i)=>i===0?<th key={i} scope="row">{v}</th>:<td key={i}>
 {best[i]!==undefined && Number(v)===best[i]?<strong>{v}</strong>:v}</td>)}
 </tr>)}</tbody></table></div></>;
}
