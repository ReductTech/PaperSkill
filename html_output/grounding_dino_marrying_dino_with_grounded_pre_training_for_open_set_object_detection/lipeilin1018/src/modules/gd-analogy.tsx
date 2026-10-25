import React, {useRef} from 'react';
import type {WidgetProps} from './registry';
import {C,ART,Scene,bird,photo,camera,frame,line} from './gd-kit';
export function GdAnalogy({chapterId}:WidgetProps){const chapter=Number(chapterId.replace('chap-',''))||1;
 const focusPhoto=useRef<HTMLCanvasElement|null>(null);
 return <Scene width={560} height={140} animate label={`第${chapter}章摄影类比，自动循环的教学动画`} draw={(ctx,time)=>{
  const u=(1-Math.cos(time*2*Math.PI/3))/2;
  if(chapter===1){photo(ctx,65,20,430,100);frame(ctx,145+135*u,42,75,55,C.blue);}
  if(chapter===2){photo(ctx,65,20,250,100);const r=22+16*u;ctx.save();ctx.translate(390,65);line(ctx,r*.69,r*.69,r*1.4,r*1.4,ART.ink,8);line(ctx,r*.90,r*.85,r*1.34,r*1.29,'#6f8583',2);ctx.fillStyle='#f7f5e9';ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();bird(ctx,0,0,10+8*u,C.red);ctx.strokeStyle=ART.ink;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();ctx.strokeStyle=ART.metal;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,r-3,0,7);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r-6,3.5,4.5);ctx.stroke();ctx.restore();}
  if(chapter===3){
   // One physical action drives both the lens and its optical result.
   // Hold the sharp image long enough to make the focus change easy to see.
   const phase=time%4.8,ease=(v:number)=>v*v*(3-2*v);
   const focus=phase<1.5?ease(phase/1.5):phase<3?1:1-ease((phase-3)/1.8);
   const locked=focus>.97;
   camera(ctx,190,65,45);
   ctx.save();ctx.translate(190,65);ctx.rotate(-1.05+focus*2.1);
   ctx.strokeStyle=ART.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.stroke();
   for(let n=0;n<12;n++){const a=n*Math.PI/6;line(ctx,Math.cos(a)*23,Math.sin(a)*23,Math.cos(a)*27,Math.sin(a)*27,ART.cream,1.2);}
   // An asymmetric focus lever makes the rotation visible even in a small card.
   line(ctx,0,-24,0,-34,ART.ink,8);
   ctx.fillStyle=ART.gold;ctx.beginPath();ctx.roundRect(-5,-40,10,15,3);ctx.fill();
   line(ctx,-2,-36,-2,-30,'#f2dfbb',1.5);ctx.restore();
   // Cache the still photo, then blur the whole image instead of each shape.
   if(!focusPhoto.current){const image=document.createElement('canvas');image.width=352;image.height=212;const imageCtx=image.getContext('2d');if(imageCtx){imageCtx.scale(2,2);photo(imageCtx,0,0,176,106);focusPhoto.current=image;}}
   ctx.save();ctx.beginPath();ctx.rect(330,15,176,106);ctx.clip();ctx.filter=`blur(${((1-focus)*3.8).toFixed(2)}px)`;
   if(focusPhoto.current)ctx.drawImage(focusPhoto.current,330,15,176,106);else photo(ctx,330,15,176,106);
   ctx.restore();ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.strokeRect(330,15,176,106);
   // Viewfinder corners tighten in response to the same focus movement.
   const fx=330+176*.30,fy=15+106*.42,fw=66-22*focus,fh=48-16*focus;
   const fc=locked?C.green:ART.gold;
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{const cx=fx+dx*fw/2,cy=fy+dy*fh/2;line(ctx,cx-dx*7,cy,cx,cy,fc,2);line(ctx,cx,cy,cx,cy-dy*7,fc,2);});
   ctx.save();ctx.font='500 12px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ART.ink;ctx.fillText(locked?'完成对焦':'转动对焦环',190,119);ctx.fillStyle=locked?C.green:C.muted;ctx.fillText(locked?'画面清晰':'对焦中…',418,132);ctx.restore();
  }
  if(chapter===4){line(ctx,220,82,220,126,'#708780',3);line(ctx,220,86,192,128,ART.barkLight,4);line(ctx,220,86,248,128,ART.barkLight,4);line(ctx,190,128,196,128,ART.ink,3);line(ctx,245,128,251,128,ART.ink,3);line(ctx,209,92,231,92,ART.ink,3);photo(ctx,345,24,150,90);camera(ctx,220,64,35,-.28+.45*u);}
  if(chapter===5){photo(ctx,88,25,170,90);photo(ctx,302,25,170,90);ctx.fillStyle=ART.ink;ctx.beginPath();ctx.roundRect(271,18+24*u,18,102-24*u,3);ctx.fill();line(ctx,275,24+24*u,275,114,'#6f8583',1.5);}
  if(chapter===6){photo(ctx,90,20,380,100);frame(ctx,132+45*u,28+12*u,210-130*u,84-22*u,C.blue);}
  if(chapter===7){photo(ctx,100,20,360,100);frame(ctx,166,37,85,62,C.purple,true);const p=((time%3)/3)*4;const vertices=[[166,37],[251,37],[251,99],[166,99],[166,37]];const idx=Math.min(3,Math.floor(p));ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(166,37);for(let i=1;i<=idx;i++)ctx.lineTo(vertices[i][0],vertices[i][1]);const f=p-idx;ctx.lineTo(vertices[idx][0]+(vertices[idx+1][0]-vertices[idx][0])*f,vertices[idx][1]+(vertices[idx+1][1]-vertices[idx][1])*f);ctx.stroke();}
  if(chapter===8){photo(ctx,330,24,160,92);line(ctx,205,90,205,126,ART.ink,3);line(ctx,205,117,194,128,ART.ink,2);line(ctx,205,117,216,128,ART.ink,2);ctx.save();ctx.translate(205,65);ctx.rotate(-.45+.65*u);ctx.fillStyle=ART.cream;ctx.strokeStyle=ART.ink;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,26,44,0,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle=ART.gold;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,22,40,0,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.40)';ctx.beginPath();ctx.ellipse(-7,-6,9,28,.15,0,7);ctx.fill();ctx.restore();}
  if(chapter===9){photo(ctx,350,25,150,90);camera(ctx,205,76,34);ctx.save();ctx.translate(205,47-20*u);ctx.rotate(-.2*u);ctx.fillStyle=ART.ink;ctx.beginPath();ctx.moveTo(-43,0);ctx.quadraticCurveTo(-45,-1,-42,-5);ctx.lineTo(-34,-18);ctx.quadraticCurveTo(0,-22,34,-18);ctx.lineTo(42,-5);ctx.quadraticCurveTo(45,-1,43,0);ctx.closePath();ctx.fill();line(ctx,-39,-3,39,-3,'#617c80',1.7);line(ctx,-30,-17,30,-17,ART.metal,1);ctx.restore();}
  if(chapter===10){photo(ctx,90,20,165,86);photo(ctx,305,20,165,86);const w=80+300*u;ctx.fillStyle='#e2c9a4';ctx.beginPath();ctx.roundRect(90,111,w,16,3);ctx.fill();for(let i=0;i<w;i+=15)line(ctx,90+i,111,90+i,119+(i%30===0?4:0),ART.bark,1);}
 }}/>;
}
