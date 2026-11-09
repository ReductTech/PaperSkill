import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { C, Garment, Hanger, Rail, Tag } from './tailorKit';
import './tailor.css';

/** 封面：同一根衣架上的“相邻两款”，旧法拿错，新法先认邻居再拉开。 */
export function RapfCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const p = Math.max(0, Math.min(1, progress));
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = reduced ? 1 : p;

  const open = isNew ? Math.max(0, Math.min(1, (t - 0.45) / 0.4)) : 0;
  const leftX = 250 - 55 * open;
  const rightX = 350 + 55 * open;
  const reach = isNew ? 0 : Math.max(0, Math.min(1, (t - 0.12) / 0.55));
  const handX = 620 - 200 * reach;
  const ringed = isNew && t > 0.18 && t < 0.95;

  return (
    <div className="rapf-cover">
      <svg viewBox="0 0 660 366" role="img" aria-label={isNew ? '先用款名圈出邻居，再把两款样板拉开' : '两款挨着挂，学徒伸手拿错了一件'}>
        <rect x="0" y="0" width="660" height="366" fill={C.bg} />
        <rect x="0" y="300" width="660" height="66" fill={C.light} opacity="0.55" />
        <path d="M0 300 H660" stroke={C.wood} strokeWidth="4" opacity="0.5" />
        <Rail x1={40} x2={620} y={92} />

        {ringed ? (
          <rect x={leftX - 78} y={86} width={rightX - leftX + 156} height={190} rx={26} fill="none" stroke={C.orange} strokeWidth={4} strokeDasharray="10 6" />
        ) : null}

        <g opacity={isNew && t < 0.2 ? 0.55 : 1}>
          <Hanger x={leftX} y={92} s={0.8} color={isNew && ringed ? C.orange : C.wood} />
          <Garment x={leftX} y={118} s={0.78} color={C.red} collar="round" />
          <Tag x={leftX} y={232} text="箱龟" size={20} fill="#fff" stroke={C.red} />
        </g>
        <g opacity={isNew && t < 0.2 ? 0.55 : 1}>
          <Hanger x={rightX} y={92} s={0.8} color={isNew && ringed ? C.orange : C.wood} />
          <Garment x={rightX} y={118} s={0.78} color={C.blue} collar="point" />
          <Tag x={rightX} y={232} text="泥龟" size={20} fill="#fff" stroke={C.blue} />
        </g>

        {isNew ? (
          <g opacity={Math.min(1, t * 3)}>
            <rect x={400} y={262} width={150} height={40} rx={10} fill="#eaf5ee" stroke={C.green} strokeWidth={2} />
            <text x={475} y={289} textAnchor="middle" fontSize={21} fill={C.green} fontWeight={700}>
              余量 m 已拉开
            </text>
          </g>
        ) : (
          <g opacity={Math.min(1, reach * 1.4)}>
            <path d={`M${handX} 300 L${handX} 250 L${handX - 26} 214 L${handX - 8} 200 L${handX + 14} 226 L${handX + 16} 196 L${handX + 40} 198 L${handX + 40} 246 L${handX + 22} 300 Z`}
              fill="#e5ae78" stroke="#9a6a42" strokeWidth={3} strokeLinejoin="round" />
            <Tag x={handX + 6} y={170} text="拿错" size={20} fill="#fdecee" color={C.red} stroke={C.red} />
          </g>
        )}

        <text x={24} y={348} fontSize={21} fill={C.muted}>
          {isNew ? '款名册先圈邻居，再在打版纸上把样板推开' : '两款名字与样子都挨着，学徒随手取下错的那件'}
        </text>
      </svg>
    </div>
  );
}
