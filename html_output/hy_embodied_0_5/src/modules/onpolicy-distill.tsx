import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W=1040,H=440;
const NODE_HALF=40;
const C={bg:'#f5f8f0',blue:'#27446e',green:'#228d5c',orange:'#d97706',purple:'#7c3aed',red:'#c43f52',text:'#21324a',muted:'#68778f',line:'#d7deea'};
const student=['x','先看杯子','判断把手','向右偏一步','修正抓点','给出动作'];
const teacher=['x','先看杯子','定位把手','直接接近','稳定抓取','给出动作'];
const feedback=[
 '两种方法从同一输入 x 出发，差异尚未出现。',
 '学生开始生成自己的 rollout；此刻前缀仍接近教师路线。',
 '离线轨迹继续沿教师前缀；学生部署已经进入不同状态。',
 'OPD 让教师评估学生前缀，并以 KL(π_t || π_s) 指导下一词元。',
 '纠正持续落在学生真正访问的状态，而不是只看教师轨迹。',
 '序列损失对学生 rollout 各步 KL 做长度归一化平均，不只比较最终答案。'
];
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=10){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function node(ctx:CanvasRenderingContext2D,x:number,y:number,label:string,active:boolean,teacherNode:boolean){ctx.fillStyle='#fff';rr(ctx,x-NODE_HALF,y-20,NODE_HALF*2,40);ctx.fill();ctx.strokeStyle=active?C.orange:teacherNode?C.purple:C.blue;ctx.lineWidth=active?4:2;ctx.stroke();ctx.fillStyle=C.text;ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(label.length>7?label.slice(0,7)+'…':label,x,y+4);ctx.textAlign='left';}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,dash=false){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dash?[6,5]:[]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
function bars(ctx:CanvasRenderingContext2D,x:number,y:number,step:number){const tp=[.55,.3,.15],sp=[.25+.04*step,.47-.03*step,.28-.01*step];ctx.fillStyle=C.muted;ctx.font='12px system-ui';ctx.fillText('示意分布，非论文测量值',x,y-10);['候选 A','候选 B','候选 C'].forEach((lab,i)=>{ctx.fillStyle=C.muted;ctx.fillText(lab,x,y+18+i*32);ctx.fillStyle=C.purple;ctx.fillRect(x+70,y+5+i*32,tp[i]*170,8);ctx.fillStyle=C.blue;ctx.fillRect(x+70,y+16+i*32,sp[i]*170,8);});ctx.fillStyle=C.purple;ctx.fillText('教师 π_t',x+270,y+18);ctx.fillStyle=C.blue;ctx.fillText('学生 π_s',x+270,y+38);}
function draw(ctx:CanvasRenderingContext2D,step:number){ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(520,48);ctx.lineTo(520,214);ctx.stroke();ctx.fillStyle=C.text;ctx.font='800 19px system-ui';ctx.fillText('离线模仿：教师轨迹与学生部署状态会分叉',28,34);ctx.fillText('同策略蒸馏 OPD：教师来到学生前缀',550,34);
 const xs=[50,132,214,296,378,460];for(let i=0;i<6;i++){if(i>0){line(ctx,xs[i-1]+NODE_HALF,90,xs[i]-NODE_HALF,90,C.purple);line(ctx,xs[i-1]+NODE_HALF,160,xs[i]-NODE_HALF,160,i<=1?C.blue:C.red,i>1);}node(ctx,xs[i],90,teacher[i],i===step,true);node(ctx,xs[i],160,student[i],i===step,false);}
 ctx.fillStyle=C.purple;ctx.font='700 13px system-ui';ctx.fillText('教师离线前缀 T_<t',28,68);ctx.fillStyle=C.blue;ctx.fillText('学生部署前缀 S_<t',28,205);if(step>=2){ctx.fillStyle=C.red;ctx.fillText('状态错配',210,133);}
 const ox=[580,662,744,826,908,990];for(let i=0;i<6;i++){if(i>0)line(ctx,ox[i-1]+NODE_HALF,132,ox[i]-NODE_HALF,132,C.blue);node(ctx,ox[i],132,student[i],i===step,false);}ctx.fillStyle=C.blue;ctx.font='700 13px system-ui';ctx.fillText('学生 rollout：y ~ π_s(·|x)',550,76);
 const tx=ox[step];ctx.fillStyle='rgba(124,58,237,.12)';ctx.beginPath();ctx.moveTo(tx-35,38);ctx.lineTo(tx+35,38);ctx.lineTo(tx+18,105);ctx.lineTo(tx-18,105);ctx.closePath();ctx.fill();ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx,55);ctx.lineTo(tx,106);ctx.stroke();ctx.fillStyle=C.purple;ctx.fillText('教师分布',Math.min(940,tx-28),54);
 ctx.fillStyle=C.green;ctx.font='700 14px system-ui';ctx.fillText('KL(π_t || π_s) 在同一学生前缀上计算',610,205);bars(ctx,560,260,step);
 ctx.fillStyle='#fff';rr(ctx,28,232,470,160);ctx.fill();ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=C.text;ctx.font='800 16px system-ui';ctx.fillText(`t=${step} · 当前观察`,48,264);ctx.font='15px system-ui';ctx.fillStyle=C.muted;const lines=feedback[step].match(/.{1,28}/g)||[];lines.forEach((l,i)=>ctx.fillText(l,48,298+i*26));ctx.fillStyle=C.orange;ctx.font='700 13px system-ui';ctx.fillText('离线栏不能改用学生前缀；否则已不是离线模仿。',48,375);
}

export const OnPolicyDistill:React.FC<WidgetProps>=({chapterId,moduleId})=>{const ref=useRef<HTMLCanvasElement>(null);const [decodeStep,setDecodeStep]=useState(2);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);canvas.style.width='100%';canvas.style.height='auto';}catch{return;}let raf=0;const render=()=>{draw(ctx,decodeStep);canvas.classList.add('is-ready');};const start=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});};const stop=()=>{cancelAnimationFrame(raf);raf=0;};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};},[decodeStep]);
 return <div><div className="ctrl"><label htmlFor={`opd-${chapterId}-${moduleId}`}>解码步 <span className="val">t={decodeStep}</span></label><input id={`opd-${chapterId}-${moduleId}`} type="range" min={0} max={5} step={1} value={decodeStep} aria-valuetext={`第 ${decodeStep} 步：${feedback[decodeStep]}`} onChange={e=>setDecodeStep(Number(e.target.value))}/></div>
  <div className="chip-row" role="group" aria-label="选择解码词元步">{student.map((_,i)=><button key={i} className={`chip ${i===decodeStep?'selected':''}`} aria-current={i===decodeStep?'step':undefined} onClick={()=>setDecodeStep(i)}>t={i}</button>)}</div>
  <canvas ref={ref} id={`cv-${chapterId}-${moduleId}`} width={W} height={H} role="img" aria-label={`第 ${decodeStep} 步。离线模仿沿教师前缀，OPD 在学生前缀 ${student[decodeStep]} 上取得教师分布。${feedback[decodeStep]}`}/>
  <div className="feedback good" aria-live="polite">{feedback[decodeStep]}</div>
  <div className="compare-row"><div className="compare-col"><div className="compare-label">离线模仿</div><p style={{fontSize:14}}>只看教师生成轨迹；学生偏离后，部署状态可能未受监督。</p></div><div className="compare-col"><div className="compare-label">同策略蒸馏 OPD</div><p style={{fontSize:14}}>rollout 必须来自 π_s；教师在同一学生前缀上给下一词元分布。</p></div></div>
  <p className="opd-takeaway">不是只让学生背教师的满分答案，而是让教师跟到学生真正犯错的地方，再用 KL 散度指导下一步。</p>
 </div>;
};
export default OnPolicyDistill;
