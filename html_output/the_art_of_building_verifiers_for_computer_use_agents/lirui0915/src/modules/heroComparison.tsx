import {CanvasView,page,line,label,loupe,palette as p} from './proofKit';
function Comparison({specific}:{specific:boolean}){
 return <CanvasView height={680} animate label={specific?'按评分清单逐项核查同一份校样':'结合作者说明或筛选重点页，对同一份校样作整体判断'} draw={(c,w,h,time)=>{
 const phase=(time%6000)/6000, row=Math.min(2,Math.floor(phase*3));
 page(c,100,70,880,530);
 label(c,specific?'逐项核验':'整体审阅',155,125,p.blue,38);
 for(let i=0;i<3;i++){
 const y=220+i*125,active=specific?i===row:true;
 c.fillStyle=active?'#e4ebdc':'#f5f8f0';c.fillRect(155,y-40,730,88);
 line(c,280,y-5,820,y-5,p.border,6);line(c,280,y+20,680,y+20,p.border,5);
 if(specific){c.strokeStyle=i===row?p.orange:p.dark;c.lineWidth=i===row?6:3;c.strokeRect(190,y-23,38,38);if(i<row){line(c,196,y-5,207,y+5,p.green,5);line(c,207,y+5,224,y-17,p.green,5)}}
 else {c.strokeStyle=p.blue;c.lineWidth=3;c.strokeRect(190,y-24,38,48);}
 }
 // Same error on both sheets: inspection strategy, not a fabricated success verdict.
 line(c,510,345,585,345,p.red,8);
 const x=specific?545:440+Math.sin(phase*Math.PI*2)*205;
 const y=specific?220+row*125:345;
 loupe(c,x,y,58,p.blue);
 if(specific&&row===1){c.strokeStyle=p.red;c.lineWidth=5;c.beginPath();c.ellipse(547,345,75,35,0,0,Math.PI*2);c.stroke()}
 label(c,specific?'标准 ↔ 证据':'截图 + 记录',155,565,p.ink,32);
 }}/>
}
export function HeroOld(){return <Comparison specific={false}/>}
export function HeroNew(){return <Comparison specific/>}
