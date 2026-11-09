import React,{useState,useEffect} from 'react';
import {Canvas,C,StampScene,line,text,clearScene} from './stamp-kit';
const density=[['各向同性高斯',3.703,.091,50],['对角高斯',3.678,.079,150],['全协方差高斯',3.608,.085,525],['异方差高斯（NLF）',3.642,.088,72],['Noise Flow',3.311,.198,2330],['Noise Flow-Large',3.288,.227,6618],['本文模型',3.072,.044,6160]] as const;
const denoise=[['各向同性高斯',32.48,.855],['对角高斯',33.34,.867],['全协方差高斯',32.72,.873],['异方差高斯',32.24,.849],['Noise Flow',33.81,.894],['C2N（引用结果）',33.76,.901],['本文模型',34.74,.912],['真实噪声训练',36.51,.922]] as const;
const labels=['负对数似然','边际 KL','去噪 PSNR','去噪 SSIM'];
const feedback=['表 1：本文 NLL 3.072，Noise Flow 3.311。单位为每维 nats，越低越好。','表 1：本文边际 KL 0.044，Noise Flow 0.198。直方图实现会影响 KL，不能跨论文直接排名。','表 3：本文合成噪声训练 DnCNN 达 34.74 dB，真实噪声训练为 36.51 dB，仍差 1.77 dB。','表 3：本文 SSIM 为 0.912，真实噪声训练为 0.922。提高不等于替代真实训练数据。'];
export function Analogy10(){return <StampScene action="finish"/>;}
export function Lab10(){const [metric,setMetric]=useState(0),[progress,setProgress]=useState(0),[running,setRunning]=useState(false);
 const rows=metric<2?density:denoise;const col=metric%2+1;const max=Math.max(...rows.map(r=>Number(r[col])));const color=(i:number)=>i===6?C.green:(metric>=2&&i===7?C.blue:C.dark);
 useEffect(()=>{if(!running)return;let id=0;const start=performance.now();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const frame=(time:number)=>{const p=reduced?1:Math.min(1,(time-start)/1600);setProgress(p);if(p<1)id=requestAnimationFrame(frame);else setRunning(false);};id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id);},[running]);
 const choose=(m:number)=>{setRunning(false);setMetric(m);setProgress(0);};
 const draw=(ctx:CanvasRenderingContext2D,w:number,h:number)=>{clearScene(ctx,w,h);const top=43,step=metric<2?29:26;line(ctx,80,27,80,260,C.border,2);line(ctx,80,260,990,260,C.border,2);text(ctx,metric<2?'越短越好':'越长越好',80,20,C.muted,16);for(let i=0;i<rows.length;i++){const y=top+i*step,v=Number(rows[i][col]);ctx.fillStyle='#e1e7dd';ctx.fillRect(80,y,750,15);ctx.fillStyle=color(i);ctx.fillRect(80,y,750*v/max*progress,15);if(i===6){ctx.strokeStyle=C.green;ctx.lineWidth=2;ctx.strokeRect(77,y-3,756,21);}ctx.font='16px sans-serif';ctx.fillStyle=C.text;ctx.textAlign='left';ctx.fillText(metric===2?v.toFixed(2):v.toFixed(3),855,y+13);ctx.fillStyle=C.muted;ctx.fillText(String(i+1),46,y+13);}};
 return <><Canvas draw={draw} label="原文指标对照，条形顺序与下方表格一致，数值长度按相同零点线性比例显示"/>
 <div className="chip-row" style={{flexWrap:'wrap'}}>{labels.map((s,i)=><button key={s} className={'chip '+(metric===i?'selected':'')} aria-pressed={metric===i} onClick={()=>choose(i)}>{s}</button>)}</div>
 <div className="step-ctrl"><button className="chip" disabled={running} onClick={()=>{setProgress(0);setRunning(true);}}>{running?'对照中…':progress===1?'重新对照':'开始对照'}</button></div>
 <div className="feedback" aria-live="polite">{feedback[metric]}</div>
 <table className="paper"><caption>{metric<2?'原文第 6 页表 1：SIDD 噪声模型测试；NLL 每维 nats ↓，边际 KL 无单位 ↓':'原文第 8 页表 3：DnCNN 在 SIDD-Medium 训练、SIDD-Validation 验证、SIDD-Benchmark 测试；PSNR 单位 dB ↑，SSIM 无单位 ↑'}</caption><thead><tr><th>序号</th><th>{metric<2?'噪声模型':'训练用噪声来源'}</th><th>{metric<2?'NLL ↓':'PSNR ↑'}</th><th>{metric<2?'边际 KL ↓':'SSIM ↑'}</th>{metric<2&&<th>参数量</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]} style={{color:color(i),fontWeight:i===6?700:400}}><td>{i+1}</td><td>{r[0]}</td><td>{Number(r[1]).toFixed(metric<2?3:2)}</td><td>{Number(r[2]).toFixed(3)}</td>{metric<2&&<td>{(r as typeof density[number])[3]}</td>}</tr>)}</tbody></table>
 <div style={{marginTop:12}}><a href="https://openaccess.thecvf.com/content/CVPR2022/papers/Kousha_Modeling_sRGB_Camera_Noise_With_Normalizing_Flows_CVPR_2022_paper.pdf" target="_blank" rel="noreferrer">打开原论文核对表格</a></div>
 </>;
}
