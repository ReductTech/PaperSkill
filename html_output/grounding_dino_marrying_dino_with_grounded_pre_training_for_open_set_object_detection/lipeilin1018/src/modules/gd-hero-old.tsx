import React from 'react';
import {C,Scene,photo,frame} from './gd-kit';
export function GdHeroOld(){return <Scene width={560} height={240} animate label="任务示意：固定鸟类别可以框出两只鸟，无法单独请求红色属性" draw={(ctx,time)=>{photo(ctx,25,25,510,190);const u=(1-Math.cos(time*2*Math.PI/3))/2;frame(ctx,130,76,92,73,C.red,true);frame(ctx,294,68,92,73,C.red,true);ctx.save();ctx.strokeStyle=C.red;ctx.globalAlpha=.35+.4*u;ctx.lineWidth=2;ctx.beginPath();ctx.arc(477,47,8,0,7);ctx.stroke();ctx.restore();}}/>;}
