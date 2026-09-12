import {useState} from 'react';
import {Scene,clearScene,colors} from './drawing';

export function EvidenceAudit(){
 const [mode,setMode]=useState(0),[steps,setSteps]=useState(4);
 const base=mode===0?144:mode===1?144+144*steps:45.3;
 const update=mode===0?64:mode===1?144+64*steps:48.6;
 const ceiling=mode===2?60:Math.max(base,update)*1.1;
 const reduction=(base-update)/base*100;
 return <details><summary style={{cursor:'pointer',padding:'16px 0',fontWeight:700}}>研究者核对：这几个百分比究竟在比较什么？</summary>
 <p>原文 §5.3.1 的 55.6% 针对平均新增视觉 token。把初态也计入示例，分母就变了；表 1 的分数差则应使用百分点。</p>
 <div className="chip-row">{['新增视觉 token','包含初态的示例','推理分数提升'].map((s,i)=><button key={s} className={'chip '+(mode===i?'selected':'')} aria-pressed={mode===i} onClick={()=>setMode(i)} style={{minHeight:44}}>{s}</button>)}</div>
 {mode===1&&<div className="chip-row">{[1,4,10].map(n=><button key={n} className={'chip '+(steps===n?'selected':'')} aria-pressed={steps===n} onClick={()=>setSteps(n)} style={{minHeight:44}}>{n} 次更新</button>)}</div>}
 <Scene ariaLabel={`完整图方案 ${base}，视觉更新方案 ${update}；${mode===2?'总体分数，越高越好':'视觉token数，越低越省'}。`} draw={(c,w,h)=>{
  clearScene(c,w,h);c.strokeStyle=colors.border;c.lineWidth=2;c.beginPath();c.moveTo(80,225);c.lineTo(1000,225);c.stroke();
  [base,update].forEach((v,i)=>{const x=240+i*430,y=225-v/ceiling*175;c.fillStyle=i?colors.green:colors.red;c.fillRect(x,y,140,225-y);c.fillStyle=colors.text;c.font='24px sans-serif';c.fillText(mode===2?v.toFixed(1):String(v),x+35,y-12)});
 }}/>
 <div style={{display:'flex',justifyContent:'space-around',gap:12,flexWrap:'wrap'}}><span>完整图方案</span><span>视觉更新方案</span></div>
 <div className="feedback" role="status">{mode===0?'(144 − 64) ÷ 144 = 55.6%。比较平均新增视觉 token，不包含初态、文本或其他计算。':mode===1?`示例共同初态取 144 token，${steps} 次更新按每次平均 144 / 64 计算：${base} 对 ${update}，视觉 token 总量减少 ${reduction.toFixed(1)}%。初态摊销使比例不同；这是算术示例，不是论文实测总开销。`:'48.6 − 45.3 = 3.3 个百分点；相对增长为 3.3 ÷ 45.3 ≈ 7.3%。两个数回答不同的问题。'}</div>
 <p>{mode===1?'更新数与平均预算仅用于说明统计口径，真实每步更新长度可变；本例没有计入文本、结束标记，也不能推导时间或显存。':mode===2?'来源：原文表 1，Zebra-CoT 测试集随机 4K 例，总体分数越高越好。':'来源：原文 §5.3.1、图 8。token 数量、重建质量与运行时间是不同指标。'}</p>
 </details>
}
