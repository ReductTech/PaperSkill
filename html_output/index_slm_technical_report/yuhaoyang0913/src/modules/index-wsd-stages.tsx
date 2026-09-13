import React, {useState} from 'react';
import {Scene,Feedback,C,drawDesk,drawPaper,drawPen,drawLabel,line,bar} from './index-kit';
export function IndexWsdStages(){
 const [phase,setPhase]=useState(0);
 const names=['预热','稳定','衰减'];
 const values=['预热：100 步；峰值：5×10⁻⁴','稳定阶段：较高学习率平台；精选子集约占语料 10%','衰减：400B tokens；末值：5×10⁻⁶；最终精选比例未给出'];
 const feedback=['先用 100 步预热到峰值，阶段图不提供中间测量点。','约 10% 指精选语料子集，并非稳定阶段的采样配比。','最后 400B tokens 进入衰减，并增加精选数据；论文没有给出最终精选比例。看懂最终配方后，还要与不同规模的消融分开比较。'];
 return <div onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation()}}><Scene label={'WSD阶段示意：'+names[phase]} draw={(c)=>{drawDesk(c,410,280);drawPaper(c,55,100,300,110);drawPen(c,210,130-phase*5,-.3);bar(c,198,178,[30,70,40][phase],4,C.blue);for(let i=0;i<3;i++){c.strokeStyle=i===phase?C.blue:C.axis;c.lineWidth=i===phase?4:2;c.strokeRect(450+i*196,65,174,75);let y=i===0?115:i===1?90:75;line(c,470+i*196,y,600+i*196,i===0?80:i===1?90:120,i===phase?C.blue:C.muted,3);bar(c,450+i*196,180,174,28,i===phase&&i===2?C.purple:C.light)}drawLabel(c,'学习率',450,35);drawLabel(c,'材料',450,250)}}/><div className="ctrl" style={{flexWrap:'wrap'}}>{names.map((n,i)=><span key={n} style={{color:i===phase?C.blue:C.muted,fontWeight:i===phase?700:400}}>{n}{i<2?' → ':''}</span>)}</div><p>{values[phase]}</p><div className="ctrl" style={{flexWrap:'wrap'}}><button className="chip" style={{minHeight:44}} disabled={phase===0} onClick={()=>setPhase(phase-1)}>上一步</button><button className="chip" style={{minHeight:44}} disabled={phase===2} onClick={()=>setPhase(phase+1)}>下一步</button><button className="chip" style={{minHeight:44}} disabled={phase===0} onClick={()=>setPhase(0)}>重置</button></div><Feedback tone={phase===2?'good':'neutral'}>{feedback[phase]}</Feedback></div>
}
