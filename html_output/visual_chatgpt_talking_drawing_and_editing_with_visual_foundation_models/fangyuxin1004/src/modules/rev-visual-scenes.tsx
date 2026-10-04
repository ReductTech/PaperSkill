import { colors, line, panel } from './vc-visual-kit';
type C=CanvasRenderingContext2D;
function mix(a:string,b:string,t:number){
 const rgb=(s:string):number[]=>s.startsWith('#')?[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)):(s.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
 const aa=rgb(a),bb=rgb(b);return `rgb(${aa.map((v,i)=>Math.round(v*(1-t)+bb[i]*t)).join(',')})`;
}
export function phase(t:number,start:number){return Math.min(1,Math.max(0,((t<start?3.8:t-start)%6)/3.8));}
export function flowerFrame(c:C,x:number,y:number,w:number,h:number,{red=0,depth=0,cartoon=0,reveal=1}:{red?:number;depth?:number;cartoon?:number;reveal?:number}={}){
 c.save();c.translate(x,y);panel(c,0,0,w,h,'#fff');c.beginPath();c.roundRect(9,9,w-18,h-18,5);c.clip();
 c.fillStyle=mix('#e9efe0','#e8e8e8',depth);c.fillRect(9,9,w-18,h-18);
 c.fillStyle=mix('#c4d4b7','#b5b5b5',depth);c.beginPath();c.ellipse(w*.4,h*.93,w*.7,h*.28,0,0,Math.PI*2);c.fill();
 c.save();c.beginPath();c.rect(9,9,(w-18)*reveal,h-18);c.clip();
 const cx=w*.51,cy=h*.40,r=Math.min(w,h)*.185;
 line(c,cx,cy,cx,h*.88,mix('#76906a','#686868',depth),4+cartoon*2);
 c.fillStyle=mix('#76906a','#686868',depth);c.beginPath();c.ellipse(cx+w*.10,h*.68,w*.12,h*.045,-.55,0,Math.PI*2);c.fill();
 if(cartoon>0){c.strokeStyle=`rgba(33,50,74,${cartoon})`;c.lineWidth=2;c.stroke();}
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7; c.beginPath();c.ellipse(cx+Math.cos(a)*r*.77,cy+Math.sin(a)*r*.77,r*.62,r*.40,a,0,Math.PI*2);c.fillStyle=mix(mix('#e6bb59','#c85863',red),'#626262',depth);c.fill();if(cartoon>0){c.strokeStyle=`rgba(33,50,74,${cartoon})`;c.lineWidth=2.5;c.stroke();}}
 c.beginPath();c.arc(cx,cy,r*.36,0,Math.PI*2);c.fillStyle=mix('#956639','#626262',depth);c.fill();
 if(cartoon>0){c.strokeStyle=`rgba(33,50,74,${cartoon})`;c.lineWidth=2;c.stroke();}c.restore();c.restore();
}
export function scan(c:C,x:number,y:number,w:number,h:number,p:number){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const sy=y+h*p;const g=c.createLinearGradient(0,sy-22,0,sy);g.addColorStop(0,'rgba(39,68,110,0)');g.addColorStop(1,'rgba(39,68,110,.16)');c.fillStyle=g;c.fillRect(x,sy-22,w,22);line(c,x,sy,x+w,sy,colors.blue,2);c.restore();}
