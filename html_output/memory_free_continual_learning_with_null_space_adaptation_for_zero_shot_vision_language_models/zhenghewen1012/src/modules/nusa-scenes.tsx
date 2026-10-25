import React from 'react';
import { Scene, C, paint, brush, line, dot } from './nusa-kit';
export function AnalogyScene({index,hero=false,old=false}:{index:number;hero?:boolean;old?:boolean}){
return <Scene width={560} height={hero?200:140} animate label={hero?(old?'自由微调笔触越过原画轮廓':'固定遮罩下的细节修补'):'同一幅画的修补示意'} draw={(c,w,h,t)=>{
 const phase=(Math.sin(t/650)+1)/2;const y=hero?32:18,ph=hero?142:103;paint(c,130,y,290,ph,.2+.8*phase,(hero?!old:index===1||index===4)?.60:0);
 if(hero){if(old){c.strokeStyle=C.red;c.lineWidth=7;c.beginPath();c.moveTo(150,y+ph*.3);c.lineTo(150+230*phase,y+ph*.6);c.stroke();brush(c,150+230*phase,y+ph*.6,-.4,C.red);}else brush(c,332+55*phase,y+ph*.83,-.4);return;}
 if(index===3){c.fillStyle='rgba(184,201,167,.7)';c.fillRect(138+phase*35,y+5,165,ph-10);c.strokeStyle=C.dark;c.strokeRect(138+phase*35,y+5,165,ph-10);return;}
 if(index===2){c.fillStyle=C.light;c.fillRect(440,48,60,50);dot(c,455,72,9,C.blue);dot(c,485,72,9,C.green);brush(c,310,88,-.6+phase*.9,C.orange);return;}
 if(index===5){line(c,313,25,313,115,C.dark,3);brush(c,299+35*phase,87,-.25,C.red);return;}
 if(index===6){dot(c,359,89,8+phase*5,C.green);brush(c,359,87+phase*4,-.05);return;}
 if(index===7){brush(c,350,78+phase*16,-.3,C.orange);line(c,336,99,363,99,C.green,2+phase*5);return;}
 if(index===8){c.fillStyle=C.blue;c.fillRect(444,38,21,24);c.fillStyle=C.green;c.fillRect(465,38,21,24);brush(c,352,82+phase*12,.1);return;}
 if(index===9){c.fillStyle=C.light;c.fillRect(444,89,55,8);brush(c,350,82,.1);c.fillStyle=C.green;c.fillRect(347-4*phase,82,6+8*phase,4);return;}
 if(index===10){brush(c,365,89-27*phase,-phase*.2);return;}
 brush(c,324+55*phase,103-8*phase,-.35,index===1?C.orange:C.green);
 }}/>
}
export function NusaScenes(){return null;}
