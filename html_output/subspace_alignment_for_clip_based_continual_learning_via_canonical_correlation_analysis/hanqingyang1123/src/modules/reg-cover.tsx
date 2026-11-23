import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

/**
 * 封面双栏：同一张纸、同一初始错位、同一时钟。
 * 旧法（moduleId=oldMethod）：每批手动挪画版，错位随进度累积。
 * 新法（moduleId=newMethod）：用累积落点解出共享网格，两版沿网格对齐。
 */
export function RegCover({ moduleId }: { moduleId: string }) {
  const { progress } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const p = Math.max(0, Math.min(1, progress));

  const baseX = 332;
  const baseY = 168;

  const spread = isNew ? 54 * Math.max(0, 1 - p / 0.72) : 16 + 112 * p;
  const dx = spread;
  const dy = spread * 0.26;

  const gridOpacity = isNew ? Math.max(0, Math.min(1, (p - 0.26) / 0.34)) : 0;
  const settled = isNew ? p > 0.8 : p > 0.86;

  const sheet = '#fdfdf8';
  const ink = '#27446e';
  const type = '#228d5c';
  const red = '#c43f52';
  const orange = '#f07e47';

  return (
    <div className="rs" style={{ background: sheet }}>
      <svg viewBox="0 0 664 324" width="100%" height="100%" role="img"
        aria-label={isNew ? '共享网格把两版对齐' : '手动挪版仍然错位'}>
        <defs>
          <pattern id={`pg-${isNew ? 'n' : 'o'}`} width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M44 0H0V44" fill="none" stroke="#e6ebf2" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="8" y="8" width="648" height="308" rx="12" fill={sheet} stroke="#d7deea" strokeWidth="2" />
        <rect x="8" y="8" width="648" height="308" rx="12" fill={`url(#pg-${isNew ? 'n' : 'o'})`} opacity="0.55" />
        <text x="26" y="40" fontSize="20" fill="#68778f">同一张纸 · 两版套印</text>

        {/* 共享网格：新法算出的公共坐标系 */}
        {isNew && (
          <g opacity={gridOpacity}>
            <path d="M332 62V290M132 168H540" stroke={orange} strokeWidth="2" strokeDasharray="9 7" />
            <path d="M332 104V232M222 168H442" stroke={orange} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.6" />
            <text x="544" y="176" fontSize="18" fill={orange}>共享网格</text>
          </g>
        )}

        {!isNew && (
          <g opacity={0.45}>
            <rect x={baseX - 118} y={baseY - 64} width="236" height="128" rx="10" fill="none"
              stroke={red} strokeWidth="2" strokeDasharray="8 6" />
          </g>
        )}

        {/* 字版十字固定，画版十字随位移 */}
        <g transform={`translate(${baseX} ${baseY})`}>
          <circle r="26" fill="none" stroke={type} strokeWidth="2.5" />
          <path d="M-38 0H38M0 -38V38" stroke={type} strokeWidth="2.5" />
          <circle r="4" fill={type} />
        </g>
        <text x={baseX} y={baseY - 74} textAnchor="middle" fontSize="20" fill={type} fontWeight="700">字版十字</text>

        <g transform={`translate(${baseX + dx} ${baseY + dy})`}>
          <circle r="26" fill="none" stroke={isNew && settled ? type : ink} strokeWidth="2.5" />
          <path d="M-38 0H38M0 -38V38" stroke={isNew && settled ? type : ink} strokeWidth="2.5" />
          <circle r="4" fill={isNew && settled ? type : ink} />
        </g>
        <text x={baseX + dx} y={baseY + dy + 78} textAnchor="middle" fontSize="20" fill={isNew && settled ? type : ink} fontWeight="700">
          画版十字
        </text>

        {!isNew && (
          <path d={`M${baseX} ${baseY}L${baseX + dx} ${baseY + dy}`} stroke={red} strokeWidth="2" strokeDasharray="5 5" opacity="0.85" />
        )}

        <text x="332" y="300" textAnchor="middle" fontSize="21" fontWeight="700"
          fill={settled ? (isNew ? type : red) : '#68778f'}>
          {isNew
            ? (settled ? '两版重合：任务后重解共享网格' : '累积成对统计量，解共享网格…')
            : (settled ? '越追越花：重影越来越大' : '每批都要手挪画版…')}
        </text>
      </svg>
    </div>
  );
}
