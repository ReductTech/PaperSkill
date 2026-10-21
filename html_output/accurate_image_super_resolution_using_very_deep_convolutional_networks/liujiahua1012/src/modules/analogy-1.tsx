import React from 'react';
import {CanvasPlot,C,clearScene,sketch,pencil,line,box,dot} from './vdsr-kit';
function Scene({n,old=false}:{n:number;old?:boolean}){
 return <CanvasPlot width={560} height={140} label="素描修复的生活类比动画" animate draw={(c,w,h,time)=>{clearScene(c,w,h);const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;const t=reduce?.65:(time%3)/3;const q=(1-Math.cos(t*Math.PI*2))/2;sketch(c,150,14,240,113,n===1?.1:n===3||n===6?q:n===7?1:n===10?1:.4,old?C.red:C.blue);
 if(n===1){pencil(c,175+140*t,55,C.red);}
 if(n===2){const x=190+145*q;dot(c,x,60,23,'#ffffffb0');c.strokeStyle=C.orange;c.lineWidth=5;c.beginPath();c.arc(x,60,23,0,Math.PI*2);c.stroke();line(c,x+17,78,x+40,105,C.support,8);}
 if(n===3||n===6){line(c,197,67,197+134*q,67,C.green,4);pencil(c,197+134*q,67,C.green);}
 if(n===4){box(c,185,87,135,13,C.light);for(let i=0;i<10;i++)line(c,190+i*13,87,190+i*13,94,C.dark,1);box(c,185+80*q,78,45,12,C.orange);}
 if(n===5){const pad=8+q*23; c.strokeStyle=C.support;c.lineWidth=6;c.strokeRect(150-pad,14-pad/3,240+pad*2,113+pad/2);}
 if(n===7){box(c,232+36*q,43,40,19,C.light,C.dark);line(c,238+36*q,45,238+36*q,60,C.support,2);}
 if(n===8){const rad=17+q*21;c.strokeStyle=C.orange;c.lineWidth=5;c.beginPath();c.arc(264,55,rad,0,Math.PI*2);c.stroke();line(c,264+rad*.7,55+rad*.7,306+rad*.7,97+rad*.7,C.support,7);}
 if(n===9){pencil(c,250,67+q*8,C.green,-1.1);dot(c,239,80,3+q*3,C.green);}
 if(n===10){clearScene(c,w,h);c.strokeStyle=C.support;c.lineWidth=7;c.strokeRect(180,10,215,120);sketch(c,120+60*q,22,190,96,1,C.green);}
 }}/>
}
export const Analogy1=()=> <Scene n={1}/>; export const Analogy2=()=> <Scene n={2}/>;
export const Analogy3=()=> <Scene n={3}/>; export const Analogy4=()=> <Scene n={4}/>;
export const Analogy5=()=> <Scene n={5}/>; export const Analogy6=()=> <Scene n={6}/>;
export const Analogy7=()=> <Scene n={7}/>; export const Analogy8=()=> <Scene n={8}/>;
export const Analogy9=()=> <Scene n={9}/>; export const Analogy10=()=> <Scene n={10}/>;
function HeroScene({old}:{old:boolean}){return <CanvasPlot width={560} height={200} label={old?'从空白重画完整图':'保留底稿，补画残差'} animate draw={(c,w,h,time)=>{clearScene(c,w,h);const t=matchMedia('(prefers-reduced-motion: reduce)').matches?.65:(time%3)/3;const progress=Math.min(1,t*1.5);if(old){c.save();c.beginPath();c.rect(110,18,340*progress,160);c.clip();sketch(c,110,18,340,160,1,C.red);c.restore();pencil(c,110+330*progress,110,C.red);}else{sketch(c,110,18,340,160,0,C.blue);line(c,175,100,175+205*progress,100,C.green,4);pencil(c,175+205*progress,100,C.green);}}}/>;}
export const HeroOld=()=> <HeroScene old/>;export const HeroNew=()=> <HeroScene old={false}/>;
