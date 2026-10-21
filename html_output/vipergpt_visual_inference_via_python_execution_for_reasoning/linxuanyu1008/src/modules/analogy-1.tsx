import React from 'react';
import {ViperCanvas,C,clearScene,line,box,drawLoupe,drawPencil,drawRuler,drawBook} from './viper-kit';
function questionCard(ctx:CanvasRenderingContext2D,x:number,y:number){box(ctx,x,y,105,62,'white',C.dark,5);line(ctx,x+14,y+18,x+84,y+18,C.light,3);line(ctx,x+14,y+31,x+65,y+31,C.light,3);ctx.beginPath();ctx.arc(x+78,y+46,7,0,Math.PI*2);ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.stroke();}
function toolbox(ctx:CanvasRenderingContext2D){box(ctx,440,67,74,43,C.light,C.dark,5);box(ctx,465,57,23,12,'transparent',C.dark,4);line(ctx,440,80,514,80,C.dark,3);box(ctx,472,78,10,8,C.green,C.green,2);}
function person(ctx:CanvasRenderingContext2D,hx:number,hy:number){
 ctx.beginPath();ctx.arc(88,34,14,0,Math.PI*2);ctx.fillStyle='#efe0cc';ctx.fill();ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.stroke();
 box(ctx,67,51,43,46,C.light,C.dark,9);line(ctx,80,96,75,120,C.dark,5);line(ctx,98,96,105,120,C.dark,5);
 line(ctx,106,63,145,74,C.dark,6);line(ctx,145,74,hx,hy,C.dark,5);
 ctx.beginPath();ctx.arc(hx,hy,6,0,Math.PI*2);ctx.fillStyle='#efe0cc';ctx.fill();
}
const Scene:React.FC<{n:number;bad?:boolean}>=({n,bad=false})=><ViperCanvas width={560} height={140} animate ariaLabel="同一位解谜者在桌上检查问题卡与工具，每章只改变一个生活动作" draw={(ctx,time)=>{
 clearScene(ctx,560,140);line(ctx,130,113,530,113,C.dark,4);line(ctx,150,113,144,140,C.dark,4);line(ctx,510,113,516,140,C.dark,4);
 questionCard(ctx,247,39);toolbox(ctx);
 const p=(time%3000)/3000,u=(1-Math.cos(p*2*Math.PI))/2,color=bad?C.red:C.blue;
 let hx=285,hy=78;
 if(n===1){hx=260+u*60;hy=64;person(ctx,hx,hy);drawLoupe(ctx,hx,hy,color,.52);}
 else if(n===3){hx=265+u*65;hy=75;person(ctx,hx,hy);line(ctx,262,78,hx,78,C.green,2);drawPencil(ctx,hx,hy,C.orange,.5);}
 else if(n===2){hx=470-u*155;hy=67-u*22;person(ctx,hx,hy);drawLoupe(ctx,hx,hy,color,.48);}
 else if(n===4){hx=270+u*35;hy=83;person(ctx,hx,hy);drawRuler(ctx,hx-25,83,85);}
 else if(n===5){hx=275;hy=73;person(ctx,hx,hy);drawBook(ctx,255,41,110,60);ctx.beginPath();ctx.moveTo(310,41);ctx.lineTo(310+42*Math.cos(p*2*Math.PI),45);ctx.lineTo(310+42*Math.cos(p*2*Math.PI),95);ctx.lineTo(310,101);ctx.fillStyle='#e8eee1';ctx.fill();ctx.strokeStyle=C.dark;ctx.stroke();}
 else if(n===6){hx=363-u*70;hy=85-u*26;person(ctx,hx,hy);box(ctx,hx-24,hy-17,48,31,'white',C.blue,4);line(ctx,hx-12,hy-3,hx+13,hy-3,C.green,3);}
 else if(n===7){hx=295;hy=66;person(ctx,hx,hy);const width=60*Math.cos(p*2*Math.PI);ctx.save();ctx.translate(hx,hy);box(ctx,-Math.abs(width)/2,-20,Math.max(2,Math.abs(width)),43,'white',C.blue,4);line(ctx,-Math.abs(width)*.25,7,Math.abs(width)*.25,-8,C.green,3);ctx.restore();}
 else if(n===8){hx=210+u*95;hy=58+u*22;person(ctx,hx,hy);box(ctx,hx-32,hy-23,64,43,'white',C.blue,4);line(ctx,hx-19,hy-8,hx+18,hy-8,C.green,3);line(ctx,hx-19,hy+4,hx+12,hy+4,C.light,3);}
 else if(n===9){hx=375-u*60;hy=59+u*21;person(ctx,hx,hy);box(ctx,hx-18,hy-16,36,32,'#fff0df',C.orange,4);line(ctx,hx-9,hy,hx+9,hy,C.orange,3);}
 else{hx=303;hy=51+u*33;person(ctx,hx,hy);box(ctx,hx-14,hy-12,28,19,C.light,C.dark,4);box(ctx,hx-25,hy+6,50,9,C.blue,C.blue,3);if(u>.8){line(ctx,284,90,291,96,C.green,3);line(ctx,291,96,306,84,C.green,3);}}
}}/>;
export const Analogy1:React.FC=()=> <Scene n={1}/>;
export const Analogy2:React.FC=()=> <Scene n={2}/>;
export const Analogy3:React.FC=()=> <Scene n={3}/>;
export const Analogy4:React.FC=()=> <Scene n={4}/>;
export const Analogy5:React.FC=()=> <Scene n={5}/>;
export const Analogy6:React.FC=()=> <Scene n={6}/>;
export const Analogy7:React.FC=()=> <Scene n={7}/>;
export const Analogy8:React.FC=()=> <Scene n={8}/>;
export const Analogy9:React.FC=()=> <Scene n={9}/>;
export const Analogy10:React.FC=()=> <Scene n={10}/>;
export const HeroOld:React.FC=()=> <Scene n={1} bad/>;
export const HeroNew:React.FC=()=> <Scene n={6}/>;
