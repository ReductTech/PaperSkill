import React,{useState} from 'react';
import {C,Stage,clearScene,line,pill,Chips,Feedback,Metric} from './BirdKit';
import {evidenceModels as models,evidenceTasks as tasks,evidenceCosts as costs,evidenceClaims as claims} from './evidenceMath';
const cell:React.CSSProperties={padding:'9px 8px',borderBottom:`1px solid ${C.line}`,textAlign:'left'};
const note:React.CSSProperties={fontSize:17,lineHeight:1.75,color:C.muted};
export function Results(){
 const [claim,setClaim]=useState(0),[answers,setAnswers]=useState<Record<number,number>>({});
 const q=claims[claim],answer=answers[claim],isCost=claim===3;
 const done=Object.keys(answers).length,correct=Object.entries(answers).filter(([k,v])=>claims[Number(k)].answer===v).length;
 return <>
  <Chips label="选择待检验的说法" value={claim} onChange={setClaim} options={claims.map((q,value)=>({value,label:q.title}))}/>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>待检验：{q.title}</b>。读证据，再选择判断。</p>
  <Stage height={360} label={isCost?'预训练开销对照，没有推理延迟数据':'四个任务的准确率差值，右侧表示第一个模型报告均值更高，左侧更低'} render={(c,w,h)=>{
   clearScene(c,w,h);const text=(s:string,x:number,y:number,size=22,color:string=C.ink)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
   text(models[q.a],25,33,23,C.blue);text('对照 '+models[q.b],575,33,23,C.muted);
   if(isCost){
    text('预训练开销（TPUv3-core-days，越低越好）',25,76);
    [q.a,q.b].forEach((i,k)=>{const y=105+k*82;pill(c,230,y,640,40,'#e0e7d9');pill(c,230,y,640*costs[i]/10000,40,k===0?C.blue:C.muted);text(models[i].split(' · ')[0],25,y+28);text(costs[i].toLocaleString(),890,y+28);});
    text('推理延迟：未报告，无法从这些数值换算',25,306,26,C.orange);
   }else{
    const zero=535,scale=85;line(c,zero,67,zero,295,C.muted,2);
    text('均值更低 ←',230,67,18,C.orange);text('→ 均值更高',680,67,18,C.green);
    tasks.forEach((t,k)=>{const delta=t.values[q.a]-t.values[q.b],y=95+k*49;
     text(t.name,25,y+21);line(c,195,y+12,875,y+12,C.line,1);
     c.fillStyle=delta<0?C.orange:C.green;
     c.fillRect(Math.min(zero,zero+delta*scale),y,Math.max(2,Math.abs(delta)*scale),24);
     text(`${delta>=0?'+':''}${delta.toFixed(2)} pp`,900,y+22,22,delta<0?C.orange:C.green);
    });
    [-4,-2,0,2,4].forEach(v=>text(String(v),zero+v*scale-9,314,18,C.muted));
    text('横轴：准确率差（百分点）；不是跨任务平均分',195,346,19,C.muted);
   }
  }}/>
  <table style={{width:'100%',borderCollapse:'collapse',fontSize:18}}><thead><tr><th style={cell}>{isCost?'模型':'任务'}</th><th style={cell}>{isCost?'开销':models[q.a]}</th><th style={cell}>{isCost?'指标边界':models[q.b]}</th></tr></thead><tbody>
   {isCost?[q.a,q.b].map(i=><tr key={i}><td style={cell}>{models[i]}</td><td style={cell}>{costs[i].toLocaleString()}</td><td style={cell}>预训练累计计算资源</td></tr>):tasks.map(t=><tr key={t.name} style={claim===2&&t.name==='VTAB-19'?{background:'#fff3e9'}:undefined}><td style={cell}>{t.name}</td><td style={cell}>{t.values[q.a].toFixed(2)} ± {t.sd[q.a].toFixed(2)}%</td><td style={cell}>{t.values[q.b].toFixed(2)} ± {t.sd[q.b].toFixed(2)}%</td></tr>)}
  </tbody></table>
  <Chips label="这组证据能否支持说法" value={answer??-1} onChange={v=>setAnswers({...answers,[claim]:v})} options={[{value:0,label:'支持（保留条件）'},{value:1,label:'有直接反例'},{value:2,label:'证据不足'}]}/>
  <Feedback tone={answer===undefined?"blue":answer===q.answer?"green":"orange"}>{answer===undefined?"看清指标与比较条件，再作判断。":<><b>{answer===q.answer?"判断正确。":"再检查一下。"}</b>{q.reason}</>}</Feedback>
  <Metric><span>已判断 {done} / 4</span><span>当前正确 {correct} / 4</span></Metric>
  {correct===4&&<Feedback tone="green">图块 + Transformer 能学到可迁移表示；收益有数据与训练条件，并非各项全胜。</Feedback>}
  <details><summary>展开论文四个模型的完整报告值</summary><div style={{overflowX:'auto'}}><table style={{width:'100%',fontSize:17,borderCollapse:'collapse'}}><thead><tr><th style={cell}>模型与预训练数据</th>{tasks.map(t=><th key={t.name} style={cell}>{t.name}</th>)}<th style={cell}>预训练开销</th></tr></thead><tbody>{models.map((m,i)=><tr key={m}><td style={cell}>{m}</td>{tasks.map(t=><td key={t.name} style={cell}>{t.values[i].toFixed(2)} ± {t.sd[i].toFixed(2)}</td>)}<td style={cell}>{costs[i]}</td></tr>)}</tbody></table></div></details>
  <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>Table 2 · 三次微调均值 ± 标准差；标准差不是置信区间。</p><details><summary>数据、协议与复现边界</summary><p style={note}>来源：论文 Table 2。准确率越高越好，为三次微调的均值 ± 标准差；开销越低越好，单位为 TPUv3-core-days。IN-21k 指 ImageNet-21k。ImageNet 的 L/16、H/14 分别采用 512、518 分辨率及 Polyak 平均；与前面 Table 5 的 384 微调协议分开阅读。比较的是报告系统，训练数据与安排未全部控制一致；差值图不表示统计显著性。JFT 非公开也限制复现。</p></details></>
 </>;
}
