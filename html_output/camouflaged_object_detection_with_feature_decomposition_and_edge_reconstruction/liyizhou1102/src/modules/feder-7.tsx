import { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const W=1080,H=280, ink='#204b49',jade='#29816b',red='#ac493e',paper='#f8f3e7';
type Pen=CanvasRenderingContext2D;
function Plot({paint,label}:{paint:(c:Pen)=>void;label:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,W,H);el.style.maxWidth="100%";el.style.height="auto";
 const render=()=>{c.fillStyle=paper;c.fillRect(0,0,W,H);c.lineWidth=2;c.lineCap='round';c.lineJoin='round';paint(c);el.classList.add('is-ready');};
 const disconnect=observeCanvas(el,render,()=>{});return disconnect;
 },[paint]);return <canvas ref={ref} width={W} height={H} role="img" aria-label={label} style={{maxWidth:'100%',height:'auto'}}/>;
}
function ln(c:Pen,x:number,y:number,x2:number,y2:number,color:string,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function txt(c:Pen,t:string,x:number,y:number,color=ink){c.font='600 24px system-ui';c.fillStyle=color;c.fillText(t,x,y);}
function Pick({options,sel,pick}:{options:string[];sel:number;pick:(i:number)=>void}){return <div className="ctrl">{options.map((s,i)=><button key={s} type="button" aria-pressed={sel===i} style={{background:sel===i?ink:paper,color:sel===i?'white':ink,padding:'8px 14px',marginRight:6,border:'1px solid '+ink,borderRadius:6,cursor:'pointer'}} onClick={()=>pick(i)}>{s}</button>)}</div>;}
const labels=['起点','第一次求值','第二次求值','门控合成','通道耦合'];
const msg=['从当前特征 eₜ 出发；横纵坐标表示两个教学特征分量。','第一次得到 F₁=(2, 1)，只把它加到起点作为下一次试算的位置。','同一组参数作用于新位置，得到 F₂=(1, 2)。两次求值的输入不同。','若 g=0.25，最终增量是 0.25×(2,1)+0.75×(1,2)=(1.25,1.75)；不是把两笔首尾相加。','按通道分为 a、b：先由 b 更新 a，再由新 a′ 更新 b。已知输出时先用 a′ 还原 b，再还原 a。'];
export function Feder7(){const [step,pick]=useState(0);return <div><Plot label={msg[step]} paint={c=>{
 if(step===4){for(let j=0;j<2;j++){let y=90+110*j;ln(c,155,y,915,y,ink,4);c.fillStyle=j?red:jade;c.fillRect(170,y-20,130,40);}ln(c,350,200,495,90,jade,4);ln(c,545,90,705,200,red,4);txt(c,'先加',480,64);txt(c,'后减',700,235);return;}
 for(let x=140;x<=940;x+=100)ln(c,x,32,x,235,'#e1dccd',1);for(let y=40;y<=240;y+=50)ln(c,140,y,940,y,'#e1dccd',1);
 const dot=(x:number,y:number,color:string)=>{c.beginPath();c.arc(x,y,8,0,2*Math.PI);c.fillStyle=color;c.fill();};
 dot(230,220,ink); if(step>0){ln(c,230,220,470,162,jade,5);dot(470,162,jade);}if(step>1){ln(c,470,162,590,46,red,4);dot(590,46,red);}if(step===3){ln(c,230,220,380,118.5,ink,7);dot(380,118.5,ink);txt(c,'最终增量',395,115);}txt(c,'起点',149,245);
 }}/><Pick options={labels} sel={step} pick={pick}/><div className="feedback" aria-live="polite">{msg[step]} <small>（图4、式11–12；向量为教学值）</small></div></div>;}
