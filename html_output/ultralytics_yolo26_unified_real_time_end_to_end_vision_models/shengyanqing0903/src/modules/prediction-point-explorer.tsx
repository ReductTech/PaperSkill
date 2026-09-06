import React, {useEffect,useRef,useState} from 'react';
import {setupCanvas} from '../lib/canvasKit';
import type {WidgetProps} from './registry';
import {C,box,clear,dot,label,metric,scalePoint} from './yolo-shared';

type Level='P3'|'P4'|'P5';
const W=720,H=400;
export const PredictionPointExplorer:React.FC<WidgetProps>=()=>{
 const ref=useRef<HTMLCanvasElement>(null); const [level,setLevel]=useState<Level>('P3'); const [point,setPoint]=useState({x:310,y:176}); const [showGT,setShowGT]=useState(true); const [showPos,setShowPos]=useState(false);
 const gx=310,gy=176,gw=112,gh=78; const inside=point.x>gx-gw/2&&point.x<gx+gw/2&&point.y>gy-gh/2&&point.y<gy+gh/2;
 useEffect(()=>{const c=ref.current;if(!c)return;const ctx=setupCanvas(c,W,H);clear(ctx,W,H);ctx.fillStyle='#fff';ctx.fillRect(20,22,465,312);const step=level==='P3'?24:level==='P4'?40:64;ctx.strokeStyle=C.border;ctx.lineWidth=1;for(let x=30;x<485;x+=step){ctx.beginPath();ctx.moveTo(x,30);ctx.lineTo(x,330);ctx.stroke()}for(let y=30;y<335;y+=step){ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(485,y);ctx.stroke()}label(ctx,'抽象图像与特征网格',34,44,C.muted,12,600);ctx.fillStyle=C.light;ctx.beginPath();ctx.ellipse(gx,gy,34,24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.dark;ctx.beginPath();ctx.arc(gx+22,gy-14,10,0,Math.PI*2);ctx.fill(); if(showGT)box(ctx,gx-gw/2,gy-gh/2,gw,gh,C.green); if(showPos){for(const [x,y] of [[286,166],[310,166],[334,166],[310,190]] as number[][])dot(ctx,x,y,C.green,5)}
 dot(ctx,point.x,point.y,inside&&showPos?C.green:C.blue,7);const dx=(point.x-gx)*.35,dy=(point.y-gy)*.3;box(ctx,gx-gw/2+dx,gy-gh/2+dy,gw+Math.abs(dx)*.25,gh+Math.abs(dy)*.25,inside?C.blue:C.red);ctx.strokeStyle=C.blue;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(point.x-11,point.y);ctx.lineTo(point.x+11,point.y);ctx.moveTo(point.x,point.y-11);ctx.lineTo(point.x,point.y+11);ctx.stroke();
 metric(ctx,505,37,190,'当前特征层',`${level} · 网格步长 ${level==='P3'?8:level==='P4'?16:32}`,C.blue);metric(ctx,505,101,190,'分类置信度（示意）',inside?'0.86':'0.18',inside?C.green:C.red);metric(ctx,505,165,190,'左/上/右/下距离',`${Math.max(1,Math.round((point.x-gx+90)/8))}, 7, 8, 6`,C.orange);metric(ctx,505,229,190,'训练分配',showPos?(inside?'正样本':'背景'):'尚未显示',showPos?(inside?C.green:C.red):C.blue);label(ctx,'P3 / P4 / P5 同时生成密集预测',30,368,C.muted,12,600);c.classList.add('is-ready')},[level,point,showGT,showPos,inside]);
 const onPoint=(e:React.PointerEvent<HTMLCanvasElement>)=>{const c=ref.current;if(!c)return;const p=scalePoint(e,c,W,H);if(p.x<20||p.x>485||p.y<22||p.y>334)return;const step=level==='P3'?24:level==='P4'?40:64;setPoint({x:Math.round((p.x-30)/step)*step+30,y:Math.round((p.y-30)/step)*step+30})};
 const feedback=showPos?(inside?{c:'good',t:'任务对齐分配（TAL）将这个位置选为正样本，它会学习当前标注目标。'}:{c:'bad',t:'这个位置没有分配到当前标注目标，因此不接收该目标的边界回归监督。'}):{c:'',t:'当前空间位置正在产生类别与边界框预测。'};
 return <div><canvas ref={ref} width={W} height={H} onPointerDown={onPoint} style={{cursor:'crosshair'}} aria-label="空间位置与预测框交互画布"/>
 <div className="ctrl"><span>特征层</span>{(['P3','P4','P5'] as Level[]).map(v=><button key={v} className={`chip ${level===v?'active':''}`} onClick={()=>setLevel(v)}>{v}</button>)}<button className={`chip ${showGT?'active':''}`} onClick={()=>setShowGT(v=>!v)}>显示标注框</button><button className={`chip ${showPos?'active':''}`} onClick={()=>setShowPos(v=>!v)}>显示 TAL 正样本</button></div>
 <div className={`feedback ${feedback.c}`}>{feedback.t}</div></div>;
};
