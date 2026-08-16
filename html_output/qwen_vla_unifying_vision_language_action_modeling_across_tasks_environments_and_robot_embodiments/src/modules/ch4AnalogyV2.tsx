import React from 'react';
import { ANA, ANA_CSS } from './analogyMotion';
import type { WidgetProps } from './registry';

/** §4 — VLM → DiT → smooth action micro cinema */
export const Ch4AnalogyV2: React.FC<WidgetProps> = () => (
  <svg
    viewBox="0 0 244 130"
    className={`analogy-anim ch4-ana-svg ${ANA_CSS.stage}`}
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    aria-hidden="true"
  >
    <defs>
      <filter id="ch4-sh"><feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.12" /></filter>
      <linearGradient id="ch4-vlm-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a5f8a" />
        <stop offset="100%" stopColor={ANA.navy} />
      </linearGradient>
    </defs>

    {/* Inputs: eye + speech bubble */}
    <g className="ch4-ana-input">
      <g className="ch4-ana-eye">
        <ellipse cx="22" cy="22" rx="14" ry="10" fill="none" stroke={ANA.navy} strokeWidth="1.5" />
        <circle cx="22" cy="22" r="4" fill={ANA.navy} />
      </g>
      <g className="ch4-ana-bubble" transform="translate(42, 10)">
        <rect width="36" height="24" rx="6" fill={ANA.softBg} stroke={ANA.navy} strokeWidth="1" />
        <path d="M4 12 H32 M4 18 H24" stroke="#68778f" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* Token dots morphing from inputs */}
      <circle className="ch4-ana-imgtok ch4-ana-it0" cx="22" cy="38" r="3" fill={ANA.amber} opacity="0" />
      <circle className="ch4-ana-imgtok ch4-ana-it1" cx="28" cy="40" r="3" fill={ANA.amber} opacity="0" />
      <circle className="ch4-ana-langtok ch4-ana-lt0" cx="52" cy="38" r="3" fill={ANA.green} opacity="0" />
      <circle className="ch4-ana-langtok ch4-ana-lt1" cx="58" cy="40" r="3" fill={ANA.green} opacity="0" />
    </g>

    {/* VLM — layered brain, not plain rect */}
    <g className="ch4-ana-vlm" filter="url(#ch4-sh)">
      <rect x="8" y="48" width="72" height="52" rx="12" fill="url(#ch4-vlm-grad)" />
      <text x="44" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">VLM</text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${16 + i * 4}, ${68 + i * 6})`}>
          <rect width="48" height="6" rx="2" fill="#fff" opacity={0.15 + i * 0.08} />
          <circle cx="8" cy="3" r="2" fill={ANA.amber} className={`ch4-ana-vtok ch4-ana-vtok-${i}`} />
          <circle cx="20" cy="3" r="2" fill={ANA.green} className={`ch4-ana-vtok ch4-ana-vtok-${i}`} />
          <circle cx="32" cy="3" r="2" fill="#fff" opacity="0.6" className={`ch4-ana-vtok ch4-ana-vtok-${i}`} />
        </g>
      ))}
    </g>

    {/* Hidden state particles → DiT */}
    <circle className="ch4-ana-dot ch4-ana-dot-0" cx="88" cy="58" r="4" fill={ANA.amber} opacity="0" />
    <circle className="ch4-ana-dot ch4-ana-dot-1" cx="96" cy="66" r="4" fill={ANA.amber} opacity="0" />
    <circle className="ch4-ana-dot ch4-ana-dot-2" cx="104" cy="74" r="4" fill={ANA.amber} opacity="0" />
    <circle className="ch4-ana-dot ch4-ana-dot-3" cx="112" cy="82" r="4" fill={ANA.amber} opacity="0" />
    <path className="ch4-ana-flowpath" d="M80 70 Q100 70 118 72" fill="none" stroke={ANA.amber} strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />

    {/* DiT — block stack */}
    <g className="ch4-ana-dit" filter="url(#ch4-sh)">
      <rect x="118" y="48" width="58" height="52" rx="10" fill={ANA.green} />
      <text x="147" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">DiT</text>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          className={`ch4-ana-block ch4-ana-block-${i}`}
          x={126}
          y={66 + i * 8}
          width={42}
          height={6}
          rx={2}
          fill="#fff"
          opacity={0.2 + i * 0.05}
        />
      ))}
    </g>

    {/* Noise particles rising into DiT */}
    <circle className="ch4-ana-noise ch4-ana-noise-0" cx="130" cy="108" r="3" fill={ANA.grayStroke} opacity="0" />
    <circle className="ch4-ana-noise ch4-ana-noise-1" cx="142" cy="112" r="3" fill={ANA.grayStroke} opacity="0" />
    <circle className="ch4-ana-noise ch4-ana-noise-2" cx="154" cy="106" r="3" fill={ANA.grayStroke} opacity="0" />

    {/* Output: noisy → smooth trajectory */}
    <path
      className="ch4-ana-traj-noisy"
      d="M182 90 C 196 88, 204 82, 210 74"
      fill="none"
      stroke={ANA.grayStroke}
      strokeWidth="1.5"
      strokeDasharray="2 2"
      opacity="0.5"
    />
    <path
      className="ch4-ana-traj"
      d="M182 90 C 198 86, 214 72, 232 52"
      fill="none"
      stroke={ANA.navy}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle className="ch4-ana-eef" cx="232" cy="52" r="6" fill={ANA.amber} stroke={ANA.navy} strokeWidth="1.2" />
  </svg>
);
export default Ch4AnalogyV2;
