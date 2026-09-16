import { CanvasView, palette as p, page, pencil, loupe, stamp, line } from './proofKit';

function Scene({kind}:{kind:number}) {
 return <CanvasView height={kind<10 ? 720 : 140} animate label={['放大镜检查错字','橡皮擦掉多余标准','过程栏盖章','尺子量取适用范围','红笔圈出根本错误','放大镜扫描全部校样','透明片对齐原稿','夹子固定证据','红笔划出额外段落','验收盖章','仅凭自述盖章','回到证据核对'][kind]} draw={(ctx,w,h,time)=>{
  ctx.save();if(kind<10){const scale=w/350;ctx.translate(w/2-280*scale,h/2-70*scale);ctx.scale(scale,scale);}else{ctx.scale(w/560,1);}
  const t=(time%3000)/3000,a=Math.sin(t*Math.PI*2),s=(1-Math.cos(t*Math.PI*2))/2;
  page(ctx,145,20,270,102);
  for(let i=0;i<3;i++)line(ctx,169,45+i*24,385,45+i*24,p.border,3);
  if([0,4,5,8,10,11].includes(kind))line(ctx,230,69,264,69,p.red,5);
  if(kind===0||kind===5||kind===11){const x=kind===5?170+s*210:235+a*38;loupe(ctx,x,65,25,p.blue)}
  if(kind===1){ctx.fillStyle=p.red;ctx.globalAlpha=1-s;ctx.fillRect(230,65,90,7);ctx.globalAlpha=1;ctx.save();ctx.translate(220+s*105,68);ctx.rotate(-.15);ctx.fillStyle=p.orange;ctx.fillRect(-18,-10,36,20);ctx.strokeStyle=p.ink;ctx.strokeRect(-18,-10,36,20);ctx.restore()}
  if(kind===2||kind===9||kind===10){stamp(ctx,300,52+s*27,kind!==10)}
  if(kind===3){ctx.save();ctx.translate(190,83);ctx.rotate(a*.07);ctx.fillStyle=p.orange;ctx.fillRect(0,0,120+s*65,16);for(let i=0;i<12;i++)line(ctx,i*10,0,i*10,7,p.ink,1);ctx.restore()}
  if(kind===4){pencil(ctx,245+Math.cos(t*Math.PI*2)*24,68+Math.sin(t*Math.PI*2)*16,t*Math.PI*2,p.red);ctx.beginPath();ctx.ellipse(246,68,27,18,0,0,Math.PI*2);ctx.strokeStyle=p.red;ctx.lineWidth=2;ctx.stroke()}
  if(kind===6){ctx.save();ctx.translate(15*(1-s),-18*(1-s));ctx.fillStyle='rgba(39,68,110,.10)';ctx.strokeStyle=p.blue;ctx.lineWidth=2;ctx.fillRect(155,28,250,84);ctx.strokeRect(155,28,250,84);line(ctx,228,69,265,69,p.red,4);ctx.restore()}
  if(kind===7){ctx.save();ctx.translate(265,24+8*a);ctx.strokeStyle=p.blue;ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(-9,-8,18,40,8);ctx.stroke();ctx.beginPath();ctx.roundRect(-4,-4,8,25,4);ctx.stroke();ctx.restore()}
  if(kind===8){line(ctx,225,94,335,94,p.red,3);pencil(ctx,225+s*110,94,-.5,p.red)}
  ctx.restore();
 }}/>
}
export function Analogy1(){return <Scene kind={0}/>}
export function Analogy2(){return <Scene kind={1}/>}
export function Analogy3(){return <Scene kind={2}/>}
export function Analogy4(){return <Scene kind={3}/>}
export function Analogy5(){return <Scene kind={4}/>}
export function Analogy6(){return <Scene kind={5}/>}
export function Analogy7(){return <Scene kind={6}/>}
export function Analogy8(){return <Scene kind={7}/>}
export function Analogy9(){return <Scene kind={8}/>}
export function Analogy10(){return <Scene kind={9}/>}
export function HeroOld(){return <Scene kind={10}/>}
export function HeroNew(){return <Scene kind={11}/>}
