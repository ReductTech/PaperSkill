import React from 'react';
import { HW } from './kit';

const TAKEAWAYS = [
  '验证者要能对抗自己的偷懒本能。',
  '有些认知工作不该在实时对话里做。',
  '提示词是你的管理哲学：给框架与身份，不给步骤。',
];

/* 收束：不复述 12 个点，只留三条能带走的判断。 */
export function Closing() {
  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.22fr) minmax(0, 1fr)' }}>
      <div className="hw-col" style={{ gap: 14 }}>
        <p className="hw-fig" style={{ fontSize: 46, lineHeight: 1.24 }}>
          读源码的价值，<br />不是抄实现。
        </p>
        <ol style={{ display: 'grid', gap: 10, listStyle: 'none' }}>
          {TAKEAWAYS.map((text, index) => (
            <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="hw-num" style={{ background: index === 1 ? HW.orange : HW.blue }}>{index + 1}</span>
              <span className="hw-t" style={{ paddingTop: 6 }}>{text}</span>
            </li>
          ))}
        </ol>
        <div className="hw-band" style={{ marginTop: 'auto' }}>
          <span>是理解取舍背后的 <strong>Why</strong>——才能抄得更好。</span>
        </div>
      </div>

      <div className="hw-stage" style={{ background: '#f4f8f5' }}>
        <svg viewBox="0 0 460 560" role="img" aria-label="归档的体检报告与抄 Why 印章">
          <rect x="40" y="40" width="380" height="420" rx="8" fill="#ffffff" stroke={HW.lineStrong} strokeWidth="3" />
          <text x="70" y="88" fill={HW.ink} fontSize="30" fontWeight="700">体检报告 · 归档</text>
          {[0, 1, 2, 3, 4].map(i => (
            <g key={i}>
              <line x1="70" y1={120 + i * 56} x2="390" y2={120 + i * 56} stroke={HW.line} strokeDasharray="6 6" />
              <rect x="70" y={132 + i * 56} width={210 - i * 18} height="8" rx="4" fill={HW.line} />
            </g>
          ))}
          <polyline points="70,300 110,300 130,262 150,330 170,300 230,300 250,276 270,300 390,300"
            fill="none" stroke={HW.green} strokeWidth="4" />
          <g transform="translate(230 372) rotate(-7)">
            <rect width="176" height="62" rx="8" fill="none" stroke={HW.green} strokeWidth="4" />
            <text x="88" y="42" textAnchor="middle" fill={HW.green} fontSize="30" fontWeight="700">抄 Why</text>
          </g>
          <text x="230" y="520" textAnchor="middle" fill={HW.muted} fontSize="30">十二个瞬间，三条结论</text>
        </svg>
      </div>
    </div>
  );
}
