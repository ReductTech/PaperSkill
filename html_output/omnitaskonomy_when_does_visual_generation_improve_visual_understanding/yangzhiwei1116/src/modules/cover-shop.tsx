import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const SLOT: [number, number][] = [[128, 34], [252, 34], [128, 158], [252, 158]];
const SHUFFLED = [2, 0, 3, 1];
const LABELS = ['1', '2', '3', '4'];

function Tile({ x, y, content }: { x: number; y: number; content: number }) {
  const marks = [
    <g key="a"><path d="M8 26 H84 M8 46 H84 M8 66 H84" stroke={C.wood} strokeWidth="2.4" opacity=".55" /></g>,
    <g key="b"><path d="M22 8 V84 M46 8 V84 M70 8 V84" stroke={C.wood} strokeWidth="2.4" opacity=".55" /></g>,
    <g key="c"><circle cx="46" cy="46" r="17" fill="none" stroke={C.wood} strokeWidth="2.6" opacity=".7" /><circle cx="46" cy="46" r="6" fill={C.wood} opacity=".45" /></g>,
    <g key="d"><path d="M14 74 L46 20 L78 74" fill="none" stroke={C.wood} strokeWidth="2.6" opacity=".6" /></g>,
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="92" height="92" rx="8" fill={C.woodSoft} stroke={C.wood} strokeWidth="2.5" />
      {marks[content]}
      <circle cx="76" cy="16" r="11" fill="#fff" stroke={C.wood} strokeWidth="1.8" />
      <text x="76" y="21" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.ink}>{LABELS[content]}</text>
    </g>
  );
}

function Master({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <ellipse cx="0" cy="76" rx="34" ry="7" fill={C.envD} opacity=".18" />
      <path d="M-20 74 V30 a20 20 0 0 1 40 0 V74 Z" fill={C.envL} stroke={C.envD} strokeWidth="2" />
      <path d="M-13 8 h26 v14 h-26 Z" fill={C.woodSoft} stroke={C.wood} strokeWidth="2" />
      <circle cx="0" cy="-4" r="15" fill="#e8c9a0" stroke={C.wood} strokeWidth="2" />
      <path d="M18 30 L40 44" stroke={C.wood} strokeWidth="6" strokeLinecap="round" />
      <circle cx="44" cy="46" r="6" fill={C.woodSoft} stroke={C.wood} strokeWidth="2" />
    </g>
  );
}

export function CoverShop({ moduleId }: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const advanced = moduleId === 'newMethod';
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = reduced && !playing ? (advanced ? 1 : 0) : clamp((progress - 0.08) / 0.72, 0, 1);
  const solved = advanced && t > 0.72;
  const order = solved ? [0, 1, 2, 3] : SHUFFLED;

  return (
    <div style={{ width: 664, height: 324, background: C.bg, borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="0 0 664 324" width="664" height="324" role="img"
        aria-label={advanced ? '先动手把木料拼回原样，再报出顺序，两者都正确' : '只练口述，木料始终没有拼回，顺序也报错'}>
        <rect x="16" y="250" width="632" height="48" rx="10" fill={C.woodSoft} stroke={C.wood} strokeWidth="2.5" />
        <path d="M16 268 H648" stroke={C.wood} strokeWidth="1.5" opacity=".35" />
        <Master x={62} y={168} />
        {[0, 1, 2, 3].map((content) => {
          const from = SLOT[SHUFFLED.indexOf(content)];
          const to = SLOT[content];
          const p = advanced ? clamp((t - content * 0.09) / 0.62, 0, 1) : 0;
          const x = from[0] + (to[0] - from[0]) * p;
          const y = from[1] + (to[1] - from[1]) * p;
          return <Tile key={content} x={x} y={y} content={content} />;
        })}
        <g>
          <rect x="404" y="46" width="232" height="96" rx="10" fill="#fff" stroke={C.line} strokeWidth="2" />
          <text x="418" y="70" fontSize="15" fill={C.muted}>口述答案（I2T）</text>
          <text x="418" y="94" fontSize="15" fontFamily="ui-monospace, Consolas, monospace"
            fill={solved ? C.green : C.red}>
            ("reorder",
          </text>
          <text x="418" y="114" fontSize="15" fontFamily="ui-monospace, Consolas, monospace"
            fill={solved ? C.green : C.red}>
            [{order.join(', ')}])
          </text>
          <text x="418" y="134" fontSize="14" fill={solved ? C.green : C.red}>
            {solved ? '报对了' : advanced ? '还在搬木料……' : '报错了'}
          </text>
        </g>
        <g>
          <rect x="404" y="158" width="232" height="64" rx="10" fill="#fff" stroke={advanced ? C.green : C.red} strokeWidth="2" />
          <text x="420" y="184" fontSize="15" fill={C.muted}>拼回去（I2I）</text>
          <text x="420" y="208" fontSize="17" fill={advanced ? C.green : C.red}>
            {advanced ? (solved ? '木料已归位' : '正在拼……') : '从来没拼过'}
          </text>
        </g>
        <text x="16" y="316" fontSize="14" fill={C.muted}>
          {advanced ? '先做一批 → 手感更新 → 再练口述：论文报告收益随生成数据增加' : '只练口述：没有生成训练阶段，共享参数从未被更新'}
        </text>
      </svg>
    </div>
  );
}
