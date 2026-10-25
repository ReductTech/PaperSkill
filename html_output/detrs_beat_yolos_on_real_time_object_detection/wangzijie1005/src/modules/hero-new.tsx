import React from 'react';
import {Scene,photo,frame,C} from './shared-kit';
export function HeroNew(){return <Scene height={180} animate label="RT-DETR类比：取景框逐步对准目标，无需NMS去重" draw={(ctx,t)=>{photo(ctx,190,22,180,126);const a=(1-Math.cos(t/2.8*Math.PI*2))/2;frame(ctx,262+13*a,45+3*a,70-5*a,73-3*a,C.green);}}/>;}
