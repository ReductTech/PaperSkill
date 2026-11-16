import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Box = { label: string; x1: number; y1: number; x2: number; y2: number };

function fmt(n: number) {
  return Math.min(1, Math.max(0, n)).toFixed(3);
}

export function GriffonFormat(_props: WidgetProps) {
  const [boxes, setBoxes] = useState<Box[]>([
    { label: 'bus', x1: 0.12, y1: 0.22, x2: 0.48, y2: 0.72 },
    { label: 'person', x1: 0.58, y1: 0.30, x2: 0.78, y2: 0.85 },
  ]);
  const [active, setActive] = useState(0);

  const text = useMemo(
    () => boxes.map((b) => `${b.label}-[${fmt(b.x1)},${fmt(b.y1)},${fmt(b.x2)},${fmt(b.y2)}]`).join('&'),
    [boxes],
  );

  const move = (field: keyof Box, delta: number) => {
    setBoxes((prev) => prev.map((b, i) => {
      if (i !== active || field === 'label') return b;
      const next = { ...b, [field]: Math.min(0.999, Math.max(0.001, Number(b[field]) + delta)) } as Box;
      if (next.x2 <= next.x1) next.x2 = Math.min(0.999, next.x1 + 0.02);
      if (next.y2 <= next.y1) next.y2 = Math.min(0.999, next.y1 + 0.02);
      return next;
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#dfe8d6', borderRadius: 16, border: '1px solid #76906a', position: 'relative' }}>
        <svg viewBox="0 0 800 520" width="100%" height="100%">
          <rect x="40" y="40" width="720" height="400" rx="10" fill="#b8c9a7" />
          <text x="60" y="78" fill="#27446e" fontSize="24">接触印样 · 手写旁注</text>
          {boxes.map((b, i) => {
            const x = 40 + b.x1 * 720;
            const y = 40 + b.y1 * 400;
            const w = (b.x2 - b.x1) * 720;
            const h = (b.y2 - b.y1) * 400;
            return (
              <g key={i} onClick={() => setActive(i)} style={{ cursor: 'pointer' }}>
                <rect x={x} y={y} width={w} height={h} fill="none" stroke={i === active ? '#f07e47' : '#228d5c'} strokeWidth={i === active ? 5 : 3} />
                <text x={x + 4} y={y - 8} fill={i === active ? '#f07e47' : '#228d5c'} fontSize="22">{b.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>统一输出格式</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.4 }}>
          选中框后微调角点；字符串按精度 0.001 即时更新，多框用 & 拼接。
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {boxes.map((b, i) => (
            <button key={b.label} type="button" onClick={() => setActive(i)} style={{
              fontSize: 28, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${active === i ? '#f07e47' : '#d7deea'}`,
              background: active === i ? '#fff4ee' : '#fff',
            }}>{b.label}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['x1', 'y1', 'x2', 'y2'] as const).map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 28 }}>
              <span style={{ width: 40 }}>{k}</span>
              <button type="button" onClick={() => move(k, -0.02)} style={tinyBtn}>−</button>
              <span style={{ minWidth: 70 }}>{fmt(boxes[active][k])}</span>
              <button type="button" onClick={() => move(k, 0.02)} style={tinyBtn}>+</button>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 26, padding: 14, borderRadius: 12, background: '#e7f6ee', color: '#228d5c', wordBreak: 'break-all', lineHeight: 1.35 }}>
          {text}
        </div>
      </div>
    </div>
  );
}

const tinyBtn: React.CSSProperties = {
  fontSize: 28, width: 40, height: 40, borderRadius: 8, border: '1px solid #d7deea', background: '#fff', cursor: 'pointer',
};
