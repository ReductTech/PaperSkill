import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

function Scene({ count, label }: { count: number; label: string }) {
  const cells = [];
  for (let i = 0; i < 12; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const on = i < count;
    cells.push(<rect key={i} x={36 + col * 68} y={28 + row * 52} width="58" height="42" rx="6" fill={on ? '#c43f52' : 'rgba(255,253,248,.25)'} stroke={on ? '#c43f52' : '#d7deea'} strokeWidth="2" />);
  }
  return <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <svg viewBox="0 0 340 210" preserveAspectRatio="xMidYMid meet" role="img" aria-label={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
    <rect width="340" height="210" fill="#f5f8f0" />
    <rect x="20" y="16" width="300" height="178" rx="10" fill="#fffdf8" stroke="#92400e" strokeWidth="3" />
    <path d="M28 112 Q100 62 170 104 T312 92 V140 H28 Z" fill="#76906a" />
    <circle cx="168" cy="88" r="12" fill="#e5ae78" />
    {cells}
    </svg>
  </div>;
}

export function CoverFull(_props: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = reduced && !playing ? 1 : Math.max(0, Math.min(1, (progress - 0.06) / 0.9));
  const count = Math.round(t * 12);
  return <Scene count={count} label={count < 12 ? '整张照片还在涂' : '整张都涂完了'} />;
}
