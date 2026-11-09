import React,{useState} from 'react';
import {Canvas,C,paper,stamp,line,text} from './stamp-kit';
const rows=[{name:'仅 ISO',nll:3.726,kl:.154},{name:'仅相机',nll:3.609,kl:.216},{name:'仅干净图',nll:3.882,kl:.295},{name:'三种条件',nll:3.530,kl:.104}];
const feedback=['仅 ISO：NLL 3.726，KL 0.154；单一条件遗漏其他影响。','仅相机：NLL 3.609，KL 0.216；两个指标不能只看一个。','仅干净图：NLL 3.882，KL 0.295；内容条件不能替代元数据。','完整 CCS×2：NLL 3.530，KL 0.104。此处还没加 CL，也不是最终四块模型。'];
export function Lab5(){const [selected,setSelected]=useState(0);const row=rows[selected];const color=selected===3?C.green:C.blue;
return <>
 <Canvas label="条件切换同步改变印章示意与原文消融指标" draw={(ctx)=>{
  paper(ctx,45,160,410,80);
  for(let i=0;i<4;i++){ctx.strokeStyle=i===selected?color:C.border;ctx.lineWidth=i===selected?3:1;ctx.strokeRect(65+i*92,180,70,38);}
  stamp(ctx,100+selected*92,137,1,0,color);
  ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.6;ctx.lineWidth=2;
  for(let j=0;j<6;j++){const cx=100+selected*92,cy=198;ctx.beginPath();ctx.ellipse(cx,cy,Math.max(2,30-j*4),Math.max(2,15-j*2),selected*.12,0,Math.PI*2);ctx.stroke();}ctx.restore();
  text(ctx,'负对数似然',565,64);text(ctx,'边际KL',565,163);
  ctx.fillStyle=C.border;ctx.fillRect(565,80,420,27);ctx.fillRect(565,180,420,27);
  ctx.fillStyle=color;ctx.fillRect(565,80,row.nll/4.2*420,27);ctx.fillRect(565,180,row.kl/.32*420,27);
  text(ctx,row.nll.toFixed(3),990,102,color,17);text(ctx,row.kl.toFixed(3),990,202,color,17);
 }}/>
 <div className="chip-row" style={{flexWrap:'wrap'}}>{rows.map((r,i)=><button key={r.name} className={'chip'+(i===selected?' selected':'')} aria-pressed={i===selected} onClick={()=>setSelected(i)}>{r.name}</button>)}</div>
 <div className={'feedback'+(selected===3?' good':'')} aria-live="polite">{feedback[selected]}</div>
 <table className="paper"><caption style={{textAlign:'left',marginTop:16}}>原文表 2 · 同一测试协议 · CCS×2 条件消融 · 两项指标均越低越好</caption><thead><tr><th scope="col">条件配置</th><th scope="col">NLL（每维 nats）</th><th scope="col">边际 KL</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.name} aria-selected={i===selected} style={i===selected?{background:'rgba(39,68,110,.06)',fontWeight:600}:undefined}><th scope="row">{r.name}</th><td>{r.nll.toFixed(3)}</td><td>{r.kl.toFixed(3)}</td></tr>)}</tbody></table>
 </>;
}
