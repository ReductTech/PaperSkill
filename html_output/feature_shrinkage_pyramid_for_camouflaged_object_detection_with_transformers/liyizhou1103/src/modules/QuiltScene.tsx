import {useEffect,useRef} from 'react';
import {observeCanvas} from '../lib/canvasKit';

const labels=['直接拼合','辨认布纹','裁出方片','配对布片','归拢花纹','拼合小块','沿缝穿针','逐层验针','对照样布','拆线复查','检查漏缝','逐对拼合'];
const ink='#344f51',sage='#427e73',clay='#ae694f';
type C=CanvasRenderingContext2D;
function fabric(c:C,x:number,y:number,w:number,h:number,shade:string){
 c.save(); c.translate(x,y);c.fillStyle=shade;c.fillRect(0,0,w,h);
 c.strokeStyle='#ffffff47';c.lineWidth=.8;c.beginPath();
 for(let i=1;i<w;i+=5){c.moveTo(i,0);c.lineTo(i,h)}
 for(let j=2;j<h;j+=5){c.moveTo(0,j);c.lineTo(w,j)}c.stroke();
 c.strokeStyle='#344f5140';c.lineWidth=1;c.strokeRect(0,0,w,h);
 c.setLineDash([3,4]);c.strokeStyle='#526960';c.strokeRect(5,5,w-10,h-10);c.restore();
}
function sprig(c:C,x:number,y:number,w:number,h:number){
 c.save();c.translate(x,y);c.scale(w/110,h/65);c.strokeStyle=sage;c.lineWidth=2;
 c.beginPath();c.moveTo(4,60);c.quadraticCurveTo(46,39,104,4);c.stroke();
 for(let i=0;i<5;i++){let a=14+i*17,b=55-i*9;c.fillStyle=i%2?sage:ink;
 c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(a-5,b-19,a+12,b-23);c.quadraticCurveTo(a+16,b-10,a,b);c.fill();
 c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(a+9,b+12,a+23,b+3);c.quadraticCurveTo(a+14,b-4,a,b);c.fill()}c.restore()
}
function patch(c:C,x:number,y:number,w:number,h:number,part:number,color:string){
 fabric(c,x,y,w,h,color);c.save();c.beginPath();c.rect(x+1,y+1,w-2,h-2);c.clip();sprig(c,x-part*w+8,y+10,w*2-16,h-12);c.restore()
}
function stitch(c:C,x:number,y:number,len:number){
 c.save();c.strokeStyle=clay;c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();c.moveTo(x,y);c.lineTo(x,y+len);c.stroke();c.restore()
}
function lens(c:C,x:number,y:number){
 c.strokeStyle=clay;c.lineWidth=3;c.beginPath();c.arc(x,y,14,0,Math.PI*2);c.moveTo(x+10,y+10);c.lineTo(x+20,y+20);c.stroke()
}
function paint(c:C,n:number,t:number){
 const q=(1-Math.cos(2*Math.PI*t))/2;
 c.fillStyle='#f4eddb';c.fillRect(0,0,560,140);c.fillStyle='#5c6d65';c.font='bold 13px "Microsoft YaHei",sans-serif';c.fillText('拼 布 手 记',18,28);c.font='13px "Microsoft YaHei",sans-serif';c.fillText(labels[n],18,54);
 const x=209,y=27,w=87,h=81,a='#ead6ab',b='#d5dcbb';
 if([0,3,5,11].includes(n)){patch(c,x,y,w,h,0,a);patch(c,x+w+(1-q)*28,y+(n===0?20:(1-q)*14),w,h,1,b);return}
 if(n===8||n===4){for(let i=0;i<3;i++){const xx=172+i*80+(n===4&&i===2?-q*20:0);fabric(c,xx,37,73,68,i===1?b:a);sprig(c,xx+5,46,61,48)}lens(c,206+q*150,72);return}
 patch(c,x,y,w,h,0,a);patch(c,x+w,y,w,h,1,b);
 if(n===2){c.strokeStyle=ink;c.lineWidth=2.5;let yy=27+68*q;c.beginPath();c.arc(x+w-5,yy-6,4,0,7);c.moveTo(x+w+8,yy-6);c.arc(x+w+5,yy-6,4,0,7);c.moveTo(x+w-7,yy-5);c.lineTo(x+w+3,yy+13);c.moveTo(x+w+7,yy-5);c.lineTo(x+w-3,yy+13);c.stroke();return}
 if(n===6||n===9){const len=72*(n===6?q:1-q);stitch(c,x+w,y+3,len);c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(x+w,y+3+len);c.lineTo(x+w+21,y-7+len);c.stroke();return}
 if(n===10){c.fillStyle=b;c.fillRect(294,54,22,24)}
 lens(c,n===7?x+w:228+100*q,n===7?36+56*q:70);
}
export function QuiltScene({n}:{n:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const c=el.getContext('2d');if(!c)return;
 const d=Math.min(devicePixelRatio||1,2);el.width=d*560;el.height=d*140;c.scale(d,d);
 let id=0;paint(c,n,.47);if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const tick=(stamp:number)=>{paint(c,n,stamp%3200/3200);id=requestAnimationFrame(tick)};
 const stop=()=>cancelAnimationFrame(id);const off=observeCanvas(el,()=>{stop();id=requestAnimationFrame(tick)},stop);return ()=>{off();stop()};
 },[n]);return <canvas ref={ref} role="img" aria-label={'拼布示意：'+labels[n]} className="is-ready quilt-scene"/>;
}
