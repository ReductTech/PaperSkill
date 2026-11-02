import React,{useState} from 'react';
import {C,Canvas,clear,rect,text,line} from './detr-kit';
const metrics=['总体 AP','小物体 AP','大物体 AP'];
const vals=[[42,42],[26.6,20.5],[53.4,61.1]];
function D10Content(){const [metric,setMetric]=useState(0),[start,setStart]=useState<number|null>(null);const v=vals[metric];return <>
 <Canvas animate={start!==null} ariaLabel="论文报告的COCO验证集AP比较" draw={(ctx,t)=>{clear(ctx);const p=start===null?0:Math.min(1,Math.max(0,(t-start)/1500));line(ctx,245,262,985,262,C.border);for(let k=0;k<=7;k++){line(ctx,245+k*100,255,245+k*100,268,C.border);text(ctx,k*10,237+k*100,291,15,C.muted);}['FPN+','DETR'].forEach((label,i)=>{text(ctx,label,50,95+i*104,26);const width=v[i]*10*p;rect(ctx,245,60+i*104,width,54,i===1?C.blue:C.dark,true);text(ctx,(v[i]*p).toFixed(1),255+width,95+i*104,24);});}}/>
 <div className="chip-row">{metrics.map((v,i)=><button type="button" className={'chip '+(i===metric?'selected':'')} aria-pressed={i===metric} key={v} onClick={()=>{setMetric(i);setStart(null);}}>{v}</button>)}<button type="button" className="chip" onClick={()=>setStart(performance.now())}>比较成绩</button></div>
 <table className="paper"><thead><tr><th>COCO 2017验证集</th><th>{metrics[metric]} ↑</th></tr></thead><tbody><tr><td>Faster R-CNN-FPN+，ResNet-50</td><td>{v[0].toFixed(1)}</td></tr><tr><td>DETR，ResNet-50</td><td>{v[1].toFixed(1)}</td></tr></tbody></table>
 <div className={'feedback '+(metric===1?'bad':'good')}>{metric===0?'总体 AP 都是42.0。这里的基线已加入GIoU、随机裁剪和更长训练。':metric===1?'小物体 AP：DETR为20.5，基线为26.6。原始DETR仍容易在小物体上丢分。':'大物体 AP：DETR为61.1，基线为53.4。总体分数相同，也可以有不同的能力分布。'}</div>
 </>;}

export function D10(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D10Content/></div>;}
