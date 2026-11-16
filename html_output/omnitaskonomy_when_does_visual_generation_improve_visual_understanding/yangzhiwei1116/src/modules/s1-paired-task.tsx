import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

const INITIAL = [2, 0, 3, 1];
const SLOTS: [number, number][] = [[40, 30], [214, 30], [40, 204], [214, 204]];
const LABELS = ['1', '2', '3', '4'];

function marks(content: number) {
  if (content === 0) return <path d="M16 50 H148 M16 92 H148 M16 134 H148" stroke={C.wood} strokeWidth="3" opacity=".5" />;
  if (content === 1) return <path d="M40 16 V168 M82 16 V168 M124 16 V168" stroke={C.wood} strokeWidth="3" opacity=".5" />;
  if (content === 2) return <g><circle cx="82" cy="92" r="34" fill="none" stroke={C.wood} strokeWidth="3" opacity=".62" /><circle cx="82" cy="92" r="11" fill={C.wood} opacity=".4" /></g>;
  return <path d="M26 148 L82 34 L138 148" fill="none" stroke={C.wood} strokeWidth="3" opacity=".55" />;
}

export function S1PairedTask(_props: WidgetProps) {
  const [order, setOrder] = useState<number[]>([...INITIAL]);
  const [selected, setSelected] = useState<number | null>(null);
  const solved = order.every((value, index) => value === index);

  const pick = (slot: number) => {
    if (selected === null) { setSelected(slot); return; }
    if (selected === slot) { setSelected(null); return; }
    const next = [...order];
    [next[selected], next[slot]] = [next[slot], next[selected]];
    setOrder(next);
    setSelected(null);
  };

  return (
    <div style={{ display: 'flex', gap: 32, width: 1472, height: 622 }}>
      <div style={{ width: 430, height: 560, background: C.bg, borderRadius: 18, border: `2px solid ${C.line}` }}>
        <svg viewBox="0 0 430 470" width="430" height="470" role="group" aria-label="四块木料，点两块可交换位置">
          <rect x="24" y="14" width="382" height="360" rx="14" fill={C.woodSoft} opacity=".45" />
          {order.map((content, slot) => {
            const [x, y] = SLOTS[slot];
            const isSel = selected === slot;
            return (
              <g key={slot} transform={`translate(${x} ${y})`} role="button" tabIndex={0}
                aria-label={`第 ${slot + 1} 格，木料 ${LABELS[content]}${isSel ? '，已选中' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => pick(slot)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(slot); } }}>
                <rect width="174" height="174" rx="10" fill={C.woodSoft} stroke={isSel ? C.orange : C.wood} strokeWidth={isSel ? 6 : 3} />
                <g transform="translate(5 5)">{marks(content)}</g>
                <circle cx="150" cy="26" r="18" fill="#fff" stroke={C.wood} strokeWidth="2" />
                <text x="150" y="33" textAnchor="middle" fontSize="19" fontWeight="700" fill={C.ink}>{LABELS[content]}</text>
              </g>
            );
          })}
          <text x="24" y="404" fontSize="20" fill={C.muted}>拼法：点第一块，再点第二块，两块交换</text>
          <text x="24" y="434" fontSize="20" fill={solved ? C.green : C.blue}>
            {solved ? '四块归位：木料与编号一致' : `当前缺口 ${order.filter((v, i) => v !== i).length} 处`}
          </text>
        </svg>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, padding: '18px 22px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16 }}>
            <div style={{ fontSize: 26, color: C.muted }}>I2I 目标（图像）</div>
            <svg viewBox="0 0 120 120" width="120" height="120" style={{ marginTop: 6 }} role="img" aria-label="正确顺序的整块木板">
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={`translate(${(i % 2) * 60} ${Math.floor(i / 2) * 60})`}>
                  <rect width="60" height="60" fill={C.woodSoft} stroke={C.wood} strokeWidth="2" />
                  <g transform="scale(.34)">{marks(i)}</g>
                </g>
              ))}
            </svg>
            <div style={{ fontSize: 24, color: C.ink, marginTop: 4 }}>监督信号是一张整图</div>
          </div>
          <div style={{ flex: 1.2, padding: '18px 22px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16 }}>
            <div style={{ fontSize: 26, color: C.muted }}>I2T 目标（文本）</div>
            <div style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 30, color: solved ? C.green : C.blue, marginTop: 14, lineHeight: 1.5 }}>
              ("reorder",<br />[{order.join(', ')}])
            </div>
            <div style={{ fontSize: 24, color: C.ink, marginTop: 10 }}>监督信号是一串排列</div>
          </div>
        </div>
        <div style={{ padding: '18px 22px', borderRadius: 16, background: solved ? 'rgba(34,141,92,.10)' : 'rgba(39,68,110,.08)', border: `2px solid ${solved ? C.green : C.blue}` }}>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: C.ink }}>
            {solved
              ? '拼对了，顺序也就报对了：同一块木料、同一个视觉问题，只有输出模态不同。'
              : '左侧木料的排布同时决定两件事：能不能拼回整块板（I2I），以及报出的排列对不对（I2T）。'}
          </div>
        </div>
        <div style={{ fontSize: 24, color: C.muted }}>
          论文的 Jigsaw 把图像 patch 打乱后要求还原；本页用 2×2 木料简化示意，只保留“同一输入、两种输出模态”的结构。
        </div>
      </div>
    </div>
  );
}
