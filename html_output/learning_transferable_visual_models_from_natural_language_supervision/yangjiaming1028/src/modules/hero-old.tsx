import React from 'react';
import {ClipCanvas,C,clearScene,roundRect,drawPhoto,drawCaption,drawTarget} from './clip-kit';
export const HeroOld=()=> <ClipCanvas width={560} height={220} label="固定类别的相册，新类别照片无法归入" animate draw={(ctx,w,h,t)=>{
  clearScene(ctx,w,h);const u=(1-Math.cos((t%3600)/3600*Math.PI*2))/2;
  roundRect(ctx,279,38,146,150,9,'#fff',C.red,2);drawCaption(ctx,286,151,132,27,C.red);
  drawPhoto(ctx,85+92*u,39,138,154,'chair',C.blue);drawTarget(ctx,460,115,false);
}}/>;
