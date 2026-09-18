import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const sceneColors = {bg:'#f5f8f0', passive:'#b8c9a7', contour:'#76906a', support:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', text:'#21324a', border:'#d7deea'};
const C=sceneColors;
export function clearScene(ctx:CanvasRenderingContext2D,w=560,h=140){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=C.passive;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(35,h-17);ctx.lineTo(w-35,h-17);ctx.stroke();}
export function drawPaper(ctx:CanvasRenderingContext2D,x:number,y:number,w=155,h=102,marked=0){
 ctx.save();ctx.fillStyle=C.passive;ctx.fillRect(x+4,y+4,w,h);ctx.fillStyle='#fffef9';ctx.strokeStyle=C.contour;ctx.lineWidth=1.8;ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();ctx.stroke();
 // A small bag icon identifies the list as a life object, without dense text.
 ctx.strokeStyle=C.support;ctx.strokeRect(x+14,y+12,13,13);ctx.beginPath();ctx.arc(x+20.5,y+12,4,Math.PI,0);ctx.stroke();
 for(let i=0;i<3;i++){const yy=y+39+i*20;ctx.strokeStyle=C.passive;ctx.strokeRect(x+15,yy-5,8,8);ctx.beginPath();ctx.moveTo(x+35,yy);ctx.lineTo(x+w-15-(i%2)*20,yy);ctx.stroke();if(i<marked){ctx.strokeStyle=C.blue;ctx.lineWidth=2.7;ctx.beginPath();ctx.moveTo(x+15,yy-1);ctx.lineTo(x+19,yy+3);ctx.lineTo(x+26,yy-6);ctx.stroke();}}
 ctx.restore();
}
export function drawPen(ctx:CanvasRenderingContext2D,x:number,y:number,angle=-.65){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=C.support;ctx.strokeStyle=C.text;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-5,-53,10,43,2);ctx.fill();ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.moveTo(-5,-10);ctx.lineTo(5,-10);ctx.lineTo(0,2);ctx.closePath();ctx.fill();ctx.restore();}
export function drawHand(ctx:CanvasRenderingContext2D,x:number,y:number,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#ead8bd';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(21,29);ctx.lineTo(20,4);ctx.quadraticCurveTo(20,-3,16,-3);ctx.quadraticCurveTo(12,-3,12,4);ctx.lineTo(12,10);ctx.lineTo(11,-20);ctx.quadraticCurveTo(10,-29,5,-25);ctx.quadraticCurveTo(2,-23,3,-16);ctx.lineTo(4,8);ctx.lineTo(-3,-1);ctx.quadraticCurveTo(-9,-6,-11,0);ctx.lineTo(-2,19);ctx.quadraticCurveTo(0,26,6,30);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
export function drawTarget(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,progress:number){ctx.save();ctx.strokeStyle=C.orange;ctx.lineWidth=2.8;ctx.beginPath();ctx.ellipse(x+w/2,y,w/2,10,0,0,Math.PI*2*Math.max(.02,Math.min(1,progress)));ctx.stroke();ctx.restore();}
function drawShopping(ctx:CanvasRenderingContext2D,chapter:number,t:number,controlled?:number){
 clearScene(ctx);const p=controlled===undefined?(1-Math.cos(t*2*Math.PI))/2:Math.max(0,Math.min(1,Math.abs(controlled)));const x=197,y=15;
 if(chapter===9){drawPaper(ctx,100,y,145,99,2);drawPaper(ctx,315,y,145,99,p>.1?2:0);drawHand(ctx,190+170*p,84,-.25);return;}
 if(chapter===5){
  ctx.save();ctx.translate(280,68);const scale=.22+.78*Math.abs(Math.cos(p*Math.PI));ctx.scale(scale,1);ctx.fillStyle='#fffef9';ctx.strokeStyle=C.contour;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-47,-45,94,91,7);ctx.fill();ctx.stroke();ctx.fillStyle=C.passive;ctx.fillRect(-39,-38,78,13);
  if(p>.5){for(let i=0;i<4;i++){ctx.fillStyle=i===2?C.blue:C.passive;ctx.fillRect(-30,-10+i*12,60-(i%2)*15,4);}}else{ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(0,9,20,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.contour;ctx.beginPath();ctx.ellipse(9,-14,12,5,-.6,0,Math.PI*2);ctx.fill();}ctx.restore();return;
 }
 if(chapter===1||chapter===6){drawPaper(ctx,x,y,166,101,chapter===6?2:0);ctx.save();ctx.translate(x+83,y+50);ctx.scale(Math.max(.08,Math.abs(Math.cos(p*Math.PI))),1);ctx.fillStyle='#fffef9';ctx.strokeStyle=C.contour;ctx.fillRect(-78,-45,156,90);ctx.strokeRect(-78,-45,156,90);for(let i=0;i<4;i++){ctx.fillStyle=i===2&&p>.5?C.blue:C.passive;ctx.fillRect(-53,-25+i*17,105-i*8,3);}ctx.restore();drawHand(ctx,x+140-100*p,82,-p*.4);return;}
 drawPaper(ctx,x,y,166,101,chapter===2?Math.floor(p*2.99):1);
 const yy=y+(chapter===7?79:59);
 if(chapter===2){drawPen(ctx,x+19+15*p,yy+7*Math.sin(p*Math.PI));}
 if(chapter===3||chapter===7){drawTarget(ctx,x+35,yy,105,p);drawPen(ctx,x+88+51*Math.cos(p*Math.PI*2),yy+10*Math.sin(p*Math.PI*2));}
 if(chapter===4){ctx.strokeStyle=C.orange;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+35,yy+6);ctx.lineTo(x+35+105*p,yy+6);ctx.stroke();drawPen(ctx,x+35+105*p,yy+6);}
 if(chapter===8){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+36,yy);ctx.lineTo(x+36+100*p,yy);ctx.stroke();drawPen(ctx,x+36+100*p,yy);ctx.strokeStyle=C.blue;ctx.beginPath();ctx.moveTo(x+35,yy+11);ctx.lineTo(x+35+100*p,yy+11);ctx.stroke();}
}
export function ShoppingScene({chapter,value,animated=true}:{chapter:number,value?:number,animated?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,560,140);canvas.style.width='100%';canvas.style.height='auto';let raf=0,visible=false;const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const draw=(time:number)=>{drawShopping(ctx,chapter,time/3000,value);canvas.classList.add('is-ready');};
 const tick=(time:number)=>{draw(time);if(visible)raf=requestAnimationFrame(tick);};
 const stop=()=>{visible=false;cancelAnimationFrame(raf);};
 const start=()=>{stop();if(!animated||value!==undefined||media.matches){draw(1500);return;}visible=true;raf=requestAnimationFrame(tick);};
 draw(1500);let inView=false,hovered=false;const resume=()=>{if(inView&&!hovered)start();};const disconnect=observeCanvas(canvas,()=>{inView=true;resume();},()=>{inView=false;stop();});const changed=()=>{if(inView)resume();else draw(1500);};const enter=()=>{hovered=true;stop();},leave=()=>{hovered=false;resume();};canvas.addEventListener('mouseenter',enter);canvas.addEventListener('mouseleave',leave);media.addEventListener('change',changed);return()=>{stop();disconnect();canvas.removeEventListener('mouseenter',enter);canvas.removeEventListener('mouseleave',leave);media.removeEventListener('change',changed);};
 },[chapter,value,animated]);
 return <canvas ref={ref} width={560} height={140} role="img" aria-label="生活类比：清单记录的动作" style={{display:'block',width:'100%',height:'auto',maxWidth:560,margin:'0 auto'}}/>;
}
export function HybridCue({chapter,value,label}:{chapter:number,value:number,label?:string}){
 const normal=chapter===1?value/6:chapter===2?value/2:chapter===3?value/4:value===0?0:1;
 const copy=chapter===1?'翻回已有记录，检查哪些信息真正用于最后选择。':chapter===2?(value===2?'翻查已保存的规格备注；没有新增一份记录。':value===1?'查看新的资料，并将这次发现留下。':'简记没有全部细节，可以另找资料，也可以翻回备注。'):chapter===3?'同一次决定，同时改变时间记录与当前清单。':'比较两张记录，先确认它们完成的是同一项需求。';
 return <details className="auxiliary"><summary>辅助理解：生活中的类似情形</summary><aside data-life-cue="true" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:12,margin:'8px 0 20px',padding:12,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8}}><div style={{flex:'0 1 210px',maxWidth:260}}><ShoppingScene chapter={chapter} value={normal} animated={false}/></div><div style={{flex:'1 1 180px',minWidth:0}}><strong>{label||'生活类比'}</strong><p style={{margin:'4px 0 0'}}>{copy}</p></div></aside></details>;
}
