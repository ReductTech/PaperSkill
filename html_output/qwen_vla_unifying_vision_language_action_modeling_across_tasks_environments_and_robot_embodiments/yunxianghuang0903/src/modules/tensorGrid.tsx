import React from 'react';

export interface TensorGridProps {
  rows: number;
  cols: number;
  activeC: number;
  activeH: number;
  showMask?: boolean;
  showGradient?: boolean;
  hoverCell?: { t: number; k: number } | null;
  onHover?: (t: number, k: number) => void;
  onLeave?: () => void;
  className?: string;
}

export function TensorGrid({
  rows,
  cols,
  activeC,
  activeH,
  showMask = false,
  showGradient = false,
  hoverCell,
  onHover,
  onLeave,
  className = '',
}: TensorGridProps) {
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  return (
    <svg viewBox="0 0 100 100" className={`tensor-grid-svg ${className}`.trim()} onMouseLeave={onLeave}>
      {Array.from({ length: rows }).map((_, t) =>
        Array.from({ length: cols }).map((__, k) => {
          const active = k < activeC && t < activeH;
          const isHover = hoverCell?.t === t && hoverCell?.k === k;
          return (
            <rect
              key={`${t}-${k}`}
              x={k * cellW + 0.5}
              y={t * cellH + 0.5}
              width={cellW - 1}
              height={cellH - 1}
              rx={1}
              fill={active ? (showGradient ? '#6fa87d' : '#5A8F68') : '#D9E0E8'}
              stroke={showMask ? (active ? '#34476f' : '#b8c4d0') : isHover ? '#34476f' : 'transparent'}
              strokeWidth={isHover ? 1.5 : showMask ? 0.6 : 0}
              opacity={active && showGradient ? 0.85 : 1}
              className={active && showGradient ? 'tensor-cell-pulse' : ''}
              onMouseEnter={() => onHover?.(t, k)}
            />
          );
        })
      )}
    </svg>
  );
}
