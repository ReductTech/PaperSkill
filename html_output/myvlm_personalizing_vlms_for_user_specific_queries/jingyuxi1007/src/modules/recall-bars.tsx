import React from 'react';

export function RecallBars({ rows }: { rows: { label: string; value: number; selected?: boolean; paperMethod?: boolean }[] }) {
  return (
    <div className="mv-recall-chart" role="img" aria-label={rows.map(row => `${row.label}：${row.value.toFixed(2)}%`).join('；')}>
      {rows.map(row => (
        <div className={'mv-bar-row ' + (row.selected ? 'mv-selected-row' : '')} key={row.label}>
          <span>{row.label}</span><div className="mv-bar-track"><i className={row.paperMethod ? 'mv-green' : ''} style={{ width: `${row.value}%` }} /></div><b>{row.value.toFixed(2)}%</b>
        </div>
      ))}
      <p className="mv-source">横轴：Concept-name recall，0–100%，越高越好。</p>
    </div>
  );
}
