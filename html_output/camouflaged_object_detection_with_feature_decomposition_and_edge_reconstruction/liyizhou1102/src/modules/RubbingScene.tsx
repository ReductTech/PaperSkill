import { useRef, useEffect } from 'react';
import { observeCanvas } from '../lib/canvasKit';

const captions = ['粗拓 · 细线失落','擦看浅刻','传递拓纸','折看纹向','挑出细纹','对齐叠纸','补拓漏墨','试笔再落墨','双样校印','对照拓本','撤去一道工序','细拓 · 重见轮廓'];
const fish = new Path2D('M -67 2 Q -44 -31 -3 -20 Q 24 -18 40 -2 L 66 -21 Q 62 -5 67 14 L 40 5 Q 12 27 -20 22 Q -49 20 -67 2 Z');
function stroke(c:CanvasRenderingContext2D,path:string,color:string,width:number){c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path))}
function motif(c:CanvasRenderingContext2D,x:number,y:number,s:number,clarity:number){
 c.save(); c.translate(x,y); c.scale(s,s); c.lineCap='round';c.lineJoin='round';
 c.fillStyle='rgba(53,88,79,0.08)'; c.fill(fish); c.lineWidth=2.6; c.strokeStyle='#355e53';c.setLineDash(clarity<.4?[18,12]:[]);c.stroke(fish);c.setLineDash([]);
 c.globalAlpha=.42+.58*clarity;stroke(c,'M -31 -19 Q -15 0 -29 20 M -4 -20 Q 8 -39 20 -26 L 12 -16 M -3 21 Q 8 29 14 22','#3b6859',1.7);
 c.beginPath();c.arc(-47,-2,3,0,7);c.fillStyle='#294d45'; c.fill();
 for(let r=0;r<3;r++){for(let j=0;j<4;j++){const a=-17+j*10+(r%2)*4,b=-10+9*r;c.strokeStyle='rgba(49,85,70,'+(.14+clarity*.6)+')';c.lineWidth=1;c.beginPath();c.arc(a,b,5,-1,1);c.stroke()}}
 c.restore();
}
function sheet(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);c.shadowBlur=6;c.shadowColor='#796e5440';c.shadowOffsetY=3;c.fillStyle='#fff9e8';c.fillRect(0,0,w,h);c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle='#c6bb9d';c.strokeRect(0,0,w,h);
 for(let i=0;i<100;i++){const px=(i*137+13)%w,py=(i*83+6)%h;c.strokeStyle=i%2?'#e5dcc450':'#c8bb9350';c.beginPath();c.moveTo(px,py);c.lineTo(px+2,py-.5);c.stroke()}c.restore();
}
function tool(c:CanvasRenderingContext2D,x:number,y:number){
 c.save();c.translate(x,y);c.rotate(.3);stroke(c,'M 0 0 L 0 -20','#8f6a43',7);c.fillStyle='#45675b';c.beginPath();c.ellipse(0,2,10,6,0,0,7);c.fill();stroke(c,'M -5 -9 L 5 -9','#c9af81',2);c.restore()
}
function frame(c:CanvasRenderingContext2D,n:number,t:number){
 const wave=(1-Math.cos(2*Math.PI*t))/2;
 c.fillStyle='#eee5d1';c.fillRect(0,0,560,140);
 for(let i=0;i<38;i++){const a=i*19%560,b=i*37%140;stroke(c,'M '+a+' '+b+' l 28 -1','#d9cdb556',.8)}
 c.fillStyle='#536256';c.font='bold 13px "Microsoft YaHei",sans-serif';c.fillText('拓 印 手 记',16,24);c.fillStyle='#8f7355';c.font='12px "Microsoft YaHei",sans-serif';c.fillText(captions[n],16,45);
 const side=n===8||n===9||n===10;
 if(side){
  const off=n===10?wave*19:0;
  sheet(c,168,25,146,94,-.025);sheet(c,338+off,24,146,94,.018);
  motif(c,241,75,.9,n===8?.9:.4);motif(c,411+off,75,.9,n===10?1-wave:n===9?wave:1);
  if(n===8){c.strokeStyle='#a65038';c.lineWidth=2;c.beginPath();c.arc(408+30*wave,73,13,0,7);c.stroke()}
  if(n===9){stroke(c,'M '+(360+83*wave)+' 37 v 70','#ad6449',1.8)}
 } else {
  const shift=n===2?wave*34:0; if(n===2||n===5)sheet(c,221,22,225,101,-.04);
  sheet(c,206+shift,21,229,100,n===5?-.095*(1-wave):.012);let cl=n===0?.18:n===3?.52:n===5?.4+wave*.55:.25+wave*.73;
  motif(c,323+shift,75,1.32,cl);
  if(n===3){c.save();c.fillStyle='rgba(215,202,167,.7)';c.beginPath();c.moveTo(432,22);c.lineTo(432-47*wave,22);c.lineTo(432,22+47*wave);c.fill();c.restore()}
  if(n===4){c.save();c.strokeStyle='#a7543b';c.lineWidth=2;c.beginPath();c.arc(302+47*wave,75,13,0,7);c.stroke();c.restore()}
  if([0,1,6,7,11].includes(n)){const x=n===6?356+20*wave:n===7?302+35*wave:241+153*wave;tool(c,x,67+(n===7?12*Math.sin(Math.PI*t*2):5*wave))}
 }
 c.save();c.translate(523,101);c.rotate(-.08);c.strokeStyle='#a54c3a';c.lineWidth=1.5;c.strokeRect(-11,-12,22,24);c.fillStyle='#a54c3a';c.font='bold 16px serif';c.fillText('拓',-8,6);c.restore()
}
export function RubbingScene({n}:{n:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const c=el.getContext('2d');if(!c)return;
 const d=Math.min(devicePixelRatio||1,2);el.width=560*d;el.height=140*d;c.scale(d,d);let id=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=(stamp:number)=>{frame(c,n,(stamp%3200)/3200);id=requestAnimationFrame(tick)};
 frame(c,n,.42);if(reduced)return;
 const stop=()=>cancelAnimationFrame(id);const disconnect=observeCanvas(el,()=>{stop();id=requestAnimationFrame(tick)},stop);return ()=>{stop();disconnect()};
 },[n]);
 return <canvas ref={ref} role="img" aria-label={'碑刻拓印示意：'+captions[n]} className="rubbing-scene"/>;
}
