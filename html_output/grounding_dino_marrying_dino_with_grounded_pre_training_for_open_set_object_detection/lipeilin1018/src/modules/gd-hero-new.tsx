import React from 'react';
import {C,Scene,photo,frame} from './gd-kit';
export function GdHeroNew(){return <Scene width={560} height={240} animate label="任务示意：语言委托指定红鸟，取景框移动至红鸟" draw={(ctx,time)=>{photo(ctx,25,25,510,190);const phase=(time%3)/3;const u=phase<.65?Math.min(1,phase/.5):1;const ease=1-Math.pow(1-u,3);frame(ctx,294-164*ease,68+8*ease,92,73,u>=1?C.green:C.blue);}}/>;}
