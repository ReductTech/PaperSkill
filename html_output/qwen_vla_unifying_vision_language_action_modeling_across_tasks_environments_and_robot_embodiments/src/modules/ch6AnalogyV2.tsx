import React from 'react';
import { ANA, ANA_CSS } from './analogyMotion';
import type { WidgetProps } from './registry';

/** §6 — one student, multiple exams, score bars grow */
export const Ch6AnalogyV2: React.FC<WidgetProps> = () => (
  <svg
    viewBox="0 0 244 130"
    className={`analogy-anim ch6-ana-svg ${ANA_CSS.stage}`}
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    aria-hidden="true"
  >
    <defs>
      <filter id="ch6-sh"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" /></filter>
    </defs>

    {/* Fixed student / generalist */}
    <g className="ch6-ana-student" filter="url(#ch6-sh)">
      <circle cx="62" cy="58" r="18" fill={ANA.navy} />
      <path d="M44 98 Q62 76 80 98" fill={ANA.navy} opacity="0.92" />
      <rect x="52" y="48" width="20" height="6" rx="2" fill="#fff" opacity="0.25" />
    </g>

    {/* Exam cards fly in */}
    <g className="ch6-ana-exam ch6-ana-exam-0" filter="url(#ch6-sh)">
      <rect x="0" y="0" width="36" height="28" rx="5" fill={ANA.softBg} stroke={ANA.navy} strokeWidth="1" />
      <path d="M10 18 L14 10 L18 18" fill="none" stroke={ANA.navy} strokeWidth="1.8" />
      <circle cx="14" cy="10" r="3" fill={ANA.navy} />
    </g>
    <g className="ch6-ana-exam ch6-ana-exam-1" filter="url(#ch6-sh)">
      <rect x="0" y="0" width="36" height="28" rx="5" fill={ANA.softBg} stroke={ANA.navy} strokeWidth="1" />
      <path d="M8 16 L14 10 L20 16" fill="none" stroke={ANA.navy} strokeWidth="1.5" />
      <path d="M22 16 L28 10 L34 16" fill="none" stroke={ANA.navy} strokeWidth="1.5" />
    </g>
    <g className="ch6-ana-exam ch6-ana-exam-2" filter="url(#ch6-sh)">
      <rect x="0" y="0" width="36" height="28" rx="5" fill={ANA.softBg} stroke={ANA.navy} strokeWidth="1" />
      <circle cx="12" cy="18" r="3" fill={ANA.navy} />
      <path d="M18 18 L26 12 L34 18" fill="none" stroke={ANA.green} strokeWidth="1.5" />
    </g>
    <g className="ch6-ana-exam ch6-ana-exam-3" filter="url(#ch6-sh)">
      <rect x="0" y="0" width="36" height="28" rx="5" fill={ANA.softBg} stroke={ANA.navy} strokeWidth="1" />
      <circle cx="18" cy="14" r="6" fill="none" stroke={ANA.amber} strokeWidth="1.5" />
      <circle cx="18" cy="14" r="2" fill={ANA.amber} />
    </g>

    {/* Score bars — right side */}
    <g transform="translate(148, 24)" className="ch6-ana-scores">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0, ${i * 22})`}>
          <rect x="0" y="0" width="80" height="10" rx="3" fill={ANA.gray} />
          <rect
            className={`ch6-ana-bar ch6-ana-bar-${i}`}
            x="0"
            y="0"
            width="0"
            height="10"
            rx="3"
            fill={i % 2 === 0 ? ANA.green : ANA.navy}
          />
        </g>
      ))}
    </g>
  </svg>
);
export default Ch6AnalogyV2;
