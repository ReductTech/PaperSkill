import React from 'react';
import {Scene,clearScene,drawBoard,drawPencil,drawLine,colors} from './drawing';
function Sketch({scene,old=false}:{scene:number;old?:boolean}){
 return <Scene width={560} height={140} animate ariaLabel="画板草图的生活类比动画" draw={(c,w,h,t)=>{
  clearScene(c,w,h);const u=(t%3000)/3000;const e=.5-.5*Math.cos(u*Math.PI*2);const x=175,y=15,bw=210,bh=105;
  if(scene===0){drawBoard(c,x,y,bw,bh,old?4:2,old?colors.light:colors.blue);const p=u*4;const points:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[[.16,.8],[.38,.8],[.38,.58],[.64,.58],[.64,.3]];drawBoard(c,x,y,bw,bh,old?p:2+p/2,old?colors.red:colors.green);const k=Math.min(3,Math.floor(old?p:2+p/2)),f=(old?p:2+p/2)-k;const a=points[k],b=points[k+1];drawPencil(c,x+(a[0]+(b[0]-a[0])*Math.min(f,1))*bw,y+(a[1]+(b[1]-a[1])*Math.min(f,1))*bh,.3,old?colors.red:colors.green);return;}
  drawBoard(c,x,y,bw,bh,scene===1?Math.min(4,u*4):2,colors.blue);
  if(scene===1){drawPencil(c,x+80,y+85-u*40,.3,colors.green)}
  if(scene===2){c.strokeStyle=colors.orange;c.lineWidth=3;c.strokeRect(x+30+e*70,y+25,70,55);drawPencil(c,x+100+e*70,y+25,.3,colors.orange)}
  if(scene===3){c.save();c.globalAlpha=.72;c.fillStyle='#e2f1e8';c.fillRect(x+e*80,y,bw,bh);drawLine(c,[[x+80+e*80,y+60],[x+134+e*80,y+60],[x+134+e*80,y+31]],colors.green,5);c.restore()}
  if(scene===4){const fw=120*Math.cos(u*Math.PI*2);c.fillStyle='#fff';c.strokeStyle=colors.dark;c.lineWidth=2;c.beginPath();c.moveTo(x+bw/2,y);c.lineTo(x+bw/2+fw,y+8);c.lineTo(x+bw/2+fw,y+bh-8);c.lineTo(x+bw/2,y+bh);c.closePath();c.fill();c.stroke()}
  if(scene===5){const q=1-Math.pow(1-u,3);drawLine(c,[[x+80,y+60],[x+80+q*54,y+60]],colors.green,4);drawPencil(c,x+80+q*54,y+60,.2,colors.green)}
  if(scene===6){drawPencil(c,x+134,y+32-e*25,.2-e*.3,colors.green)}
  if(scene===7){drawLine(c,[[x+40,y+40],[x+130,y+40]],colors.light,7);drawLine(c,[[x+40,y+40],[x+40+u*90,y+40]],colors.green,3);drawPencil(c,x+40+u*90,y+40,.3,colors.support)}
  if(scene===8){c.save();c.translate(x+80,y+60);c.rotate((1-e)*.35);c.fillStyle='#e7c49a';c.strokeStyle=colors.support;c.fillRect(0,5,110,17);c.strokeRect(0,5,110,17);for(let j=0;j<11;j++){c.beginPath();c.moveTo(j*10,5);c.lineTo(j*10,11);c.stroke()}c.restore()}
  if(scene===9){c.save();c.translate(e*90,0);c.fillStyle='white';c.strokeStyle=colors.border;c.fillRect(x,y,bw,bh);c.strokeRect(x,y,bw,bh);c.strokeStyle=colors.dark;c.lineWidth=2;c.beginPath();c.moveTo(x+50,y+80);c.lineTo(x+100,y+20);c.lineTo(x+155,y+80);c.closePath();c.stroke();c.restore()}
  if(scene===10){const pts:[number,number][]=[[x+70,y+55],[x+92,y+77],[x+142,y+25]];const q=Math.min(1,u*1.5),k=q<.35?0:1,f=k===0?q/.35:(q-.35)/.65;const a=pts[k],b=pts[k+1];const end:[number,number]=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];drawLine(c,[...pts.slice(0,k+1),end],colors.green,5);drawPencil(c,end[0],end[1],.3,colors.green)}
 }}/>
}
export function HeroOld(){return <Sketch scene={0} old/>}export function HeroNew(){return <Sketch scene={0}/>}
export function Analogy1(){return <Sketch scene={1}/>}export function Analogy2(){return <Sketch scene={2}/>}export function Analogy3(){return <Sketch scene={3}/>}export function Analogy4(){return <Sketch scene={4}/>}export function Analogy5(){return <Sketch scene={5}/>}export function Analogy6(){return <Sketch scene={6}/>}export function Analogy7(){return <Sketch scene={7}/>}export function Analogy8(){return <Sketch scene={8}/>}export function Analogy9(){return <Sketch scene={9}/>}export function Analogy10(){return <Sketch scene={10}/>}
