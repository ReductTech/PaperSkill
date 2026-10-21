import React from 'react';
import {Scene,C,rounded,line,filmFrame} from './shared';
import type {WidgetProps} from './registry';
function lens(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#ffffffaa';ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=color;ctx.stroke();line(ctx,x+r*.7,y+r*.7,x+r*1.45,y+r*1.45,C.brown,9);ctx.restore();}
function paper(ctx:CanvasRenderingContext2D){rounded(ctx,115,22,330,102,'#fff',8);for(let i=0;i<3;i++)line(ctx,148,49+i*23,408,49+i*23,C.edge,3);}
function reel(ctx:CanvasRenderingContext2D,x:number,y:number,a:number){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.arc(0,0,45,0,Math.PI*2);ctx.fillStyle=C.dark;ctx.fill();for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(Math.cos(i*Math.PI*.4)*27,Math.sin(i*Math.PI*.4)*27,10,0,Math.PI*2);ctx.fillStyle=C.bg;ctx.fill();}ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fillStyle=C.blue;ctx.fill();ctx.restore();}
function Analogy({n}:{n:number}){return <Scene width={560} height={140} animate label={`放映室第${n}章生活类比动画`} draw={(ctx,w,h,t)=>{const p=(Math.sin(t*Math.PI*2/3)+1)/2;line(ctx,50,128,510,128,C.pale,3);
 if(n===1||n===9){for(let i=0;i<4;i++)filmFrame(ctx,92+i*95,27,83,90,i,true);lens(ctx,n===1?125+p*260:362,68,n===1?30:25+p*8,C.blue);}
 if(n===2){paper(ctx);const x=155+p*235;line(ctx,152,73,x,73,C.blue,4);ctx.save();ctx.translate(x,73);ctx.rotate(-.5);rounded(ctx,-5,-52,10,52,C.orange,2);ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.lineTo(0,10);ctx.fillStyle=C.brown;ctx.fill();ctx.restore();}
 if(n===3){paper(ctx);rounded(ctx,240,81,85,24,'#e6f0e8',4);for(let i=0;i<4;i++)line(ctx,252+i*16,90,252+i*16,98,C.green,4);const y=26+p*30;rounded(ctx,251,y,63,20,C.blue,4);rounded(ctx,270,y-19,24,25,C.brown,4);}
 if(n===4){paper(ctx);for(let i=0;i<6;i++)line(ctx,178+i*32,50,178+i*32,92,C.blue,7);const x=175+p*174;rounded(ctx,x-22,40,44,62,C.bg,0);rounded(ctx,x-25,25,50,30,C.orange,6);rounded(ctx,x-25,25,22,30,C.pale,5);}
 if(n===5){for(let i=0;i<3;i++)filmFrame(ctx,145+i*100,40,85,78,i,true);const x=125+p*275;ctx.fillStyle='#f07e4725';ctx.beginPath();ctx.moveTo(x,10);ctx.lineTo(x-60,121);ctx.lineTo(x+60,121);ctx.closePath();ctx.fill();rounded(ctx,x-16,6,32,25,C.blue,4);}
 if(n===6){paper(ctx);ctx.save();ctx.translate(280,75);ctx.scale(.6+.4*Math.cos(t*.8),1);rounded(ctx,-90,-45,180,90,C.blue,7);for(let i=0;i<3;i++)line(ctx,-60,-20+i*22,60,-20+i*22,'#e8eff6',4);ctx.restore();}
 if(n===7){rounded(ctx,128,30,165,88,'#fff',8);ctx.globalAlpha=.3+.7*p;filmFrame(ctx,160,37,100,75,3,true);ctx.globalAlpha=1;ctx.save();ctx.translate(390,75);ctx.rotate(p*2);ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fillStyle=C.blue;ctx.fill();line(ctx,0,-11,0,-28,C.orange,6);ctx.restore();}
 if(n===8){paper(ctx);line(ctx,150,84,410,84,C.blue,3);for(let i=0;i<5;i++)line(ctx,155+i*61,79,155+i*61,91,C.dark,2);const x=157+p*246;ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(x-9,35);ctx.lineTo(x+9,35);ctx.lineTo(x+9,76);ctx.lineTo(x,87);ctx.lineTo(x-9,76);ctx.fill();}
 if(n===10){rounded(ctx,245,64,220,38,C.pale,2);for(let i=0;i<8;i++)rounded(ctx,253+i*26,72,17,21,'#fff',1);reel(ctx,240,78,t*.35);}
 }}/>;}
function HeroScene({complete}:{complete:boolean}){return <Scene width={560} height={240} animate label={complete?'有序胶片提供上下文':'单帧只显示局部证据'} draw={(ctx,w,h,t)=>{for(let i=0;i<4;i++){ctx.globalAlpha=complete||i===1?1:.2;filmFrame(ctx,44+i*124,65,108,130,i,complete||i===1);}ctx.globalAlpha=1;const x=complete?98+(Math.sin(t*2*Math.PI/3)+1)*180:226;lens(ctx,x,112,36,complete?C.green:C.red);line(ctx,46,214,514,214,C.pale,2);}}/>;}
export const HeroOld:React.FC<WidgetProps>=()=> <HeroScene complete={false}/>;
export const HeroNew:React.FC<WidgetProps>=()=> <HeroScene complete/>;
export const Analogy1:React.FC<WidgetProps>=()=> <Analogy n={1}/>;
export const Analogy2:React.FC<WidgetProps>=()=> <Analogy n={2}/>;
export const Analogy3:React.FC<WidgetProps>=()=> <Analogy n={3}/>;
export const Analogy4:React.FC<WidgetProps>=()=> <Analogy n={4}/>;
export const Analogy5:React.FC<WidgetProps>=()=> <Analogy n={5}/>;
export const Analogy6:React.FC<WidgetProps>=()=> <Analogy n={6}/>;
export const Analogy7:React.FC<WidgetProps>=()=> <Analogy n={7}/>;
export const Analogy8:React.FC<WidgetProps>=()=> <Analogy n={8}/>;
export const Analogy9:React.FC<WidgetProps>=()=> <Analogy n={9}/>;
export const Analogy10:React.FC<WidgetProps>=()=> <Analogy n={10}/>;
