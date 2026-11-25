import React from 'react';

export const ink = '#21324a';
export const blue = '#27446e';
export const green = '#228d5c';
export const red = '#c43f52';
export const orange = '#f07e47';

export function btn(on: boolean): React.CSSProperties {
  return {
    margin: 0, cursor: 'pointer', fontSize: 28, lineHeight: 1.2, padding: '8px 12px', borderRadius: 12,
    border: on ? '3px solid #27446e' : '3px solid #d7deea', background: on ? '#27446e' : '#fff', color: on ? '#fff' : ink,
  };
}

export function Page({ art, children }: { art: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.45fr) minmax(0,0.75fr)', columnGap: 20 }}>
    <div style={{ minWidth: 0, minHeight: 0, height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0 }}>{art}</div>
    </div>
    <div style={{ minWidth: 0, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>{children}</div>
  </div>;
}

export function H({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 34, lineHeight: 1.35, fontWeight: 800 }}>{children}</p>;
}
export function T({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 28, lineHeight: 1.4 }}>{children}</p>;
}
export function Big({ children, color }: { children: React.ReactNode; color?: string }) {
  return <p style={{ margin: 0, fontSize: 44, lineHeight: 1.35, fontWeight: 800, color: color || green }}>{children}</p>;
}

const stickerOrder = [5, 4, 6, 1, 9, 0, 2, 8, 10, 3, 7, 11];

export function Photo({ covered, scan }: { covered: number; scan?: boolean }) {
  const chosen = new Set(stickerOrder.slice(0, covered));
  const cells = [];
  for (let i = 0; i < 12; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 108 + col * 156;
    const y = 78 + row * 112;
    const on = chosen.has(i);
    cells.push(<rect key={i} x={x} y={y} width="140" height="96" rx="8" fill={on ? 'rgba(240,126,71,.82)' : 'rgba(255,253,248,.1)'} stroke={on ? orange : '#d7deea'} strokeWidth="3" />);
  }
  return <g>
    <rect width="900" height="622" fill="#f5f8f0" />
    <rect x="48" y="508" width="804" height="78" rx="14" fill="#e7d3b0" />
    <rect x="48" y="508" width="804" height="16" fill="#92400e" />
    <rect x="78" y="40" width="720" height="430" rx="14" fill="#fffdf8" stroke="#92400e" strokeWidth="4" />
    <rect x="96" y="56" width="684" height="210" fill="#d5eee4" />
    <circle cx="620" cy="112" r="32" fill="#f6d36b" />
    <path d="M96 240 Q280 160 450 230 T780 210 V292 H96 Z" fill="#76906a" />
    <circle cx="400" cy="208" r="18" fill="#e5ae78" />
    <rect x="386" y="226" width="28" height="42" rx="8" fill={blue} />
    {scan ? <rect x="90" y="52" width="696" height="404" fill="none" stroke={red} strokeWidth="6" /> : null}
    {cells}
  </g>;
}
