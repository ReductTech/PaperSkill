import React from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill} from './BirdKit';

export function Analogy9(){return <Stage width={560} height={380}
 label="同一视野的鸟照片，左为224×224像素、14×14个图块，右为384×384像素、24×24个图块。两侧每个图块均为16×16像素，图中格子的边长也相同。橙色标出同一鸟嘴：旧网格第6行第13列，新网格第11行第21列。"
 render={(c,w,h)=>{
  clearScene(c,w,h);
  c.save();c.translate(0,-37);
  const text=(s:string,x:number,y:number,color:string=C.ink,size=17)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
  text('原输入：224×224',22,66,C.blue,19);
  text('新输入：384×384',270,66,C.blue,19);
  // Both panels use the same display scale (11 px per 16 source pixels).
  // This makes fixed patch size and increasing patch count directly visible.
  const photo=(x:number,y:number,n:number)=>{
   const side=n*11;c.save();c.beginPath();c.rect(x,y,side,side);c.clip();drawPhoto(c,x,y,side,n);c.restore();
   const row=Math.floor(n*94/224),col=Math.floor(n*195/224);
   const px=x+col*11,py=y+row*11;
   c.fillStyle='rgba(240,126,71,.25)';c.fillRect(px,py,11,11);
   c.strokeStyle=C.orange;c.lineWidth=3;c.strokeRect(px-1,py-1,13,13);
   c.beginPath();c.arc(x+195/224*side,y+94/224*side,15,0,Math.PI*2);c.stroke();
   return {row:row+1,col:col+1};
  };
  const old=photo(22,88,14),next=photo(270,88,24);
  line(c,194,166,245,166,C.blue,3);line(c,245,166,235,160,C.blue,3);line(c,245,166,235,172,C.blue,3);
  text('同一视野',188,145,C.muted,15);
  text('14×14 = 196 个图块',22,271,C.blue,18);
  text(`鸟嘴：第 ${old.row} 行、第 ${old.col} 列`,22,300,C.support,16);
  pill(c,21,321,218,62,'#fffefa');
  c.strokeStyle=C.blue;c.lineWidth=2;c.strokeRect(33,337,11,11);c.strokeRect(54,337,11,11);
  text('两侧每一格同样大',77,349,C.ink,16);
  text('始终是 16×16 像素',33,373,C.muted,16);
  text('24×24 = 576 个图块',270,377,C.blue,18);
  text(`同一鸟嘴：第 ${next.row} 行、第 ${next.col} 列`,270,403,C.support,16);
  c.restore();
 }}/>;}
