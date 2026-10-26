import React from 'react';
import {Canvas,clearScene,drawPhoto,drawPen,drawCard,colors} from './llava-kit';
function Scene({n}:{n:number}){return <Canvas width={560} height={140} animate label={`照片说明的第${n}个生活类比`} draw={(c,t)=>{clearScene(c,560,140);const phase=(t%3000)/3000,s=.5-.5*Math.cos(phase*Math.PI*2);drawPhoto(c,35,15,210,106);
 if(n===1||n===11){c.strokeStyle=colors.orange;c.lineWidth=3;c.beginPath();c.ellipse(92,62,43,37,0,-Math.PI/2,-Math.PI/2+phase*2*Math.PI);c.stroke();drawPen(c,92+43*Math.cos(-Math.PI/2+phase*2*Math.PI),62+37*Math.sin(-Math.PI/2+phase*2*Math.PI),-.7);}
 else if(n===2){c.strokeStyle=colors.orange;c.lineWidth=4;c.strokeRect(45+110*s,30,65,72);}
 else if(n===3){c.strokeStyle=colors.orange;c.lineWidth=4;const w=140+70*s;c.strokeRect(140-w/2,68-w/4,w,w/2);}
 else if(n===4){c.fillStyle='rgba(240,126,71,.18)';c.beginPath();c.arc(72+130*s,66,34,0,Math.PI*2);c.fill();c.strokeStyle=colors.orange;c.stroke();}
 else if(n===5||n===6||n===12){drawCard(c,282,32,225,80);c.strokeStyle=colors.blue;c.lineWidth=3;c.beginPath();c.moveTo(300,80);const end=300+160*phase;c.lineTo(end,80);c.stroke();drawPen(c,end,78,-.65,n===12?colors.green:colors.blue);}
 else if(n===7){drawCard(c,282,32,225,80);c.strokeStyle=colors.red;c.lineWidth=3;c.beginPath();c.moveTo(305+145*s,76);c.lineTo(470,76);c.stroke();c.fillStyle='#d7deea';c.strokeStyle=colors.dark;c.beginPath();c.roundRect(300+145*s,64,35,23,4);c.fill();c.stroke();}
 else if(n===8){c.strokeStyle=colors.dark;c.lineWidth=6;c.beginPath();c.moveTo(340,110);c.lineTo(340,42);c.lineTo(400,42);c.stroke();c.fillStyle=colors.blue;c.beginPath();c.arc(410,49,22,Math.PI,2*Math.PI);c.fill();c.save();c.translate(340,87);c.rotate(s*1.7);c.fillStyle=colors.orange;c.fillRect(-16,-5,32,10);c.restore();}
 else if(n===9){c.fillStyle='#e8e9e5';c.strokeStyle=colors.dark;c.fillRect(160+45*s,16,65,105);c.strokeRect(160+45*s,16,65,105);}
 else {drawCard(c,288,25,210,95);c.fillStyle=colors.green;c.globalAlpha=Math.min(1,phase*3);c.beginPath();c.arc(390,81,22,0,Math.PI*2);c.fill();c.globalAlpha=1;c.fillStyle='#92400e';c.fillRect(377,12+28*s,26,35);c.fillStyle=colors.blue;c.fillRect(362,42+28*s,56,12);}
 }}/>;}
export function Analogy1(){return <Scene n={1}/>;} export function Analogy2(){return <Scene n={2}/>;} export function Analogy3(){return <Scene n={3}/>;} export function Analogy4(){return <Scene n={4}/>;} export function Analogy5(){return <Scene n={5}/>;} export function Analogy6(){return <Scene n={6}/>;} export function Analogy7(){return <Scene n={7}/>;} export function Analogy8(){return <Scene n={8}/>;} export function Analogy9(){return <Scene n={9}/>;} export function Analogy10(){return <Scene n={10}/>;} export function HeroOld(){return <Scene n={11}/>;} export function HeroNew(){return <Scene n={12}/>;}
