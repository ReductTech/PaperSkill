import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

const smears = Array.from({ length: 13 }, (_, index) => ({
  x: 174 + (index % 5) * 53,
  y: 112 + Math.floor(index / 5) * 62,
  angle: -24 + index * 9,
}));

export function RpCoverOld() {
  const { progress } = useCoverPlayback();
  const pressure = Math.min(1, progress * 1.25);
  const fade = Math.max(0, Math.min(1, (progress - 0.55) / 0.45));
  const padX = 44 + progress * 338;
  const padY = 94 + Math.sin(progress * Math.PI) * 18;

  return (
    <div className="rp-cover-widget rp-cover-old-widget" style={{ width: 664, height: 324 }}>
      <svg viewBox="0 0 664 324" role="img" aria-label="原始特征分类在压力下覆盖旧标签">
        <rect width="664" height="324" rx="14" className="rp-cover-bg" />
        <rect x="28" y="22" width="608" height="280" rx="10" className="rp-cover-desk" />
        <rect x="52" y="40" width="560" height="244" rx="8" className="rp-cover-page" />
        <line x1="76" y1="78" x2="588" y2="78" className="rp-cover-rule" />
        <text x="76" y="65" className="rp-cover-page-title">原始特征页</text>
        <text x="520" y="65" className="rp-cover-small">共享分类器</text>

        {[0, 1, 2].map((row) => (
          <g key={row}>
            <rect x="82" y={98 + row * 58} width="118" height="38" rx="6" className="rp-cover-label-card" />
            <text x="141" y={123 + row * 58} textAnchor="middle" className="rp-cover-label-text">
              {['旧类别 A', '旧类别 B', '旧类别 C'][row]}
            </text>
          </g>
        ))}

        <g opacity={Math.max(0.18, 1 - fade * 0.72)}>
          {[0, 1, 2].map((row) => (
            <path
              key={row}
              d={`M286 ${112 + row * 52} C342 ${84 + row * 55}, 419 ${145 + row * 42}, 500 ${112 + row * 52}`}
              className="rp-cover-shared-path"
            />
          ))}
          <rect x="432" y="84" width="126" height="142" rx="8" className="rp-cover-classifier" />
          <text x="495" y="158" textAnchor="middle" className="rp-cover-classifier-text">共享分类器</text>
        </g>

        <g opacity={Math.min(1, 0.15 + pressure * 0.85)}>
          {smears.map((smear, index) => (
            <ellipse
              key={index}
              cx={smear.x + fade * 16}
              cy={smear.y + fade * 5}
              rx={22 + pressure * 35 + fade * 18}
              ry={7 + pressure * 5}
              transform={`rotate(${smear.angle} ${smear.x} ${smear.y})`}
              className="rp-cover-smear"
              opacity={0.24 + pressure * 0.55}
            />
          ))}
        </g>

        <g transform={`translate(${padX} ${padY})`} className="rp-cover-old-pad">
          <rect x="-36" y="-22" width="72" height="48" rx="16" />
          <path d="M-22,0 H20" />
          <circle cx="36" cy="2" r="14" className="rp-cover-old-pad-handle" />
        </g>

        <g opacity={fade}>
          <rect x="272" y="246" width="151" height="34" rx="8" className="rp-cover-failure-band" />
          <text x="347" y="268" textAnchor="middle" className="rp-cover-failure-text">旧标签被覆盖</text>
        </g>
        <text x="588" y="292" textAnchor="end" className="rp-cover-footnote">压力升高 · 记忆模糊</text>
      </svg>
    </div>
  );
}
