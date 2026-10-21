import React from 'react';
import type { WidgetProps } from './registry';

// Cover widgets for the Hero contrast cards (arXiv 2601.08901).
// Pure SVG + CSS animations — no canvas, no rAF lifecycle, safe to mount/unmount.

const CProblem = '#185FA5';
const CMethod = '#534AB7';
const CFinding = '#0F6E56';
const CGhost = '#9AA5B1';

/** 传统方法卡：三路输入被压成一根无差别向量（静态 + 轻微呼吸动画） */
export const HeroSingleVector: React.FC<WidgetProps> = () => (
  <svg className="hw-svg" viewBox="0 0 360 150" role="img" aria-label="传统方法：整篇论文压缩为一个向量">
    <rect x="0" y="0" width="360" height="150" fill="transparent" />
    {/* 三路来源 */}
    <g fontSize="10.5" fill="#5b6472">
      <rect x="18" y="16" width="78" height="24" rx="6" fill="#eef1f5" stroke="#c9d1dc" strokeWidth=".8" />
      <text x="57" y="31" textAnchor="middle">标题</text>
      <rect x="18" y="63" width="78" height="24" rx="6" fill="#eef1f5" stroke="#c9d1dc" strokeWidth=".8" />
      <text x="57" y="78" textAnchor="middle">摘要</text>
      <rect x="18" y="110" width="78" height="24" rx="6" fill="#eef1f5" stroke="#c9d1dc" strokeWidth=".8" />
      <text x="57" y="125" textAnchor="middle">正文</text>
    </g>
    {/* 汇聚箭头 */}
    <g stroke={CGhost} strokeWidth="1" fill="none" opacity=".9">
      <path d="M100 28 C 132 28, 140 68, 168 74" />
      <path d="M100 75 H 164" />
      <path d="M100 122 C 132 122, 140 82, 168 76" />
    </g>
    <path d="M168 75 l-6 -3.2 v6.4 z" fill={CGhost} />
    {/* 单一无差别向量 */}
    <g className="hw-breathe">
      <rect x="176" y="55" width="150" height="40" rx="9" fill="#e4e8ee" stroke="#aab4c2" strokeWidth="1" />
      <g stroke="#aab4c2" strokeWidth="1" opacity=".75">
        <path d="M206 61 v28" /><path d="M236 61 v28" /><path d="M266 61 v28" /><path d="M296 61 v28" />
      </g>
      <text x="251" y="79" textAnchor="middle" fontSize="12" fontWeight="600" fill="#414b59">1 个向量</text>
    </g>
    <text x="251" y="118" textAnchor="middle" fontSize="10.5" fill="#8a93a1">像在哪？无从分辨</text>
  </svg>
);

/** 本文方法卡：单点 → 三叉分解（三色，依次点亮循环） */
export const HeroDecompose: React.FC<WidgetProps> = () => (
  <svg className="hw-svg" viewBox="0 0 360 150" role="img" aria-label="本文方法：分解为三个子空间向量">
    <rect x="0" y="0" width="360" height="150" fill="transparent" />
    {/* 论文单点 */}
    <rect x="14" y="56" width="72" height="38" rx="8" fill="#eef1f5" stroke="#c9d1dc" strokeWidth=".9" />
    <text x="50" y="72" textAnchor="middle" fontSize="12" fontWeight="600" fill="#414b59">论文</text>
    <text x="50" y="87" textAnchor="middle" fontSize="10" fill="#8a93a1">1 个向量</text>
    {/* 分解箭头 */}
    <text x="112" y="62" textAnchor="middle" fontSize="10" fill="#8a93a1">分解</text>
    <path d="M90 75 H 130" stroke={CGhost} strokeWidth="1.1" fill="none" />
    <path d="M134 75 l-6 -3.2 v6.4 z" fill={CGhost} />
    <g stroke={CGhost} strokeWidth=".9" fill="none" opacity=".95">
      <path d="M134 75 L 162 27" />
      <path d="M134 75 H 162" />
      <path d="M134 75 L 162 123" />
    </g>
    {/* 三个子空间 */}
    <g fontSize="11.5">
      <g className="hw-fork hw-f1">
        <rect x="168" y="10" width="172" height="34" rx="8" fill="#fff" stroke={CProblem} strokeWidth="1.2" />
        <circle cx="184" cy="27" r="4.5" fill={CProblem} />
        <text x="196" y="31" fill="#2c3542" fontWeight="600">问题 <tspan fill={CProblem}>E_problem</tspan></text>
      </g>
      <g className="hw-fork hw-f2">
        <rect x="168" y="58" width="172" height="34" rx="8" fill="#fff" stroke={CMethod} strokeWidth="1.2" />
        <circle cx="184" cy="75" r="4.5" fill={CMethod} />
        <text x="196" y="79" fill="#2c3542" fontWeight="600">方法 <tspan fill={CMethod}>E_method</tspan></text>
      </g>
      <g className="hw-fork hw-f3">
        <rect x="168" y="106" width="172" height="34" rx="8" fill="#fff" stroke={CFinding} strokeWidth="1.2" />
        <circle cx="184" cy="123" r="4.5" fill={CFinding} />
        <text x="196" y="127" fill="#2c3542" fontWeight="600">发现 <tspan fill={CFinding}>E_findings</tspan></text>
      </g>
    </g>
  </svg>
);
