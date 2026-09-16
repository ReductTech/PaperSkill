import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const colors = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', ink:'#21324a', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', line:'#d7deea' };
type Ctx = CanvasRenderingContext2D;
export const SharedKit:React.FC<WidgetProps> = () => null;
export function Styles(){return <style>{'.qs{min-width:0;color:#21324a}.qs *{box-sizing:border-box;letter-spacing:0}.qs canvas{width:100%!important;height:auto!important;max-width:100%;display:block;aspect-ratio:27/7}.qs .qs-small{aspect-ratio:4/1}.qs-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:16px 0}.qs button,.qs select,.qs input[type=number]{font:inherit;border:1px solid #bdc9cb;border-radius:5px;padding:8px 13px;background:#fff;color:#21324a;min-height:42px;max-width:100%}.qs button:disabled{opacity:.42;cursor:default}.qs button[aria-pressed=true]{background:#27446e;color:#fff;border-color:#27446e}.qs button:focus-visible,.qs select:focus-visible,.qs canvas:focus-visible{outline:3px solid #f07e47;outline-offset:3px}.qs label{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.qs input[type=range]{accent-color:#27446e;min-width:120px;flex:1}.qs input[type=checkbox]{width:19px;height:19px;accent-color:#27446e}.qs-readout{display:flex;gap:18px;flex-wrap:wrap;padding:12px 0;min-height:52px;font-variant-numeric:tabular-nums}.qs-feedback{margin:12px 0 0;border-left:3px solid #27446e;padding:13px 15px;background:#eef3f8;line-height:1.65;min-height:74px}.qs-feedback.good{border-color:#228d5c;background:#eef7f1}.qs-feedback.bad{border-color:#c43f52;background:#fbf0f2}.qs-timeline{display:flex;gap:0;overflow:auto;padding:8px 0 16px}.qs-timeline button{flex:1;min-width:95px;border-radius:0;border-bottom:4px solid #bdc9cb}.qs-timeline button[aria-pressed=true]{border-bottom-color:#f07e47}.qs-losses{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:10px;margin:14px 0}.qs-losses>div{border-bottom:3px solid #d7deea;padding:12px 8px;line-height:1.7}.qs-losses>div.on{border-color:#228d5c;background:#f0f7f3}.qs-losses span{display:block;font-size:14px}.qs-network{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;position:relative}.qs-network button{min-height:96px;line-height:1.4;text-align:left;border-left:4px solid #b8c9a7}.qs-network small{display:block;font-size:13px;margin-top:8px}.qs-network .downstream{border-color:#228d5c;background:#f0f7f3}.qs-table-wrap{overflow:auto;width:100%;margin-top:16px}.qs table{width:100%;border-collapse:collapse;font-size:14px}.qs th,.qs td{padding:10px 8px;border-bottom:1px solid #e1e6e8;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.qs th:first-child,.qs td:first-child{text-align:left;white-space:normal;min-width:135px}.qs th{color:#52636b;background:#f3f6f7}.qs tr.ours{background:#edf7f1}.qs-bars{display:grid;gap:11px;padding:18px 0}.qs-bar-row{display:grid;grid-template-columns:minmax(100px,180px) minmax(50px,1fr) 70px;align-items:center;gap:12px;font-size:14px}.qs-bar-label{overflow-wrap:anywhere;line-height:1.4}.qs-track{height:16px;background:#edf0f2;border-left:1px solid #64778b}.qs-fill{height:100%;background:#76906a;transition:width 1.2s ease}.qs-bar-value{font-variant-numeric:tabular-nums;text-align:right}.qs-source{font-size:14px;line-height:1.6;margin-top:14px;color:#536376}.qs figure{margin:16px 0}.qs figure img{display:block;width:100%;height:auto}.qs figcaption{font-size:14px;line-height:1.7;margin-top:12px}.qs details{margin-top:16px;padding:12px 0;border-top:1px solid #d7deea}.qs summary{cursor:pointer;font-weight:600}.qs .qs-equation{overflow-wrap:anywhere;padding:14px 0;line-height:1.7;font-family:Georgia,serif}@media(max-width:600px){.qs-network{grid-template-columns:repeat(2,minmax(0,1fr))}.qs-bar-row{grid-template-columns:100px minmax(25px,1fr) 58px;gap:6px;font-size:12px}.qs-controls{gap:8px}.qs-feedback{min-height:110px}.qs button,.qs select{font-size:14px;padding:8px}.qs-readout{font-size:14px}.qs-losses{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.qs-fill{transition:none}}'}</style>}
export function Tool({children}:{children:React.ReactNode}){return <div className="qs" onKeyDown={e=>{if(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)e.stopPropagation()}}><Styles/>{children}</div>}
export function Source({anchor,label}:{anchor:string,label:string}){return <a href={'https://arxiv.org/html/2608.01186v1#'+anchor} target="_blank" rel="noreferrer">{label}</a>}
export function Feedback({children,tone=''}:{children:React.ReactNode,tone?:string}){return <div aria-live="polite" className={'qs-feedback '+tone}>{children}</div>}
export function Choices({labels,value,onChange,label='模式'}:{labels:string[];value:number;onChange:(v:number)=>void;label?:string}){return <div className="qs-controls" role="group" aria-label={label}>{labels.map((s,i)=><button key={s} type="button" aria-pressed={value===i} onClick={()=>onChange(i)}>{s}</button>)}</div>}
export function Steps({value,max,onChange}:{value:number;max:number;onChange:(v:number)=>void}){return <div className="qs-controls"><button title="回到起点" aria-label="回到起点" onClick={()=>onChange(0)}>↶</button><button title="上一步" aria-label="上一步" disabled={value===0} onClick={()=>onChange(value-1)}>←</button><output>{value+1} / {max+1}</output><button title="下一步" aria-label="下一步" disabled={value===max} onClick={()=>onChange(value+1)}>→</button></div>}
export function line(c:Ctx,x:number,y:number,xx:number,yy:number,color:string=colors.line,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()}
export function circle(c:Ctx,x:number,y:number,r:number,color:string){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
export function house(c:Ctx,x:number,y:number,s=1,detail=true,color:string=colors.blue){
 c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';c.lineWidth=3;
 c.fillStyle='#e0e8df';c.strokeStyle=color;c.beginPath();c.moveTo(-85,0);c.lineTo(-85,-95);c.lineTo(0,-157);c.lineTo(85,-95);c.lineTo(85,0);c.closePath();c.fill();c.stroke();
 c.fillStyle='#b8c9a7';c.beginPath();c.moveTo(-98,-93);c.lineTo(0,-167);c.lineTo(98,-93);c.lineTo(85,-83);c.lineTo(0,-144);c.lineTo(-85,-83);c.closePath();c.fill();c.stroke();
 c.fillStyle='#fff';c.fillRect(-62,-78,36,36);c.strokeRect(-62,-78,36,36);c.fillRect(26,-78,36,36);c.strokeRect(26,-78,36,36);
 c.fillStyle='#76906a';c.fillRect(-15,-51,30,51);c.strokeRect(-15,-51,30,51);
 if(detail){for(let j=0;j<5;j++){const yy=-145+j*10;const w=(j+1)*12;line(c,-w,yy,w,yy,color,2)}line(c,-44,-78,-44,-42,color,2);line(c,-62,-60,-26,-60,color,2);line(c,44,-78,44,-42,color,2);line(c,26,-60,62,-60,color,2);for(let yy=-30;yy<0;yy+=12){line(c,-83,yy,-23,yy,color,1);line(c,23,yy,83,yy,color,1)}}
 c.restore();
}
export function brush(c:Ctx,x:number,y:number,color:string=colors.orange){c.save();c.translate(x,y);c.rotate(.35);c.fillStyle='#92400e';c.fillRect(-5,-55,10,47);c.fillStyle=color;c.beginPath();c.moveTo(-8,-8);c.lineTo(8,-8);c.lineTo(0,12);c.closePath();c.fill();c.restore()}
export function gaussian(c:Ctx,x:number,y:number,rx:number,ry:number,angle:number,color:string=colors.blue,alpha=.55){
 c.save();c.translate(x,y);c.rotate(angle);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.globalAlpha=alpha;c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,2*Math.PI);c.fill();c.restore();
}
export function Scene({draw,small=false,label,onDrag}:{draw:(c:Ctx,t:number)=>void;small?:boolean;label:string;onDrag?:(x:number,y:number)=>void}){
 const ref=useRef<HTMLCanvasElement>(null), latest=useRef(draw);latest.current=draw;
 const [paused,setPaused]=useState(false);const pausedRef=useRef(false);pausedRef.current=paused;
 useEffect(()=>{const canvas=ref.current!;const w=small?560:1080,h=small?140:280;const c=setupCanvas(canvas,w,h);canvas.style.width='100%';canvas.style.height='auto';let id=0;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let elapsed=1000,last=0;
 const tick=(t:number)=>{if(last&&!pausedRef.current&&!reduced)elapsed+=Math.min(t-last,50);last=t;c.clearRect(0,0,w,h);c.fillStyle=colors.bg;c.fillRect(0,0,w,h);latest.current(c,elapsed);canvas.classList.add('is-ready');id=requestAnimationFrame(tick)};
 const start=()=>{if(!id)id=requestAnimationFrame(tick)};const stop=()=>{cancelAnimationFrame(id);id=0};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect()};
 },[small]);
 function drag(e:React.PointerEvent<HTMLCanvasElement>){if(!onDrag)return;const r=e.currentTarget.getBoundingClientRect();onDrag(Math.max(0,Math.min(1080,(e.clientX-r.left)/r.width*1080)),Math.max(0,Math.min(280,(e.clientY-r.top)/r.height*280)))}
 return <><canvas className={small?'qs-small':''} ref={ref} aria-label={label} role="img" onPointerDown={e=>{if(onDrag){e.currentTarget.setPointerCapture(e.pointerId);drag(e)}}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))drag(e)}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} style={{touchAction:onDrag?'none':'auto',cursor:onDrag?'grab':'default'}}/><div className="qs-controls"><button aria-label={paused?'播放动画':'暂停动画'} title={paused?'播放动画':'暂停动画'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'▶':'Ⅱ'}</button></div></>;
}
export function Craft({action=0,bad=false}:{action?:number;bad?:boolean}){
 return <Tool><Scene small label="模型手作类比动画" draw={(c,t)=>{const q=(Math.sin(t/1000*2)+1)/2;line(c,55,124,505,124,colors.light,2);
 c.save();c.translate(280,117);
 if(action===3){c.scale(.76+.15*Math.sin(t/1500),.58);house(c,0,0,1,true)}
 else if(action===8){c.scale(.65+q*.12,.58);house(c,0,0,1,true)}
 else {house(c,0,0,.58,!bad,bad?colors.red:colors.blue)}
 c.restore();
 if(action===0){c.fillStyle=colors.dark;c.fillRect(235,15+q*15,90,12);c.fillRect(272,3+q*15,16,20)}
 if(action===1){c.fillStyle=colors.orange;c.globalAlpha=.8;c.fillRect(245+q*15,58,24,32);c.globalAlpha=1}
 if(action===2)brush(c,225+q*105,40, bad?colors.red:colors.green);
 if(action===4){c.fillStyle=colors.light;c.fillRect(205+q*8,36,10,83);for(let j=0;j<8;j++)line(c,205+q*8,40+j*10,211+q*8,40+j*10,colors.ink,1)}
 if(action===5){c.strokeStyle=colors.orange;c.lineWidth=2;c.strokeRect(217+q*25,25,124,94)}
 if(action===6){c.fillStyle=colors.orange;c.fillRect(342+q*35,70,9,53)}
 if(action===7){c.strokeStyle=colors.blue;c.lineWidth=5;c.beginPath();c.arc(252+q*65,75,23,0,Math.PI*2);c.stroke();line(c,269+q*65,93,283+q*65,112,colors.blue,7)}
 if(action===9){line(c,202,119,362,119,colors.dark,3);line(c,202,119,202,86,colors.dark,3);line(c,347-q*12,119,347-q*12,86,colors.dark,3)}
 }}/></Tool>
}
export const HeroOld:React.FC<WidgetProps>=()=> <Craft action={2} bad/>;
export const HeroNew:React.FC<WidgetProps>=()=> <Craft action={2}/>;
export function Bars({rows,max,started=true}:{rows:{label:string;value:number|null;color?:string}[];max:number;started?:boolean}){
 return <div className="qs-bars">{rows.map(r=><div className="qs-bar-row" key={r.label}><span className="qs-bar-label">{r.label}</span><div className="qs-track" aria-hidden="true"><div className="qs-fill" style={{width:(started&&r.value!==null?r.value/max*100:0)+'%',background:r.color||colors.dark}}/></div><span className="qs-bar-value">{r.value===null?'—':r.value.toFixed(4)}</span></div>)}</div>
}
