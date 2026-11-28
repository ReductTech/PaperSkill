import React from 'react';

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const fmt = (value: number, digits = 1) => Number(value.toFixed(digits)).toString();

/** Quiet room: light wall above, soft floor band below. Sized in percentages so it fits any viewBox. */
export function Room({ wallTop = 0 }: { wallTop?: number }) {
  return (
    <g aria-hidden="true">
      <rect x="0" y={wallTop} width="100%" height="59%" fill="#eef1ea" />
      <rect x="0" y="59%" width="100%" height="41%" fill="#e7e9df" />
      <line x1="0" y1="59%" x2="100%" y2="59%" stroke="#d7deea" strokeWidth="3" />
    </g>
  );
}

/** Abstract room content shared by photo thumbnails and generated frame strips. */
export function RoomContent({ variant = 'a', muted = false }: { variant?: 'a' | 'b' | 'corner' | 'shifted'; muted?: boolean }) {
  const ink = muted ? '#c3cbd8' : '#8fa3b8';
  const sofa = muted ? '#dfe4ea' : '#b9c9a7';
  const warm = muted ? '#e6e2da' : '#e8c9a0';
  return (
    <g aria-hidden="true">
      <rect x="0" y="0" width="240" height="150" fill={muted ? '#f6f7f4' : '#f3f5ef'} />
      {variant === 'corner' ? (
        <>
          <path d="M0 150 L120 96 L240 150 Z" fill={muted ? '#e9ebef' : '#dfe3d8'} />
          <rect x="160" y="46" width="58" height="70" rx="6" fill={warm} />
          <path d="M188 46 V30" stroke={ink} strokeWidth="4" />
        </>
      ) : (
        <>
          <rect x="18" y={variant === 'shifted' ? 74 : 84} width="120" height="52" rx="10" fill={sofa} />
          <rect x={variant === 'shifted' ? 190 : 168} y="58" width="34" height="46" rx="5" fill={warm} />
          <path d={variant === 'shifted' ? 'M206 48 Q214 8 224 44' : 'M185 52 Q190 22 200 50'} stroke={variant === 'b' ? '#7a8fa6' : '#7c9a6a'} strokeWidth="5" fill="none" />
          <rect x="60" y="38" width="66" height="10" rx="5" fill={ink} opacity=".5" />
        </>
      )}
    </g>
  );
}

export function PhotoCard({
  x, y, w = 210, h = 132, label, rotation = 0, variant = 'a', tone = '#ffffff', dashed = false,
}: {
  x: number; y: number; w?: number; h?: number; label?: string; rotation?: number;
  variant?: 'a' | 'b' | 'corner' | 'shifted'; tone?: string; dashed?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <rect x="0" y="0" width={w} height={h + 34} rx="8" fill={tone} stroke={dashed ? '#c43f52' : '#d7deea'} strokeWidth={dashed ? 3 : 2} strokeDasharray={dashed ? '10 8' : undefined} />
      <g transform={`translate(9 9) scale(${(w - 18) / 240} ${(h - 18) / 150})`}>
        <RoomContent variant={variant} muted={dashed} />
      </g>
      {label ? <text x={w / 2} y={h + 26} textAnchor="middle" fontSize="24" fontWeight="700" fill={dashed ? '#c43f52' : '#68778f'}>{label}</text> : null}
    </g>
  );
}

export function Person({ x, y, scale = 1, tone = '#27446e' }: { x: number; y: number; scale?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
      <ellipse cy="6" rx="26" ry="7" fill="#21324a" opacity=".12" />
      <path d="M-9 -46 L-13 -4 M9 -46 L13 -4" stroke="#3c4b63" strokeWidth="10" strokeLinecap="round" />
      <path d="M-14 -96 Q0 -104 14 -96 L18 -44 H-18 Z" fill={tone} />
      <path d="M-13 -92 L-26 -58 M13 -92 L26 -58" stroke={tone} strokeWidth="8" strokeLinecap="round" />
      <circle cy="-110" r="13" fill="#e5ae78" />
    </g>
  );
}

export function Camera({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
      <rect x="-46" y="-26" width="92" height="56" rx="10" fill="#3c4b63" />
      <rect x="-20" y="-38" width="40" height="14" rx="4" fill="#52627c" />
      <circle cx="0" cy="2" r="20" fill="#21324a" stroke="#d7deea" strokeWidth="3" />
      <circle cx="0" cy="2" r="9" fill="#8fa3b8" />
      <circle cx="30" cy="-14" r="5" fill="#f07e47" />
    </g>
  );
}

export function FrameStrip({
  x, y, labels, states, width = 132, height = 88, dashed = false,
}: {
  x: number; y: number; labels: string[]; states?: ('ok' | 'bad' | 'idle')[]; width?: number; height?: number; dashed?: boolean;
}) {
  const gap = 14;
  return (
    <g transform={`translate(${x} ${y})`}>
      {labels.map((label, index) => {
        const state = states?.[index] ?? 'idle';
        const stroke = state === 'bad' ? '#c43f52' : state === 'ok' ? '#228d5c' : '#d7deea';
        return (
          <g key={label + index} transform={`translate(${index * (width + gap)} 0)`}>
            <rect x="0" y="0" width={width} height={height} rx="8" fill="#ffffff" stroke={stroke} strokeWidth="3" strokeDasharray={dashed ? '9 7' : undefined} />
            <g transform={`translate(8 8) scale(${(width - 16) / 240} ${(height - 16) / 150})`}>
              <RoomContent variant={state === 'bad' ? 'corner' : index === 1 ? 'shifted' : 'a'} muted={state === 'bad'} />
            </g>
            <text x={width / 2} y={height + 24} textAnchor="middle" fontSize="22" fill={state === 'bad' ? '#c43f52' : '#68778f'}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

export function Chip({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'grey' }) {
  return <span className={`ps-chip is-${tone}`}>{children}</span>;
}
