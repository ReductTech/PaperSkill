import React from 'react';
import { CanvasStage } from './canvas-stage';
import './laboratory-finish.css';
export { CanvasStage };
export const KitAnchor: React.FC = () => null;
export const C={bg:'#f4f1e9',ink:'#152d48',muted:'#536b7c',blue:'#285b86',green:'#2c8b78',red:'#c55158',orange:'#ed8754',purple:'#8b6db1',line:'#d6dfdf'};
export function Feedback({tone='neutral',children}:{tone?:'neutral'|'good'|'bad';children:React.ReactNode}) {
  return <div className={`feedback ${tone==='neutral'?'':tone}`} aria-live="polite"><span className="feedback-mark" aria-hidden="true">{tone==='good'?'✓':tone==='bad'?'!':'i'}</span><div>{children}</div></div>;
}
export function Chips({label,options,value,onChange}:{label?:string;options:{value:string;label:string}[];value:string;onChange:(v:string)=>void}) {
  return <div className="ctrl choice-group" role="group" aria-label={label} onKeyDown={event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.stopPropagation();
    const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const index=buttons.indexOf(event.target as HTMLButtonElement);
    if(index<0) return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+buttons.length)%buttons.length;
    buttons[next].focus(); onChange(options[next].value);
  }}>{label&&<strong className="choice-label">{label}</strong>}{options.map(option=><button key={option.value} type="button" className={`chip ${value===option.value?'selected':''}`} aria-pressed={value===option.value} onClick={()=>onChange(option.value)}>{option.label}</button>)}</div>;
}
export function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
export function txt(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,size=18,color=C.ink,align:CanvasTextAlign='left'){ctx.save();ctx.font=`600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color=C.blue){const a=Math.atan2(y2-y1,x2-x1);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-10*Math.cos(a-.45),y2-10*Math.sin(a-.45));ctx.lineTo(x2-10*Math.cos(a+.45),y2-10*Math.sin(a+.45));ctx.closePath();ctx.fill();}
export function softmax(xs:number[]){const m=Math.max(...xs),ys=xs.map(x=>Math.exp(x-m)),s=ys.reduce((a,b)=>a+b,0);return ys.map(y=>y/s);}
export function drawPhoto(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,kind=0){
  ctx.save();rr(ctx,x,y,w,h,8,'#fff',C.line);ctx.translate(x+w*.5,y+h*.48);const s=Math.min(w,h)*.31;ctx.fillStyle=['#aabf95','#d7ba91','#b8c9df'][kind%3];ctx.fillRect(-w*.43,-h*.39,w*.86,h*.75);
  if(kind===5){ctx.fillStyle='#76906a';ctx.fillRect(-w*.43,-h*.39,w*.86,h*.75);ctx.fillStyle='#b8c9a7';ctx.fillRect(-w*.36,-h*.28,w*.32,h*.3);ctx.fillStyle='#d8c996';ctx.fillRect(w*.02,h*.02,w*.36,h*.27);ctx.strokeStyle='#8db5d0';ctx.lineWidth=w*.11;ctx.beginPath();ctx.moveTo(-w*.43,h*.28);ctx.bezierCurveTo(-w*.1,-h*.2,w*.15,h*.2,w*.43,-h*.3);ctx.stroke();}
  else if(kind===4){ctx.save();ctx.beginPath();ctx.rect(-w*.43,-h*.39,w*.86,h*.75);ctx.clip();ctx.strokeStyle='#92400e';ctx.lineWidth=4;for(let i=-8;i<12;i++){ctx.beginPath();ctx.moveTo(i*14,-h*.4);ctx.lineTo(i*14+h*.8,h*.4);ctx.stroke();}ctx.restore();}
  else if(kind===3){ctx.fillStyle='#89684c';ctx.beginPath();ctx.ellipse(-s*.12,s*.1,s*.8,s*.4,0,0,Math.PI*2);ctx.fill();ctx.fillRect(s*.3,-s*.65,s*.28,s*.9);ctx.beginPath();ctx.ellipse(s*.53,-s*.58,s*.42,s*.21,.12,0,Math.PI*2);ctx.fill();ctx.fillRect(-s*.58,s*.28,s*.14,s*.6);ctx.fillRect(s*.25,s*.28,s*.14,s*.6);ctx.beginPath();ctx.moveTo(s*.35,-s*.68);ctx.lineTo(s*.35,-s*.97);ctx.lineTo(s*.51,-s*.72);ctx.fill();ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(s*.62,-s*.63,s*.035,0,Math.PI*2);ctx.fill();}
  else if(kind===2){for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.ellipse(Math.cos(a)*s*.5,Math.sin(a)*s*.5,s*.36,s*.27,a,0,Math.PI*2);ctx.fillStyle='#e9a0ae';ctx.fill();}ctx.beginPath();ctx.arc(0,0,s*.29,0,Math.PI*2);ctx.fillStyle='#f0bd55';ctx.fill();}
  else if(kind===1){ctx.fillStyle='#674733';[-1,1].forEach(k=>{ctx.beginPath();ctx.ellipse(k*s*.72,s*.03,s*.27,s*.66,k*.18,0,Math.PI*2);ctx.fill();});ctx.fillStyle='#b48b62';ctx.beginPath();ctx.ellipse(0,0,s*.73,s*.7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ead5bd';ctx.beginPath();ctx.ellipse(0,s*.29,s*.38,s*.27,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.ink;[-.31,.31].forEach(k=>{ctx.beginPath();ctx.arc(k*s,-s*.1,s*.06,0,Math.PI*2);ctx.fill();});ctx.beginPath();ctx.ellipse(0,s*.2,s*.14,s*.09,0,0,Math.PI*2);ctx.fill();}
  else {ctx.fillStyle='#ead5bd';ctx.beginPath();ctx.moveTo(-s*.8,-s*.1);ctx.lineTo(-s*.85,-s*.9);ctx.lineTo(-s*.2,-s*.5);ctx.lineTo(s*.2,-s*.5);ctx.lineTo(s*.85,-s*.9);ctx.lineTo(s*.8,-s*.1);ctx.closePath();ctx.fill();ctx.beginPath();ctx.ellipse(0,0,s*.82,s*.68,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.ink;[-.32,.32].forEach(k=>{ctx.beginPath();ctx.arc(k*s,-s*.06,s*.055,0,Math.PI*2);ctx.fill();});ctx.beginPath();ctx.arc(0,s*.21,s*.08,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
export function drawTag(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color=C.orange,values?:number[]){rr(ctx,x,y,w,h,5,'#fffdf7','#cabda4');ctx.fillStyle=color;ctx.fillRect(x+9,y+9,Math.max(8,w*.055),h-18);const n=values?.length||4;for(let i=0;i<n;i++){const slot=(w-44)/n;rr(ctx,x+25+i*slot,y+h*.23,slot-6,h*.54,3,`${color}25`);if(values)txt(ctx,values[i].toFixed(1),x+25+i*slot+(slot-6)/2,y+h*.51,Math.min(14,slot*.34),C.ink,'center');else{ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+29+i*slot,y+h*.5);ctx.lineTo(x+20+(i+1)*slot,y+h*.5);ctx.stroke();}}}
export function GalleryScene({variant=1}:{variant?:number}) {
  return <CanvasStage width={560} height={140} animate label="图片馆标签工作台的生活类比动画" draw={(ctx,w,h,t)=>{
    const wave=Math.sin(t/3000*Math.PI*2), drift=wave*8;
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);rr(ctx,25,105,510,15,7,'#b8c9a7');
    if([1,3,5,6,11,12].includes(variant)){
      drawPhoto(ctx,57,23,102,90,variant===6?1:0);
      if(variant===5){drawTag(ctx,350,48,145,49,C.blue);drawTag(ctx,195+drift,48,145,49,C.orange);}
      else if(variant===12||variant===3){drawTag(ctx,220,45,222,51,C.blue);rr(ctx,253+drift,56,112,29,3,'#ffe0cb');ctx.fillStyle=C.orange;for(let i=0;i<4;i++)ctx.fillRect(261+drift+i*25,65,15,12);rr(ctx,430,39,16,65,3,'#76906a');}
      else{drawTag(ctx,219+(variant===1?drift:0),45+(variant===6?drift*.6:0),222,51,C.orange);if(variant===11){ctx.save();ctx.translate(365+drift,30);ctx.rotate(.4);rr(ctx,0,0,10,70,2,'#d9953b');ctx.fillStyle=C.ink;ctx.beginPath();ctx.moveTo(0,70);ctx.lineTo(10,70);ctx.lineTo(5,82);ctx.fill();ctx.restore();}}
    }else{
      drawTag(ctx,157+(variant===8?drift:0),49,238,49,variant===8?C.blue:C.orange);
      if(variant===2||variant===10){const x=330+drift;ctx.strokeStyle='#92400e';ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,57,29,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+21,78);ctx.lineTo(x+46,103);ctx.stroke();if(variant===10){ctx.strokeStyle=C.green;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(196+i*46,75);ctx.lineTo(201+i*46,81);ctx.lineTo(215+i*46,65);ctx.stroke();}}}
      if(variant===4){rr(ctx,130,106,300,8,2,'#92400e');rr(ctx,310+drift,31,6,81,2,'#76906a');}
      if(variant===7){ctx.save();ctx.translate(295+drift,21);ctx.rotate(.35);rr(ctx,0,0,10,71,2,'#d9953b');ctx.fillStyle=C.ink;ctx.beginPath();ctx.moveTo(0,71);ctx.lineTo(10,71);ctx.lineTo(5,83);ctx.fill();ctx.restore();}
      if(variant===8){rr(ctx,359,41,29,64,4,'#76906a');rr(ctx,366,47,15,49,3,'#dfe6d9');}
      if(variant===9){rr(ctx,160,100,230,11,2,'#cda66f');ctx.strokeStyle='#92400e';for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(167+i*18,100);ctx.lineTo(167+i*18,106);ctx.stroke();}ctx.save();ctx.translate(330+drift,53);ctx.strokeStyle=C.muted;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-14,-25);ctx.lineTo(13,25);ctx.moveTo(14,-25);ctx.lineTo(-13,25);ctx.stroke();ctx.restore();}
    }
  }}/>;
}
