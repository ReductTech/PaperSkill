/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React,{useState} from 'react';
import type { WidgetProps } from './registry';
import { VtimeFrame, keepRangeKeysLocal } from './vtime-scene';
export const VtimeDual: React.FC<WidgetProps> = () => {
 const [pos,setPos]=useState(52);const inside=pos>=33.333&&pos<=63.333; return <div className="vt-widget" onKeyDown={keepRangeKeysLocal}><div className="vt-grid2"><div className="vt-card"><div className="vt-card-head"><span>仅进度条</span><span className="vt-pill">知道当前时间</span></div><VtimeFrame seconds={pos*.6} annotated/><p className="vt-small">这帧在{(pos*.6).toFixed(1)}秒；还没有显式标出查询相关的候选范围。</p></div><div className="vt-card"><div className="vt-card-head"><span>进度条 + 高亮</span><span className="vt-pill green">知道候选在哪里</span></div><VtimeFrame seconds={pos*.6} annotated highlighted/><p className="vt-small">同时可见20—38秒候选范围，当前帧{inside?'位于范围内，可重点核查动作。':'位于范围外，可对照前后事件。'}</p></div></div><label className="vt-small">同步移动同一时间点<input className="vt-scrub" type="range" min="5" max="95" value={pos} onChange={e=>setPos(Number(e.target.value))}/></label><div className="vt-feedback" aria-live="polite">两种线索并用时，时间条回答“现在在何时”，高亮回答“哪些时间值得关注”。MLLM还需判断候选是否符合查询。教学场景展示分工；两种配置的真实比较见后面的Table 5。</div></div>;
};
