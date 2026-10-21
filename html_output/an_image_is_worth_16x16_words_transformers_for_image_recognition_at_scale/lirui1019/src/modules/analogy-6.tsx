import React from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill} from './BirdKit';
export function Analogy6(){return <Stage width={560} height={420}
 label="观鸟相册类比：照片中的鸟嘴、翅膀与叶片各提供局部观察，把它们写进同一页整图记录，再依据整份记录比较鸟类，而不是让每个图块各投一张类别票。"
 render={(c,w,h)=>{
  clearScene(c,w,h);c.fillStyle=C.ink;c.font='600 18px sans-serif';
  c.fillText('看见几个局部，怎样判断整张照片？',20,31);
  drawPhoto(c,25,80,208);
  const points=[[193,94],[100,133],[32,80]],colors=[C.orange,C.blue,C.muted];
  points.forEach(([x,y],i)=>{const px=25+x/224*208,py=80+y/224*208;
   c.strokeStyle=colors[i];c.lineWidth=3;c.strokeRect(px-13,py-13,26,26);
   line(c,px+13,py,284,104+i*49,colors[i],i===2?1:2);
  });
  pill(c,277,55,263,236,'#fffefa');
  c.fillStyle=C.purple;c.font='600 18px sans-serif';c.fillText('一页整图记录',294,82);
  ['鸟嘴：细长轮廓','翅膀：羽毛与形态','叶片：环境线索'].forEach((t,i)=>{
   c.fillStyle=colors[i];c.font='17px sans-serif';c.fillText(t,294,116+i*49);
   line(c,294,127+i*49,518,127+i*49,C.line,1);
  });
  c.fillStyle=C.ink;c.font='600 16px sans-serif';c.fillText('据整份记录比较候选鸟类',294,274);
  line(c,408,292,408,310,C.purple,2);
  c.fillStyle=C.ink;c.font='600 17px sans-serif';c.fillText('比较候选',25,342);
  ['长嘴型鸟','圆嘴型鸟'].forEach((t,i)=>{
   const x=139+i*204;
   pill(c,x,314,185,59,i===0?'#e1efe5':'#fffefa');
   c.fillStyle=C.blue;c.beginPath();c.arc(x+26,342,13,0,Math.PI*2);c.fill();
   c.fillStyle=C.orange;c.beginPath();c.moveTo(x+36,338);c.lineTo(x+(i===0?62:48),343);c.lineTo(x+36,348);c.closePath();c.fill();
   c.fillStyle=i===0?C.green:C.muted;c.font='600 17px sans-serif';c.fillText(t,x+67,348);
   if(i===0){c.strokeStyle=C.green;c.lineWidth=2;c.strokeRect(x,314,185,59);}
  });
  c.fillStyle=C.support;c.font='16px sans-serif';c.fillText('综合局部线索，再选类别；本图仅作类比',24,403);
 }}/>;}
