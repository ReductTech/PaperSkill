import React from 'react';
import {ClipCanvas,C,clearScene,roundRect,drawPhoto,drawCaption,drawTarget} from './clip-kit';
export const HeroNew=()=> <ClipCanvas width={560} height={220} label="文字描述为相册中的新类别提供匹配依据" animate draw={(ctx,w,h,t)=>{
  clearScene(ctx,w,h);const u=(1-Math.cos((t%3600)/3600*Math.PI*2))/2;
  roundRect(ctx,279,38,146,150,9,'#fff',C.green,2);drawCaption(ctx,286,151,132,27,C.green);
  drawPhoto(ctx,85+198*u,39,138,154,'chair',u>.8?C.green:C.blue);drawTarget(ctx,460,115,true);
}}/>;
