import React from 'react';
import type { WidgetProps } from './registry';
import { BowingDancers, INK } from './danceKit';

const ROWS = [
  ['Lift · 状态', 0.98, 1.0], ['Lift · 视觉', 1.0, 1.0], ['Can · 状态', 0.96, 0.98], ['Can · 视觉', 0.97, 0.99],
  ['ToolHang · 状态', 0.3, 0.38], ['ToolHang · 视觉', 0.73, 0.67], ['PushT · 状态', 0.91, 0.86], ['PushT · 视觉', 0.84, 0.86],
  ['BlockPush · 阶段 1', 0.36, 0.56], ['BlockPush · 阶段 2', 0.11, 0.16], ['Kitchen · 阶段 1', 1.0, 1.0], ['Kitchen · 阶段 2', 1.0, 1.0],
  ['Kitchen · 阶段 3', 1.0, 0.99], ['Kitchen · 阶段 4', 0.99, 0.96],
] as const;
const PLOT = 440;
const up = ROWS.filter(r => r[2] > r[1]).length;
const down = ROWS.filter(r => r[2] < r[1]).length;
const same = ROWS.length - up - down;

export function RobotPolicy(_: WidgetProps) {
  return <div className="ppt-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 28 }}>
    <div className="dk-table-grid" style={{ gridTemplateColumns: '270px 460px 190px', lineHeight: '42px', alignContent: 'start' }} role="table" aria-label="机器人控制成功率，越高越好">
      {ROWS.map(([name, base, ours]) => <React.Fragment key={name}>
        <div>{name}</div>
        <div style={{ height: 42 }}>
          <svg viewBox={`0 0 ${PLOT + 20} 42`} width={PLOT + 20} height={42} style={{ display: 'block' }} aria-hidden="true">
            <line x1={10} x2={PLOT + 10} y1={21} y2={21} stroke={INK.axis} strokeWidth={2} />
            <line x1={10 + base * PLOT} x2={10 + ours * PLOT} y1={21} y2={21} stroke={ours >= base ? INK.net : INK.bad} strokeWidth={5} />
            <circle cx={10 + base * PLOT} cy={21} r={9} fill={INK.dancer} />
            <circle cx={10 + ours * PLOT} cy={21} r={7} fill={INK.net} />
          </svg>
        </div>
        <div style={{ textAlign: 'right' }}>{base.toFixed(2)} → <b style={{ color: ours < base ? INK.bad : INK.net }}>{ours.toFixed(2)}</b></div>
      </React.Fragment>)}
    </div>
    <div className="dk-panel">
      <div className="dk-h">成功率（越高越好）</div>
      <div className="dk-orange" style={{ fontWeight: 750 }}>● Diffusion Policy，100 次调用</div>
      <div className="dk-green" style={{ fontWeight: 750 }}>● Drifting Policy，1 次调用</div>
      <div className="dk-h">提高 {up} · 持平 {same} · 降低 {down}</div>
      <p>把多步生成器换成一步模型，协议沿用 Diffusion Policy。直接在原始表征上算漂移，不用特征空间。</p>
      <p className="dk-muted">后 10 个 checkpoint 的平均成功率（Table 7）。</p>
      <div style={{ marginTop: 'auto' }}><BowingDancers width={420} height={110} /></div>
    </div>
  </div>;
}
