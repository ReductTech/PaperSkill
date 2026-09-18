import React from 'react';
import {Scene,Palette,drawPresenter,drawDesk,drawMic,drawCard,line} from './omni-kit';
export const HeroOld:React.FC=()=> <Scene width={560} height={210} animate ariaLabel="读取显式文字稿的生活类比，非性能测量" draw={(c,w,h,t)=>{
 const p=(Math.sin(t/3000*Math.PI*2)+1)/2;drawDesk(c,w,h);drawPresenter(c,230,114,1,p,Palette.blue);drawMic(c,340,137,.9);drawCard(c,70,97,90,57);
}}/>;
