import React from 'react';
import { C, SceneCanvas, drawSetting, drawLeaf, drawLens, drawTrace } from './kit-anchor';

function notebook(ctx:CanvasRenderingContext2D){ctx.save();ctx.fillStyle='#fffdf5';ctx.strokeStyle=C.light;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(148,20,264,103,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(280,24);ctx.lineTo(280,119);ctx.stroke();ctx.restore();}
function pencil(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.save();ctx.translate(x,y);ctx.rotate(-.65);ctx.fillStyle=C.orange;ctx.fillRect(-4,-46,8,39);ctx.fillStyle=C.support;ctx.beginPath();ctx.moveTo(-4,-7);ctx.lineTo(0,3);ctx.lineTo(4,-7);ctx.fill();ctx.restore();}
function Scene({scene,hero}:{scene:number;hero?:'old'|'new'}){
 return <SceneCanvas width={560} height={140} animate aria-label="林间自然观察的生活类比动画" draw={(ctx,time)=>{
  const phase=(time%3000)/3000, wave=Math.sin(phase*Math.PI*2), progress=(1-Math.cos(phase*Math.PI*2))/2;
  drawSetting(ctx,560,140);
  if(scene!==8)notebook(ctx);
  if(scene!==10)drawLeaf(ctx,280,70,.65,hero==='new');
  if(hero){drawLens(ctx,250+40*wave,65,hero==='new'?27+8*progress:20,hero==='new'?C.green:C.blue);return;}
  if(scene===1)drawLens(ctx,240+64*wave,66,26,C.blue);
  if(scene===2){const w=100+95*progress;ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.strokeRect(280-w/2,70-w*.23,w,w*.46);}
  if(scene===3)drawLens(ctx,283,65,22+22*progress,C.blue);
  if(scene===4){const x=208+80*progress;ctx.fillStyle='#27446e19';ctx.strokeStyle=C.blue;ctx.lineWidth=3;ctx.fillRect(x,32,72,77);ctx.strokeRect(x,32,72,77);ctx.fillStyle=C.support;ctx.fillRect(x+29,109,14,14);}
  if(scene===5){ctx.save();ctx.translate(280,70);ctx.rotate(wave*.55);ctx.fillStyle='#7c3aed16';ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-43,-35,86,70,6);ctx.fill();ctx.stroke();ctx.fillStyle=C.support;ctx.fillRect(43,-6,43,12);ctx.restore();}
  if(scene===6){const end=phase*Math.PI*2, points:[number,number][]=[];for(let a=0;a<=end;a+=.08)points.push([280+38*Math.cos(a),70+25*Math.sin(a)]);drawTrace(ctx,points,C.green);pencil(ctx,280+38*Math.cos(end),70+25*Math.sin(end));}
  if(scene===7){const x=245+70*progress;ctx.strokeStyle=C.green;ctx.globalAlpha=.3+.7*progress;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(245,75);ctx.quadraticCurveTo(280,50,x,75);ctx.stroke();ctx.globalAlpha=1;pencil(ctx,x,75);}
  if(scene===8){ctx.save();ctx.translate(280,70);const w=65+55*progress;ctx.fillStyle='#fffdf5';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-48);ctx.lineTo(-w,-38);ctx.lineTo(-w,49);ctx.lineTo(0,40);ctx.lineTo(w,49);ctx.lineTo(w,-38);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-48);ctx.lineTo(0,40);ctx.stroke();ctx.restore();}
  if(scene===9){const y=94+14*wave;ctx.fillStyle='#fff1c5';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.fillRect(188,y,184,20);ctx.strokeRect(188,y,184,20);for(let i=0;i<18;i++){ctx.beginPath();ctx.moveTo(195+i*10,y);ctx.lineTo(195+i*10,y+(i%5?7:13));ctx.stroke();}}
  if(scene===10){ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.beginPath();ctx.arc(280,91,22,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(268,91);ctx.lineTo(278,100);ctx.lineTo(294,81);ctx.stroke();const y=35+32*progress;ctx.fillStyle=C.support;ctx.beginPath();ctx.roundRect(272,y-24,16,27,6);ctx.fill();ctx.fillStyle=C.blue;ctx.fillRect(249,y,62,12);}
 }}/>
}
export const HeroOld:React.FC=()=> <Scene scene={1} hero="old"/>;
export const HeroNew:React.FC=()=> <Scene scene={1} hero="new"/>;
export const Analogy1:React.FC=()=> <Scene scene={1}/>;
export const Analogy2:React.FC=()=> <Scene scene={2}/>;
export const Analogy3:React.FC=()=> <Scene scene={3}/>;
export const Analogy4:React.FC=()=> <Scene scene={4}/>;
export const Analogy5:React.FC=()=> <Scene scene={5}/>;
export const Analogy6:React.FC=()=> <Scene scene={6}/>;
export const Analogy7:React.FC=()=> <Scene scene={7}/>;
export const Analogy8:React.FC=()=> <Scene scene={8}/>;
export const Analogy9:React.FC=()=> <Scene scene={9}/>;
export const Analogy10:React.FC=()=> <Scene scene={10}/>;
