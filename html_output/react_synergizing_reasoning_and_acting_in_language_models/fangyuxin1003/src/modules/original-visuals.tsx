import { drawHousehold } from './household-scene';
import React from 'react';
import { C, CanvasScene, line, circle, label, drawBook, drawCard, drawHand } from './scene-kit';

export function panel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.contour){ctx.fillStyle='#fff';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();ctx.stroke();}
export function words(ctx:CanvasRenderingContext2D,rows:string[],x:number,y:number,size=18,color:string=C.text,gap=27){rows.forEach((row,i)=>label(ctx,row,x,y+i*gap,color,size));}
export function flow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,p:number,color:string=C.blue){line(ctx,x1,y1,x2,y2,C.border,2);const a=Math.atan2(y2-y1,x2-x1);line(ctx,x2,y2,x2-9*Math.cos(a-.5),y2-9*Math.sin(a-.5),color,2);line(ctx,x2,y2,x2-9*Math.cos(a+.5),y2-9*Math.sin(a+.5),color,2);circle(ctx,x1+(x2-x1)*Math.max(0,Math.min(1,p)),y1+(y2-y1)*Math.max(0,Math.min(1,p)),5,color);}
export function remote(ctx:CanvasRenderingContext2D,x:number,y:number){panel(ctx,x,y,29,66,C.contour);circle(ctx,x+14.5,y+20,9,C.light);circle(ctx,x+14.5,y+20,3,C.contour);circle(ctx,x+14.5,y+46,4,C.contour);}
export function display(ctx:CanvasRenderingContext2D,x:number,y:number,title:string,body:string,color:string=C.blue){panel(ctx,x,y,178,68,color);label(ctx,title,x+12,y+25,color,16);label(ctx,body,x+12,y+48,C.text,14);line(ctx,x+89,y+68,x+89,y+78,color,3);line(ctx,x+57,y+78,x+121,y+78,color,3);}
export function keyboard(ctx:CanvasRenderingContext2D,x:number,y:number){panel(ctx,x,y,98,38,C.green);for(let r=0;r<3;r++)for(let k=0;k<8;k++){ctx.fillStyle=r===0?C.green:C.light;ctx.fillRect(x+7+k*11,y+6+r*9,7,5);} }
export { drawHousehold as drawTrace } from './household-scene';
export function HeroOld(){return <CanvasScene width={560} height={230} label="CoT：在脑中规划找杯子和放置，环境没有被执行动作改变。" draw={(ctx,w,h,time)=>drawHousehold(ctx,0,0,w,h,(time%18000)/18000,'CoT')}/>;}
export function HeroNew(){return <CanvasScene width={560} height={230} label="ReAct：打开柜子后发现空了，改看台面，发现杯子，拿起并放到餐桌，最后检查结果。" draw={(ctx,w,h,time)=>drawHousehold(ctx,0,0,w,h,(time%18000)/18000,'ReAct')}/>;}
const miniText:Record<number,string[][]>={
 1:[['计划','找杯子'],['行动','打开柜子'],['观察','柜子为空']],
 2:[['模型 · 思考','先确认作者'],['模型 · 行动','发出 search'],['环境 · 观察','圣埃克苏佩里']],
 3:[['查询','圣埃克苏佩里'],['未命中','返回候选实体'],['修改查询','补全姓名']],
 4:[['上下文','已知 圣埃克苏佩里'],['加入思考','核查出生地点'],['外部事实','没有变化']],
 5:[['示范轨迹','思考 → 行动'],['执行动作','工具返回观察'],['新的任务','按反馈继续']],
 6:[['search','打开实体页'],['lookup','匹配页内句子'],['finish','提交并结束']],
 7:[['少样本提示','示例进入输入'],['模型参数','保持冻结'],['监督微调','训练才更新']],
 8:[['模型','提出动作'],['环境工具','执行并返回'],['上下文','写入新观察']],
 9:[['多条路径','不同推理'],['汇总答案','比较一致性'],['外部反馈','补充事实']],
 10:[['同一任务','核对指标'],['同一协议','比较固定结果'],['保留边界','收益并非全面']],
};

export function Concept({id}:{id:number}){return <CanvasScene width={560} height={id===1?230:140} label={`${miniText[id].map(r=>r.join('：')).join('；')}。循环动画示意。`} draw={(ctx,_w,_h,time)=>{
 const p=(time%8400)/2800, stage=Math.floor(p), part=p-stage;
 if(id===1){drawHousehold(ctx,0,0,_w,_h,(time%18000)/18000,'ReAct');
 }else if(id===2||id===8){
  circle(ctx,66,59,31,C.light);label(ctx,'模型',49,65,C.blue,16);
  drawBook(ctx,385,24,.8,C.contour);words(ctx,['外部','页面'],394,48,13,C.blue,21);words(ctx,['返回','信息'],468,48,13,C.green,21);
  drawCard(ctx,193,27,145,66,C.blue);words(ctx,['上下文',stage===0?'计划：查作者':stage===1?'动作：search':'观察：圣埃克苏佩里'],205,51,13,stage===2?C.green:C.blue,24);
  if(stage===0)flow(ctx,103,44,183,44,part,C.purple);
  if(stage===1){line(ctx,64,101,420,101,C.border,2);circle(ctx,64+356*part,101,4,C.blue);}
  if(stage===2)flow(ctx,374,59,348,59,part,C.green);

 }else if(id===3){
  drawBook(ctx,28,19,.91,C.contour);words(ctx,['查询','作者姓氏'],38,47,14,C.blue,26);words(ctx,[stage===0?'等待返回':'未命中',stage===0?'':'有相似项'],122,47,13,C.red,26);
  panel(ctx,282,27,248,66,stage===2?C.blue:C.contour);words(ctx,[stage===0?'查询已发出':stage===1?'候选：作者全名条目':'改查 作者全名条目',stage===2?'补全姓名，重新请求':'等待查询结果，不先作答'],294,52,14,C.blue,25);
  flow(ctx,stage===0||stage===2?269:205,65,stage===0||stage===2?205:269,65,part,stage===1?C.green:C.blue);

 }else if(id===4){
  drawCard(ctx,24,23,281,82,C.blue);words(ctx,['已知：作者是 圣埃克苏佩里','计划：核查出生地点'.slice(0,Math.floor(p/3*23))],38,50,16,C.blue,31);
  ctx.fillStyle=C.purple;ctx.fillRect(281,14,14,35);
  drawBook(ctx,370,26,.75,C.contour);words(ctx,['外部','事实'],379,51,13,C.muted,24);words(ctx,['保持','不变'],447,51,13,C.muted,24);

 }else if(id===5){
  for(let i=2;i>=0;i--)drawCard(ctx,23+i*8,20+i*7,201,79,C.contour);
  words(ctx,['思考：先查作者','行动：查作品','观察：圣埃克苏佩里'],36,43,13,C.blue,23);
  drawCard(ctx,333,23,208,80,C.blue);words(ctx,['新任务的上下文',stage===0?'参考示范组织计划':stage===1?'执行与任务有关的动作':'依实际反馈调整'],346,48,14,C.blue,30);
  flow(ctx,254,63,319,63,part,C.blue);
 }else if(id===6){
  drawBook(ctx,23,18,.96,C.contour);words(ctx,['《小王子》','作品条目','圣埃克苏佩里'],31,39,12,C.blue,25);words(ctx,['匹配句','作者姓名','圣埃克苏佩里'],117,39,12,C.green,25);
  if(stage===1){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(147,84,19,0,Math.PI*2);ctx.stroke();line(ctx,160,98,174,112,C.support,5);}
  panel(ctx,308,30,233,65,C.contour);words(ctx,[['search','lookup','finish'][stage],['先打开实体页','只找当前页下一处匹配','提交答案，结束轨迹'][stage]],322,55,14,C.blue,24);
  if(stage<2)flow(ctx,stage===0?292:218,63,stage===0?218:292,63,part,stage===0?C.blue:C.green);else flow(ctx,328,105,516,105,part,C.blue);

 }else if(id===7){
  drawCard(ctx,22,25,226,79,C.blue);words(ctx,['示范：思考 → 行动 → 观察',stage<2?'放入本次输入':'用正确答案轨迹监督训练'],33,51,13,C.blue,28);
  circle(ctx,438,64,38,C.bg);ctx.strokeStyle=C.contour;ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;circle(ctx,438+Math.cos(a)*29,64+Math.sin(a)*29,stage===2?4+part*3:4,stage===2?C.purple:C.light);}
  label(ctx,stage<2?'冻结':'更新',423,69,C.blue,14);flow(ctx,266,64,382,64,part,stage<2?C.blue:C.purple);

 }else if(id===9){
  circle(ctx,43,66,19,C.blue);label(ctx,'?',38,73,'#fff',19);
  for(let i=0;i<5;i++){const y=21+i*23;const color=i<3?C.blue:C.orange;line(ctx,64,66,180,y,C.border,2);line(ctx,180,y,361,y,C.border,2);line(ctx,361,y,469,i<3?43:101,C.border,2);circle(ctx,180+181*part,y,4,color);}
  panel(ctx,471,23,67,38,C.blue);label(ctx,'A · 3',481,48,C.blue,17);panel(ctx,471,81,67,38,C.orange);label(ctx,'B · 2',481,106,C.orange,17);
 }else{
  label(ctx,'HotpotQA · EM（%）',18,24,C.text,16);
  [['CoT',29.4],['ReAct',27.4]].forEach(([name,value],i)=>{label(ctx,String(name),21,58+i*38,C.blue,15);ctx.fillStyle=i===0?C.blue:C.green;ctx.fillRect(95,42+i*38,Number(value)*10*Math.min(1,p),22);label(ctx,String(value),411,59+i*38,C.text,16);});

 }
 }}/ >;}
