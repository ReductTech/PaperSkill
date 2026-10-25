import React from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill} from './BirdKit';
export function Analogy10(){return <Stage width={560} height={286}
 label="考题与成绩对照：换背景认鸟、分辨相似鸟、换成花草题；表现可能有明显优势、非常接近或被反超，不能用一项代表全部。"
 render={(c,w,h)=>{
  clearScene(c,w,h);
  c.save();c.translate(0,-30);
  const text=(s:string,x:number,y:number,size=17,color:string=C.ink)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
  pill(c,14,44,532,259,'#fffefa');line(c,278,55,278,291,C.line,2);
  text('换几套考题',30,71,18,C.blue);text('逐项记成绩',297,71,18,C.blue);
  for(let i=0;i<3;i++){
   const y=88+i*64;
   c.save();c.beginPath();c.rect(31,y,55,55);c.clip();drawPhoto(c,31,y,55);if(i===1){c.fillStyle='rgba(240,126,71,.22)';c.fillRect(31,y,55,55);}c.restore();
   if(i===2){c.fillStyle='#e6eddd';c.fillRect(31,y,55,55);c.fillStyle=C.green;c.fillRect(58,y+25,3,28);c.beginPath();c.ellipse(67,y+41,9,4,-.5,0,Math.PI*2);c.fill();c.fillStyle=C.orange;for(let k=0;k<5;k++){c.beginPath();c.arc(60+9*Math.cos(k*1.26),y+22+9*Math.sin(k*1.26),7,0,7);c.fill();}c.fillStyle='#f2d17c';c.beginPath();c.arc(60,y+22,5,0,Math.PI*2);c.fill();}
   text(['换背景认鸟','分辨相似鸟','换成花草题'][i],99,y+31,17);
   text(['有明显优势','成绩很接近','也可能被反超'][i],297,y+21,17,[C.green,C.muted,C.orange][i]);
   line(c,298,y+39,520,y+39,C.line,2);
   text(['✓ 不能只背熟悉照片','≈ 相近时保留不确定性','↔ 不能用一项代表全部'][i],297,y+56,13,C.muted);
  }
  c.restore();
 }}/>;}
