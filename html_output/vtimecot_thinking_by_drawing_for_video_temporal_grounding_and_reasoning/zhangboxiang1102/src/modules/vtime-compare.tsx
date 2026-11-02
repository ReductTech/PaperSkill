/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React,{useState} from 'react';
import type { WidgetProps } from './registry';
import { VtimeFrame, eventAt, keepRangeKeysLocal } from './vtime-scene';
export const VtimeCompare: React.FC<WidgetProps> = () => {
 const [pos,setPos]=useState(48);
 return <div className="vt-widget" onKeyDown={keepRangeKeysLocal}><div className="vt-grid2"><div className="vt-card"><div className="vt-card-head"><span>只有画面与文字解释</span><span className="vt-pill orange">未画出时间</span></div><VtimeFrame seconds={pos*.6}/><p className="vt-small">“{eventAt(pos*.6)}。”能描述语义，还缺少可见的秒数对应关系。</p></div><div className="vt-card"><div className="vt-card-head"><span>相同画面 + 视觉时间线索</span><span className="vt-pill green">时间可读</span></div><VtimeFrame seconds={pos*.6} annotated/><p className="vt-small">相同动作，现在还能对应到 <strong>{(pos*.6).toFixed(1)}s / 60s</strong>。</p></div></div><label className="vt-small">同步移动同一画面<input className="vt-scrub" type="range" min="4" max="96" value={pos} onChange={e=>setPos(Number(e.target.value))}/></label><div className="vt-feedback" aria-live="polite">当前两边都显示“{eventAt(pos*.6)}”；新增的是时间坐标，而非动作语义本身。这解释了进度条为何可能帮助定位，尚不能证明它一定提高每个样本的准确率。场景为教学示意。</div></div>;
};
