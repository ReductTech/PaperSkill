import React from 'react';
import { RW } from './kit';

const TAKEAWAYS = [
  '边界决定形态：进程、渲染、控制、构建。',
  '能力要回到一个循环，否则状态没有人持有。',
  '未发布的功能，最好连代码都不存在。',
];

/* 收束：不再引入新事实，把四个边界压成三句话，并把调度图归档。 */
export function Closing() {
  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
      <div className="rw-col" style={{ gap: 14 }}>
        <p className="rw-fig" style={{ fontSize: 46, lineHeight: 1.24 }}>
          一个终端工具，<br />长成了一座应用框架。
        </p>
        <ol style={{ display: 'grid', gap: 10, listStyle: 'none' }}>
          {TAKEAWAYS.map((text, index) => (
            <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="rw-num" style={{ background: index === 1 ? RW.orange : RW.blue }}>{index + 1}</span>
              <span className="rw-t" style={{ paddingTop: 6 }}>{text}</span>
            </li>
          ))}
        </ol>
        <div className="rw-band" style={{ marginTop: 'auto' }}>
          <span>读懂架构，是为了在自己的项目里少建一层。</span>
        </div>
      </div>

      <div className="rw-stage" style={{ background: '#f4f7fa' }}>
        <svg viewBox="0 0 460 560" role="img" aria-label="三盏绿灯的调度图与归档铭牌">
          <rect x="20" y="30" width="420" height="180" rx="8" fill={RW.white} stroke={RW.lineStrong} strokeWidth="3" />
          <text x="40" y="70" fill={RW.muted} fontSize="30">调度图 · 已归档</text>
          {[0, 1, 2].map(index => (
            <g key={index} transform={`translate(${70 + index * 110} 96)`}>
              <rect x="-4" y="0" width="8" height="70" fill={RW.steel} />
              <circle cx="0" cy="8" r="12" fill={RW.green} />
              <text x="0" y="102" textAnchor="middle" fill={RW.muted} fontSize="30">{index + 1}</text>
            </g>
          ))}
          <rect x="40" y="250" width="380" height="12" rx="4" fill={RW.rail} />
          <g transform="translate(60 300)">
            <rect width="340" height="150" rx="8" fill={RW.white} stroke={RW.lineStrong} strokeWidth="3" />
            <text x="24" y="52" fill={RW.ink} fontSize="30" fontWeight="700">四个边界</text>
            {['进程', '渲染', '控制', '构建'].map((name, index) => (
              <g key={name} transform={`translate(${24 + index * 78} 72)`}>
                <rect width="68" height="50" rx="5" fill="#eef3f9" stroke={RW.blue} strokeWidth="2" />
                <text x="34" y="34" textAnchor="middle" fill={RW.blue} fontSize="30">{name}</text>
              </g>
            ))}
          </g>
          <text x="230" y="520" textAnchor="middle" fill={RW.muted} fontSize="30">一条管线，两笔预算，四个边界</text>
        </svg>
      </div>
    </div>
  );
}
