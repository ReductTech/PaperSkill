import React from 'react';
import { C, Stage, clearScene, drawPhoto, line, pill } from './BirdKit';

export function Analogy5() {
  return <Stage width={560} height={350} label="同一张观鸟照片的两种观察：比较翅膀与叶片的纹理，比较鸟嘴与树枝的轮廓。两份观察并排保留，再加工记录，并保留原稿。观察角度只是类比，不是改变摄像机位置。"
    render={(c,w,h)=>{
      clearScene(c,w,h);
      c.fillStyle=C.ink;c.font='600 18px sans-serif';
      c.fillText('同一张照片，同时问两个不同的问题',22,30);
      const panels=[{x:20,title:'看纹理：翅膀 ↔ 叶片',color:C.blue,points:[[100,133],[32,80]]},
        {x:294,title:'看轮廓：鸟嘴 ↔ 树枝',color:C.purple,points:[[193,94],[170,169]]}];
      panels.forEach(p=>{
        pill(c,p.x,45,246,238,'#fffefa');
        c.fillStyle=p.color;c.font='600 16px sans-serif';c.fillText(p.title,p.x+12,70);
        drawPhoto(c,p.x+45,88,156);
        p.points.forEach(([px,py])=>{const x=p.x+45+px/224*156,y=88+py/224*156;
          c.strokeStyle=p.color;c.lineWidth=3;c.strokeRect(x-12,y-12,24,24);});
        const [a,b]=p.points;line(c,p.x+45+a[0]/224*156,88+a[1]/224*156,p.x+45+b[0]/224*156,88+b[1]/224*156,p.color,2);
        c.fillStyle=p.color;c.font='15px sans-serif';c.fillText('留下这一角度的观察记录',p.x+22,268);
      });
      pill(c,20,295,520,40,'#e0e8d8');c.fillStyle=C.ink;c.font='600 16px sans-serif';
      c.fillText('并排保留观察 → 加工记录；两次保留原稿',35,321);
    }}/>;
}
