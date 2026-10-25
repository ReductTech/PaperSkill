import React from 'react';
import { INK, Sheet } from './kit';

const TAKEAWAYS = [
  '发布清单决定公开范围，不决定代码质量。',
  '关键决策越往下沉，越难绕过，也越难改。',
  '读懂取舍，比记住八卦有用。',
];

/* 收束页：不再引入新事实，只把五条决策压成三句话，并把"读过的校样"归档。 */
export function Closing() {
  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 1.22fr) minmax(0, 1fr)' }}>
      <div className="ps-col" style={{ gap: 16 }}>
        <p className="ps-fig" style={{ fontSize: 46, lineHeight: 1.25 }}>
          被泄漏的不是代码，<br />是取舍。
        </p>
        <ol style={{ display: 'grid', gap: 12, listStyle: 'none' }}>
          {TAKEAWAYS.map((text, index) => (
            <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span className="ps-num" style={{ background: index === 1 ? INK.orange : INK.blue }}>{index + 1}</span>
              <span className="ps-t" style={{ paddingTop: 6 }}>{text}</span>
            </li>
          ))}
        </ol>
        <div className="ps-band" style={{ marginTop: 'auto' }}>
          <span>代码会被下架，读过它的人不会。</span>
        </div>
      </div>

      <div className="ps-card ps-card--plain" style={{ padding: 12, display: 'grid' }}>
        <svg className="ps-art" viewBox="0 0 460 566" role="img" aria-label="合上的校样册与归档章">
          <rect x="0" y="0" width="460" height="566" rx="14" fill="#f8f3e4" />
          <rect x="46" y="470" width="368" height="18" rx="9" fill={INK.wood} opacity="0.3" />
          <g transform="translate(96 96)">
            <rect x="8" y="10" width="268" height="360" rx="10" fill="#21324a" opacity="0.10" />
            <rect x="0" y="0" width="268" height="360" rx="10" fill="#33475f" stroke="#1b2738" strokeWidth="3" />
            <rect x="0" y="0" width="24" height="360" rx="10" fill="#293a4f" />
            <rect x="44" y="44" width="180" height="4" fill="#8b9bb1" />
            <text x="134" y="150" textAnchor="middle" fill="#dbe4f0" fontSize="30" fontWeight="700">设计取舍</text>
            <text x="134" y="196" textAnchor="middle" fill="#93a4bb" fontSize="30">校样 2026</text>
            <Sheet x={44} y={230} w={180} h={100} tone="#5d708c" fill="#3c5069" lines={2} />
          </g>
          <g transform="translate(300 392) rotate(-9)">
            <circle r="76" fill="#fdfbf2" stroke={INK.red} strokeWidth="6" opacity="0.95" />
            <text y="-8" textAnchor="middle" fill={INK.red} fontSize="30" fontWeight="700">已归档</text>
            <text y="30" textAnchor="middle" fill={INK.red} fontSize="30">2026-04</text>
          </g>
          <text x="230" y="536" textAnchor="middle" fill={INK.muted} fontSize="30">一份校样，五次下沉，一个方向</text>
        </svg>
      </div>
    </div>
  );
}
