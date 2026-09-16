import React from 'react';
import {Scene,C,drawDesk,drawPaper,drawPen,drawGuide,drawTarget,line,bar} from './index-kit';

function WritingScene({mode,hero=false}:{mode:number,hero?:boolean}){
 return <Scene width={560} height={140} animate label={hero?'阅读思路类比':'书桌上的写作练习类比'} draw={(c,w,h,t)=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const f=reduced?.65:(t%3000)/3000,q=(1-Math.cos(f*Math.PI*2))/2;
 drawDesk(c,w,h);
 if(hero){drawPaper(c,90,25,380,80);drawGuide(c,130,80,280);const x=130+280*f;const bad=mode===0;c.beginPath();c.moveTo(130,80);for(let i=0;i<=100*f;i++){const xx=130+280*i/100;c.lineTo(xx,80+(bad?12*Math.sin(i/12):0))}c.lineWidth=3;c.strokeStyle=bad?C.red:C.blue;c.stroke();drawPen(c,x,80+(bad?12*Math.sin(f*100/12):0),0,bad?C.red:C.blue);return}
 switch(mode){
 case 1:drawPaper(c,300,35,150,76);drawPaper(c,65,40,65,65);drawTarget(c,350,85);drawPen(c,140+210*q,85);break;
 case 2:drawPaper(c,85,44,390,62);bar(c,90,114,380,8,C.support);for(let i=0;i<15;i++)line(c,100+i*24,114,100+i*24,119,C.light);line(c,280,44,280,106,C.axis);drawPen(c,220+120*q,60);break;
 case 3:drawPaper(c,95,30,115,76);drawGuide(c,115,60,65);drawPaper(c,300,42,155,73);drawTarget(c,165,65);drawPen(c,255-50*q,67);break;
 case 4:drawPaper(c,365,68,100,38);bar(c,296,61,49,47,C.dark);bar(c,300,65,41,36,C.blue);line(c,300,70,341,70,C.orange);drawPen(c,321,45+35*q);break;
 case 5:drawPaper(c,145,47,95,55);drawPaper(c,315,47,95,55);drawGuide(c,160,81,60);drawGuide(c,330,81,60);drawPen(c,210+140*q,78);break;
 case 6:drawPaper(c,125,40,310,60);drawGuide(c,175,84,210);line(c,175,84,175+210*f,84,C.blue,3);drawPen(c,175+210*f,84);break;
 case 7:drawPaper(c,135,55,270,55);bar(c,437,71,28,34,C.support);line(c,205,94,350,94,C.blue,3+4*q);drawPen(c,270,91-10*q);break;
 case 8:for(let i=2;i>=0;i--)drawPaper(c,240+i*3,65+i*10,155,40);bar(c,425,62,13,61,C.support);drawTarget(c,290,70);drawPen(c,290,48+12*q);break;
 case 9:drawPaper(c,180,52,205,55);drawPaper(c,425,58,65,48);drawGuide(c,240,88,105);c.beginPath();c.ellipse(305,88,45,12,0,0,2*Math.PI*f);c.strokeStyle=C.blue;c.lineWidth=2;c.stroke();drawPen(c,305+45*Math.cos(f*2*Math.PI),88+12*Math.sin(f*2*Math.PI));break;
 default:drawPaper(c,145,42,290,62);bar(c,180,107,220,10,C.support);for(let i=0;i<11;i++)line(c,190+i*19,108,190+i*19,113,C.light);line(c,190,88,390,88,C.blue,3);drawPen(c,190+200*q,78);drawTarget(c,390,88);
 }
 }}/>;
}
export function HeroOld(){return <WritingScene mode={0} hero/>}
export function HeroNew(){return <WritingScene mode={1} hero/>}
export function Analogy1(){return <WritingScene mode={1}/>}
export function Analogy2(){return <WritingScene mode={2}/>}
export function Analogy3(){return <WritingScene mode={3}/>}
export function Analogy4(){return <WritingScene mode={4}/>}
export function Analogy5(){return <WritingScene mode={5}/>}
export function Analogy6(){return <WritingScene mode={6}/>}
export function Analogy7(){return <WritingScene mode={7}/>}
export function Analogy8(){return <WritingScene mode={8}/>}
export function Analogy9(){return <WritingScene mode={9}/>}
export function Analogy10(){return <WritingScene mode={10}/>}
