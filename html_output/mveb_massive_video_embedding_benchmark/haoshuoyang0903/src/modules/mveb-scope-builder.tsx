import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = { bg:'#f5f8f0', wall:'#b8c9a7', contour:'#76906a', wood:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', purple:'#7c3aed', text:'#21324a', muted:'#68778f', border:'#d7deea', white:'#fff' };
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=8){const q=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();}
function clearGallery(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.32;ctx.fillStyle=C.wall;ctx.fillRect(0,h*.78,w,h*.22);ctx.globalAlpha=1;ctx.strokeStyle=C.contour;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,h*.78);ctx.lineTo(w,h*.78);ctx.stroke();}
function drawVisitor(ctx:CanvasRenderingContext2D,x:number,y:number,s=1){ctx.save();ctx.translate(x,y);ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(0,-15*s,7*s,0,Math.PI*2);ctx.fill();rr(ctx,-12*s,-7*s,24*s,25*s,8*s);ctx.fill();ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(0,3*s,4*s,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawExhibit(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){ctx.fillStyle=C.wood;rr(ctx,x,y,w,h,5);ctx.fill();ctx.fillStyle='#fffdf7';ctx.fillRect(x+5,y+5,w-10,h-10);ctx.strokeStyle=C.contour;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y+h-12);ctx.lineTo(x+w*.5,y+14);ctx.lineTo(x+w-10,y+h-12);ctx.stroke();}
function drawClueCard(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,stroke=C.blue){ctx.fillStyle=C.white;ctx.strokeStyle=stroke;ctx.lineWidth=2;rr(ctx,x,y,w,h,6);ctx.fill();ctx.stroke();}
function drawGuidePath(ctx:CanvasRenderingContext2D,p:Array<[number,number]>,color=C.blue,width=3){if(p.length<2)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...p[0]);p.slice(1).forEach(v=>ctx.lineTo(...v));ctx.stroke();}
function drawVerificationSeal(ctx:CanvasRenderingContext2D,x:number,y:number,r=10,color=C.green){ctx.fillStyle=C.white;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-r*.45,y);ctx.lineTo(x-r*.1,y+r*.34);ctx.lineTo(x+r*.5,y-r*.38);ctx.stroke();}
function drawSceneLabel(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,color=C.text,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font='600 12px "Segoe UI","Microsoft YaHei",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(t,x,y);}
function drawLegend(ctx:CanvasRenderingContext2D,items:Array<[string,string]>,x:number,y:number){let xx=x;for(const [t,c] of items){ctx.fillStyle=c;ctx.beginPath();ctx.arc(xx,y,4,0,Math.PI*2);ctx.fill();drawSceneLabel(ctx,t,xx+8,y,C.muted);xx+=ctx.measureText(t).width+28;}}
function useObservedCanvas(ref:React.RefObject<HTMLCanvasElement|null>,w:number,h:number,draw:(ctx:CanvasRenderingContext2D,now:number)=>void){const dr=useRef(draw);dr.current=draw;useEffect(()=>{const cv=ref.current;if(!cv)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(cv,w,h);}catch{return;}let raf:number|null=null;const tick=(n:number)=>{dr.current(ctx,n);cv.classList.add('is-ready');raf=requestAnimationFrame(tick);};const start=()=>{if(raf===null)raf=requestAnimationFrame(tick);};const stop=()=>{if(raf!==null)cancelAnimationFrame(raf);raf=null;};const off=observeCanvas(cv,start,stop);return()=>{stop();off();};},[ref,w,h]);}

function ScopeAnalogy(){const ref=useRef<HTMLCanvasElement>(null);const began=useRef(performance.now());useObservedCanvas(ref,244,130,(ctx,now)=>{clearGallery(ctx,244,130);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const p=reduced?1:clamp(((now-began.current)%3300)/2200,0,1);drawExhibit(ctx,156,20,68,72);drawVisitor(ctx,42+easeInOutQuad(p)*25,86,.9);drawGuidePath(ctx,[[66,76],[125,62]],C.blue,3);drawClueCard(ctx,112,38,52,64,p>.72?C.green:C.blue);['T','A','V'].forEach((t,i)=>{ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(125+i*13,52,5,0,Math.PI*2);ctx.fill();drawSceneLabel(ctx,t,125+i*13,52,C.white,'center');});if(p>.72)drawVerificationSeal(ctx,151,91,8);drawSceneLabel(ctx,'范围护照',10,14,C.blue);drawSceneLabel(ctx,'模态匹配',234,116,C.green,'right');});return <canvas ref={ref} width={244} height={130} role="img" aria-label="一名访客把模型接口与一张模态范围护照匹配。"/>;}

type Scope='mveb'|'textVideo'|'videoOnly';
const scopes:Record<Scope,{label:string,short:string,count:number,mods:Array<'T'|'A'|'V'>}>={
  mveb:{label:'MVEB 精选基准',short:'完整范围',count:23,mods:['T','A','V']},
  textVideo:{label:'MVEB（文本、视频）子榜',short:'文本、视频',count:19,mods:['T','V']},
  videoOnly:{label:'MVEB（仅视频）子榜',short:'仅视频',count:9,mods:['V']},
};
type ScopeState={scope:Scope;audioChecked:boolean;hasInteracted:boolean};

function ScopeMain({chapterId,moduleId}:WidgetProps){const ref=useRef<HTMLCanvasElement>(null);const [state,setState]=useState<ScopeState>({scope:'mveb',audioChecked:false,hasInteracted:false});const sr=useRef(state);sr.current=state;
  const choose=(scope:Scope)=>setState({scope,audioChecked:false,hasInteracted:true});
  useObservedCanvas(ref,560,240,(ctx)=>{const s=sr.current,d=scopes[s.scope];clearGallery(ctx,560,240);
    ctx.fillStyle='rgba(255,255,255,.78)';ctx.strokeStyle=C.border;ctx.lineWidth=1;rr(ctx,16,62,208,154,10);ctx.fill();ctx.stroke();rr(ctx,322,62,222,154,10);ctx.fill();ctx.stroke();
    const tabs:[Scope,string,number,number][]=[['mveb','完整',16,160],['textVideo','T+V',194,168],['videoOnly','V',380,164]];for(const [id,t,x,w] of tabs){ctx.fillStyle=s.scope===id?C.blue:C.white;ctx.strokeStyle=s.scope===id?C.blue:C.border;rr(ctx,x,10,w,38,8);ctx.fill();ctx.stroke();drawSceneLabel(ctx,t,x+w/2,29,s.scope===id?C.white:C.text,'center');}
    const modX={T:62,A:120,V:178};(['T','A','V'] as const).forEach(m=>{const on=d.mods.includes(m);ctx.fillStyle=on?C.blue:'#eef1f4';ctx.strokeStyle=on?C.blue:C.border;ctx.lineWidth=on?3:1;ctx.beginPath();ctx.arc(modX[m],112,23,0,Math.PI*2);ctx.fill();ctx.stroke();drawSceneLabel(ctx,m,modX[m],112,on?C.white:C.muted,'center');drawSceneLabel(ctx,m==='T'?'文本':m==='A'?'音频':'视频',modX[m],149,on?C.text:C.muted,'center');});
    drawGuidePath(ctx,[[208,112],[260,112],[306,112]],C.blue,3);ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(306,106);ctx.lineTo(318,112);ctx.lineTo(306,118);ctx.closePath();ctx.fill();
    ctx.strokeStyle=C.purple;ctx.lineWidth=1;[0,1,2].forEach(i=>{rr(ctx,340+i*10,78+i*9,176-i*20,112-i*18,10);ctx.stroke();});
    drawClueCard(ctx,374,88,118,98,s.audioChecked?C.green:C.blue);drawSceneLabel(ctx,d.label,433,106,C.text,'center');ctx.fillStyle=C.orange;ctx.font='700 42px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.fillText(String(d.count),433,154);drawSceneLabel(ctx,'个任务',433,174,C.muted,'center');if(s.hasInteracted||s.audioChecked)drawVerificationSeal(ctx,512,84,10);
    drawLegend(ctx,[['纳入',C.blue],['范围外',C.muted],['结论边界',C.red]],26,228);
  });
  const feedback=!state.hasInteracted&&!state.audioChecked?'蓝｜当前显示 MVEB 精选基准：23 个任务，覆盖文本 T、音频 A 与视频 V。':state.audioChecked?'绿｜当前范围包含音频相关任务；这说明评测面覆盖音频，不代表所有音频场景都已解决。':state.scope==='mveb'?'绿｜范围有效：完整 MVEB 在论文发布版中包含 23 个任务。':state.scope==='textVideo'?'绿｜范围有效：文本、视频子榜包含 19 个任务，结论只适用于 T、V 接口。':'绿｜范围有效：仅视频子榜包含 9 个任务，结论只适用于 V 接口。';
  const invalid=state.scope==='textVideo'?'红｜不可外推：文本、视频子榜不含音频任务，不能据此声称具备音频通用性。':state.scope==='videoOnly'?'红｜不可外推：仅视频子榜不含文本或音频任务，不能据此声称具备跨模态通用性。':'';
  const onCanvas=(e:React.PointerEvent<HTMLCanvasElement>)=>{const cv=e.currentTarget,r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;const x=(e.clientX-r.left)*(cv.width/dpr)/r.width,y=(e.clientY-r.top)*(cv.height/dpr)/r.height;if(y>=10&&y<=48){if(x<184)choose('mveb');else if(x<370)choose('textVideo');else choose('videoOnly');}};
  return <div>
    <div className="chip-row" role="group" aria-label="选择评测范围">{(Object.keys(scopes) as Scope[]).map(id=><button key={id} id={`mveb-scope-builder-scope-${id==='textVideo'?'text-video':id==='videoOnly'?'video-only':'mveb'}`} className={`chip ${state.scope===id?'selected':''}`} aria-pressed={state.scope===id} onClick={()=>choose(id)}>{scopes[id].short}</button>)}</div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={560} height={240} onPointerDown={onCanvas} role="img" aria-label={`当前范围为${scopes[state.scope].label}，包含${scopes[state.scope].count}个任务。`}/>
    <div className="step-ctrl"><button id="mveb-scope-builder-audio-check" className="tiny" disabled={state.scope!=='mveb'} aria-describedby="mveb-scope-builder-audio-reason" onClick={()=>setState(v=>({...v,audioChecked:true,hasInteracted:true}))}>检查音频结论</button><button id="mveb-scope-builder-reset" className="tiny ghost" disabled={state.scope==='mveb'&&!state.audioChecked} onClick={()=>setState({scope:'mveb',audioChecked:false,hasInteracted:false})}>恢复完整范围</button></div>
    <div className={`feedback ${state.hasInteracted||state.audioChecked?'good':''}`} role="status" aria-live="polite">{feedback}</div>
    {invalid?<div id="mveb-scope-builder-audio-reason" className="feedback bad">{invalid}</div>:<span id="mveb-scope-builder-audio-reason" hidden>当前范围可检查音频覆盖。</span>}
    <div className="step-desc">判断：没有音频接口的模型进入 MVEB（文本、视频）子榜；也没有文本接口时进入 MVEB（仅视频）子榜。</div>
  </div>;
}

export const MvebScopeBuilder:React.FC<WidgetProps>=(props)=>props.moduleId==='ana'?<ScopeAnalogy/>:<ScopeMain {...props}/>;
export default MvebScopeBuilder;
