import React, { useEffect, useRef, useState } from 'react';
import { C, CanvasView, clearScene, drawPlayer, label, Analogy, Feedback, Controls } from './hero-old';

const clamp=(v:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const source='https://arxiv.org/abs/2508.04416v2';
function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,fill='#fff'){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=color;c.stroke();}
function line(c:CanvasRenderingContext2D,points:number[][],color:string,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.lineWidth=2;}
function arrow(c:CanvasRenderingContext2D,a:number[],b:number[],color:string,width=2){line(c,[a,b],color,width);const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);line(c,[[b[0]-10*Math.cos(angle-.5),b[1]-10*Math.sin(angle-.5)],b,[b[0]-10*Math.cos(angle+.5),b[1]-10*Math.sin(angle+.5)]],color,width);}
function Choices({items,value,onChange}:{items:string[];value:number;onChange:(i:number)=>void}){return <Controls>{items.map((item,i)=><button key={item} className="chip" aria-pressed={value===i} onClick={()=>onChange(i)} style={{borderColor:value===i?C.blue:undefined,background:value===i?'#27446e12':undefined}}>{item}</button>)}</Controls>;}
const cell:React.CSSProperties={padding:'10px 12px',borderBottom:`1px solid ${C.border}`,textAlign:'left',verticalAlign:'top'};

export function Runtime(){
 const [route,setRoute]=useState(0);
 const colors=[C.blue,C.green,C.red];
 return <><CanvasView label="三种执行分支：回答、成功裁剪、参数错误" draw={c=>{
  clearScene(c);drawPlayer(c,62,81,175,116,true);circle(c,370,140,32,C.blue);
  for(let i=0;i<3;i++){const y=48+i*91,color=route===i?colors[i]:C.border;line(c,[[402,140],[512,140],[595,y],[815,y]],color,route===i?5:2);arrow(c,[775,y],[815,y],color,route===i?5:2);c.strokeStyle=color;c.lineWidth=route===i?4:2;
   if(i===0){c.strokeRect(849,y-25,53,51);line(c,[[860,y-10],[891,y-10]],color);line(c,[[860,y+4],[884,y+4]],color);}
   if(i===1)drawPlayer(c,829,y-34,96,68,route===1,color);
   if(i===2){circle(c,876,y,27,color);line(c,[[865,y-11],[887,y+11]],color,3);line(c,[[887,y-11],[865,y+11]],color,3);}
  }label(c,'本轮输出',290,212);label(c,route===0?'结束':route===1?'新证据':'调用错误',937,55+route*91,colors[route]);
 }}/><Choices items={['直接回答','合法裁剪','参数错误']} value={route} onChange={setRoute}/><Feedback tone={['blue','green','red'][route]}>{[
  '输出最终答案，循环结束；工具调用是可选分支。',
  '教学示例 clip(42,66)：返回 42–66 秒的局部视觉证据，继续下一轮推理。',
  '教学示例 clip(66,42)：结束时间早于开始时间，返回错误信息。错误信息不是新画面，也不保证后续一定修复成功。'
 ][route]}</Feedback></>;
}

const stages=[{name:'SFT',count:54,lr:'1e-5',tool:false},{name:'DGRPO',count:94,lr:'1e-6',tool:false},{name:'工具 SFT',count:18,lr:'1e-5',tool:true},{name:'工具 DGRPO',count:16,lr:'1e-6',tool:true}];
export function Training(){
 const [stage,setStage]=useState(0),s=stages[stage];
 return <><CanvasView label={`四阶段训练，当前第 ${stage+1} 阶段`} draw={c=>{
  clearScene(c);stages.forEach((v,i)=>{const y=37+i*57,active=stage===i,w=v.count*7.4;c.fillStyle=active?C.blue:C.light;c.fillRect(170,y,w,31);c.strokeStyle=active?C.blue:C.dark;c.lineWidth=active?4:1;c.strokeRect(170,y,w,31);c.save();c.beginPath();c.rect(170,y,w,31);c.clip();c.strokeStyle=active?'#ffffff77':C.dark;c.lineWidth=1;if(i%2===0){for(let x=174;x<170+w;x+=15){c.beginPath();c.moveTo(x,y);c.lineTo(x+20,y+31);c.stroke();}}else{for(let x=180;x<170+w;x+=19){c.beginPath();c.arc(x,y+16,2,0,Math.PI*2);c.stroke();}}c.restore();label(c,`${i+1} · ${v.count}k`,60,y+23,active?C.blue:C.dark,18);});label(c,'训练样本数',850,245);
 }}/><Controls><button className="btn" onClick={()=>setStage(v=>Math.max(0,v-1))} disabled={stage===0}>上一步</button><span>第 {stage+1} / 4 阶段</span><button className="btn" onClick={()=>setStage(v=>Math.min(3,v+1))} disabled={stage===3}>下一步</button><button className="btn" onClick={()=>setStage(0)}>重置</button></Controls><Feedback>第 {stage+1} 阶段：{s.name}，{s.count}k 个训练样本，学习率 {s.lr}，{s.tool?'使用工具':'不使用工具'}。每阶段 1 epoch，视觉编码器冻结。纹理区分 SFT（斜线）与 RL（圆点）。 SFT 合计72k，RL合计110k；不是互不重复的视频数量。</Feedback></>;
}

const rewardExamples=[[1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0],[.40,.41,.42,.40,.43,.41,.42,.40],[0,1,0,1,1,0,1,0]];
export function Filter(){
 const [sample,setSample]=useState(0),values=rewardExamples[sample],min=Math.min(...values),max=Math.max(...values),range=max-min,keep=range>.05;
 return <><CanvasView label="同一题八次采样的教学奖励，比较最大值和最小值" draw={c=>{
  clearScene(c);line(c,[[92,34],[92,228],[994,228]],C.dark);for(let j=0;j<=4;j++){const y=228-j*44;line(c,[[92,y],[994,y]],C.border);label(c,(j*.5).toFixed(1),45,y+6,C.ink,16);}values.forEach((v,i)=>{const x=140+i*104;c.fillStyle=keep?C.green:C.red;c.fillRect(x,228-v*88,54,Math.max(2,v*88));circle(c,x+27,228-v*88,5,C.orange,C.orange);});[min,max].forEach(v=>line(c,[[109,228-v*88],[987,228-v*88]],C.orange,3));label(c,'奖励',40,22);
 }}/><Choices items={['全答对','全答错','全部差不多','有明显差异']} value={sample} onChange={setSample}/><Feedback tone={keep?'green':'red'}>教学奖励：[{values.map(v=>v.toFixed(2)).join('，')}]。最大值 {max.toFixed(2)} − 最小值 {min.toFixed(2)} = 极差 {range.toFixed(2)}；{keep?'大于 0.05，保留':'不大于 0.05，过滤'}。 纵轴为奖励0–2；筛选依据是极差，不是平均分。</Feedback></>;
}

const nodeNames=['视觉编码','投影合并','语言模型','输出解析','视频工具'];
const nodePositions=[[130,140],[330,80],[560,80],[790,140],[560,225]];
const nodeFeedback=[
 '输入视频帧 → 视觉表征。视觉编码器在四阶段训练中冻结。',
 '视觉表征 → 合并、投影后的语言模型输入。',
 '多模态历史 → 文本推理，以及工具调用请求或最终答案。',
 '模型输出 → 结构化调用参数，或被识别为最终答案。最终答案可直接结束。',
 '合法时间范围 → 从原始视频采样片段 → 新视觉证据返回视觉入口。'
];
export function Architecture(){
 const [selected,setSelected]=useState(0);
 const choose=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)*1080/r.width,y=(e.clientY-r.top)*280/r.height;const index=nodePositions.findIndex(([a,b])=>Math.hypot(x-a,y-b)<=40);if(index>=0)setSelected(index);};
 return <><CanvasView label={`组件数据流，当前选择${nodeNames[selected]}；下方按钮提供相同操作`} onPointerDown={choose} style={{cursor:'pointer'}} draw={c=>{
  clearScene(c);for(let i=0;i<4;i++){const [x,y]=nodePositions[i],[nx,ny]=nodePositions[i+1],angle=Math.atan2(ny-y,nx-x);arrow(c,[x+39*Math.cos(angle),y+39*Math.sin(angle)],[nx-40*Math.cos(angle),ny-40*Math.sin(angle)],selected===i?C.blue:C.border,selected===i?5:2);}
  c.strokeStyle=selected===4?C.green:C.border;c.lineWidth=selected===4?5:2;c.beginPath();c.moveTo(521,235);c.bezierCurveTo(333,288,76,258,119,178);c.stroke();arrow(c,[111,205],[119,178],selected===4?C.green:C.border,selected===4?5:2);
  nodePositions.forEach(([x,y],i)=>{c.lineWidth=selected===i?4:2;circle(c,x,y,37,selected===i?C.blue:C.dark,selected===i?'#e1eaf5':'#fff');const color=selected===i?C.blue:C.dark;
   if(i===0){c.strokeStyle=color;c.strokeRect(x-19,y-15,38,30);line(c,[[x-17,y+11],[x-4,y-3],[x+4,y+3],[x+15,y-10]],color);}
   if(i===1){for(let j=0;j<3;j++)line(c,[[x-20,y-14+j*14],[x+17,y]],color,2);circle(c,x+19,y,4,color,color);}
   if(i===2){[-12,0,12].forEach(dx=>circle(c,x+dx,y,3,color,color));c.strokeStyle=color;c.strokeRect(x-24,y-16,48,32);}
   if(i===3){line(c,[[x-12,y-14],[x-22,y],[x-12,y+14]],color);line(c,[[x+12,y-14],[x+22,y],[x+12,y+14]],color);}
   if(i===4){c.strokeStyle=color;c.strokeRect(x-20,y-15,40,30);line(c,[[x-7,y-8],[x+10,y],[x-7,y+8],[x-7,y-8]],color);}
  });label(c,'视觉入口',55,79);label(c,'回传片段',288,257,selected===4?C.green:C.dark);
 }}/><Choices items={nodeNames} value={selected} onChange={setSelected}/><Feedback tone={selected===4?'green':'blue'}><strong>{nodeNames[selected]}：</strong>{nodeFeedback[selected]}</Feedback></>;
}

function axes(c:CanvasRenderingContext2D,xmax:number,ymax:number,ylabel:string){
 clearScene(c);for(let i=0;i<=4;i++){const y=232-i*48;line(c,[[90,y],[985,y]],C.border);label(c,(ymax*i/4).toFixed(2),24,y+5,C.ink,15);const x=90+i*223.75;label(c,(xmax*i/4).toFixed(2),x-14,259,C.ink,15);}line(c,[[90,35],[90,232],[985,232]],C.dark);label(c,ylabel,18,23);
}
function curve(c:CanvasRenderingContext2D,fn:(x:number)=>number,xmax:number,color:string){const p=Array.from({length:101},(_,i)=>[90+i*8.95,232-fn(i*xmax/100)*192]);line(c,p,color,4);}
export function TaskReward(){
 const [iou,setIou]=useState(.3),short=clamp((iou-.2)/.6),long=clamp(iou/.5);
 return <><CanvasView label="同一 IoU 下的短视频与长视频定位奖励映射" draw={c=>{axes(c,1,1,'奖励');curve(c,x=>clamp((x-.2)/.6),1,C.blue);curve(c,x=>clamp(x/.5),1,C.green);const x=90+iou*895;line(c,[[x,38],[x,232]],C.orange);circle(c,x,232-short*192,7,C.blue,C.blue);circle(c,x,232-long*192,7,C.green,C.green);}}/><Controls><label htmlFor="vital-iou">IoU：{iou.toFixed(2)}</label><input id="vital-iou" type="range" min="0" max="1" step="0.01" value={iou} onChange={e=>setIou(Number(e.target.value))} style={{width:'min(560px,75%)',accentColor:C.orange}}/></Controls><Feedback>当前 IoU = {iou.toFixed(2)}。<span style={{color:C.blue}}>蓝线：短视频定位奖励 {short.toFixed(3)}</span>；<span style={{color:C.green}}>绿线：长视频 VidCh 定位奖励 {long.toFixed(3)}</span>。超出映射区间时 clamp 饱和为 0 或 1；实际 IoU 没有被提高。</Feedback></>;
}

export function SampleReward(){
 const [d,setD]=useState(.8),w=.5+.5*clamp(2-d),weighted=d*w;
 return <><CanvasView label="平均预权重奖励 D 与软权重 w 的关系" draw={c=>{axes(c,2,1,'权重');curve(c,x=>.5+.5*clamp(2-x),2,C.blue);c.setLineDash([8,7]);line(c,[[90,136],[985,136]],C.orange);c.setLineDash([]);const x=90+d/2*895,y=232-w*192;line(c,[[x,232],[x,y]],C.orange);circle(c,x,y,8,C.orange,C.orange);}}/><Controls><label htmlFor="vital-mean">平均奖励 D：{d.toFixed(2)}</label><input id="vital-mean" type="range" min="0" max="2" step="0.02" value={d} onChange={e=>setD(Number(e.target.value))} style={{width:'min(560px,75%)',accentColor:C.orange}}/></Controls><Feedback>D = {d.toFixed(2)}，w = {w.toFixed(3)}，wD = {weighted.toFixed(3)}。{d<=1?'D ≤ 1 时，w = 1，不打折。':d===2?'D = 2 时，w = 0.5，仍保留奖励贡献。':'D > 1 时，平均奖励越高，软权重越低。'} 这里用同题 8 次奖励都等于 D 的教学情形展示乘法；w 不能直接视为最终梯度的缩放倍数。</Feedback></>;
}

type Metric=[string,string,number[],string];
const metrics:Metric[]=[['LongVideo-Reason','准确率（%）',[60.1,70.2,79.3],'表 2(a)'],['Video-MME','整体准确率（%）',[62.9,62.5,64.1],'表 2(a)'],['VidChapters-7M','R@0.5（%）',[.3,25.8,34.7],'表 2(b)'],['VUE-TR-Vision','IoU AUC（%）',[12.6,31.6,35.3],'表 2(c)'],['VSI-Bench','准确率（%）',[31.8,37.5,41.8],'表 4'],['Video-MMMU','准确率（%）',[47.4,52.1,54.2],'表 4'],['MMVU（选择题）','选择题准确率（%）',[61.3,62.6,68.7],'表 4'],['NExT-GQA','mIoU（%）',[15.4,37.2,43.0],'表 3'],['Charades-STA','mIoU（%）',[43.6,57.1,59.9],'表 3'],['ActivityNet-MR','mIoU（%）',[21.1,46.6,49.8],'表 3'],['ReXTime','mIoU（%）',[27.5,40.9,47.6],'表 3']];
const modelNames=['Qwen2.5-VL-7B','VITAL-7B 无工具','VITAL-7B'];
const modelColors=[C.dark,C.blue,C.green];
export function Results(){
 const [metric,setMetric]=useState(0),[progress,setProgress]=useState(0),[running,setRunning]=useState(false),[run,setRun]=useState(0);const container=useRef<HTMLDivElement>(null);const current=metrics[metric];
 useEffect(()=>{
  if(!running)return;let frame=0,last:number|null=null,elapsed=0,visible=true;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){setProgress(1);setRunning(false);return;}
  const tick=(time:number)=>{if(last!==null&&visible&&!document.hidden)elapsed+=time-last;last=time;const p=clamp(elapsed/1800);setProgress(p);if(p<1)frame=requestAnimationFrame(tick);else setRunning(false);};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=null;});if(container.current)observer.observe(container.current);frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[running,run,metric]);
 const start=()=>{setProgress(0);setRun(v=>v+1);setRunning(true);};
 return <div ref={container}><Controls><label htmlFor="vital-metric">指标</label><select id="vital-metric" value={metric} onChange={e=>{setMetric(Number(e.target.value));setProgress(0);setRunning(false);}} style={{padding:10,fontSize:16,maxWidth:'100%'}}>{metrics.map((m,i)=><option key={m[0]} value={i}>{m[0]} · {m[1]}</option>)}</select><button className="btn" onClick={start}>{running?'重新开始':progress===1?'重新对比':'开始对比'}</button></Controls><p style={{fontSize:14}}>共同刻度：0–100%，越高越好。颜色：<span style={{color:C.dark}}>灰绿＝原始骨干</span>；<span style={{color:C.blue}}>蓝＝无工具 VITAL</span>；<span style={{color:C.green}}>绿＝VITAL</span>。动画仅展示论文表格数值，不表示推理速度。</p><CanvasView label={`${current[0]}，${current[1]}，三种模型在同一刻度比较`} draw={c=>{
  clearScene(c);for(let j=0;j<=4;j++){const x=74+j*211;line(c,[[x,29],[x,230]],C.border);label(c,String(j*25),x-8,257,C.ink,16);}current[2].forEach((v,i)=>{const y=43+i*67;c.fillStyle='#e5eadf';c.fillRect(74,y,844,36);c.fillStyle=modelColors[i];c.fillRect(74,y,844*v/100*progress,36);label(c,(v*progress).toFixed(1)+'%',946,y+25,modelColors[i],21);});
 }}/><Feedback tone={progress===1?'green':'blue'}>{progress===1?`${current[0]} 的 ${current[1]}：VITAL 比无工具 VITAL 高 ${(current[2][2]-current[2][1]).toFixed(1)} 个百分点。${metric===1?' 同表 Gemini 1.5 Pro 为 75.0%，高于 VITAL 的 64.1%。':''}`:running?'正在以相同的 1.8 秒展示时长绘制三条结果；精确值始终保留在下表。':'先选择指标，再开始对比。下表始终展示论文报告的精确结果。'}</Feedback>
  <div style={{overflowX:'auto',marginTop:16}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:15}}><caption style={{textAlign:'left',padding:8}}>{current[0]} · {current[1]} · 越高越好 · {current[3]}</caption><thead><tr><th style={cell} scope="col">模型</th><th style={cell} scope="col">论文数值</th></tr></thead><tbody>{modelNames.map((name,i)=><tr key={name}><th style={{...cell,color:modelColors[i]}} scope="row">{name}</th><td style={cell}>{current[2][i].toFixed(1)}%</td></tr>)}</tbody></table></div>
  <p style={{fontSize:14}}>这些数值按论文对应基准协议比较。VidCh 的 R@0.5、mIoU 与 VUE 的 IoU AUC 含义不同，不能合并为总分。</p>
  <details style={{marginTop:18}}><summary style={{cursor:'pointer',fontWeight:700}}>补充消融证据与评测配置</summary><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}><caption style={{textAlign:'left',padding:8}}>独立实验，条件不同；以下行不参加上方动画比较。</caption><thead><tr><th style={cell}>实验与条件</th><th style={cell}>指标与报告值</th><th style={cell}>可支持的判断</th></tr></thead><tbody>
   <tr><th style={cell}>表 1：相同 Think 风格，无工具 GRPO → DGRPO</th><td style={cell}>LVR 准确率 66.0% → 70.2%；Charades mIoU 57.2% → 57.1%</td><td style={cell}>提升因指标而异，不能声称每项都提高。</td></tr>
   <tr><th style={cell}>表 13：省略／保留工具 SFT 阶段</th><td style={cell}>LVR 准确率 70.5%／79.3%；平均成功调用 0／0.87 次</td><td style={cell}>工具使用需要相应训练；成功调用次数是样本平均。</td></tr>
   <tr><th style={cell}>表 13：提高像素预算的无工具基线</th><td style={cell}>LVR 准确率 73.7%；VITAL 79.3%</td><td style={cell}>更接近预算的比较，但并非严格相同运行时间。</td></tr>
   <tr><th style={cell}>表 12：两阶段、无工具，软／硬权重</th><td style={cell}>LVR 准确率 70.2%／58.3%</td><td style={cell}>此实验支持保留容易样本的部分奖励贡献。</td></tr>
   <tr><th style={cell}>表 14：工具 RL 数据规模 8k／12k／16k</th><td style={cell}>LVR 准确率 76.1%／75.8%／79.3%</td><td style={cell}>中间结果有波动，不能画成单调提升曲线。</td></tr>
  <tr><th style={cell}>表 5：仅定位／仅推理问答／定位＋推理问答／全部任务</th><td style={cell}>LVR 准确率 59.5%／76.5%／78.3%／79.3%</td><td style={cell}>任务互补；数据量也随组合改变，不能看作严格控制变量下的纯任务收益。</td></tr></tbody></table></div><p style={{fontSize:14}}>附录 B.2：评测先按 2 FPS 采样，再受上限约束。长视频基准最多 1024 帧、每帧最多 224×224 像素；其余七个基准最多 256 帧、384×384 像素。max_num_turns = 2，temperature = 0.01，top_p = 0.001，max_response_length = 1024。上限不代表每次都用满，也不同于训练或工具返回的上限。</p></details>
  <p style={{fontSize:14,marginTop:16}}>数据来源：<a href={source} target="_blank" rel="noreferrer">VITAL 论文 v2，表 1–5、12–14 与附录 B.2</a>。</p>
 </div>;
}

export function Analogy6(){return <Analogy index={6}/>;}
export function Analogy7(){return <Analogy index={7}/>;}
export function Analogy8(){return <Analogy index={8}/>;}
export function Analogy9(){return <Analogy index={9}/>;}
export function Analogy10(){return <Analogy index={10}/>;}
