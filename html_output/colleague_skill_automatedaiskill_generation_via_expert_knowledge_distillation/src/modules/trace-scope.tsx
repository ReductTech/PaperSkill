import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, card, clearDesk, label, useCanvas } from './handbook-kit';
const W=560,H=250;
const items=[['review','工作评审记录',true],['interview','公开长访谈',true],['private','未经同意的私聊',false],['guess','模型猜测',false]] as const;
type Zone='neutral'|'accepted'|'excluded';
export const TraceScope:React.FC<WidgetProps>=()=>{
 const ref=useRef<HTMLCanvasElement>(null); const [zones,setZones]=useState<Record<string,Zone>>({review:'neutral',interview:'neutral',private:'neutral',guess:'neutral'}); const [active,setActive]=useState('review');
 const valid=Object.entries(zones).filter(([id,z])=>z==='accepted'&&items.find(x=>x[0]===id)?.[2]).length; const invalid=Object.entries(zones).filter(([id,z])=>z==='accepted'&&!items.find(x=>x[0]===id)?.[2]).length;
 const feedback=invalid?{t:'这张材料缺少授权或可核查来源，不能进入当前范围。',c:'bad'}:valid>=2?{t:'已保留来源与用途边界，可进入蒸馏。',c:'good'}:{t:'来源可见，但仍要记录用途边界。',c:''};
 useCanvas(ref,W,H,ctx=>{clearDesk(ctx,W,H);ctx.fillStyle='#eef4ff';ctx.fillRect(24,38,170,160);ctx.fillStyle='#fff8e8';ctx.fillRect(195,38,170,160);ctx.fillStyle='#fff0f2';ctx.fillRect(366,38,170,160);label(ctx,`可用证据 ${valid}`,109,23,C.blue,'center');label(ctx,'待判断',280,23,C.orange,'center');label(ctx,'边界外',451,23,C.red,'center');items.forEach((it,i)=>{const z=zones[it[0]];const x=z==='accepted'?39+(i%2)*78:z==='excluded'?381+(i%2)*78:210+(i%2)*78;const y=62+Math.floor(i/2)*62;card(ctx,x,y,70,36,it[1],z==='accepted'?(it[2]?C.green:C.red):z==='excluded'?C.red:C.orange);});label(ctx,invalid?'存在越界材料':'范围由来源与权限共同决定',280,224,invalid?C.red:C.muted,'center');},[zones,valid,invalid]);
 const place=(zone:Zone)=>setZones(z=>({...z,[active]:zone}));
 return <div><canvas ref={ref} width={W} height={H}/><div className="ctrl" style={{flexWrap:'wrap'}}>{items.map(it=><button key={it[0]} className={`chip ${active===it[0]?'active':''}`} draggable onDragStart={()=>setActive(it[0])} onClick={()=>setActive(it[0])}>{it[1]}</button>)}</div><div className="ctrl"><button className="chip" onDragOver={e=>e.preventDefault()} onDrop={()=>place('accepted')} onClick={()=>place('accepted')}>放入可用证据</button><button className="chip" onDragOver={e=>e.preventDefault()} onDrop={()=>place('excluded')} onClick={()=>place('excluded')}>移到边界外</button></div><div className={`feedback ${feedback.c}`}>{feedback.t}</div></div>;
};
export default TraceScope;
