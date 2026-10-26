import React from 'react';
import { C, drawAlbum, drawCamera, drawPhoto, roundRect, useCanvas } from './der-kit';
function glass(ctx:CanvasRenderingContext2D,x:number,y:number){
 ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.strokeStyle=C.brown;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(18,18);ctx.lineTo(43,43);ctx.stroke();ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.fillStyle=C.bg;ctx.globalAlpha=.5;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=C.ink;ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(-5,-4,16,3.7,4.8);ctx.strokeStyle=C.env;ctx.lineWidth=3;ctx.stroke();ctx.restore();
}
export function PhotoScene({scene}:{scene:number}){
 const ref=useCanvas((ctx,w,h,time)=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);const t=(Math.sin(time/1050)+1)/2;
  ctx.strokeStyle=C.env;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(35,120);ctx.lineTo(525,120);ctx.stroke();
  if(scene===1){drawPhoto(ctx,65,29,93,80,[.6,.8,.35],C.leaf);drawPhoto(ctx,410,29,93,80,[.4,.2,.7],C.leaf);drawCamera(ctx,280,76,.82,(t-.5)*.25);}
  if(scene===2){drawCamera(ctx,230,78,.95);ctx.save();ctx.translate(386,75);ctx.rotate((t-.5)*2.2);ctx.beginPath();ctx.arc(0,0,33,0,Math.PI*2);ctx.fillStyle=C.env;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(27*Math.cos(a),27*Math.sin(a));ctx.lineTo(32*Math.cos(a),32*Math.sin(a));ctx.stroke();}roundRect(ctx,-3,-33,6,14,2,C.orange);ctx.restore();}
  if(scene===3){drawPhoto(ctx,130,22,290,92,[.35,.6,.8]);glass(ctx,178+t*180,67);}
  if(scene===4){drawAlbum(ctx,265,22,240,88,[],3);drawPhoto(ctx,55+t*292,35,56,68,[.5,.7,.3],C.blue);}
  if(scene===5){drawPhoto(ctx,95,25,137,88,[.4,.7,.5],C.green);ctx.beginPath();ctx.arc(377,74,41,0,Math.PI*2);ctx.fillStyle=C.env;ctx.fill();ctx.strokeStyle=C.leaf;ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(377,74);ctx.rotate((t-.5)*1.7);ctx.beginPath();ctx.arc(0,0,31,0,Math.PI*2);ctx.fillStyle=C.bg;ctx.fill();ctx.strokeStyle=C.ink;ctx.stroke();roundRect(ctx,-3,-29,6,28,2,C.orange);ctx.restore();}
  if(scene===6){drawPhoto(ctx,110,23,157,89,[.4,.65,.5]);roundRect(ctx,325,68,130,36,4,C.bg,C.env);ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(359,86);ctx.lineTo(367,94);ctx.lineTo(389,76);ctx.stroke();ctx.save();ctx.translate(398+t*7,57-t*5);ctx.rotate(.7);roundRect(ctx,-5,-40,10,65,2,C.orange,C.brown);ctx.beginPath();ctx.moveTo(-5,25);ctx.lineTo(5,25);ctx.lineTo(0,39);ctx.closePath();ctx.fillStyle=C.brown;ctx.fill();ctx.restore();}
  if(scene===7){drawCamera(ctx,262,87,.83);drawPhoto(ctx,404,37,79,69,[.4,.7,.5],C.green);roundRect(ctx,282,5+t*11,17,43,8,C.orange,C.brown);}
  if(scene===8){roundRect(ctx,142,48,276,43,20,C.env,C.leaf);roundRect(ctx,158,61,243,17,8,C.bg,C.axis);ctx.strokeStyle=C.green;ctx.lineWidth=2;[267,293].forEach(x=>{ctx.beginPath();ctx.moveTo(x,52);ctx.lineTo(x,86);ctx.stroke();});ctx.beginPath();ctx.ellipse(280+(t-.5)*133,69,12,8,0,0,Math.PI*2);ctx.fillStyle=C.blue;ctx.globalAlpha=.75;ctx.fill();ctx.globalAlpha=1;}
  if(scene===9){drawCamera(ctx,114,80,.7);ctx.beginPath();ctx.ellipse(365,109,79,11,0,0,Math.PI*2);ctx.fillStyle=C.env;ctx.fill();ctx.save();ctx.translate(365,66);ctx.rotate((t-.5)*.8);drawPhoto(ctx,-36,-37,72,79,[.35,.7,.45],C.blue);ctx.restore();}
  if(scene===10){drawAlbum(ctx,116,23,335,86,[3,7,11],3);glass(ctx,155+t*240,60);}
 },[scene],{width:560,height:140,animate:true});
 return <canvas ref={ref} role="img" aria-label={['','相机转向新的拍摄对象','转动相机对焦环','放大镜查看参考照片的色阶','将一张照片放进固定容量相册','转动曝光旋钮对齐参考','用铅笔校正照片标签','按下快门记录当前状态','让水平仪气泡靠近中心','拍摄旋转台上的照片','放大镜比较接触印相册'][scene]||'摄影参考场景'} style={{width:'100%',height:'auto',display:'block'}}/>;
}
export function PhotoHero({dark}:{dark:boolean}){
 const ref=useCanvas((ctx,w,h,time)=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);const swapped=Math.sin(time/1500)>0;
  drawCamera(ctx,110,130,.9);drawPhoto(ctx,245,59,126,142,[.8,.5,.2],C.leaf);
  const tones=dark?[.8,.5,.2]:swapped?[.8,.2,.5]:[.8,.5,.2];
  drawPhoto(ctx,412,59,126,142,tones,dark?C.green:C.blue);
  if(dark){ctx.strokeStyle=C.green;ctx.lineWidth=2;[245,412].forEach(x=>{ctx.beginPath();ctx.moveTo(x-7,77);ctx.lineTo(x-7,52);ctx.lineTo(x+18,52);ctx.stroke();});}
  else{[245,412].forEach(x=>{roundRect(ctx,x+24,206,78,21,3,C.env);ctx.beginPath();ctx.moveTo(x+38,216);ctx.lineTo(x+87,216);ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.stroke();});}
 },[dark],{width:620,height:260,animate:true});
 return <canvas ref={ref} role="img" aria-label={dark?'保存旧输入与完整得分参考，使当前输出向历史输出对齐的教学示意':'只保留题材标签时，非目标得分关系仍可能变化的教学示意'} style={{width:'100%',height:'auto',display:'block'}}/>;
}
