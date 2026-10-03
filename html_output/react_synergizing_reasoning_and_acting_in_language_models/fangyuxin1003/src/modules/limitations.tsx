import { useState } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, drawBook, label, line, circle } from './scene-kit';
import { flow, panel } from './original-visuals';
import { cabinet, cup } from './household-scene';
const cases=[
 {name:'检索信息不足',detail:'检索返回了内容，却没有回答当前缺失的事实。动画里的空心反馈表示没有取得所需信息；继续推理也不能凭空补齐证据。'},
 {name:'重复行动',detail:'已观察到柜子为空，却反复执行同一个拿取动作。动作和反馈不断出现，但状态没有推进；可见的闭环并不一定是有效的闭环。'},
 {name:'上下文容量',detail:'复杂动作空间往往需要更多示范，示范与思考、动作、观察共同占用有限输入空间。格子只示意容量压力，不代表实际容量。'},
 {name:'示例覆盖有限',detail:'少量示范不一定覆盖新任务所需的行为，复杂动作空间又可能需要更多示范。柜子上锁是日常类比，不代表 ALFWorld 提供开锁动作。'},
];
function brain(ctx:CanvasRenderingContext2D,x:number,y:number){circle(ctx,x,y,17,C.purple);for(let i=0;i<6;i++){const a=i*Math.PI/3;line(ctx,x,y,x+Math.cos(a)*43,y+Math.sin(a)*43,C.contour,2);circle(ctx,x+Math.cos(a)*43,y+Math.sin(a)*43,7,C.blue);}}
function lock(ctx:CanvasRenderingContext2D,x:number,y:number){ctx.strokeStyle=C.support;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-11,11,Math.PI,Math.PI*2);ctx.stroke();panel(ctx,x-16,y-11,32,30,C.support);circle(ctx,x,y+1,3,C.support);line(ctx,x,y+3,x,y+9,C.support,2);}
export function Limitations(){const[selected,setSelected]=useState(0);const[replay,setReplay]=useState(0);return <div>
 <CanvasScene key={`${selected}-${replay}`} height={310} label={`局限性：${cases[selected].name}。${cases[selected].detail}`} draw={(ctx,_w,_h,time)=>{
 const t=(time%8400)/8400;
 if(selected===0){
  label(ctx,'返回了内容',82,38,C.text,20);label(ctx,'缺少关键事实',750,38,C.text,20);
  for(let i=2;i>=0;i--){ctx.save();ctx.translate(90+i*14,78+i*13);ctx.rotate((i-1)*.045);drawBook(ctx,0,0,1.25,C.contour);ctx.restore();}
  label(ctx,'作品',111,120,C.blue,21);label(ctx,'作者',233,120,C.blue,21);
  brain(ctx,563,155);
  if(t<.4)flow(ctx,494,125,350,125,t/.4,C.blue);
  else{line(ctx,350,185,494,185,C.border,2);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(350+144*Math.min(1,(t-.4)/.35),185,7,0,Math.PI*2);ctx.stroke();}
  ctx.setLineDash([5,5]);line(ctx,631,155,747,155,C.border,2);ctx.setLineDash([]);
  panel(ctx,775,87,225,149,C.contour);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(888,143,25,Math.PI*.15,Math.PI*2.85);ctx.stroke();label(ctx,'?',880,153,C.orange,29);label(ctx,'出生地',855,210,C.muted,20);
 }else if(selected===1){
  label(ctx,'柜子已经是空的',88,38,C.text,20);label(ctx,'同一动作反复发生',625,38,C.text,20);
  cabinet(ctx,118,77,1,1.5);label(ctx,'空',183,154,C.muted,27);
  const cycle=t*3,part=cycle%1,reach=Math.sin(part*Math.PI);const hx=423-173*reach;
  ctx.fillStyle='#f1d5ba';ctx.strokeStyle=C.support;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(hx,142,32,23,8);ctx.fill();ctx.stroke();line(ctx,hx+29,154,hx+102,172,C.blue,13);
  ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(748,155,64,-Math.PI*.25,Math.PI*1.55);ctx.stroke();const a=-Math.PI*.25+part*Math.PI*2;circle(ctx,748+Math.cos(a)*64,155+Math.sin(a)*64,7,C.orange);
  label(ctx,'拿取',729,162,C.orange,21);label(ctx,`第 ${Math.floor(cycle)+1} 次尝试`,685,260,C.muted,18);
  flow(ctx,476,223,298,223,part,C.orange);
 }else if(selected===2){
  label(ctx,'有限上下文',224,38,C.text,20);label(ctx,'新记录继续到来',796,38,C.text,20);
  panel(ctx,207,62,520,196,C.contour);const count=Math.min(9,3+Math.floor(t*10));const colors=[C.purple,C.blue,C.green];
  for(let i=0;i<9;i++){const x=231+(i%3)*163,y=82+Math.floor(i/3)*56;ctx.fillStyle=i<count?['#eee6f4','#e5edf4','#e8efdf'][i%3]:'#fafbf8';ctx.strokeStyle=i<count?colors[i%3]:C.border;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,145,43,7);ctx.fill();ctx.stroke();if(i<count)label(ctx,(i<3?`示例${i+1}`:['思考','行动','观察'][i%3]),x+52,y+27,colors[i%3],18);}
  const overflow=t>.6;const moving=overflow?780:855-(t% .1)/.1*95;
  panel(ctx,moving,126,111,66,overflow?C.orange:C.green);label(ctx,'新观察',moving+22,166,overflow?C.orange:C.green,18);
  if(overflow){ctx.setLineDash([5,4]);line(ctx,746,68,746,251,C.orange,3);ctx.setLineDash([]);label(ctx,'空间不足',792,233,C.orange,19);}
 }else{
  label(ctx,'已见示范',88,38,C.text,20);label(ctx,'遇到新的状态',697,38,C.text,20);
  cabinet(ctx,99,77,1,1.45);cup(ctx,178,209,1.15);label(ctx,'打开 → 拿取',107,267,C.blue,20);
  flow(ctx,339,149,620,149,Math.min(1,t*1.7),C.blue);
  cabinet(ctx,699,77,0,1.45);lock(ctx,775,155);
  ctx.strokeStyle=C.orange;ctx.setLineDash([4,4]);ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(904,80,103,93,12);ctx.stroke();ctx.setLineDash([]);label(ctx,'?',943,128,C.orange,34);label(ctx,'新策略',924,155,C.orange,16);
  label(ctx,'需要处理“上锁”',701,267,C.orange,20);
 }
 }}/>
 <Controls>{cases.map((c,i)=><Chip key={c.name} active={i===selected} onClick={()=>setSelected(i)}>{c.name}</Chip>)}<button type="button" onClick={()=>setReplay(n=>n+1)}>重播这一过程</button></Controls>
 <Feedback>{cases[selected].detail}</Feedback>
 </div>;}