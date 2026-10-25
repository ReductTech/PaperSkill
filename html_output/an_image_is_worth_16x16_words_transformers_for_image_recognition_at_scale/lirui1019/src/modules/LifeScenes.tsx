import React from 'react';
import { Stage, C, clearScene, drawPhoto, drawAlbum, line, drawTarget } from './BirdKit';

function lens(c:CanvasRenderingContext2D,x:number,y:number,r:number){
 c.fillStyle='rgba(255,255,255,.3)';c.strokeStyle=C.blue;c.lineWidth=5;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();line(c,x+r*.7,y+r*.7,x+r+23,y+r+23,C.support,10);
}
function pencil(c:CanvasRenderingContext2D,x:number,y:number,angle=-.7){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=C.orange;c.fillRect(0,-5,64,10);c.fillStyle=C.support;c.beginPath();c.moveTo(0,-5);c.lineTo(-14,0);c.lineTo(0,5);c.closePath();c.fill();c.fillStyle=C.ink;c.fillRect(61,-5,7,10);c.restore();}
function frame(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){c.strokeStyle=C.orange;c.lineWidth=5;for(const [sx,sy] of [[0,0],[1,0],[0,1],[1,1]]){let a=x+w*sx,b=y+h*sy;c.beginPath();c.moveTo(a+(sx?-20:20),b);c.lineTo(a,b);c.lineTo(a,b+(sy?-20:20));c.stroke();}}

function Life({chapter}:{chapter:number}){return <Stage width={560} height={140} animate label="观鸟相册中的生活类比" render={(c,w,h,t)=>{
 clearScene(c,w,h);const u=(1-Math.cos(t*Math.PI*2/3))/2;
 if(chapter===8){drawAlbum(c,170,13,220,112);c.save();c.translate(70+100*u,19);c.rotate(-.12*(1-u));drawPhoto(c,0,0,100);c.restore();return;}
 drawAlbum(c,135,8,290,124);drawPhoto(c,153,20,100);
 if(chapter===1){const s=100-50*u;frame(c,153+50-s/2,70-s/2,s,s);}
 if(chapter===2){line(c,291,85,359,65,C.light,3);pencil(c,294+60*u,84-17*u);}
 if(chapter===3){c.save();c.translate(332-59*u,23+8*u);c.fillStyle=C.orange;c.beginPath();c.moveTo(0,0);c.lineTo(28,0);c.lineTo(0,28);c.closePath();c.fill();c.restore();}
 if(chapter===4){lens(c,180+37*u,61+10*u,25);}
 if(chapter===5){c.save();c.translate(326,65);c.rotate((u-.5)*.42);c.fillStyle=C.blue;c.beginPath();c.roundRect(-42,-15,31,42,8);c.roundRect(8,-15,31,42,8);c.fill();line(c,-15,0,14,0,C.blue,10);c.strokeStyle=C.support;c.lineWidth=4;for(const x of [-27,24]){c.beginPath();c.arc(x,28,17,0,Math.PI*2);c.stroke();}c.restore();}
 if(chapter===6){c.fillStyle='#fffefa';c.fillRect(285,35,100,70);line(c,297,58,360,58,C.light,2);line(c,297,78,297+61*u,78,C.blue,3);pencil(c,297+61*u,78);}
 if(chapter===7){line(c,288,80,358,59,C.light,3);line(c,288,80,288+70*u,80-21*u,C.blue,3);pencil(c,288+70*u,80-21*u,-.5);}
 if(chapter===9){lens(c,203,67,22+11*u);}
 if(chapter===10){c.fillStyle=C.blue;c.beginPath();const y=12+22*u;c.moveTo(322,y);c.lineTo(351,y);c.lineTo(351,y+65);c.lineTo(337,y+54);c.lineTo(322,y+65);c.closePath();c.fill();drawTarget(c,337,y+22,8,C.green);}
 }}/ >;}

export function Analogy1(){return <Life chapter={1}/>;}
export function Analogy2(){return <Life chapter={2}/>;}
export function Analogy3(){return <Life chapter={3}/>;}
export function Analogy4(){return <Life chapter={4}/>;}
export function Analogy5(){return <Life chapter={5}/>;}
export function Analogy6(){return <Life chapter={6}/>;}
export function Analogy7(){return <Life chapter={7}/>;}
export function Analogy8(){return <Life chapter={8}/>;}
export function Analogy9(){return <Life chapter={9}/>;}
export function Analogy10(){return <Life chapter={10}/>;}

function HeroView({broad}:{broad:boolean}){return <Stage width={560} height={240} animate label={broad?'图块序列与可学习关系的直觉示意':'卷积局部视觉先验的直觉示意'} render={(c,w,h,t)=>{clearScene(c,w,h);drawAlbum(c,104,12,352,215);drawPhoto(c,119,25,190);const u=(Math.sin(t*Math.PI*2/3)+1)/2;const x=broad?156+106*u:244+20*u;const y=broad?99+30*Math.sin(t*Math.PI*2/3):87;lens(c,x,y,broad?46:24);}}/>;}
export function HeroOld(){return <HeroView broad={false}/>;}
export function HeroNew(){return <HeroView broad/>;}
