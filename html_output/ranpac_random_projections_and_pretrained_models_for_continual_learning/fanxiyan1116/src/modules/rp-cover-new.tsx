import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

const fixedHoles = Array.from({ length: 32 }, (_, index) => ({
  x: 94 + (index % 8) * 42 + ((index * 7) % 9),
  y: 92 + Math.floor(index / 8) * 45 + ((index * 5) % 7),
  r: 5 + (index % 4),
  angle: index * 17,
}));

export function RpCoverNew() {
  const { progress } = useCoverPlayback();
  const rawId = React.useId();
  const revealId = `rp-cover-reveal-${rawId.replace(/:/g, '')}`;
  const revealWidth = 18 + progress * 390;
  const ledgerFill = Math.min(1, Math.max(0, (progress - 0.38) / 0.42));
  const finalLabel = Math.max(0, Math.min(1, (progress - 0.62) / 0.3));
  const padX = 70 + progress * 338;
  const padY = 215 - Math.sin(progress * Math.PI) * 30;

  return (
    <div className="rp-cover-widget rp-cover-new-widget" style={{ width: 664, height: 324 }}>
      <svg viewBox="0 0 664 324" role="img" aria-label="固定随机板把相关印记分离并写入累计账本">
        <defs>
          <clipPath id={revealId}>
            <rect x="68" y="82" width={revealWidth} height="160" rx="7" />
          </clipPath>
        </defs>
        <rect width="664" height="324" rx="14" className="rp-cover-bg" />
        <rect x="28" y="22" width="608" height="280" rx="10" className="rp-cover-desk" />
        <rect x="52" y="40" width="560" height="244" rx="8" className="rp-cover-page" />
        <line x1="76" y1="78" x2="588" y2="78" className="rp-cover-rule" />

        <g clipPath={`url(#${revealId})`}>
          <rect x="68" y="82" width="394" height="160" rx="7" className="rp-cover-plate-field" />
          {fixedHoles.map((hole, index) => (
            <g key={index}>
              <circle cx={hole.x} cy={hole.y} r={hole.r} className="rp-cover-hole" />
              <line
                x1={hole.x - 18}
                y1={hole.y + 15}
                x2={hole.x + 22}
                y2={hole.y - 13}
                transform={`rotate(${hole.angle} ${hole.x} ${hole.y})`}
                className="rp-cover-rubbing-stroke"
                opacity={0.2 + progress * 0.7}
              />
            </g>
          ))}
          <path d="M282 111 C342 72, 417 148, 505 106" className="rp-cover-separated-path" />
          <path d="M282 167 C351 122, 417 204, 505 161" className="rp-cover-separated-path is-second" />
          <path d="M282 223 C338 190, 423 244, 505 216" className="rp-cover-separated-path is-third" />
        </g>

        <rect x="68" y="82" width="394" height="160" rx="7" className="rp-cover-plate-frame" />
        <text x="76" y="65" className="rp-cover-page-title">随机投影页</text>
        <text x="522" y="65" className="rp-cover-small">冻结后复用</text>

        {[0, 1, 2].map((row) => (
          <g key={row}>
            <rect x="82" y={98 + row * 58} width="118" height="38" rx="6" className="rp-cover-label-card" />
            <text x="141" y={123 + row * 58} textAnchor="middle" className="rp-cover-label-text">
              {['类别 A', '类别 B', '类别 C'][row]}
            </text>
          </g>
        ))}

        <rect x="68" y="266" width="230" height="9" rx="4" className="rp-cover-ledger-track" />
        <rect x="68" y="266" width={230 * ledgerFill} height="9" rx="4" className="rp-cover-ledger-fill" />
        <text x="462" y="258" textAnchor="end" className="rp-cover-ledger-text">累计 G / C 账本</text>

        <g transform={`translate(${padX} ${padY}) rotate(${-8 + progress * 12})`} className="rp-cover-new-pad">
          <ellipse cx="0" cy="0" rx="43" ry="22" />
          <path d="M-28,-1 H25" />
        </g>

        <g opacity={finalLabel}>
          <rect x="482" y="248" width="112" height="38" rx="8" className="rp-cover-success-label" />
          <text x="538" y="273" textAnchor="middle" className="rp-cover-success-text">目标标签清晰</text>
        </g>
        <text x="588" y="292" textAnchor="end" className="rp-cover-footnote">固定板 · 累计账本</text>
      </svg>
    </div>
  );
}
