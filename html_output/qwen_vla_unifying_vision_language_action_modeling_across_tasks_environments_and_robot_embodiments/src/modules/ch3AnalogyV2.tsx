import React from 'react';
import { ANA, ANA_CSS } from './analogyMotion';
import type { WidgetProps } from './registry';

/** §3 — fixed driver, morphing vehicle + instruction card scan */
export const Ch3AnalogyV2: React.FC<WidgetProps> = () => (
  <svg
    viewBox="0 0 244 130"
    className={`analogy-anim ch3-ana-svg ${ANA_CSS.stage}`}
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    aria-hidden="true"
  >
    <defs>
      <filter id="ch3-sh"><feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.12" /></filter>
      <clipPath id="ch3-scan-clip">
        <rect className="ch3-ana-scan-rect" x="168" y="8" width="64" height="44" />
      </clipPath>
    </defs>

    {/* Driver — always visible, center-left, large */}
    <g className="ch3-ana-driver" filter="url(#ch3-sh)">
      <circle cx="52" cy="62" r="16" fill={ANA.navy} />
      <path d="M36 98 Q52 78 68 98" fill={ANA.navy} opacity="0.92" />
      <circle cx="46" cy="58" r="2" fill="#fff" opacity="0.8" />
      <circle cx="58" cy="58" r="2" fill="#fff" opacity="0.8" />
    </g>

    {/* Instruction card — symbols only */}
    <g className="ch3-ana-card" filter="url(#ch3-sh)">
      <rect x="168" y="8" width="64" height="44" rx="8" fill="#fef3c7" stroke={ANA.amber} strokeWidth="1.2" />
      <circle cx="188" cy="24" r="8" fill="none" stroke={ANA.navy} strokeWidth="1.8" />
      <circle cx="188" cy="24" r="2.5" fill={ANA.navy} />
      <path d="M184 20 h8 M184 28 h8 M180 24 h4 M192 24 h4" stroke={ANA.navy} strokeWidth="1" opacity="0.6" />
      <rect x="206" y="18" width="16" height="12" rx="3" fill="none" stroke={ANA.navy} strokeWidth="1.2" />
      <path d="M210 26 L214 22 L218 26" fill="none" stroke={ANA.green} strokeWidth="1.5" />
      <path d="M184 38 h24 M188 34 v8 M204 34 v8" stroke={ANA.green} strokeWidth="1.5" strokeLinecap="round" />
      <line className="ch3-ana-scanline" x1="168" y1="20" x2="232" y2="20" stroke={ANA.amber} strokeWidth="2" opacity="0.8" />
    </g>

    {/* Vehicle slot */}
    <rect x="148" y="72" width="80" height="48" rx="8" fill={ANA.softBg} stroke={ANA.grayStroke} strokeWidth="1" strokeDasharray="4 3" />

    {/* Sedan */}
    <g className="ch3-ana-veh ch3-ana-veh-sedan" filter="url(#ch3-sh)">
      <rect x="158" y="92" width="60" height="14" rx="4" fill={ANA.navy} />
      <path d="M166 92 L174 78 H202 L210 92" fill="#5a7099" />
      <circle cx="170" cy="106" r="6" fill="#1a3050" />
      <circle cx="206" cy="106" r="6" fill="#1a3050" />
    </g>
    {/* Truck */}
    <g className="ch3-ana-veh ch3-ana-veh-truck" filter="url(#ch3-sh)">
      <rect x="154" y="88" width="28" height="20" rx="3" fill={ANA.navy} />
      <rect x="182" y="94" width="40" height="14" rx="2" fill="#5a7099" />
      <circle cx="166" cy="108" r="6" fill="#1a3050" />
      <circle cx="206" cy="108" r="6" fill="#1a3050" />
    </g>
    {/* Moto */}
    <g className="ch3-ana-veh ch3-ana-veh-moto" filter="url(#ch3-sh)">
      <circle cx="168" cy="106" r="8" fill="#1a3050" stroke={ANA.navy} strokeWidth="2" />
      <circle cx="208" cy="106" r="8" fill="#1a3050" stroke={ANA.navy} strokeWidth="2" />
      <path d="M168 98 L188 82 L208 98" fill="none" stroke={ANA.navy} strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Read connection */}
    <path className="ch3-ana-read" d="M68 62 Q118 40 168 30" fill="none" stroke={ANA.amber} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
  </svg>
);
export default Ch3AnalogyV2;
