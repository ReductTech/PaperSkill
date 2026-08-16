import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W=1120,H=520;
const C={bg:'#f5f8f0',blue:'#27446e',green:'#228d5c',orange:'#d97706',purple:'#7c3aed',red:'#c43f52',text:'#21324a',muted:'#68778f',line:'#d7deea'};
type Stage={name:string,input:string,compute:string,output:string,feedback:string};
const stages:Stage[]=[
 {name:'原生分辨率输入',input:'单图 H×W×3',compute:'任意原生分辨率入口',output:'图像 / 帧序列',feedback:'入口不强制成一个固定画布；这里不声称完全没有任何内部预处理。'},
 {name:'HY-ViT 2.0-400M',input:'H×W×3',compute:'视觉编码',output:'N_v 个视觉标记',feedback:'400M 参数视觉编码器提供表示；N_v 随输入而变，不补造隐藏维数。'},
 {name:'追加潜变量标记',input:'N_v 个视觉标记',compute:'每张图 / 每帧追加 z_v',output:'N_v 个视觉标记 + z_v',feedback:'z_v 汇聚全局视觉语义，并在预训练时接受教师对齐。'},
 {name:'视觉 MoT 分支',input:'N_v 个标记 + z_v',compute:'视觉专属 QKV + FFN；全注意力',output:'N_v 个上下文标记 + z_v',feedback:'视觉标记查看完整视觉上下文；参数不与语言分支全部共享。'},
 {name:'文本接入',input:'视觉上下文 + N_t 个文本标记',compute:'原语言 QKV + FFN；因果注意力',output:'N_t 个语言状态',feedback:'文本仍按因果顺序生成；视觉与语言走各自参数路径。'},
 {name:'预训练监督汇合',input:'语言 / 视觉 / 潜变量状态',compute:'L_llm + L_vision + L_global',output:'联合预训练目标',feedback:'三项监督只在预训练汇合；后续阶段仅保留 L_llm。'},
 {name:'回答输出',input:'N_t 个语言状态',compute:'自回归词元预测',output:'回答词元序列',feedback:'输出按因果顺序逐词元生成；不补造输出长度或词表维数。'}
];
const nodeX=[75,235,395,555,715,875,1035], nodeY=[138,138,138,138,138,320,138];
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,active:boolean){ctx.strokeStyle=active?C.green:C.line;ctx.lineWidth=active?3:2;ctx.setLineDash(active?[]:[6,5]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);const a=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=active?C.green:C.line;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-10*Math.cos(a-.5),y2-10*Math.sin(a-.5));ctx.lineTo(x2-10*Math.cos(a+.5),y2-10*Math.sin(a+.5));ctx.closePath();ctx.fill();}
function drawMask(ctx:CanvasRenderingContext2D,x:number,y:number,causal:boolean){for(let r=0;r<4;r++)for(let c=0;c<4;c++){const on=!causal||c<=r;ctx.fillStyle=on?'#dff5e9':'#eef1f5';ctx.fillRect(x+c*13,y+r*13,11,11);if(!on){ctx.strokeStyle=C.muted;ctx.beginPath();ctx.moveTo(x+c*13,y+r*13);ctx.lineTo(x+c*13+11,y+r*13+11);ctx.stroke();}}}
function draw(ctx:CanvasRenderingContext2D,active:number){ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=C.text;ctx.font='800 20px system-ui';ctx.fillText(`MoT-2B 数据路径 · 第 ${active+1}/7 步`,30,36);
 for(let i=0;i<6;i++){if(i===4)arrow(ctx,nodeX[i]+60,nodeY[i],nodeX[5]-60,nodeY[5],active>i);else if(i===5)arrow(ctx,nodeX[5]+60,nodeY[5],nodeX[6]-60,nodeY[6],active>i);else arrow(ctx,nodeX[i]+60,nodeY[i],nodeX[i+1]-60,nodeY[i+1],active>i);}
 stages.forEach((s,i)=>{const x=nodeX[i]-60,y=nodeY[i]-38;ctx.fillStyle=i<=active?'#fff':'#f1f4f7';rr(ctx,x,y,120,76);ctx.fill();ctx.strokeStyle=i===active?C.orange:i<active?C.green:C.line;ctx.lineWidth=i===active?4:i<active?3:2;ctx.stroke();ctx.fillStyle=C.text;ctx.font='700 13px system-ui';ctx.textAlign='center';const parts=s.name.split(' ');ctx.fillText(parts.slice(0,2).join(' '),nodeX[i],y+30);ctx.fillText(parts.slice(2).join(' '),nodeX[i],y+50);});ctx.textAlign='left';
 drawMask(ctx,505,210,false);ctx.fillStyle=C.blue;ctx.font='700 13px system-ui';ctx.fillText('视觉全注意力',492,278);drawMask(ctx,665,210,true);ctx.fillStyle=C.purple;ctx.fillText('语言因果注意力',650,278);
 ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(555,188);ctx.lineTo(715,188);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=C.red;ctx.fillText('× 不交换专属参数 / 注意力规则',555,204);
 const s=stages[active];ctx.fillStyle='#fff';rr(ctx,30,386,1060,104);ctx.fill();ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.stroke();const cols=[['输入',s.input],['计算 / 路由',s.compute],['输出',s.output]];cols.forEach((v,i)=>{const x=54+i*345;ctx.fillStyle=C.muted;ctx.font='700 13px system-ui';ctx.fillText(v[0],x,414);ctx.fillStyle=C.text;ctx.font='700 15px system-ui';ctx.fillText(v[1],x,441);});ctx.fillStyle=C.blue;ctx.font='14px system-ui';ctx.fillText(s.feedback,54,475);
 if(active===5){ctx.fillStyle=C.purple;ctx.font='700 13px system-ui';ctx.fillText('后续阶段：仅 L_llm；L_vision 与 L_global 已移除',655,352);}
}

export const ArchitectureMap:React.FC<WidgetProps>=({chapterId,moduleId})=>{const ref=useRef<HTMLCanvasElement>(null);const [activeStage,setActiveStage]=useState(0);const current=stages[activeStage];
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);canvas.style.width='100%';canvas.style.height='auto';}catch{return;}let raf=0;const render=()=>{draw(ctx,activeStage);canvas.classList.add('is-ready');};const start=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});};const stop=()=>{cancelAnimationFrame(raf);raf=0;};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};},[activeStage]);
 const clickCanvas=(e:React.MouseEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;for(let i=0;i<nodeX.length;i++)if(Math.abs(x-nodeX[i])<=65&&Math.abs(y-nodeY[i])<=45){setActiveStage(i);break;}};
 const keyNav=(e:React.KeyboardEvent<HTMLDivElement>)=>{if(e.key==='ArrowRight'){e.preventDefault();setActiveStage(v=>Math.min(6,v+1));}if(e.key==='ArrowLeft'){e.preventDefault();setActiveStage(v=>Math.max(0,v-1));}if(e.key==='Home'){e.preventDefault();setActiveStage(0);}if(e.key==='End'){e.preventDefault();setActiveStage(6);}};
 return <div onKeyDown={keyNav}><canvas ref={ref} id={`cv-${chapterId}-${moduleId}`} width={W} height={H} onClick={clickCanvas} role="img" aria-label={`第 ${activeStage+1} 步 ${current.name}；输入 ${current.input}；输出 ${current.output}；${current.feedback}`} />
  <div className="chip-row" role="list" aria-label="MoT-2B 架构步骤">{stages.map((s,i)=><button role="listitem" key={s.name} className={`chip ${i===activeStage?'selected':''}`} aria-current={i===activeStage?'step':undefined} onClick={()=>setActiveStage(i)}>{i+1}. {s.name}</button>)}</div>
  <div className="step-ctrl"><button className="tiny ghost" disabled={activeStage===0} onClick={()=>setActiveStage(v=>Math.max(0,v-1))}>← 上一步</button><span className="step-label"><b>{activeStage+1}/7</b> {current.name}</span><button className="tiny" disabled={activeStage===6} onClick={()=>setActiveStage(v=>Math.min(6,v+1))}>下一步 →</button></div>
  <div className="feedback good" aria-live="polite"><b>输入：</b>{current.input}　<b>输出：</b>{current.output}<br/>{current.feedback}</div>
  <table className="paper"><thead><tr><th>当前节点</th><th>输入维度</th><th>计算 / 路由</th><th>输出维度</th></tr></thead><tbody><tr><td>{current.name}</td><td>{current.input}</td><td>{current.compute}</td><td>{current.output}</td></tr></tbody></table>
  <p style={{fontSize:14,color:C.muted}}>灰色叉线表示无效组合：视觉标记不走语言专属 QKV/FFN，文本不使用视觉全注意力；MoT-2B 的路由规则不能套用到 MoE-A32B。</p>
 </div>;
};
export default ArchitectureMap;
