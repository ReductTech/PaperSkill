import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Props = WidgetProps & { mode: number };
type S = { value:number; choice:string; alt:string; revealed:boolean; step:number; selected:string[]; order:number };
const C={bg:'#e9eef0',light:'#a7b1b8',dark:'#5b6b78',brown:'#7a4d32',blue:'#35556f',green:'#2f7d62',red:'#a84a4a',orange:'#b77a3d',purple:'#6f5a7d',text:'#26333b',muted:'#68757e',border:'#c7d0d5'};

function round(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function clear(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=C.border;ctx.lineWidth=2;round(ctx,8,8,w-16,h-16,14);ctx.stroke();}
function gauge(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,p:number,label:string){ctx.strokeStyle=C.dark;ctx.lineWidth=8;ctx.beginPath();ctx.arc(x,y,r,Math.PI,2*Math.PI);ctx.stroke();ctx.strokeStyle=p>.78?C.red:p>.48?C.orange:C.blue;ctx.beginPath();ctx.arc(x,y,r,Math.PI,Math.PI+Math.PI*clamp(p,0,1));ctx.stroke();const a=Math.PI+Math.PI*clamp(p,0,1);ctx.strokeStyle=C.text;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r*.78,y+Math.sin(a)*r*.78);ctx.stroke();ctx.fillStyle=C.text;ctx.font='600 18px Segoe UI';ctx.textAlign='center';ctx.fillText(label,x,y+28);}
function bar(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,p:number,color:string){ctx.fillStyle='#d7dee2';round(ctx,x,y,w,h,7);ctx.fill();ctx.fillStyle=color;round(ctx,x,y,w*clamp(p,0,1),h,7);ctx.fill();}
function matrix(ctx:CanvasRenderingContext2D,x:number,y:number,rows:number,cols:number,size:number,color:string,active=1){for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){ctx.globalAlpha=.22+.78*active;ctx.fillStyle=color;ctx.fillRect(x+j*(size+3),y+i*(size+3),size,size);}ctx.globalAlpha=1;}
function pipe(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color=C.brown,width=8){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function label(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,color=C.text){ctx.fillStyle=color;ctx.font='600 18px Segoe UI';ctx.textAlign='center';ctx.fillText(t,x,y);}
function buttonClass(active:boolean){return 'chip'+(active?' active':'');}
const ranks=[1,2,4,8,64];

export const LabWidget:React.FC<Props>=({chapterId,moduleId,mode})=>{
 const compact=moduleId==='ana'||chapterId==='hero';
 const W=compact?560:1080,H=compact?140:280;
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [s,setS]=useState<S>({value:mode===1?7:mode===4?8:4,choice:mode===1?'Full FT':mode===7?'Wq':'LoRA',alt:'WikiSQL',revealed:false,step:0,selected:mode===7?['Wq','Wv']:[],order:0});
 const stateRef=useRef(s); stateRef.current=s;
 useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);}catch{return}let raf:number|null=null,startTime=performance.now();
 const draw=(st:S,time:number)=>{clear(ctx,W,H);const t=((time-startTime)%2800)/2800,ana=compact;
  if(mode===1){const p=chapterId==='hero'&&moduleId==='new'?.28:clamp(st.value/175,0,1);gauge(ctx,W*.28,H*.66,Math.min(70,H*.38),p,'GPU');gauge(ctx,W*.68,H*.66,Math.min(70,H*.38),clamp(p+(st.choice==='Full FT'?.18:-.25),0,1),'Storage');if(!ana){bar(ctx,W*.18,H*.12,W*.64,18,p,p>.75?C.red:C.blue);}}
  if(mode===2){const opts=['Full FT','Adapter','Prefix'];opts.forEach((o,i)=>{const x=W*(.2+i*.3),sel=st.choice===o;ctx.fillStyle=sel?C.orange:C.light;round(ctx,x-70,H*.3,140,H*.38,12);ctx.fill();label(ctx,o,x,H*.55,sel?C.text:C.muted);if(!ana)bar(ctx,x-60,H*.76,120,12,[.95,.5,.3][i],i===0?C.red:C.blue);});}
  if(mode===3){matrix(ctx,W*.16,H*.22,6,8,ana?7:16,C.blue,1);const reveal=ana?.45+.35*Math.sin(t*Math.PI*2):clamp(st.value/100,0,1);ctx.globalAlpha=reveal;matrix(ctx,W*.16,H*.22,6,8,ana?7:16,C.orange,.8);ctx.globalAlpha=1;pipe(ctx,W*.58,H*.48,W*.84,H*.48,C.brown,10);label(ctx,'W₀',W*.3,H*.78,C.blue);label(ctx,'ΔW',W*.7,H*.4,C.orange);}
  if(mode===4){const r=ana?4:Math.max(1,Math.round(st.value));matrix(ctx,W*.08,H*.2,6,8,ana?7:14,C.dark,1);label(ctx,'ΔW',W*.2,H*.8);pipe(ctx,W*.33,H*.5,W*.43,H*.5,C.brown,6);matrix(ctx,W*.47,H*.25,6,Math.min(5,Math.max(1,Math.round(r/2))),ana?7:13,C.green,1);matrix(ctx,W*.66,H*.38,Math.min(5,Math.max(1,Math.round(r/2))),8,ana?7:13,C.orange,1);label(ctx,'B × A',W*.67,H*.8,C.green);}
  if(mode===5){const locked=st.choice!=='训练 W₀';ctx.fillStyle=locked?C.blue:C.red;round(ctx,W*.1,H*.28,W*.28,H*.42,14);ctx.fill();label(ctx,locked?'W₀ 冻结':'W₀ 训练',W*.24,H*.52,'#fff');pipe(ctx,W*.4,H*.5,W*.58,H*.5,C.border,10);ctx.fillStyle=C.green;round(ctx,W*.6,H*.24,W*.25,H*.2,12);ctx.fill();round(ctx,W*.6,H*.56,W*.25,H*.2,12);ctx.fill();label(ctx,'A',W*.725,H*.37,'#fff');label(ctx,'B',W*.725,H*.69,'#fff');}
  if(mode===6){const vals=[73.4,73.3,73.7,73.8,73.5],min=68,max=75;ctx.strokeStyle=C.border;ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{const x=W*(.12+i*.19),y=H*.78-(v-min)/(max-min)*H*.5;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();vals.forEach((v,i)=>{const x=W*(.12+i*.19),y=H*.78-(v-min)/(max-min)*H*.5;ctx.fillStyle=ranks[i]===st.value?C.orange:C.blue;ctx.beginPath();ctx.arc(x,y,ana?6:10,0,Math.PI*2);ctx.fill();if(!ana)label(ctx,String(ranks[i]),x,H*.9,C.muted);});}
  if(mode===7){const names=['Wq','Wk','Wv','Wo'];names.forEach((n,i)=>{const x=W*(.15+i*.23),active=st.selected.includes(n)||ana&&(n==='Wq'||n==='Wv');ctx.fillStyle=active?C.green:C.light;ctx.strokeStyle=active?C.brown:C.border;ctx.lineWidth=active?5:2;round(ctx,x-55,H*.34,110,H*.34,14);ctx.fill();ctx.stroke();label(ctx,n,x,H*.54,active?'#fff':C.text);if(i<3)pipe(ctx,x+58,H*.51,x+W*.17,H*.51,active?C.green:C.border,5);});}
  if(mode===8){const names=['FT','Adapter','Prefix','LoRA'],vals=st.alt==='MNLI'?[89.5,91.5,88.6,91.7]:[73.8,73.2,63.1,74.0];names.forEach((n,i)=>{const x=W*(.12+i*.22),p=(vals[i]-55)/40;bar(ctx,x,H*.78-H*.55*p,W*.12,H*.55*p,1,n==='LoRA'?C.green:i===0?C.red:C.blue);if(!ana){label(ctx,n,x+W*.06,H*.9,C.text);label(ctx,vals[i].toFixed(1),x+W*.06,H*.72-H*.55*p,C.text);}});}
  if(mode===9){const merged=ana?t>.5:st.step>=2;ctx.fillStyle=C.blue;round(ctx,W*.08,H*.3,W*.25,H*.42,14);ctx.fill();label(ctx,merged?'W':'W₀',W*.205,H*.53,'#fff');if(!merged){ctx.fillStyle=C.green;round(ctx,W*.5,H*.3,W*.18,H*.42,14);ctx.fill();label(ctx,'BA',W*.59,H*.53,'#fff');pipe(ctx,W*.34,H*.51,W*.49,H*.51,C.brown,8);pipe(ctx,W*.69,H*.51,W*.88,H*.51,C.green,8);}else{pipe(ctx,W*.34,H*.51,W*.88,H*.51,C.green,12);ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(W*.9,H*.51,14,0,Math.PI*2);ctx.fill();}}
  if(mode===10){ctx.fillStyle=C.dark;round(ctx,W*.08,H*.25,W*.38,H*.5,18);ctx.fill();label(ctx,'Base Model',W*.27,H*.52,'#fff');const x=W*(.58+(ana?.05*Math.sin(t*Math.PI*2):0));ctx.fillStyle=C.orange;round(ctx,x,H*.34,W*.2,H*.32,12);ctx.fill();label(ctx,st.choice==='LoRA'?'摘要':st.choice,x+W*.1,H*.53,'#fff');pipe(ctx,W*.46,H*.5,x,H*.5,C.brown,8);if(!ana){for(let i=0;i<6;i++){ctx.fillStyle=i<st.order?C.green:C.light;ctx.beginPath();ctx.arc(W*(.1+i*.15),H*.86,10,0,Math.PI*2);ctx.fill();if(i<5)pipe(ctx,W*(.1+i*.15)+12,H*.86,W*(.1+(i+1)*.15)-12,H*.86,i<st.order?C.green:C.border,4);}}}
 };
 const tick=(time:number)=>{draw(stateRef.current,time);canvas.classList.add('is-ready');raf=requestAnimationFrame(tick)};const start=()=>{if(raf===null)raf=requestAnimationFrame(tick)};const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect()};},[mode,moduleId,chapterId,W,H]);
 if(compact)return <canvas ref={canvasRef} width={W} height={H} aria-label="蒸汽朋克模型适配实验动画" />;
 const update=(patch:Partial<S>)=>setS(v=>({...v,...patch}));
 const feedback=(()=>{
  if(mode===1)return s.value>120?['bad','GPU 与存储进入红区：全量更新让每个任务背负整台模型。']:['','继续放大模型规模，观察显存与检查点怎样一起增长。'];
  if(mode===2)return s.revealed?['good','没有一种旧方案同时赢下参数、延迟、上下文与质量。']:['','先下注，再揭示论文中的工程代价。'];
  if(mode===3)return s.value>65?['good','ΔW 被分离出来：下游任务真正新增的是权重变化。']:['','拖动探照灯，把任务变化从 W₀ 中剥离。'];
  if(mode===4)return s.value<=16?['good','窄矩阵用更少参数表达更新；低秩指独立方向少。']:['','rank 增大时容量与参数量同时上升。'];
  if(mode===5)return s.choice==='冻结 W₀，训练 A/B'?['good','正确：W₀ 冻结，A/B 接收梯度与优化器状态。']:['bad','检查训练开关：全部冻结无法学习，训练 W₀ 又回到高成本。'];
  if(mode===6)return s.revealed?['good','结果并不随 rank 单调上升；最佳选择依任务、位置与指标而变。']:['','先预测最优 rank，再揭示论文数据。'];
  if(mode===7)return s.selected.includes('Wq')&&s.selected.includes('Wv')?['good','论文固定 18M 预算实验中，Wq+Wv 整体最好。']:['','预算有限：选择一个或两个注意力投影。'];
  if(mode===8)return s.revealed?['good','LoRA 以更少可训练参数达到可比或更好结果；结论仅限这些协议。']:['','先选择数据集与下注方法，再启动结果。'];
  if(mode===9)return s.step>=2?['good','W=W₀+(α/r)BA：分支合并后，推理只经过一个权重矩阵。']:['','逐步执行缩放与合并，观察旁路何时消失。'];
  return s.order>=6?['good','你已完成推导：低秩假设是证据支持的工程选择，而非无条件定理。']:['','切换任务模块，或继续排列“成本→增量→低秩→冻结→合并→边界”。'];
 })();
 const chips=(items:string[],current:string,on:(x:string)=>void)=><div className="ctrl">{items.map(x=><button key={x} className={buttonClass(current===x)} onClick={()=>on(x)}>{x}</button>)}</div>;
 return <div>
  <canvas id={'cv-'+chapterId+'-'+moduleId} ref={canvasRef} width={W} height={H} />
  {mode===1&&moduleId.endsWith('.1')&&<div className="ctrl"><label>模型规模 <span className="val">{Math.round(s.value)}B</span></label><input aria-label="模型规模" type="range" min="1" max="175" value={s.value} onChange={e=>update({value:Number(e.target.value)})}/></div>}
  {mode===1&&moduleId.endsWith('.2')&&chips(['Full FT','Adapter','Prefix'],s.choice,x=>update({choice:x}))}
  {mode===2&&<>{chips(['Full FT','Adapter','Prefix'],s.choice,x=>update({choice:x}))}<div className="ctrl"><button onClick={()=>update({revealed:!s.revealed})}>{s.revealed?'隐藏结果':'揭示结果'}</button></div></>}
  {mode===3&&<div className="ctrl"><label>探照范围 <span className="val">{Math.round(s.value)}%</span></label><input aria-label="探照范围" type="range" min="0" max="100" value={s.value} onChange={e=>update({value:Number(e.target.value)})}/>{chips(['冻结 W₀','训练 W₀'],s.choice,x=>update({choice:x}))}</div>}
  {mode===4&&<div className="ctrl"><label>rank r <span className="val">{Math.round(s.value)}</span></label><input aria-label="rank" type="range" min="1" max="64" value={s.value} onChange={e=>update({value:Number(e.target.value)})}/><span className="val">完整 1,048,576 · 低秩 {Math.round(s.value)*2048}</span></div>}
  {mode===5&&<>{chips(['全部冻结','训练 W₀','冻结 W₀，训练 A/B'],s.choice,x=>update({choice:x}))}<div className="ctrl"><button onClick={()=>update({step:Math.max(0,s.step-1)})}>上一步</button><span className="val">前向步骤 {s.step}/3</span><button onClick={()=>update({step:Math.min(3,s.step+1)})}>下一步</button></div></>}
  {mode===6&&<><div className="ctrl">{ranks.map(r=><button key={r} className={buttonClass(s.value===r)} onClick={()=>update({value:r})}>r={r}</button>)}<button onClick={()=>update({revealed:true})}>揭示论文结果</button></div>{moduleId.endsWith('.2')&&chips(['BLEU↑','验证损失↓'],s.alt,x=>update({alt:x}))}</>}
  {mode===7&&<div className="ctrl">{['Wq','Wk','Wv','Wo'].map(x=><button key={x} className={buttonClass(s.selected.includes(x))} onClick={()=>update({selected:s.selected.includes(x)?s.selected.filter(v=>v!==x):s.selected.length<2?[...s.selected,x]:s.selected})}>{x}</button>)}</div>}
  {mode===8&&<>{chips(['WikiSQL','MNLI','SAMSum'],s.alt,x=>update({alt:x}))}<div className="ctrl"><button onClick={()=>update({revealed:true})}>启动对比</button></div></>}
  {mode===9&&<div className="ctrl"><button onClick={()=>update({step:Math.max(0,s.step-1)})}>上一步</button><span className="val">合并步骤 {s.step}/3</span><button onClick={()=>update({step:Math.min(3,s.step+1)})}>下一步</button></div>}
  {mode===10&&<>{chips(['摘要','NL2SQL','分类'],s.choice,x=>update({choice:x}))}<div className="ctrl"><button onClick={()=>update({order:Math.min(6,s.order+1)})}>加入下一条证据</button><button onClick={()=>update({order:0})}>重置推导</button><span className="val">{s.order}/6</span></div></>}
  <div className={'feedback '+feedback[0]}>{feedback[1]}</div>
 </div>;
};
export const LabSharedPlaceholder:React.FC<WidgetProps>=(props)=><LabWidget {...props} mode={1}/>;
