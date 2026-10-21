import React from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill} from './BirdKit';
export function Analogy8(){return <Stage width={560} height={390}
 label="同一张观鸟照片上的完整观察记录：格位定位鸟嘴、翅膀和叶片，鸟嘴与翅膀的观察相互参照，右侧笔记把局部记录写成一条全图鉴定。类比强调同一份记录不断充实，不能代替下方真实网络的信息路径。"
 render={(c,w,h)=>{
  clearScene(c,w,h);
  const text=(s:string,x:number,y:number,color:string=C.ink,size=17)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
  text('把零散观察，写成同一份完整鉴定',18,32,C.ink,20);
  pill(c,17,57,526,304,'#fffefa');line(c,283,68,283,347,C.line,2);
  drawPhoto(c,37,98,226,4);
  text('同一张照片 · 每格都有地址',32,83,C.muted,16);
  const marks=[{x:223,y:194,n:'1',col:C.orange},{x:146,y:231,n:'2',col:C.blue},{x:82,y:182,n:'3',col:C.dark}];
  marks.forEach(v=>{c.strokeStyle=v.col;c.lineWidth=3;c.strokeRect(v.x-22,v.y-22,44,44);pill(c,v.x-27,v.y-32,22,23,v.col);text(v.n,v.x-21,v.y-15,'white',15);});
  c.strokeStyle=C.purple;c.lineWidth=3;c.beginPath();c.moveTo(215,217);c.quadraticCurveTo(201,267,164,249);c.stroke();line(c,164,249,176,247,C.purple,3);line(c,164,249,170,260,C.purple,3);
  text('局部之间也要相互参照',39,344,C.purple,16);
  text('观鸟笔记 / 同一份记录',299,86,C.ink,18);
  [['1  鸟嘴：形状与所在格位',C.orange],['2  翅膀：纹理与所在格位',C.blue],['3  叶片：辨别背景线索',C.dark]].forEach(([s,col],i)=>{text(String(s),299,126+i*37,String(col),16);line(c,299,138+i*37,523,138+i*37,C.line,1);});
  text('把局部记录互相核对、补充',299,250,C.purple,16);
  pill(c,297,270,229,69,'#e8f2eb');text('全图鉴定',311,295,C.green,18);text('照片中的主要对象：鸟类',311,323,C.ink,16);
  text('看局部、记位置、互相核对，最终形成全图判断',18,381,C.support,16);
 }}/>;}
