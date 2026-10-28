import React from 'react';
import type {WidgetProps} from './registry';
import {ClipCanvas,C,clearScene,roundRect,line,drawPhoto,drawCaption,drawTarget} from './clip-kit';

export const AlbumScene:React.FC<WidgetProps>=({chapterId})=>{
  const n=Number(chapterId.replace('chap-',''))||1;
  return <ClipCanvas width={560} height={140} animate label="相册编辑台上的生活类比动画" draw={(ctx,w,h,t)=>{
    clearScene(ctx,w,h);const p=(t%3200)/3200;const u=(1-Math.cos(p*Math.PI*2))/2;
    const px=232,py=15;line(ctx,65,120,495,120,C.light,2);
    if(n!==1&&n!==8)drawPhoto(ctx,px,py,96,108,'cat');
    if(n===1){roundRect(ctx,228,14,104,106,9,'#fff',C.line);drawCaption(ctx,348,67,106,38);drawPhoto(ctx,100+132*u,15,96,108,'cat',u>.85?C.green:C.blue);}
    if(n===2){const inset=8+13*u;ctx.strokeStyle=C.orange;ctx.lineWidth=4;const x=px-inset,y=py-inset*.3,ww=96+2*inset,hh=108+inset*.4;for(const [xx,yy,sx,sy] of [[x,y,1,1],[x+ww,y,-1,1],[x,y+hh,1,-1],[x+ww,y+hh,-1,-1]]){line(ctx,xx,yy,xx+sx*16,yy,C.orange,3);line(ctx,xx,yy,xx,yy+sy*16,C.orange,3);}}
    if(n===3){drawCaption(ctx,118+112*u,101,104,28,u>.85?C.green:C.blue);}
    if(n===4){ctx.save();ctx.translate(232,120);ctx.rotate(-.7*(1-u));roundRect(ctx,0,-8,180,16,3,'#dfc6a8',C.support,2);for(let i=1;i<18;i++)line(ctx,i*10,-8,i*10,i%5===0?4:0,C.support,1);ctx.restore();}
    if(n===5){drawCaption(ctx,350,77,126,34);line(ctx,363,89,363+85*u,89,C.blue,2);ctx.save();ctx.translate(363+85*u,89);ctx.rotate(-.65);roundRect(ctx,0,-5,52,10,2,C.orange,C.support,1);ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(-11,0);ctx.lineTo(0,5);ctx.closePath();ctx.fillStyle=C.support;ctx.fill();ctx.restore();}
    if(n===6){const x=244+64*u,y=64;ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.fillStyle='#ffffff55';ctx.fill();ctx.strokeStyle=C.blue;ctx.lineWidth=5;ctx.stroke();line(ctx,x+20,y+20,x+45,y+47,C.support,9);}
    if(n===8){drawPhoto(ctx,111,31,69,82,'cat');roundRect(ctx,220,43,116,68,11,'#fff',C.blue,3);roundRect(ctx,236,32,38,16,4,C.light,C.blue,2);roundRect(ctx,306,55,16,10,3,C.light);ctx.beginPath();ctx.arc(270,77,23,0,Math.PI*2);ctx.fillStyle=C.light;ctx.fill();ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.stroke();const x=270+112*u;ctx.beginPath();ctx.arc(x,77,29,0,Math.PI*2);ctx.fillStyle=C.blue;ctx.fill();ctx.beginPath();ctx.arc(x,77,19,0,Math.PI*2);ctx.fillStyle='#dce7ed';ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();line(ctx,x-10,65,x+5,80,'#fff',4);}
    if(n===7){drawCaption(ctx,354,66,130,42);line(ctx,368+90*u,89,465,89,C.red,3);ctx.save();ctx.translate(368+90*u,89);ctx.rotate(-.2);roundRect(ctx,-14,-9,31,18,3,'#eadfd7',C.support,2);ctx.restore();}
    if(n===9){ctx.save();ctx.translate(275,13+12*u);ctx.rotate(-.04*(1-u));roundRect(ctx,-13,-10,26,26,4,C.blue);ctx.strokeStyle=C.support;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-8,-21,16,21,5);ctx.stroke();ctx.restore();}
    if(n===10){ctx.save();ctx.translate(394,80-28*(1-u));roundRect(ctx,-9,-42,18,24,4,C.support);roundRect(ctx,-28,-20,56,18,4,C.blue);ctx.restore();if(u>.7)drawTarget(ctx,394,98,true);}
  }}/>;
};
