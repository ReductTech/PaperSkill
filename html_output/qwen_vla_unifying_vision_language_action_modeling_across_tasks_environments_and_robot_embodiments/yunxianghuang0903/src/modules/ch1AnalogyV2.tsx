import React from 'react';
import { ANA } from './analogyMotion';
import type { WidgetProps } from './registry';

const ROWS = [28, 65, 102];
const COLORS = [ANA.amber, ANA.navy, ANA.green];
const LABELS = ['操纵', '导航', '人体动作'];

/** §1 — 三套专用策略收束为一个共享 Qwen-VLA。纯自动类比动画。 */
export const Ch1AnalogyV2: React.FC<WidgetProps> = () => (
  <svg
    viewBox="0 0 244 130"
    className="analogy-anim ch1a3"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    aria-hidden="true"
  >
    <defs>
      <filter id="ch1a3Glow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <marker id="ch1a3Arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill={ANA.navy} opacity=".72" />
      </marker>
    </defs>

    {/* Three task sources. */}
    {ROWS.map((y, i) => (
      <g key={`src-${i}`}>
        <rect x="7" y={y - 11} width="34" height="22" rx="6" fill="#fff" stroke="#cbd5e1" strokeWidth="1.1" />
        {i === 0 ? <path d={`M15 ${y + 3} L22 ${y - 5} L29 ${y + 3}`} fill="none" stroke={COLORS[i]} strokeWidth="2" strokeLinecap="round" /> : null}
        {i === 1 ? <><rect x="14" y={y - 3} width="19" height="7" rx="2" fill={COLORS[i]} opacity=".85" /><circle cx="18" cy={y + 5} r="2" fill={COLORS[i]} /><circle cx="29" cy={y + 5} r="2" fill={COLORS[i]} /></> : null}
        {i === 2 ? <><circle cx="24" cy={y - 4} r="3.5" fill="none" stroke={COLORS[i]} strokeWidth="1.6" /><path d={`M24 ${y} L24 ${y + 7} M18 ${y + 3} L30 ${y + 3}`} stroke={COLORS[i]} strokeWidth="1.6" /></> : null}
        <text x="48" y={y + 3.5} fontSize="9" fontWeight="700" fill={ANA.navy}>{LABELS[i]}</text>
      </g>
    ))}

    {/* Specialist lanes dominate the first half of the loop. */}
    <g>
      <animate attributeName="opacity" values="1;1;.12;.12;1" keyTimes="0;.36;.50;.88;1" dur="5.2s" repeatCount="indefinite" />
      {ROWS.map((y, i) => (
        <g key={`sp-${i}`}>
          <path d={`M78 ${y} L187 ${y}`} fill="none" stroke={COLORS[i]} strokeWidth="1.4" opacity=".38" markerEnd="url(#ch1a3Arrow)" />
          <circle cx="116" cy={y} r="11" fill="#fff" stroke={COLORS[i]} strokeWidth="1.8" />
          <circle cx="116" cy={y} r="3.5" fill={COLORS[i]} opacity=".75" />
          <circle r="2.7" fill={COLORS[i]}>
            <animateMotion dur="1.45s" begin={`${i * .18}s`} repeatCount="indefinite" path={`M78 ${y} L187 ${y}`} />
          </circle>
        </g>
      ))}
    </g>

    {/* Specialist cores physically converge. */}
    {ROWS.map((y, i) => (
      <circle key={`fly-${i}`} cx="116" cy={y} r="8.5" fill={COLORS[i]} opacity="0" filter="url(#ch1a3Glow)">
        <animate attributeName="opacity" values="0;0;.9;.9;0;0" keyTimes="0;.34;.40;.55;.62;1" dur="5.2s" repeatCount="indefinite" />
        <animate attributeName="cx" values="116;116;151;151;151" keyTimes="0;.34;.55;.88;1" dur="5.2s" repeatCount="indefinite" />
        <animate attributeName="cy" values={`${y};${y};65;65;65`} keyTimes="0;.34;.55;.88;1" dur="5.2s" repeatCount="indefinite" />
      </circle>
    ))}

    {/* Unified shared core + rewired outputs. */}
    <g opacity="0">
      <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.50;.62;.90;1" dur="5.2s" repeatCount="indefinite" />
      <circle cx="151" cy="65" r="24" fill={ANA.navy} opacity=".10" filter="url(#ch1a3Glow)" />
      <circle cx="151" cy="65" r="19" fill="#fff" stroke={ANA.navy} strokeWidth="2.2" />
      <circle cx="151" cy="65" r="13" fill={ANA.navy} opacity=".93" />
      <text x="151" y="62.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">Qwen</text>
      <text x="151" y="72" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff">VLA</text>

      {ROWS.map((y, i) => (
        <g key={`unified-${i}`}>
          <path d={`M78 ${y} Q116 ${y} 132 65`} fill="none" stroke={COLORS[i]} strokeWidth="1.6" opacity=".72" />
          <path d={`M170 65 Q192 ${y} 219 ${y}`} fill="none" stroke={COLORS[i]} strokeWidth="1.6" opacity=".72" markerEnd="url(#ch1a3Arrow)" />
          <circle r="2.8" fill={COLORS[i]} filter="url(#ch1a3Glow)">
            <animateMotion dur="1.25s" begin={`${2.9 + i * .16}s`} repeatCount="indefinite" path={`M78 ${y} Q116 ${y} 132 65`} />
          </circle>
          <rect x="221" y={y - 6} width="16" height="12" rx="3" fill={COLORS[i]} opacity=".17" stroke={COLORS[i]} strokeWidth="1.1" />
        </g>
      ))}
    </g>
  </svg>
);

export default Ch1AnalogyV2;
