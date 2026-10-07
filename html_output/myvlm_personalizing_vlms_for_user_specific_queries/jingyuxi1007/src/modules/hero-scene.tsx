import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export function DogDrawing({ personalized=false, pair=false }: { personalized?: boolean; pair?: boolean }) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas) return;
    const c=setupCanvas(canvas,560,230);
    c.fillStyle='#f3f6f8'; c.fillRect(0,0,560,230);
    c.fillStyle='#dde5eb';c.beginPath();c.roundRect(64,84,432,99,18);c.fill();
    c.fillStyle='#c3d0dc';c.beginPath();c.roundRect(68,135,424,50,10);c.fill();
    c.fillStyle='#8a9eae';c.fillRect(92,183,9,19);c.fillRect(460,183,9,19);
    function dog(x:number,color:string){
      c.fillStyle=color;c.beginPath();c.ellipse(x,143,64,25,0,0,Math.PI*2);c.fill();
      c.beginPath();c.ellipse(x+47,107,29,32,0,0,Math.PI*2);c.fill();
      c.fillStyle='#836d5b';c.beginPath();c.ellipse(x+24,105,11,27,-.15,0,Math.PI*2);c.fill();
      c.fillStyle=color;c.beginPath();c.roundRect(x-37,154,16,24,7);c.roundRect(x+14,153,16,25,7);c.fill();
      c.strokeStyle=color;c.lineWidth=13;c.beginPath();c.moveTo(x-50,137);c.quadraticCurveTo(x-93,95,x-65,98);c.stroke();
      c.fillStyle='#21324a';c.beginPath();c.arc(x+51,104,3,0,Math.PI*2);c.arc(x+74,119,4,0,Math.PI*2);c.fill();
      c.fillStyle='#27446e';c.fillRect(x+24,130,43,5);
    }
    dog(pair?190:258,'#b99b7c');
    if(pair)dog(373,'#d0bda7');
    if(personalized){c.strokeStyle='#228d5c';c.lineWidth=3;c.setLineDash([7,5]);c.strokeRect((pair?190:258)-90,68,180,118);c.setLineDash([]);c.fillStyle='#228d5c';c.beginPath();c.roundRect(243,21,74,30,15);c.fill();c.fillStyle='white';c.font='bold 17px system-ui';c.textAlign='center';c.fillText('Max',280,42);}
    canvas.classList.add('is-ready');
  },[personalized,pair]);
  return <canvas className="mv-scene" ref={ref} role="img" aria-label={personalized?'教学示意：指定的狗 Max 坐在沙发上':'教学示意：狗坐在沙发上，尚未绑定用户实例'}/>;
}
export function HeroScene({moduleId}:WidgetProps){
  const personal=moduleId==='new';
  return <div className="mv-hero-widget"><DogDrawing personalized={personal}/><div className="mv-scene-label">{personal?'用户实例：Max':'通用类别：dog'}</div></div>;
}
