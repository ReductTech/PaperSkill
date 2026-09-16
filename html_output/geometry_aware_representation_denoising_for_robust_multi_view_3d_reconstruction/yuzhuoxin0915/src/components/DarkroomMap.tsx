import React from 'react';
import type { DarkroomStep } from '../types';

// One-time "darkroom metaphor" overview, shown right after the Hero. It decodes the
// recurring photography → paper analogy once, so every later chapter's analogy lands.
// 渲染为「暗房工作台流水线」：桌面端横向时间线（5×2 两行），移动端垂直时间线。
// 每步配一个极简图标；章节徽章可点击直接跳转到对应章节。

// 图标与 steps 顺序一一对应（拍坏了/素材/在哪修/怎么修/修哪/设备/显影/时机/成片/校准）
const STEP_ICONS = ['📷', '🎞', '🔍', '🧪', '🔦', '⚙️', '⏳', '🎯', '🖼️', '⚖️'];

export function DarkroomMap({
  lead,
  steps,
  onJump,
}: {
  lead: string;
  steps: DarkroomStep[];
  onJump?: (slideIdx: number) => void;
}) {
  return (
    <section className="darkroom-map">
      <div className="dm-head">
        <span className="dm-icon">📷</span>
        <div>
          <div className="dm-title">暗房比喻总览</div>
          <div className="dm-subtitle">把三维重建想象成「把拍坏的照片冲成清晰成片」</div>
        </div>
      </div>
      <p className="dm-lead" dangerouslySetInnerHTML={{ __html: lead }} />
      <ol className="dm-timeline">
        {steps.map((s, i) => (
          <li className="dm-node" key={i}>
            <span className="dm-node-icon" aria-hidden="true">
              {STEP_ICONS[i] ?? '•'}
            </span>
            <span className="dm-node-stage">{s.stage}</span>
            <span className="dm-node-metaphor">{s.metaphor}</span>
            <span className="dm-node-concept">{s.concept}</span>
            {onJump ? (
              <button
                type="button"
                className="dm-chapter"
                onClick={() => onJump(i + 1)}
                title={`跳转到 ${s.chapter}`}
              >
                {s.chapter}
              </button>
            ) : (
              <span className="dm-chapter">{s.chapter}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
