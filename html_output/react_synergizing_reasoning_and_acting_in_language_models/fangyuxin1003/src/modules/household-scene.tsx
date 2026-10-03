import { C, circle, label, line } from './scene-kit';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const p=clamp(n);return p*p*(3-2*p);};
export function cup(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1,ghost=false){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=ghost?'#e9e5f2':'#dce9dd';ctx.strokeStyle=ghost?C.purple:C.blue;ctx.lineWidth=2.4;ctx.beginPath();ctx.roundRect(-13,-24,26,25,[2,2,7,7]);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(15,-14,7,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.restore();}
export function cabinet(ctx:CanvasRenderingContext2D,x:number,y:number,open:number,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#e8efdf';ctx.strokeStyle=C.contour;ctx.lineWidth=2.5;ctx.fillRect(0,0,106,101);ctx.strokeRect(0,0,106,101);line(ctx,4,51,102,51,C.contour,2);ctx.fillStyle='#f9faf5';const door=106*(1-.93*ease(open));ctx.fillRect(0,0,door,101);ctx.strokeRect(0,0,door,101);if(door>18)line(ctx,door-12,44,door-12,59,C.support,3);line(ctx,9,102,9,111,C.contour,4);line(ctx,97,102,97,111,C.contour,4);ctx.restore();}
export function table(ctx:CanvasRenderingContext2D,x:number,y:number,width=92){ctx.fillStyle='#d8c8af';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,width,9,3);ctx.fill();ctx.stroke();line(ctx,x+12,y+10,x+12,y+45,C.support,4);line(ctx,x+width-12,y+10,x+width-12,y+45,C.support,4);}
function hand(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.save();ctx.translate(x,y);ctx.strokeStyle=C.support;ctx.fillStyle='#f1d5ba';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-10,-10,20,17,6);ctx.fill();ctx.stroke();line(ctx,-7,4,-19,23,C.blue,9);ctx.restore();}
function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,p:number,color:string=C.blue){line(ctx,x1,y1,x2,y2,C.border,2);const a=Math.atan2(y2-y1,x2-x1);line(ctx,x2,y2,x2-7*Math.cos(a-.6),y2-7*Math.sin(a-.6),color,2);line(ctx,x2,y2,x2-7*Math.cos(a+.6),y2-7*Math.sin(a+.6),color,2);circle(ctx,x1+(x2-x1)*clamp(p),y1+(y2-y1)*clamp(p),4,color);}
function eye(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,13,8,0,0,Math.PI*2);ctx.stroke();circle(ctx,x,y,4,C.blue);}
/** A teaching scene, not an ALFWorld benchmark run. Every object has one continuous location. */
export function drawHousehold(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,progress:number,mode:'CoT'|'Act'|'ReAct',idle=false){
 const scale=Math.min(w/560,h/230);
 ctx.save();ctx.translate(x+(w-560*scale)/2,y+(h-230*scale)/2);ctx.scale(scale,scale);
 const phase=Math.min(8,Math.floor(clamp(progress)*9));const part=clamp(progress*9-phase);
 const planning=mode==='CoT';
 const status=idle?'准备开始':planning?'只在脑中规划':mode==='Act'?['行动准备','打开柜门','观察：空','继续查看','查看台面','观察：杯子','拿起杯子','放到桌上','观察：已放好'][phase]:['思考：先找柜子','行动：打开','观察：空','思考：换个位置','行动：查看','观察：杯子','行动：拿起','行动：放下','观察：已放好'][phase];
 label(ctx,status,18,27,planning?C.purple:[2,5,8].includes(phase)?C.green:C.blue,18);
 const open=planning||idle?0:phase<1?0:phase===1?ease(part):1;
 cabinet(ctx,40,70,open);
 table(ctx,237,157,87);table(ctx,433,157,94);
 label(ctx,'柜子',76,213,C.muted,15);label(ctx,'台面',262,213,C.muted,15);label(ctx,'餐桌',464,213,C.muted,15);
 if(planning){
   // Dashed, translucent objects belong to the plan; the physical scene remains untouched.
   ctx.save();ctx.globalAlpha=.75;ctx.setLineDash([5,5]);ctx.strokeStyle=C.purple;ctx.lineWidth=2;
   ctx.beginPath();ctx.roundRect(178,53,356,82,22);ctx.stroke();ctx.setLineDash([]);
   const t=idle?0:ease((progress*3)%1);
   cup(ctx,207,105,.72,true);arrow(ctx,226,93,323,93,t,C.purple);cup(ctx,347,105,.72,true);arrow(ctx,371,93,454,93,t,C.purple);label(ctx,'?',483,107,C.purple,28);ctx.restore();
   label(ctx,'计划尚未执行',334,186,C.muted,15);
 }else if(!idle){
   if(phase===0&&mode==='ReAct'){ctx.setLineDash([4,4]);ctx.strokeStyle=C.purple;ctx.strokeRect(30,60,126,123);ctx.setLineDash([]);circle(ctx,30+126*part,57,4,C.purple);}
   if(phase===1)hand(ctx,140-93*ease(part),123);
   if(phase===2){eye(ctx,186,103);arrow(ctx,170,108,128,112,part,C.green);label(ctx,'空',91,105,C.muted,21);}
   if(phase===3){ctx.strokeStyle=C.purple;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(151,55);ctx.quadraticCurveTo(230,20,280,70);ctx.stroke();ctx.setLineDash([]);circle(ctx,151+129*part,55-20*Math.sin(part*Math.PI),4,C.purple);}
   if(phase===4){eye(ctx,335,95);ctx.fillStyle='rgba(184,201,167,.20)';ctx.beginPath();ctx.moveTo(319,100);ctx.lineTo(246,121);ctx.lineTo(306,147);ctx.closePath();ctx.fill();}
   if(phase<5){ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle=C.border;ctx.strokeRect(259,118,39,37);ctx.restore();label(ctx,'?',272,145,C.muted,22);}
   else{
     let cx=280,cy=154;
     if(phase===6){const carry=ease((part-.4)/.6);cx=280+82*carry;cy=154-57*carry;}
     if(phase===7){cx=362+(480-362)*ease(part);cy=97+(154-97)*ease(part);}
     if(phase===8){cx=480;cy=154;}
     cup(ctx,cx,cy,1.15);
     if(phase===5){ctx.strokeStyle=C.green;ctx.lineWidth=2;ctx.beginPath();ctx.arc(280,142,28+part*7,0,Math.PI*2);ctx.stroke();}
     if(phase===6){const reach=ease(part/.4);hand(ctx,part<.4?327+(cx+19-327)*reach:cx+19,part<.4?103+(cy-13-103)*reach:cy-13);}
     if(phase===7)hand(ctx,cx+19,cy-13);
     if(phase===8){eye(ctx,393,105);arrow(ctx,409,114,455,142,part,C.green);line(ctx,503,126,509,133,C.green,3);line(ctx,509,133,520,117,C.green,3);}
   }
 }
 ctx.restore();
}