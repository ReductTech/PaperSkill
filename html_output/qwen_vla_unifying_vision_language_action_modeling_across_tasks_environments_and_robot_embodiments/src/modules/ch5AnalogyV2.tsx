import React from 'react';
import { ANA, ANA_CSS } from './analogyMotion';
import type { WidgetProps } from './registry';

/**
 * §5 analogy micro-cinema — four-stage curriculum: T2A → CPT → SFT → RL
 *
 * Important implementation detail:
 * The station position is kept on an OUTER <g transform="translate(...)" />.
 * All scale / glow animation is applied only to an INNER group.
 * This avoids CSS animation overriding the SVG transform attribute and collapsing
 * all four stations onto the same origin after the first loop.
 */
export const Ch5AnalogyV2: React.FC<WidgetProps> = () => (
  <svg
    viewBox="0 0 244 130"
    className={`analogy-anim ch5-ana-svg ${ANA_CSS.stage}`}
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    aria-hidden="true"
  >
    <defs>
      <filter id="ch5m-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.2" stdDeviation="1.5" floodColor="#34476f" floodOpacity="0.14" />
      </filter>
      <filter id="ch5m-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <marker id="ch5m-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto">
        <path d="M0 0 L5 2.5 L0 5 Z" fill={ANA.green} />
      </marker>

      <style>{`
        .ch5m-cardPulse { transform-box: fill-box; transform-origin: center; }
        .ch5m-p0 { animation: ch5mPulse 5.2s ease-in-out infinite 0s; }
        .ch5m-p1 { animation: ch5mPulse 5.2s ease-in-out infinite 1.3s; }
        .ch5m-p2 { animation: ch5mPulse 5.2s ease-in-out infinite 2.6s; }
        .ch5m-p3 { animation: ch5mPulse 5.2s ease-in-out infinite 3.9s; }

        .ch5m-runner { animation: ch5mRunner 5.2s cubic-bezier(.42,0,.2,1) infinite; }
        .ch5m-progress { stroke-dasharray: 188; stroke-dashoffset: 188; animation: ch5mProgress 5.2s ease-in-out infinite; }

        .ch5m-demo0 { animation: ch5mDemo0 5.2s ease-in-out infinite; }
        .ch5m-demo1 { animation: ch5mDemo1 5.2s ease-in-out infinite; }
        .ch5m-demo2 { animation: ch5mDemo2 5.2s ease-in-out infinite; }
        .ch5m-demo3 { animation: ch5mDemo3 5.2s ease-in-out infinite; }

        .ch5m-t2a-bead { transform-box: fill-box; transform-origin: center; animation: ch5mBead 5.2s ease-in-out infinite; }
        .ch5m-t2a-b1 { animation-delay: .10s; }
        .ch5m-t2a-b2 { animation-delay: .18s; }
        .ch5m-t2a-b3 { animation-delay: .26s; }
        .ch5m-cpt-scan { animation: ch5mScan 5.2s ease-in-out infinite 1.3s; }
        .ch5m-sft-dot { transform-box: fill-box; transform-origin: center; animation: ch5mTaskPop 5.2s ease-in-out infinite; }
        .ch5m-sft-d1 { animation-delay: 2.62s; }
        .ch5m-sft-d2 { animation-delay: 2.74s; }
        .ch5m-sft-d3 { animation-delay: 2.86s; }
        .ch5m-rl-orbit { stroke-dasharray: 36; stroke-dashoffset: 36; animation: ch5mRlOrbit 5.2s ease-in-out infinite 3.9s; }
        .ch5m-reward { transform-box: fill-box; transform-origin: center; animation: ch5mReward 5.2s ease-in-out infinite 4.12s; }

        @keyframes ch5mPulse {
          0%, 5%, 25%, 100% { transform: scale(1); filter: none; }
          9%, 18% { transform: scale(1.055); filter: url(#ch5m-glow); }
        }
        @keyframes ch5mRunner {
          0%, 6%   { transform: translate(28px, 69px); }
          21%, 31% { transform: translate(90px, 69px); }
          46%, 56% { transform: translate(152px, 69px); }
          71%, 84% { transform: translate(214px, 69px); }
          94%, 100%{ transform: translate(28px, 69px); }
        }
        @keyframes ch5mProgress {
          0%, 4% { stroke-dashoffset: 188; opacity: .25; }
          22% { stroke-dashoffset: 126; opacity: .75; }
          48% { stroke-dashoffset: 64; opacity: .8; }
          74%, 88% { stroke-dashoffset: 0; opacity: .9; }
          96%, 100% { stroke-dashoffset: 188; opacity: .2; }
        }
        @keyframes ch5mDemo0 { 0%, 5%, 23% { opacity: 1; } 29%, 100% { opacity: .16; } }
        @keyframes ch5mDemo1 { 0%, 20% { opacity: .16; } 25%, 47% { opacity: 1; } 53%, 100% { opacity: .16; } }
        @keyframes ch5mDemo2 { 0%, 45% { opacity: .16; } 50%, 72% { opacity: 1; } 78%, 100% { opacity: .16; } }
        @keyframes ch5mDemo3 { 0%, 70% { opacity: .16; } 75%, 93% { opacity: 1; } 98%, 100% { opacity: .16; } }
        @keyframes ch5mBead {
          0%, 4% { opacity: 0; transform: translateX(-7px) scale(.75); }
          9%, 20% { opacity: 1; transform: translateX(0) scale(1); }
          25%, 100% { opacity: .2; }
        }
        @keyframes ch5mScan {
          0%, 22% { opacity: 0; transform: translateX(-12px); }
          28%, 40% { opacity: .9; transform: translateX(12px); }
          46%, 100% { opacity: 0; transform: translateX(14px); }
        }
        @keyframes ch5mTaskPop {
          0%, 47% { opacity: 0; transform: translateY(5px) scale(.7); }
          53%, 68% { opacity: 1; transform: translateY(0) scale(1); }
          74%, 100% { opacity: .18; transform: translateY(0) scale(.92); }
        }
        @keyframes ch5mRlOrbit {
          0%, 72% { stroke-dashoffset: 36; opacity: 0; }
          79%, 91% { stroke-dashoffset: 0; opacity: 1; }
          97%, 100% { opacity: .18; }
        }
        @keyframes ch5mReward {
          0%, 74% { opacity: 0; transform: scale(.55); }
          81%, 89% { opacity: 1; transform: scale(1.25); }
          93%, 100% { opacity: .45; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ch5m-cardPulse, .ch5m-runner, .ch5m-progress,
          .ch5m-demo0, .ch5m-demo1, .ch5m-demo2, .ch5m-demo3,
          .ch5m-t2a-bead, .ch5m-cpt-scan, .ch5m-sft-dot,
          .ch5m-rl-orbit, .ch5m-reward { animation: none !important; }
        }
      `}</style>
    </defs>

    {/* subtle stage floor */}
    <rect x="5" y="5" width="234" height="120" rx="11" fill="rgba(255,255,255,.10)" stroke="rgba(52,71,111,.06)" />

    {/* four fixed-position station slots; animation happens only in their inner groups */}
    <g transform="translate(6 10)">
      <g className="ch5m-cardPulse ch5m-p0" filter="url(#ch5m-shadow)">
        <rect width="46" height="40" rx="7" fill="#f8fafc" stroke={ANA.navy} strokeWidth="1.15" />
        <text x="23" y="12.5" textAnchor="middle" fontSize="8.3" fontWeight="800" fill={ANA.navy}>T2A</text>
        <rect x="9" y="18" width="18" height="4" rx="2" fill={ANA.grayStroke} />
        <rect x="9" y="25" width="27" height="4" rx="2" fill={ANA.gray} />
        <circle cx="36" cy="20" r="3.1" fill={ANA.amber} />
      </g>
    </g>

    <g transform="translate(68 10)">
      <g className="ch5m-cardPulse ch5m-p1" filter="url(#ch5m-shadow)">
        <rect width="46" height="40" rx="7" fill="#f8fafc" stroke={ANA.navy} strokeWidth="1.15" />
        <text x="23" y="12.5" textAnchor="middle" fontSize="8.3" fontWeight="800" fill={ANA.navy}>CPT</text>
        <rect x="8" y="18" width="30" height="15" rx="3" fill={ANA.softBg} stroke={ANA.grayStroke} strokeWidth=".8" />
        <circle cx="23" cy="25.5" r="5.2" fill="none" stroke={ANA.green} strokeWidth="1.4" />
        <circle cx="23" cy="25.5" r="2" fill={ANA.green} />
      </g>
    </g>

    <g transform="translate(130 10)">
      <g className="ch5m-cardPulse ch5m-p2" filter="url(#ch5m-shadow)">
        <rect width="46" height="40" rx="7" fill="#f8fafc" stroke={ANA.navy} strokeWidth="1.15" />
        <text x="23" y="12.5" textAnchor="middle" fontSize="8.3" fontWeight="800" fill={ANA.navy}>SFT</text>
        <circle cx="14" cy="25" r="4.3" fill={ANA.purple} opacity=".72" />
        <circle cx="23" cy="25" r="4.3" fill={ANA.amber} opacity=".78" />
        <circle cx="32" cy="25" r="4.3" fill={ANA.green} opacity=".78" />
      </g>
    </g>

    <g transform="translate(192 10)">
      <g className="ch5m-cardPulse ch5m-p3" filter="url(#ch5m-shadow)">
        <rect width="46" height="40" rx="7" fill="#f8fafc" stroke={ANA.navy} strokeWidth="1.15" />
        <text x="23" y="12.5" textAnchor="middle" fontSize="8.3" fontWeight="800" fill={ANA.navy}>RL</text>
        <rect x="9" y="20" width="28" height="13" rx="3" fill={ANA.gray} stroke={ANA.grayStroke} strokeWidth=".8" />
        <circle cx="34" cy="19" r="3.5" fill={ANA.green} />
        <path d="M12 33 Q23 38 34 30" fill="none" stroke={ANA.green} strokeWidth="1.2" strokeDasharray="2 2" />
      </g>
    </g>

    {/* timeline: base + animated progress */}
    <line x1="28" y1="69" x2="216" y2="69" stroke="#d5dde7" strokeWidth="2.4" strokeLinecap="round" />
    <line className="ch5m-progress" x1="28" y1="69" x2="216" y2="69" stroke={ANA.green} strokeWidth="2.4" strokeLinecap="round" />
    {[28, 90, 152, 214].map((x) => (
      <circle key={x} cx={x} cy="69" r="3.6" fill="#f8fafc" stroke={ANA.navy} strokeWidth="1.15" />
    ))}

    {/* shared learner packet; starts below station labels, never clips top edge */}
    <g className="ch5m-runner" filter="url(#ch5m-shadow)">
      <circle r="7.1" fill={ANA.navy} />
      <circle r="3.2" fill={ANA.green} />
      <circle r="1.35" fill="#fff" opacity=".9" />
    </g>

    {/* compact mechanism strip — each phase has its own reserved slot, so nothing can pile up */}
    <g transform="translate(7 84)">
      <g className="ch5m-demo0">
        <text x="0" y="9" fontSize="6.5" fontWeight="700" fill={ANA.navy}>文本→动作先验</text>
        <rect x="0" y="15" width="22" height="12" rx="3" fill={ANA.softBg} stroke={ANA.grayStroke} strokeWidth=".7" />
        <rect x="4" y="18" width="13" height="2.4" rx="1" fill={ANA.navy} opacity=".65" />
        <rect x="4" y="22" width="10" height="2.4" rx="1" fill={ANA.navy} opacity=".45" />
        <path d="M24 21 H31" stroke={ANA.green} strokeWidth="1" markerEnd="url(#ch5m-arrow)" />
        <circle className="ch5m-t2a-bead ch5m-t2a-b1" cx="35" cy="18" r="2" fill={ANA.green} />
        <circle className="ch5m-t2a-bead ch5m-t2a-b2" cx="40" cy="21" r="2" fill={ANA.green} />
        <circle className="ch5m-t2a-bead ch5m-t2a-b3" cx="45" cy="24" r="2" fill={ANA.green} />
      </g>

      <g className="ch5m-demo1" transform="translate(62 0)">
        <text x="0" y="9" fontSize="6.5" fontWeight="700" fill={ANA.navy}>视觉落地</text>
        <rect x="0" y="15" width="43" height="13" rx="3" fill={ANA.softBg} stroke={ANA.grayStroke} strokeWidth=".7" />
        <path d="M5 25 L14 18 L21 23 L29 17 L38 24" fill="none" stroke={ANA.green} strokeWidth="1.1" />
        <line className="ch5m-cpt-scan" x1="20" y1="15" x2="20" y2="28" stroke={ANA.amber} strokeWidth="1.3" />
      </g>

      <g className="ch5m-demo2" transform="translate(124 0)">
        <text x="0" y="9" fontSize="6.5" fontWeight="700" fill={ANA.navy}>多任务专精</text>
        <path d="M22 24 L22 17 M22 24 L10 28 M22 24 L34 28" stroke={ANA.grayStroke} strokeWidth="1" />
        <circle className="ch5m-sft-dot ch5m-sft-d1" cx="22" cy="16" r="3.5" fill={ANA.green} />
        <circle className="ch5m-sft-dot ch5m-sft-d2" cx="9" cy="28" r="3.5" fill={ANA.purple} />
        <circle className="ch5m-sft-dot ch5m-sft-d3" cx="35" cy="28" r="3.5" fill={ANA.amber} />
      </g>

      <g className="ch5m-demo3" transform="translate(186 0)">
        <text x="0" y="9" fontSize="6.5" fontWeight="700" fill={ANA.navy}>闭环成功</text>
        <circle cx="18" cy="22" r="9" fill="#eef5ef" stroke={ANA.grayStroke} strokeWidth=".8" />
        <path className="ch5m-rl-orbit" d="M10 22 A8 8 0 1 1 18 30" fill="none" stroke={ANA.green} strokeWidth="1.5" markerEnd="url(#ch5m-arrow)" />
        <circle className="ch5m-reward" cx="18" cy="22" r="3.2" fill={ANA.amber} />
      </g>
    </g>

    <text x="122" y="124" textAnchor="middle" fontSize="6.2" fill="#7b8798">
      同一核心沿 T2A → CPT → SFT → RL 逐阶段获得动作先验、视觉落地、任务专精与闭环优化
    </text>
  </svg>
);

export default Ch5AnalogyV2;
