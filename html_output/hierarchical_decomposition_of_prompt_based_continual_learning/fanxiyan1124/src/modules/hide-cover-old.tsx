import React, { useEffect, useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

const printCards = [
  { label: '任务 1', y: 56, tone: 'is-first' },
  { label: '任务 2', y: 92, tone: 'is-second' },
  { label: '任务 3', y: 128, tone: 'is-third' },
] as const;

export function HideCoverOld() {
  const { progress } = useCoverPlayback();
  const [settled, setSettled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (progress >= 0.84) setSettled(true);
  }, [progress]);

  const p = settled ? 1 : Math.min(1, progress / 0.84);
  const pull = 34 + p * 338;
  const wash = 0.2 + p * 0.8;
  const fade = Math.max(0, (p - 0.42) / 0.58);

  return (
    <div className="hide-cover hide-cover-old">
      <svg viewBox="0 0 664 324" role="img" aria-label="旧式单头提示让同一张负片反复穿过当前显影液，旧打印逐渐褪色">
        <rect width="664" height="324" className="hide-cover-bg" />
        <rect x="24" y="18" width="616" height="288" rx="8" className="hide-cover-desk" />
        <path d="M54 44 H610" className="hide-cover-drying-line" />
        <text x="54" y="35" className="hide-cover-small">旧打印仍挂在同一根晾片线上</text>

        {printCards.map((item, index) => (
          <g key={item.label} opacity={Math.max(0.2, 1 - fade * (0.35 + index * 0.18))}>
            <path d={`M${146 + index * 92} 44 V${item.y}`} className="hide-cover-clip-wire" />
            <rect
              x={116 + index * 92}
              y={item.y}
              width="62"
              height="72"
              rx="5"
              className={`hide-cover-print ${item.tone}`}
            />
            <path
              d={`M${124 + index * 92} ${item.y + 16} l17 10 l13 -15 l18 25`}
              className="hide-cover-print-mark"
            />
            <text x={147 + index * 92} y={item.y + 62} textAnchor="middle" className="hide-cover-print-label">
              {item.label}
            </text>
          </g>
        ))}

        <g opacity={Math.min(1, 0.35 + p * 0.65)}>
          <rect x="362" y="52" width="218" height="121" rx="7" className="hide-cover-head-body" />
          <text x="471" y="78" textAnchor="middle" className="hide-cover-head-title">单一分类头</text>
          {[0, 1, 2, 3].map((row) => (
            <g key={row}>
              <circle cx="388" cy={102 + row * 18} r="5" className="hide-cover-head-node" />
              <path d={`M396 ${102 + row * 18} H492`} className="hide-cover-head-line" />
              <circle cx="500" cy={102 + row * 18} r="5" className="hide-cover-head-node is-output" />
            </g>
          ))}
          <text x="471" y="163" textAnchor="middle" className="hide-cover-head-note">新旧任务共用一套输出</text>
        </g>

        <g transform={`translate(${pull - 146} 0)`}>
          <rect x="76" y="214" width="262" height="54" rx="6" className="hide-cover-negative" />
          {[0, 1, 2].map((frame) => (
            <g key={frame}>
              <rect x={88 + frame * 80} y="223" width="66" height="36" rx="3" className="hide-cover-frame" />
              <path
                d={`M${96 + frame * 80} 249 l14 -13 l12 8 l12 -19 l14 21`}
                className="hide-cover-frame-mark"
              />
              <text x={121 + frame * 80} y="270" textAnchor="middle" className="hide-cover-frame-label">
                {`T${frame + 1}`}
              </text>
            </g>
          ))}
        </g>

        <g>
          <path d="M338 154 L390 204 H506 L558 154 Z" className="hide-cover-enlarger-beam" opacity={0.12 + wash * 0.15} />
          <rect x="370" y="211" width="174" height="58" rx="7" className="hide-cover-tray" />
          <rect x="381" y="220" width="152" height="40" rx="5" className="hide-cover-tray-fluid" opacity={0.28 + wash * 0.65} />
          <text x="457" y="291" textAnchor="middle" className="hide-cover-small">当前显影液持续改变</text>
        </g>

        <g opacity={Math.min(1, Math.max(0, (p - 0.58) / 0.42))}>
          <rect x="358" y="182" width="198" height="24" rx="5" className="hide-cover-warning-band" />
          <text x="457" y="199" textAnchor="middle" className="hide-cover-warning-text">旧画面边角开始发灰</text>
        </g>
        <text x="610" y="292" textAnchor="end" className="hide-cover-footnote">同一显影液 · 反复覆盖</text>
      </svg>
    </div>
  );
}
