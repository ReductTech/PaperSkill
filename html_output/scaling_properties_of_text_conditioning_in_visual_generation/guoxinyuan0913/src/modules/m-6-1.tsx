import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §6 模块 6.1：从请求到 SP——明确与补全（严格对应关系版）
// 蓝=明确要求（客户原话），紫=推断补全（学徒补写）。
// 点击芯片即飞入其严格对应的字段格：雨夜霓虹街/湿滑路面反光/暖黄路灯光→场景，
// 撑伞的行人/卷起的裤脚→物件，行人躲在屋檐下→关系。

type Slot = 'scene' | 'elements' | 'relations';
interface Chip { id: string; label: string; kind: 'req' | 'infer'; slot: Slot }

const CHIPS: Chip[] = [
  { id: 'r1', label: '雨夜霓虹街', kind: 'req', slot: 'scene' },
  { id: 'r2', label: '撑伞的行人 ×2', kind: 'req', slot: 'elements' },
  { id: 'r3', label: '行人躲在屋檐下', kind: 'req', slot: 'relations' },
  { id: 'i1', label: '湿滑路面反光', kind: 'infer', slot: 'scene' },
  { id: 'i2', label: '暖黄路灯光', kind: 'infer', slot: 'scene' },
  { id: 'i3', label: '卷起的裤脚', kind: 'infer', slot: 'elements' },
];

const SLOTS: { id: Slot; label: string }[] = [
  { id: 'scene', label: '场景字段' },
  { id: 'elements', label: '物件字段' },
  { id: 'relations', label: '关系字段' },
];

export const M611: React.FC<WidgetProps> = () => {
  const [placed, setPlaced] = useState<Record<string, boolean>>({});

  const nPlaced = Object.keys(placed).length;
  const allPlaced = nPlaced === CHIPS.length;
  const reqAll = CHIPS.filter((c) => c.kind === 'req').every((c) => placed[c.id]);
  const nInfer = CHIPS.filter((c) => c.kind === 'infer' && placed[c.id]).length;

  const pool = CHIPS.filter((c) => !placed[c.id]);

  let fb: { text: string; cls: string };
  if (!allPlaced) {
    fb = { text: `已归位 ${nPlaced}/6。点击芯片，把它放进严格对应的字段格。`, cls: 'fb-blue' };
  } else if (nInfer > 0 && reqAll) {
    fb = { text: '合理补全：蓝=客户原话逐字入格，紫=学徒可推断细节且不违背要求——这正是可提示性', cls: 'fb-green' };
  } else {
    fb = { text: '只复述请求：SP 合法但画面会过于简单——试试紫色的推断芯片', cls: 'fb-blue' };
  }

  return (
    <div className="widget">
      <div className="sp-order">客户请求：「雨夜的霓虹街头，两位撑伞的行人躲在屋檐下。」</div>

      <div className="sp-legend">
        <span className="sp-legend-item sp-leg-req">蓝 · 明确要求（客户原话）</span>
        <span className="sp-legend-item sp-leg-infer">紫 · 推断补全（学徒补写）</span>
      </div>

      <div className="sp-slots">
        {SLOTS.map((s) => (
          <div key={s.id} className="sp-slot">
            <b>{s.label}</b>
            <div className="sp-slot-chips">
              {CHIPS.filter((c) => c.slot === s.id && placed[c.id]).map((c) => (
                <span key={c.id} className={'sp-mini ' + (c.kind === 'req' ? 'sp-mini-req' : 'sp-mini-infer')}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sp-pool">
        {pool.map((c) => (
          <button key={c.id}
            className={'sp-chip ' + (c.kind === 'req' ? 'sp-chip-req' : 'sp-chip-infer')}
            onClick={() => setPlaced((p) => ({ ...p, [c.id]: true }))}>
            {c.label}
          </button>
        ))}
        {pool.length === 0 && (
          <button className="sp-reset" onClick={() => setPlaced({})}>↺ 重置再来</button>
        )}
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
