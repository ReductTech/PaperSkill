import React,{useState} from 'react';
import {C,Canvas,clear,rect,text,line} from './detr-kit';
const names=['完整设置','去掉空间位置','框损失只用L1','框损失只用GIoU'];
const values=[40.6,32.8,35.8,39.9];
function D10BContent(){const [variant,setVariant]=useState(0);return <>
 <Canvas height={220} ariaLabel="300轮训练协议下的论文消融AP" draw={ctx=>{clear(ctx,1080,220);line(ctx,100,170,980,170,C.border);for(let k=0;k<=5;k++)text(ctx,k*10,92+k*176,203,16,C.muted);rect(ctx,100,48,40.6/50*880,65,C.border,true);rect(ctx,100,48,values[variant]/50*880,65,variant===0?C.green:C.orange,true);text(ctx,values[variant].toFixed(1),115+values[variant]/50*880,91,30);line(ctx,100+40.6/50*880,30,100+40.6/50*880,148,C.blue,2);}}/>
 <div className="chip-row">{names.map((name,i)=><button type="button" key={name} className={'chip '+(variant===i?'selected':'')} aria-pressed={variant===i} onClick={()=>setVariant(i)}>{name}</button>)}</div>
 <table className="paper"><thead><tr><th>论文设置</th><th>AP ↑</th></tr></thead><tbody>{names.map((name,i)=><tr key={name}><td>{name}</td><td>{values[i].toFixed(1)}</td></tr>)}</tbody></table>
 <div className={'feedback '+(variant===0?'good':'')}>{['完整设置为40.6。此处是300轮消融实验，取最后10轮验证结果的中位数。','去掉的是图像的空间位置编码，100个可学习目标查询仍然保留，AP降到32.8。','保留分类损失，框损失只用L1，AP为35.8；仅靠坐标差还不够。','保留分类损失，框损失只用GIoU，AP为39.9；与L1结合后达到40.6。'][variant]}</div>
 </>;}

export function D10B(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D10BContent/></div>;}
