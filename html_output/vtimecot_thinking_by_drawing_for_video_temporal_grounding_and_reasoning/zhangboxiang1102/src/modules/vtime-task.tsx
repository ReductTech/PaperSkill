/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React,{useState} from 'react';
import type { WidgetProps } from './registry';
import { VtimeFrame } from './vtime-scene';
export const VtimeTask: React.FC<WidgetProps> = () => {
 const [mode,setMode]=useState<'qa'|'ground'>('ground');
 return <div className="vt-widget"><div className="vt-chiprow"><button className="vt-chip" aria-pressed={mode==='qa'} onClick={()=>setMode('qa')}>内容问答 · What</button><button className="vt-chip" aria-pressed={mode==='ground'} onClick={()=>setMode('ground')}>时序定位 · When</button></div>
 <div className="vt-grid2"><div className="vt-movie"><VtimeFrame seconds={28} annotated={mode==='ground'} highlighted={mode==='ground'}/><p className="vt-small">同一段60秒教学片：靠近门 → 打开门 → 走过门。</p></div><div className="vt-card"><div className="vt-kicker">问题：{mode==='qa'?'这个人做了什么？':'这个人什么时候打开门？'}</div><h4>{mode==='qa'?'内容答案':'时间区间'}</h4><p className="vt-reasoning">{mode==='qa'?'他打开了门。':'[20s, 38s]：从开始推门到完成开门。'}</p><span className={'vt-pill '+(mode==='ground'?'green':'')}>{mode==='qa'?'语义正确':'语义 + 起止边界'}</span></div></div>
 <div className="vt-feedback">{mode==='qa'?'内容回答可以说明发生了什么，但还没有给出事件边界。':'时序定位必须同时说清事件内容与它在视频中的起止位置。'}</div></div>;
};
