import React from 'react';
import {Scene,photo,frame,C} from './shared-kit';
export function HeroOld(){return <Scene height={180} animate label="旧方法类比：取景后仍需筛选重复框" draw={(ctx,t)=>{photo(ctx,190,22,180,126);frame(ctx,276,55,68,68,C.line);frame(ctx,260,47,73,72,C.line);const a=(1-Math.cos(t/2.8*Math.PI*2))/2;frame(ctx,235+45*a,50,70,68,C.red);}}/>;}
