import React from 'react';

// Cover widgets for the two Hero cards. They are deliberately schematic: the point is the
// shape of the claim, not a number. Every figure behind them lives on the chapter screens.

const CORAL = '#993C1D';
const BLUE = '#185FA5';
const TEAL = '#0F6E56';
const INK = '#21324a';
const MUTED = '#8b97ab';
const LINE = '#d7deea';

/** "One scalar" retrieval: every candidate is equally close, so the ranking is decided by topic. */
export const HeroTopicSimilarity: React.FC = () => (
  <svg className="hw-svg" viewBox="0 0 320 176" role="img" aria-label="一个向量：五个候选同样相似，分不出动作">
    <rect x="6" y="66" width="66" height="40" rx="6" fill="#eef3fb" stroke={INK} strokeWidth="1" />
    <text x="39" y="84" textAnchor="middle" fontSize="11" fill={INK}>
      查询句 q
    </text>
    <text x="39" y="98" textAnchor="middle" fontSize="9" fill={MUTED}>
      一个向量
    </text>

    {[10, 42, 74, 106].map((y, i) => (
      <g key={i}>
        <path d={`M72 86 C 92 86, 96 ${y + 11}, 116 ${y + 11}`} fill="none" stroke={LINE} strokeWidth="1" />
        <rect x="116" y={y} width="150" height="22" rx="4" fill="#f6f8fc" stroke={LINE} strokeWidth="1" />
        <rect x="122" y={y + 8} width={104 - i * 2} height="6" rx="3" fill={MUTED} opacity="0.55" />
        <text x="276" y={y + 15} fontSize="9" fill={MUTED}>
          0.{84 - i}
        </text>
      </g>
    ))}

    <text x="116" y="156" fontSize="9.5" fill={CORAL}>
      候选一样近 —— 分不出动作
    </text>
    <text x="116" y="170" fontSize="9.5" fill={CORAL}>
      只有其中一句是你要的那一步
    </text>
  </svg>
);

/** Typed retrieval: the same query, one lane per ideation operation, plus one distractor. */
export const HeroTypedMoves: React.FC = () => (
  <svg className="hw-svg" viewBox="0 0 320 176" role="img" aria-label="按动作检索：三条通道各自接住一句，干扰句落空">
    <rect x="6" y="66" width="66" height="40" rx="6" fill="#eef3fb" stroke={INK} strokeWidth="1" />
    <text x="39" y="84" textAnchor="middle" fontSize="11" fill={INK}>
      查询句 q
    </text>
    <text x="39" y="98" textAnchor="middle" fontSize="9" fill={MUTED}>
      加一个动作 r
    </text>

    {[
      { y: 8, color: BLUE, label: 'Broaden', w: 86 },
      { y: 50, color: CORAL, label: 'Address', w: 128 },
      { y: 92, color: TEAL, label: 'Specify', w: 108 },
    ].map((r) => (
      <g key={r.label}>
        <path
          d={`M72 86 C 100 86, 104 ${r.y + 16}, 132 ${r.y + 16}`}
          fill="none"
          stroke={r.color}
          strokeWidth="1.2"
          opacity="0.7"
        />
        <rect x="132" y={r.y} width={r.w} height="32" rx="5" fill={r.color} opacity="0.12" />
        <rect x="132" y={r.y} width="3" height="32" fill={r.color} />
        <text x="141" y={r.y + 14} fontSize="9.5" fill={r.color}>
          {r.label}
        </text>
        <rect x="141" y={r.y + 20} width={r.w - 22} height="4" rx="2" fill={r.color} opacity="0.4" />
      </g>
    ))}

    <g opacity="0.75">
      <path d="M72 86 C 100 86, 104 146, 132 146" fill="none" stroke={MUTED} strokeWidth="1" strokeDasharray="2 3" />
      <rect x="132" y="134" width="104" height="26" rx="5" fill="none" stroke={MUTED} strokeWidth="1" strokeDasharray="3 3" />
      <text x="141" y="151" fontSize="9" fill={MUTED}>
        主题像 · 动作不对
      </text>
    </g>

    <text x="132" y="172" fontSize="9.5" fill={INK}>
      三个动作各接一句，干扰句落空
    </text>
  </svg>
);
