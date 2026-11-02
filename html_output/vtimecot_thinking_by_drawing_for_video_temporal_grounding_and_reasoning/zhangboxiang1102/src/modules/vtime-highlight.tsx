/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React,{useState} from 'react';
import type { WidgetProps } from './registry';
import { VtimeFrame } from './vtime-scene';
export const VtimeHighlight: React.FC<WidgetProps> = () => {
 const [choice,setChoice]=useState(1); const starts=[8,33.33,73.33]; const times=[10,28,50];
 const evidence=['有人靠近门，尚未开始推门：语义相关，但不能直接把整段当作开门区间。','手接触把手并推开门：这是本教学场景的目标动作，还需看前后帧核对起止点。','人已穿过门口：可能与“门”很相似，却主要是动作结束后的画面。'];
 return <div className="vt-widget"><div className="vt-card"><div className="vt-card-head"><span>查询：这个人什么时候打开门？</span><span className="vt-pill orange">教学候选 · 非模型实测</span></div><VtimeFrame seconds={times[choice]} annotated/><div className="vt-timeline"><div className="vt-timeline-fill" style={{width:'100%'}}/><span className="vt-target" style={{left:`${starts[choice]}%`,width:'20%'}}/><span className="vt-cursor" style={{left:`${times[choice]/60*100}%`}}/></div><div className="vt-track-labels"><span>0s</span><span>30s</span><span>60s</span></div></div><div className="vt-hotspots">{['片段 A · 靠近门','片段 B · 打开门','片段 C · 走出门'].map((x,i)=><button key={i} className="vt-hotspot" aria-pressed={choice===i} onClick={()=>setChoice(i)}>{x}</button>)}</div><div className={'vt-feedback '+(choice===1?'good':'warn')} aria-live="polite"><strong>回看片段后得到的证据：</strong>{evidence[choice]}</div><div className="vt-small">§3.3 的真实检索：查询与各 clip 分别编码 → 计算余弦相似度 → 取 top-k → 合并相邻片段并绘制高亮。高亮给出候选，MLLM 结合画面继续判断。以上三个片段用于解释，不是 VideoCLIP-XL 的真实输出。</div></div>;
};
