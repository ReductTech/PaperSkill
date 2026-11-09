import React from 'react';

/** 共享语义色（contract.md §5） */
export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fmt = (v: number, d = 2) => v.toFixed(d);

/** 衣架上的衣服剪影；label 为款名吊牌 */
export function Garment({
  x = 0,
  y = 0,
  s = 1,
  color = C.blue,
  trim = '#ffffff',
  collar = 'round',
}: {
  x?: number;
  y?: number;
  s?: number;
  color?: string;
  trim?: string;
  collar?: 'round' | 'point';
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-36 -46 L-14 -53 L0 -40 L14 -53 L36 -46 L53 -16 L37 -5 L34 52 L-34 52 L-37 -5 L-53 -16 Z"
        fill={color}
        stroke={trim}
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={0.94}
      />
      {collar === 'round' ? (
        <path d="M-14 -53 Q0 -33 14 -53" fill="none" stroke={trim} strokeWidth={3} />
      ) : (
        <path d="M-14 -53 L0 -34 L14 -53" fill="none" stroke={trim} strokeWidth={3} />
      )}
      <path d="M-34 20 L34 20" stroke={trim} strokeWidth={2} opacity={0.45} />
    </g>
  );
}

export function Hanger({ x = 0, y = 0, s = 1, color = C.wood }: { x?: number; y?: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -14 L0 -4 M0 -14 A7 7 0 1 1 9 -20" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      <path d="M0 -4 L-46 22 L46 22 Z" fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
}

export function Rail({ x1, x2, y, color = C.wood }: { x1: number; x2: number; y: number; color?: string }) {
  return <path d={`M${x1} ${y} L${x2} ${y}`} stroke={color} strokeWidth={8} strokeLinecap="round" />;
}

/** 方格打版纸 */
export function Sheet({
  x,
  y,
  cols,
  rows,
  cell,
  fill = '#fffdf7',
  stroke = C.line,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  cell: number;
  fill?: string;
  stroke?: string;
}) {
  const w = cols * cell;
  const h = rows * cell;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />
      {Array.from({ length: cols }, (_, i) => (
        <path key={`v${i}`} d={`M${x + (i + 1) * cell} ${y} V${y + h}`} stroke={stroke} strokeWidth={1} opacity={0.8} />
      ))}
      {Array.from({ length: rows }, (_, i) => (
        <path key={`h${i}`} d={`M${x} ${y + (i + 1) * cell} H${x + w}`} stroke={stroke} strokeWidth={1} opacity={0.8} />
      ))}
    </g>
  );
}

/** 圆角吊牌文字 */
export function Tag({
  x,
  y,
  text,
  fill = '#ffffff',
  color = C.ink,
  size = 24,
  stroke = C.line,
}: {
  x: number;
  y: number;
  text: string;
  fill?: string;
  color?: string;
  size?: number;
  stroke?: string;
}) {
  const w = Math.max(64, text.length * size * 0.72 + 26);
  const h = size + 18;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontSize={size} fill={color} fontWeight={600}>
        {text}
      </text>
    </g>
  );
}

/** 衣架横杆上的一个款式（含吊牌） */
export function HangingItem({
  x,
  railY,
  label,
  color,
  selected = false,
  collar = 'round',
  dim = false,
}: {
  x: number;
  railY: number;
  label: string;
  color: string;
  selected?: boolean;
  collar?: 'round' | 'point';
  dim?: boolean;
}) {
  return (
    <g opacity={dim ? 0.42 : 1}>
      <Hanger x={x} y={railY} s={0.9} color={selected ? C.orange : C.wood} />
      <Garment x={x} y={railY + 34} s={0.9} color={color} collar={collar} />
      <Tag x={x} y={railY + 118} text={label} fill={selected ? '#fff3ea' : '#ffffff'} stroke={selected ? C.orange : C.line} />
    </g>
  );
}

/** 页面左图右文的通用骨架 */
export function PageFrame({
  scene,
  side,
  hint,
}: {
  scene: React.ReactNode;
  side: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        {scene}
        {hint ? <div className="tailor-hint">{hint}</div> : null}
      </div>
      <aside className="tailor-side">{side}</aside>
    </div>
  );
}
