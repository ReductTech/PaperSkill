import React from 'react';
import { ANA, ANA_CSS } from './analogyMotion';
import type { WidgetProps } from './registry';

/** §2 — same pallet, different cargo shapes (no tiny labels) */
export const Ch2AnalogyV2: React.FC<WidgetProps> = () => (
  <svg
    viewBox="0 0 244 130"
    className={`analogy-anim ch2-ana-svg ${ANA_CSS.stage}`}
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    aria-hidden="true"
  >
    <defs>
      <filter id="ch2-sh"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" /></filter>
    </defs>

    {/* Conveyor belt */}
    <rect x="6" y="58" width="100" height="8" rx="2" fill={ANA.gray} stroke={ANA.grayStroke} strokeWidth="0.8" />
    <line x1="10" y1="62" x2="102" y2="62" stroke={ANA.grayStroke} strokeWidth="0.6" strokeDasharray="4 3" />

    {/* Fixed pallet 5×8 grid — right side, large */}
    <g transform="translate(118, 18)" filter="url(#ch2-sh)">
      <rect x="-4" y="-4" width="118" height="98" rx="8" fill="#fff" stroke={ANA.navy} strokeWidth="1.5" />
      {Array.from({ length: 5 }).map((_, t) =>
        Array.from({ length: 8 }).map((__, k) => (
          <rect
            key={`${t}-${k}`}
            className={`ch2-ana-cell ch2-ana-cell-${k}`}
            x={k * 13 + 2}
            y={t * 17 + 2}
            width={11}
            height={14}
            rx={2}
            fill={ANA.gray}
            stroke={ANA.grayStroke}
            strokeWidth="0.5"
          />
        ))
      )}
    </g>

    {/* Cargo set A — manipulation tokens */}
    <g className="ch2-ana-cargo ch2-ana-cargo-0">
      <g className="ch2-ana-token ch2-ana-t0">
        <rect x="8" y="22" width="14" height="22" rx="3" fill={ANA.navy} opacity="0.85" />
      </g>
      <g className="ch2-ana-token ch2-ana-t1">
        <path d="M30 28 L38 22 L46 28 L46 40 L30 40 Z" fill={ANA.green} opacity="0.9" />
      </g>
      <g className="ch2-ana-token ch2-ana-t2">
        <circle cx="62" cy="32" r="10" fill="none" stroke={ANA.amber} strokeWidth="2.5" />
        <circle cx="62" cy="32" r="4" fill={ANA.amber} />
      </g>
      <path className="ch2-ana-route" d="M16 44 Q60 50 130 52" fill="none" stroke={ANA.green} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    </g>

    {/* Cargo set B — navigation waypoints */}
    <g className="ch2-ana-cargo ch2-ana-cargo-1">
      <g className="ch2-ana-token ch2-ana-t0">
        <path d="M14 24 L14 38 L20 38 L20 24 Z M17 20 L17 24" fill={ANA.navy} />
        <circle cx="17" cy="18" r="4" fill={ANA.navy} />
      </g>
      <g className="ch2-ana-token ch2-ana-t1">
        <path d="M36 32 L48 26 L48 38 Z" fill={ANA.green} />
      </g>
      <g className="ch2-ana-token ch2-ana-t2">
        <path d="M58 32 A12 12 0 0 1 70 32" fill="none" stroke={ANA.amber} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path className="ch2-ana-route" d="M17 44 Q65 48 135 58" fill="none" stroke={ANA.green} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    </g>

    {/* Cargo set C — egocentric trajectory samples */}
    <g className="ch2-ana-cargo ch2-ana-cargo-2">
      <g className="ch2-ana-token ch2-ana-t0">
        <circle cx="14" cy="32" r="6" fill={ANA.navy} />
      </g>
      <g className="ch2-ana-token ch2-ana-t1">
        <circle cx="38" cy="28" r="5" fill={ANA.green} />
        <circle cx="38" cy="38" r="3" fill={ANA.green} opacity="0.6" />
      </g>
      <g className="ch2-ana-token ch2-ana-t2">
        <polyline points="54,38 62,28 70,34 78,24" fill="none" stroke={ANA.amber} strokeWidth="2" strokeLinecap="round" />
      </g>
      <path className="ch2-ana-route" d="M14 44 Q68 46 140 64" fill="none" stroke={ANA.green} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    </g>

    {/* Active column highlight per cargo */}
    <g className="ch2-ana-fill ch2-ana-fill-0" transform="translate(118, 18)">
      {[0, 1, 2, 3, 4].map((t) => (
        <rect key={t} x={2} y={t * 17 + 2} width={11} height={14} rx={2} fill={ANA.navy} opacity="0.85" />
      ))}
    </g>
    <g className="ch2-ana-fill ch2-ana-fill-1" transform="translate(118, 18)">
      {[0, 1, 2].map((t) => (
        <rect key={t} x={2} y={t * 17 + 2} width={11} height={14} rx={2} fill={ANA.green} opacity="0.85" />
      ))}
    </g>
    <g className="ch2-ana-fill ch2-ana-fill-2" transform="translate(118, 18)">
      {[0, 1, 2, 3].map((t) => (
        <rect key={t} x={2} y={t * 17 + 2} width={11} height={14} rx={2} fill={ANA.amber} opacity="0.85" />
      ))}
    </g>
  </svg>
);
export default Ch2AnalogyV2;
