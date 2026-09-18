import React,{useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
import {spectrum} from './math';
import {paperSourceUrl} from '../data/paper-sources';
export const SharedTools:React.FC=()=>null;
export const palette={bg:'#f5f8f0',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea',env:'#b8c9a7',deep:'#76906a',support:'#92400e'};
export const fmt=(n:number,digits=4)=>!Number.isFinite(n)?'未定义':Math.abs(n)>0&&Math.abs(n)<1e-4?n.toExponential(2):(digits>0?n.toFixed(digits).replace(/\.?0+$/,''):n.toFixed(0))||'0';
type Children={children:React.ReactNode};
export function WidgetFrame({children,id}:{children:React.ReactNode,id?:string}){
 return <div id={id} onKeyDown={e=>{if(e.key.startsWith('Arrow')&&(e.target as HTMLElement).closest('input,select,button,canvas,[role="slider"]'))e.stopPropagation();}}>{children}</div>;
}
export function Controls({children}:Children){return <div className="ctrl">{children}</div>;}
export function Button({children,onClick,disabled,type='button'}:{children:React.ReactNode,onClick?:()=>void,disabled?:boolean,type?:'button'|'submit'|'reset'}){return <button type={type} className="chip" onClick={onClick} disabled={disabled} style={{minHeight:44,opacity:disabled ? .5 : 1}}>{children}</button>;}
export function Chips({label,options,value,onChange}:{label:string,options:{value:string,label:string}[],value:string,onChange:(s:string)=>void}){
 return <div role="group" aria-label={label} className="chip-row" style={{margin:'12px 0',justifyContent:'flex-start'}}>{options.map(o=><button type="button" className={'chip'+(o.value===value?' selected':'')} style={{minHeight:44,whiteSpace:'normal',textAlign:'left'}} aria-pressed={o.value===value} key={o.value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>;
}
export function Feedback({children,tone=''}:{children:React.ReactNode,tone?:'good'|'bad'|''}){return <div className={'feedback '+tone} role="status" aria-live="polite">{children}</div>;}
export function Source({children,loc='固定版本',kind='P / I / T'}:{children:React.ReactNode,loc?:string,kind?:string}){
 const evidenceLabels=[kind.includes('P')?'论文记录':'',kind.includes('I')?'数学解释':'',kind.includes('T')?'教学算例':''].filter(Boolean).join(' · ');
 return <p className="source-note" data-evidence-kind={kind} style={{lineHeight:1.65,margin:'12px 0'}}><strong>{evidenceLabels}</strong> · <a href={paperSourceUrl(loc)} target="_blank" rel="noopener noreferrer">{loc}</a>：{children}</p>;
}
export function Detail({title,children,open}:{title:string,children:React.ReactNode,open?:boolean}){
 return <details open={open} style={{margin:'14px 0',borderTop:'1px solid '+palette.line,paddingTop:12}}><summary style={{cursor:'pointer',minHeight:36,fontWeight:600}}>{title}</summary><div style={{lineHeight:1.7,padding:'8px 0',overflowWrap:'anywhere'}}>{children}</div></details>;
}
export function Metric({label,value}:{label:string,value:React.ReactNode}){return <div className="metric"><div className="l">{label}</div><div className="v" style={{overflowWrap:'anywhere'}}>{value}</div></div>;}
export function MatrixTable({matrix,label,headers}:{matrix:number[][],label:string,headers?:string[]}){
 return <div style={{overflowX:'auto',maxWidth:'100%',margin:'12px 0'}}><table className="paper" style={{width:'100%',fontVariantNumeric:'tabular-nums'}}><caption style={{textAlign:'left',fontWeight:600,marginBottom:8}}>{label} · {matrix.length}×{matrix[0]?.length??0}</caption><thead><tr><th scope="col">行</th>{(matrix[0]||[]).map((_,i)=><th scope="col" key={i}>{headers?.[i]||('第'+(i+1)+'列')}</th>)}</tr></thead><tbody>{matrix.map((row,i)=><tr key={i}><th scope="row">{i+1}</th>{row.map((x,j)=><td key={j}>{fmt(x)}</td>)}</tr>)}</tbody></table></div>;
}
type CanvasProps={label:string,draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void,height?:number,style?:React.CSSProperties}&Pick<React.CanvasHTMLAttributes<HTMLCanvasElement>,'onPointerDown'|'onPointerMove'|'onPointerUp'|'onPointerCancel'>;
export function Canvas({label,draw,height=260,style,...events}:CanvasProps){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;
 try{ctx=setupCanvas(canvas,720,height);}catch{return;}
 canvas.style.width='100%';canvas.style.height='auto';
 const render=()=>{ctx.clearRect(0,0,720,height);ctx.fillStyle=palette.bg;ctx.fillRect(0,0,720,height);draw(ctx,720,height);canvas.classList.add('is-ready');};
 render();return observeCanvas(canvas,render,()=>{});
 },[draw,height]);
 return <canvas ref={ref} role="img" aria-label={label} width={720} height={height} {...events} style={{...style}}/>;
}
export function drawBars(ctx:CanvasRenderingContext2D,values:number[],x:number,y:number,w:number,h:number,color:string=palette.blue,selected=-1){
 const max=Math.max(...values.map(Math.abs),1e-12),step=w/Math.max(values.length,1);
 ctx.strokeStyle=palette.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+w,y+h);ctx.stroke();
 values.forEach((v,i)=>{const bh=Math.abs(v)/max*(h-25),xx=x+i*step+step*.18;ctx.fillStyle=i===selected?palette.orange:color;ctx.fillRect(xx,y+h-bh,step*.64,bh);if(i===selected){ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.strokeRect(xx-2,y+h-bh-2,step*.64+4,bh+4);}ctx.fillStyle=palette.ink;ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(fmt(v,3),xx+step*.32,Math.max(y+18,y+h-bh-8));});
 ctx.textAlign='left';
}
export function drawMatrix(ctx:CanvasRenderingContext2D,m:number[][],x:number,y:number,w:number,h:number,color:string=palette.blue){
 if(!m.length)return;const cols=m[0].length,max=Math.max(...m.flat().map(Math.abs),1e-12),cw=w/cols,ch=h/m.length;
 m.forEach((row,i)=>row.forEach((v,j)=>{ctx.globalAlpha=.08+.82*Math.abs(v)/max;ctx.fillStyle=v<0?palette.orange:color;ctx.fillRect(x+j*cw+2,y+i*ch+2,cw-4,ch-4);ctx.globalAlpha=1;ctx.strokeStyle=palette.line;ctx.lineWidth=1;ctx.strokeRect(x+j*cw+2,y+i*ch+2,cw-4,ch-4);}));
}
export function SpectrumView({matrix,label}:{matrix:number[][],label:string}){
 let sp:ReturnType<typeof spectrum>;try{sp=spectrum(matrix);}catch{return <Feedback tone="bad">矩阵数值无效，不能给出谱结论。</Feedback>;}
 if(!sp.converged)return <Feedback tone="bad">SVD未收敛，当前不显示未经核实的秩。</Feedback>;
 return <div><Canvas label={label+'的奇异值柱图，完整数值见下方表格'} height={220} draw={ctx=>drawBars(ctx,sp.s,35,25,650,160)}/>
 <div className="metrics"><Metric label="数值秩" value={sp.rank}/><Metric label="熵有效秩" value={sp.effective===null?'未定义':fmt(sp.effective)}/><Metric label="教学 k95 / k99" value={sp.k95===null?'未定义':sp.k95+' / '+sp.k99}/></div>
 <MatrixTable matrix={[sp.s]} label={label+' · 奇异值'}/>
 <Detail title="谱指标口径与数值精度"><p>数值秩容差 τ=10⁻¹⁰smax={fmt(sp.threshold)}。熵有效秩用 pᵢ=sᵢ/Σs；教学k95/k99用累计平方能量Σs²。论文没有完整说明 Rank@ 的计算口径，因此这里的教学指标与原报指标分别阅读。</p><p>平方能量总和：{fmt(sp.energy)}。全零矩阵的能量比例与熵有效秩显示未定义。显示为0的小数不一律代表精确零。</p></Detail></div>;
}
export function drawCup(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,color:string=palette.deep){
 ctx.save();ctx.translate(x,y);ctx.scale(size/60,size/60);ctx.fillStyle=palette.bg;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-22,-25);ctx.lineTo(-17,25);ctx.quadraticCurveTo(0,35,17,25);ctx.lineTo(22,-25);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-25,22,6,0,0,2*Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(22,0,12,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.restore();
}
export function drawCamera(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,color:string=palette.blue){
 ctx.save();ctx.translate(x,y);ctx.scale(size/80,size/80);ctx.strokeStyle=color;ctx.fillStyle=palette.bg;ctx.lineWidth=3;ctx.fillRect(-38,-20,76,46);ctx.strokeRect(-38,-20,76,46);ctx.strokeRect(-25,-28,20,8);ctx.beginPath();ctx.arc(3,3,17,0,2*Math.PI);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(3,3,10,0,2*Math.PI);ctx.stroke();ctx.restore();
}
export function drawPhotoCue(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,progress:number){
 const p=Math.max(0,Math.min(1,progress));drawCamera(ctx,x,y,size,p>.7?palette.green:palette.blue);
 ctx.strokeStyle=palette.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+size*.04,y+size*.04,size*.22,-Math.PI/2,-Math.PI/2+p*2*Math.PI);ctx.stroke();
}
export function PhotoScene({action,improved=false}:{action:string,improved?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,560,140);canvas.style.width='100%';canvas.style.height='auto';let raf=0;const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
 const render=(time:number)=>{const p=mq.matches ? .7 : (1-Math.cos((time%3000)/3000*2*Math.PI))/2;ctx.clearRect(0,0,560,140);ctx.fillStyle=palette.bg;ctx.fillRect(0,0,560,140);ctx.fillStyle=palette.env;ctx.fillRect(32,117,496,3);
 ctx.fillStyle='#fff';ctx.strokeStyle=palette.line;ctx.lineWidth=2;ctx.fillRect(215,20,130,90);ctx.strokeRect(215,20,130,90);drawCup(ctx,280,67,52);
 if(action==='slide'){ctx.strokeStyle=palette.support;ctx.beginPath();ctx.moveTo(80,99);ctx.lineTo(440,99);ctx.stroke();drawCamera(ctx,100+300*p,87,62);}
 else if(action==='focus'||action==='calibrate'){drawCamera(ctx,140,72,90);ctx.save();ctx.translate(143,75);ctx.rotate(p*2*Math.PI);ctx.strokeStyle=palette.orange;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(0,-27);ctx.stroke();ctx.restore();}
 else if(action==='practice'){drawCamera(ctx,150,72,90);ctx.fillStyle=palette.orange;ctx.fillRect(122,40+7*p,15,8);}
 else if(action==='aim'){ctx.strokeStyle=palette.blue;ctx.lineWidth=3;ctx.strokeRect(228+65*p,35,40,55);}
 else if(action==='crop'||action==='hero'){const width=action==='hero'?(improved?50+100*p:32+28*p):40+110*p;if(action==='hero'){ctx.fillStyle=palette.bg;ctx.fillRect(215,19,Math.max(0,65-width/2),92);ctx.fillRect(280+width/2,19,Math.max(0,65-width/2),92);}ctx.strokeStyle=improved||action==='crop'?palette.green:palette.red;ctx.lineWidth=4;ctx.strokeRect(280-width/2,24,width,82);}
 else if(action==='turn'){ctx.save();ctx.translate(280,67);ctx.scale(.15+.85*p,1);ctx.fillStyle=palette.env;ctx.fillRect(-66,-48,132,96);ctx.strokeStyle=palette.deep;ctx.strokeRect(-66,-48,132,96);drawCup(ctx,0,0,52);ctx.restore();}
 else {ctx.fillStyle=action==='shade'?palette.deep:palette.env;const x=action==='reveal'?215+130*p:215+60*p;ctx.fillRect(x,19,100,92);ctx.strokeStyle=palette.support;ctx.strokeRect(x,19,100,92);}
 canvas.classList.add('is-ready');};
 const tick=(time:number)=>{render(time);raf=requestAnimationFrame(tick);};const stop=()=>{cancelAnimationFrame(raf);raf=0;};const start=()=>{stop();render(performance.now());if(!mq.matches)raf=requestAnimationFrame(tick);};
 start();const disconnect=observeCanvas(canvas,start,stop);mq.addEventListener('change',start);return()=>{stop();disconnect();mq.removeEventListener('change',start);};
 },[action,improved]);
 return <canvas ref={ref} role="img" aria-label="摄影教学类比，画面不代表模型性能" width={560} height={140}/>;
}

type EvidenceBarRow={name:string,value:number,focus?:boolean};
export function EvidenceBars({rows,label,decimals=4}:{rows:EvidenceBarRow[],label:string,decimals?:number}){
 const maximum=Math.max(...rows.map(row=>row.value),1e-12);
 return <figure className="evidence-bars" aria-label={label} data-scale-min="0" data-scale-max={maximum}>
  <figcaption>{label}<br/><small>同图共同刻度：0 → {maximum.toFixed(decimals)}；所有条形从 0 起。</small></figcaption>
  {rows.map((row,i)=><div className={'evidence-bar-row'+(row.focus?' focus':'')} key={row.name+i}>
    <div className="evidence-bar-label"><span>{row.name}</span><strong>{row.value.toFixed(decimals)}</strong></div>
    <div className="evidence-track" aria-hidden="true"><span style={{width:row.value/maximum*100+'%'}}/></div>
  </div>)}
 </figure>;
}
export function MetricGuide({metric,benchmark=false}:{metric:string,benchmark?:boolean}){
 const descriptions:Record<string,string>={
  AUC:'AUC 是 ROC 曲线下面积，反映分类评分区分正负例的能力，越高越好；它与准确率不同。',
  Acc:'准确率是分类预测正确的比例，越高越好。',
  F1:'F1 是精确率与召回率的调和平均，越高越好。',
  R2:'R² 比较预测误差与均值基线的误差，越高越好；结果可以为负，并不限于 0–1。',
  RMSE:'RMSE 是均方根误差，衡量预测值偏离真实值的程度，越低越好；数值受目标值尺度与预处理影响。',
  rankR2:'平均排名：先在每个数据集的全部参评方法中按 R² 排名，再取平均，越低越好。',
  rankRMSE:'平均排名：先在每个数据集的全部参评方法中按 RMSE 排名，再取平均，越低越好。'
 };
 return <p className="metric-guide">{benchmark&&<>BCCO 是论文采用的表格评测套件，CLS 表示分类、REG 表示回归。 </>}{descriptions[metric]}</p>;
}
