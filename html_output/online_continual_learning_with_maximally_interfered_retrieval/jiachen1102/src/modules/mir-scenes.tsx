import React from 'react';
import {C,useCanvas,drawInstrument,drawNote,roundRect} from './mir-kit';
function pick(c:CanvasRenderingContext2D,x:number,y:number){c.beginPath();c.moveTo(x-9,y-9);c.quadraticCurveTo(x,y-15,x+9,y-9);c.quadraticCurveTo(x+10,y,x,y+13);c.quadraticCurveTo(x-10,y,x-9,y-9);c.fillStyle=C.orange;c.fill();c.strokeStyle=C.brown;c.lineWidth=2;c.stroke();}
function bow(c:CanvasRenderingContext2D,x:number,y:number,angle=0){c.save();c.translate(x,y);c.rotate(angle);roundRect(c,-70,-4,140,8,3,C.brown);c.beginPath();c.moveTo(-65,7);c.quadraticCurveTo(0,12,65,7);c.strokeStyle=C.leaf;c.lineWidth=2;c.stroke();c.restore();}
export function MirScene({scene}:{scene:number}){const ref=useCanvas((c,w,h,time)=>{const t=(Math.sin(time/900)+1)/2;drawInstrument(c,245,81,.87,[0,0,0]);c.strokeStyle=C.env;c.lineWidth=1;c.beginPath();c.moveTo(35,128);c.lineTo(525,128);c.stroke();
 if(scene===1)pick(c,192+(t-.5)*22,78);
 if(scene===2){c.save();c.translate(387,63);c.rotate(t*1.6);roundRect(c,-18,-5,36,10,5,C.orange,C.brown);c.restore();}
 if(scene===3)bow(c,200+(t-.5)*70,68,-.6);
 if(scene===4){const x=430-t*40;c.strokeStyle=C.ink;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(x-10,30);c.lineTo(x-10,62);c.quadraticCurveTo(x,77,x+10,62);c.lineTo(x+10,30);c.moveTo(x,72);c.lineTo(x,111);c.stroke();}
 if(scene===5){roundRect(c,420,78,95,42,3,C.env,C.leaf);drawNote(c,429,35-t*22,71,76,.4,C.blue);}
 if(scene===6){roundRect(c,193,12+(1-t)*38,15,33,7,C.orange,C.brown);}
 if(scene===7)bow(c,294,60+(t-.5)*34,.8);
 if(scene===8){roundRect(c,226,25+t*25,53,11,4,C.brown);roundRect(c,228,36+t*25,8,28,3,C.brown);roundRect(c,270,36+t*25,8,28,3,C.brown);}
 if(scene===9)pick(c,157,55+t*24);
 if(scene===10)bow(c,445,90+t*15,-1.1+t*.2);
 },[scene],{width:560,height:140,animate:true});return <canvas ref={ref} role="img" aria-label={['','拨片拨动一根琴弦','旋转弦轴检查张力','琴弓沿弦滑动','音叉靠近参考琴弦','从谱册提起一张音符卡','松开试拉琴弦的手指','琴弓移动探索相邻琴弦','琴夹下降固定参考位置','拨片轻触完成检查的琴弦','将琴弓放回琴架'][scene]} style={{width:'100%',height:'auto',display:'block'}}/>;}
export function MirHeroScene({method}:{method:boolean}){const ref=useCanvas((c,w,h,time)=>{drawInstrument(c,260,130,1.12,method?[0,0,0]:[0,.9,0]);const t=(Math.sin(time/1000)+1)/2;pick(c,184,method?126+t*10:103+t*10);drawNote(c,465,80,88,105,method?.5:0,method?C.green:C.blue);if(method){c.strokeStyle=C.green;c.lineWidth=3;c.beginPath();c.moveTo(134,130);c.lineTo(422,130);c.stroke();}},[method],{width:620,height:260,animate:true});return <canvas ref={ref} role="img" aria-label={method?'优先检查预测会受损琴弦的 MIR 教学示意':'随机检查未受牵连琴弦的普通回放教学示意'} style={{width:'100%',height:'auto',display:'block'}}/>;}
