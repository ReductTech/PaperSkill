import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

type Props = { chapterId: string; moduleId: string };
const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', brown:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', muted:'#68778f', line:'#d7deea', white:'#fff' };
const OPTIONS: Record<number,string[]> = {
  1:['仅结构','结构 + 视觉'], 2:['TapButton','Text','LongPress','Swipe','Back','Home','Wait','Stop'],
  3:['Android ID','OCR 文字','视觉特征','坐标位置'], 4:['任务相关','无关操作','证据不足'],
  5:['智能体探索','人工引导'], 6:['Android ID','可见文字','视觉 / 坐标','功能解释'],
  7:['资源 ID','OCR 文字','不加载文档'], 8:['探索阶段','知识文档','部署阶段','更新记录'],
  9:['普通步骤','敏感步骤'], 10:['AppAgent','Mobile-Eval','DroidTask','局限']
};
const FEEDBACK: Record<number,string[]> = {
  1:['结构信息没有覆盖这个自定义图标。','视觉线索补上候选，但仍需确认它是否可点击。'],
  2:['动作应与当前界面线索匹配。'], 3:['不同来源提供互补线索；视觉外观本身不代表可操作。'],
  4:['界面变化与任务相关，可以记录功能线索。','该操作与当前目标无关，可进入 useless_list。','现有证据不足，反思也可能误判。'],
  5:['智能体自行尝试并反思，仍可能误解陌生控件。','人工引导由人执行操作，模型观察截图变化；这不是全自动探索。'],
  6:['知识文档来自观察与解释，可能不完整。'],
  7:['检索提供帮助，但并非每个任务都必须加载文档。'],
  8:['两阶段通过可复用知识联系，检索按需发生。'],
  9:['普通步骤按当前界面证据继续。','敏感步骤转人工处理；这不是通用安全或隐私保证。'],
  10:['AppAgent 基准（10 个应用，SR%↑）：GPT-4 原始 2.2；加入动作空间 48.9；自动探索 73.3；观看演示 84.4；v2 智能体探索 84.4；v2 人工探索 93.3。',
    'Mobile-Eval 表 2：三组指令平均 Su=1.00；PS=.97/.91/.95；CR=100%。不是普遍保证。',
    'DroidTask：158 项任务、13 个应用；完成率要求序列动作全部完成，存在环境差异。',
    '局限：数字标签可能与界面数字混淆；隐藏控件也可能未被发现。人工记录只能缓解。']
};
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=14,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left';}
function phone(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,accent=C.blue){rounded(ctx,x,y,w,h,20,C.white,C.line);rounded(ctx,x+9,y+14,w-18,h-28,13,C.bg);ctx.fillStyle=accent;ctx.beginPath();ctx.arc(x+w/2,y+9,3,0,Math.PI*2);ctx.fill();}
function note(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,active=0){rounded(ctx,x,y,w,h,10,'#fff',C.line);for(let i=0;i<3;i++){const yy=y+24+i*25;ctx.fillStyle=i===active?C.blue:C.light;rounded(ctx,x+14,yy,w-28,5,3,ctx.fillStyle);if(i===active){ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(x+w-17,yy+2,4,0,Math.PI*2);ctx.fill();}}}
function drawScreen(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,variant:number,selected:number){
  phone(ctx,x,y,w,h,variant===0?C.red:C.blue);const sx=x+18,sy=y+32,sw=w-36,sh=h-62;
  rounded(ctx,sx,sy,sw,sh,9,'#e8eee3');
  if(variant===0){rounded(ctx,sx+12,sy+14,sw-24,sh*.48,5,'#d0ddc6');ctx.fillStyle=C.red;ctx.fillRect(sx+20,sy+sh*.67,sw*.27,6);ctx.strokeStyle=C.red;ctx.strokeRect(sx+sw*.65,sy+sh*.58,14,14);}
  else {rounded(ctx,sx+12,sy+14,sw-24,sh*.48,5,'#d0ddc6');ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.strokeRect(sx+sw*.64,sy+sh*.56,20,20);ctx.strokeStyle=C.green;ctx.beginPath();ctx.arc(sx+sw*.5,sy+sh*.87,9,0,Math.PI*2);ctx.stroke();}
  for(let j=0;j<3;j++){ctx.fillStyle=j===selected?C.orange:C.light;ctx.beginPath();ctx.arc(sx+23+j*26,sy+sh*.85,5,0,Math.PI*2);ctx.fill();}
}
function drawScene(ctx:CanvasRenderingContext2D,w:number,h:number,n:number,selected:number,module:boolean,t:number,heroSide='',second=false){
  ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);
  const phase=(Math.sin(t*1.35)+1)/2;
  const motion=(from:number,to:number)=>from+(to-from)*phase;
  const stroke=(color:string,width=3)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round'};
  const dot=(x:number,y:number,r:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()};
  const line=(x1:number,y1:number,x2:number,y2:number,color=C.line,width=3)=>{stroke(color,width);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
  const frame=(x:number,y:number,size:number,color:string)=>{const s=size,l=size*.34;stroke(color,3);ctx.beginPath();ctx.moveTo(x,y+l);ctx.lineTo(x,y);ctx.lineTo(x+l,y);ctx.moveTo(x+size-l,y);ctx.lineTo(x+size,y);ctx.lineTo(x+size,y+l);ctx.moveTo(x+size,y+size-l);ctx.lineTo(x+size,y+size);ctx.lineTo(x+size-l,y+size);ctx.moveTo(x+l,y+size);ctx.lineTo(x,y+size);ctx.lineTo(x,y+size-l);ctx.stroke()};
  const p=module?selected:phase;
  if(!module&&heroSide){
    rounded(ctx,86,24,172,94,9,C.white,heroSide==='old'?C.red:C.line);
    rounded(ctx,103,41,138,60,5,'#e8eee3');
    if(heroSide==='old'){line(119,60,176,60,C.blue,4);line(119,76,147,76,C.light,5);frame(196,74,22,C.red)}
    else {frame(192,53,26,C.blue);line(111,78,159,78,C.green,3);dot(221,85,5,C.orange)}
    return;
  }
  if(!module){
    if(n===1){rounded(ctx,72,28,170,84,8,C.white,C.line);dot(157,70,18,'#dce6d4');const x=motion(286,415),y=70+Math.sin(t*2)*4;frame(x-17,y-17,34,C.orange);line(437,51,515,51,C.light,5);line(437,69,492,69,C.light,5);line(437,87,503,87,C.light,5)}
    else if(n===2){stroke(C.light,3);ctx.beginPath();ctx.moveTo(96,101);ctx.bezierCurveTo(198,100,220,28,325,45);ctx.bezierCurveTo(427,62,451,118,548,70);ctx.stroke();[130,226,325,422,516].forEach((x,i)=>dot(x,[99,64,45,77,86][i],4,C.light));stroke(C.blue,3);ctx.beginPath();ctx.arc(584,70,22,0,Math.PI*2);ctx.stroke();stroke(C.orange,2);ctx.beginPath();ctx.arc(584,70,10+phase*7,0,Math.PI*2);ctx.stroke();const u=phase<.5?phase*2:(phase-.5)*2,p=phase<.5?[[96,101],[198,100],[220,28],[325,45]]:[[325,45],[427,62],[451,118],[548,70]],v=1-u,x=v*v*v*p[0][0]+3*v*v*u*p[1][0]+3*v*u*u*p[2][0]+u*u*u*p[3][0],y=v*v*v*p[0][1]+3*v*v*u*p[1][1]+3*v*u*u*p[2][1]+u*u*u*p[3][1];dot(x,y,9,C.orange)}
    else if(n===3){const colors=[C.blue,C.purple,C.orange,C.green];const x=motion(190,476);rounded(ctx,x-47,32,94,76,15,C.white,C.line);dot(x,70,13,colors[Math.floor(p*4)%4]);frame(x-27,43,54,colors[Math.floor(p*4)%4]);line(x+62,70,565,70,C.line,3);dot(565,70,10,C.green)}
    else if(n===4){drawScreen(ctx,80,17,108,108,0,0);drawScreen(ctx,267,17,108,108,1,0);line(190,72,253,72,C.muted,2);const x=motion(430,534);frame(x-15,54,30,C.orange);line(415,35,555,35,C.light,5);line(415,107,555,107,C.light,5)}
    else if(n===5){stroke(C.blue,3);ctx.beginPath();ctx.arc(350,70,42,Math.PI*.15,Math.PI*1.8);ctx.stroke();const a=motion(Math.PI*.15,Math.PI*1.8);dot(350+42*Math.cos(a),70+42*Math.sin(a),9,C.orange);dot(350,70,10,C.green);line(350,26,350,16,C.line,2)}
    else if(n===6){rounded(ctx,182,18,336,105,3,C.white,C.line);line(211,43,338,43,C.blue,5);line(211,66,485,66,C.light,4);line(211,88,422,88,C.light,4);const y=48+Math.floor(p*3)*22;rounded(ctx,201,y,281,15,3,'#eaf0e6');dot(497,y+7,5,C.orange)}
    else if(n===7){rounded(ctx,55,46,122,49,7,C.white,C.line);dot(82,70,8,C.purple);line(102,70,153,70,C.light,4);note(ctx,500,29,133,86,1);stroke(C.blue,3);ctx.beginPath();ctx.moveTo(179,70);ctx.bezierCurveTo(277,20,386,120,480,70);ctx.stroke();const x=motion(186,490);dot(x,70,7,C.orange)}
    else if(n===8){const xs=[136,350,564];const ys=[88,48,88];line(xs[0]+44,ys[0],xs[1]-44,ys[1],C.light,4);line(xs[1]+44,ys[1],xs[2]-44,ys[2],C.light,4);xs.forEach((x,i)=>{dot(x,ys[i],i===1?25:19,i===1?C.blue:C.white);stroke(i===1?C.blue:C.line,2);ctx.beginPath();ctx.arc(x,ys[i],i===1?25:19,0,Math.PI*2);ctx.stroke()});const x=motion(xs[0],xs[2]);dot(x,ys[1]+Math.abs(x-350)*.19,7,C.orange)}
    else if(n===9){line(120,70,580,70,C.line,4);rounded(ctx,325,28,50,84,5,C.white,C.orange);line(335,43,365,43,C.orange,3);line(335,57,365,57,C.orange,3);const x=motion(190,309);dot(x,70,10,C.orange);line(375,70,492,70,C.red,4);stroke(C.red,3);ctx.beginPath();ctx.arc(525,70,18,0,Math.PI*2);ctx.stroke()}
    else {rounded(ctx,80,35,152,72,8,C.white,C.line);rounded(ctx,468,35,152,72,8,C.white,C.line);line(238,71,460,71,C.blue,3);const x=motion(249,450);dot(x,71,9,C.green);line(99,55,206,55,C.light,4);line(487,55,597,55,C.light,4);line(99,84,183,84,C.light,4);line(487,84,567,84,C.light,4)}
    return;
  }
  if(n===1){rounded(ctx,82,49,178,150,14,C.white,C.line);dot(171,123,18,'#dce6d4');const color=selected?C.blue:C.red;frame(142,94,58,color);line(302,91,402,91,C.light,6);line(302,122,472,122,C.light,6);line(302,153,432,153,C.light,6);dot(520,121,selected?13:8,selected?C.green:C.red)}
  else if(n===2){const names=['点按','输入','长按','滑动','返回','主页','等待','停止'];const cx=350,cy=119;dot(cx,cy,selected===7?0:20,selected===7?C.bg:C.blue);if(selected===0){stroke(C.orange,3);ctx.beginPath();ctx.arc(cx,cy,34+Math.sin(t*2)*3,0,Math.PI*2);ctx.stroke()}else if(selected===1){line(310,cy-12,390,cy-12,C.orange,4);line(310,cy+5,372,cy+5,C.orange,4)}else if(selected===2){stroke(C.orange,3);ctx.beginPath();ctx.arc(cx,cy,32,0,Math.PI*1.6);ctx.stroke()}else if(selected===3){line(265,cy,435,cy,C.line,4);dot(motion(275,425),cy,10,C.orange)}else if(selected===4){line(392,cy,306,cy,C.orange,4);line(306,cy,328,cy-18,C.orange,4);line(306,cy,328,cy+18,C.orange,4)}else if(selected===5){rounded(ctx,317,76,66,76,8,C.white,C.blue);line(328,91,372,91,C.light,4);line(328,106,363,106,C.light,4);dot(350,137,5,C.green)}else if(selected===6){stroke(C.orange,4);ctx.beginPath();ctx.arc(cx,cy,31,Math.PI*1.15,Math.PI*1.8);ctx.stroke()}else{stroke(C.red,5);ctx.beginPath();ctx.moveTo(330,99);ctx.lineTo(370,139);ctx.moveTo(370,99);ctx.lineTo(330,139);ctx.stroke()}label(ctx,names[selected]||'点按',350,193,C.muted,13,'center')}
  else if(n===3){const colors=[C.blue,C.purple,C.orange,C.green],color=colors[selected];rounded(ctx,97,65,210,104,10,C.white,C.line);rounded(ctx,126,88,78,58,6,'#e8eee3');frame(145,102,36,color);line(221,99,282,99,color,4);line(221,119,266,119,C.light,4);line(221,139,279,139,C.light,4);line(322,117,426,117,C.line,3);dot(454,117,24,C.white);stroke(color,3);ctx.beginPath();ctx.arc(454,117,24,0,Math.PI*2);ctx.stroke();dot(454,117,8,color);label(ctx,['ID','OCR','视觉','坐标'][selected],454,180,color,13,'center')}
  else if(n===4){drawScreen(ctx,65,55,105,142,0,0);drawScreen(ctx,232,55,105,142,1,0);line(177,124,222,124,selected===1?C.red:C.green,3);const colors=[C.green,C.red,C.orange];dot(430,124,selected===2?17:13,colors[selected]);line(470,105,575,105,C.light,5);line(470,124,545,124,C.light,5);line(470,143,560,143,C.light,5)}
  else if(n===5){if(selected===0){stroke(C.blue,4);ctx.beginPath();ctx.arc(190,125,43,Math.PI*.2,Math.PI*1.83);ctx.stroke();dot(190+43*Math.cos(t),125+43*Math.sin(t),10,C.orange);dot(190,125,9,C.green)}else{rounded(ctx,114,72,150,104,12,C.white,C.line);stroke(C.orange,4);ctx.beginPath();ctx.moveTo(189,45);ctx.lineTo(189,71);ctx.stroke();dot(189,45,8,C.orange);line(300,124,410,124,C.light,4);dot(430,124,13,C.blue)}line(490,83,583,83,C.light,5);line(490,109,559,109,C.light,5);line(490,135,575,135,C.light,5)}
  else if(n===6){rounded(ctx,150,39,390,174,4,C.white,C.line);line(183,72,312,72,C.blue,6);line(183,109,492,109,C.light,5);line(183,143,454,143,C.light,5);line(183,177,480,177,C.light,5);const y=95+selected*34;rounded(ctx,173,y,326,20,4,'#eef2e9');dot(513,y+10,6,C.orange)}
  else if(n===7){rounded(ctx,63,86,144,78,10,C.white,C.line);dot(93,125,10,C.purple);line(116,111,185,111,C.light,4);line(116,132,174,132,C.light,4);stroke(C.blue,3);ctx.beginPath();ctx.moveTo(211,125);ctx.bezierCurveTo(270,45,376,205,429,125);ctx.stroke();const x=selected===2?213:motion(216,430);dot(x,125,8,selected===2?C.muted:C.orange);if(selected===2){ctx.setLineDash([6,5]);line(454,125,520,125,C.muted,2);ctx.setLineDash([])}else note(ctx,492,71,142,108,selected===0?0:1)}
  else if(n===8){const xs=[106,350,594],ys=[165,85,165],titles=['探索','知识','部署'];line(xs[0]+58,ys[0]-10,xs[1]-58,ys[1]+10,C.light,5);line(xs[1]+58,ys[1]+10,xs[2]-58,ys[2]-10,C.light,5);for(let i=0;i<3;i++){dot(xs[i],ys[i],selected===i?31:24,selected===i?C.blue:C.white);stroke(selected===i?C.blue:C.line,2);ctx.beginPath();ctx.arc(xs[i],ys[i],selected===i?31:24,0,Math.PI*2);ctx.stroke();label(ctx,titles[i],xs[i],ys[i]+58,C.muted,13,'center')}if(selected===3){stroke(C.orange,3);ctx.beginPath();ctx.arc(350,85,42,0,Math.PI*2);ctx.stroke();dot(350,43,7,C.orange)}}
  else if(n===9&&second){rounded(ctx,62,76,185,103,10,C.white,selected===0?C.blue:C.line);rounded(ctx,453,76,185,103,10,C.white,selected===1?C.green:C.line);line(251,127,449,127,selected===1?C.green:C.line,4);const x=selected===0?motion(258,438):motion(438,258);dot(x,127,9,selected===1?C.green:C.orange);rounded(ctx,295,91,110,72,8,'#e8eee3');dot(350,127,10,C.blue)}
  else if(n===9){line(92,127,286,127,C.blue,4);rounded(ctx,289,62,118,132,10,C.white,selected===1?C.orange:C.line);line(313,92,383,92,C.light,5);line(313,114,368,114,C.light,5);line(313,136,379,136,C.light,5);line(407,127,591,127,selected===1?C.red:C.green,4);dot(288,127,selected===1?13:8,selected===1?C.orange:C.green);if(selected===1){stroke(C.orange,3);ctx.beginPath();ctx.arc(350,128,77,Math.PI*.1,Math.PI*.9);ctx.stroke()}}
  else if(n===10&&(selected===2||selected===3)){if(selected===2){for(let i=0;i<5;i++){const x=156+i*98;line(x,147,x,147-((i%2)+1)*32,C.blue,11)}line(126,151,590,151,C.line,2);dot(350,68,10,C.green)}else{rounded(ctx,169,54,362,126,8,C.white,C.red);stroke(C.red,5);ctx.beginPath();ctx.moveTo(199,84);ctx.lineTo(246,131);ctx.moveTo(246,84);ctx.lineTo(199,131);ctx.stroke();line(279,88,482,88,C.light,5);line(279,111,457,111,C.light,5);line(279,134,474,134,C.light,5)}}
  else{const chartX=95,chartY=49,chartW=410,chartH=144;const vals=selected===0?[2.2,48.9,73.3,84.4,84.4,93.3]:[97,91,95,100];line(chartX,chartY+chartH,chartX+chartW,chartY+chartH,C.line,2);vals.forEach((v,i)=>{const slot=chartW/vals.length,bh=Math.max(8,v/100*(chartH-8));rounded(ctx,chartX+i*slot+12,chartY+chartH-bh,slot-24,bh,4,i===vals.length-1?C.green:C.blue)});line(545,75,625,75,C.light,5);line(545,101,602,101,C.light,5);line(545,127,619,127,C.light,5)}
}
export function FieldStudio({chapterId,moduleId}:Props){
  const canvasRef=useRef<HTMLCanvasElement>(null);const [selected,setSelected]=useState(0);
  const chapter=chapterId==='hero'?0:Number(chapterId.replace('chap-',''))||0;
  const module=moduleId!=='ana'&&moduleId!=='old'&&moduleId!=='new';const n=chapter;
  const second=moduleId.endsWith('.2');
  const options=module?(n===9&&second?['当前应用','另一个应用']:(OPTIONS[n]||OPTIONS[1])):[];
  const current=Math.min(selected,options.length-1);const feedback=module?(n===9&&second?(current===0?'当前应用进度已选中。':'框架会评估进度并尝试继续跨应用任务，不能据此保证普遍可靠。'):(FEEDBACK[n]||['选择一个状态查看对应证据。'])[current]||FEEDBACK[n]?.[0]):'';
  useEffect(()=>{setSelected(0)},[chapterId,moduleId]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;let frame=0,alive=false,observerStop=()=>{};let time=0;
    const w=700,h=module?250:140;const ctx=setupCanvas(canvas,w,h);canvas.style.width='100%';canvas.style.height='auto';canvas.style.aspectRatio=`${w} / ${h}`;
    const render=()=>{drawScene(ctx,w,h,n,current,module,time,chapterId==='hero'?moduleId:'',second);canvas.classList.add('is-ready')};
    const draw=()=>{if(!alive)return;render();time+=.025;frame=requestAnimationFrame(draw);};
    const start=()=>{if(!alive){alive=true;frame=requestAnimationFrame(draw)}};const stop=()=>{alive=false;cancelAnimationFrame(frame)};
    if(module)render();else observerStop=observeCanvas(canvas,start,stop);return()=>{stop();observerStop()};
  },[chapterId,moduleId,current,module,n]);
  const choose=(i:number)=>setSelected(i);
  return <div className="field-widget">
    <canvas ref={canvasRef} aria-label={module?`第 ${n} 章交互示意图`:'手机摄影外出记录场景'} />
    {module&&<>
      {n===4 ? <div className="field-controls field-stepper" role="group" aria-label="逐条检查探索记录"><button type="button" className="field-control" disabled={current===0} onClick={()=>choose(current-1)}>上一条</button><span className="field-step-label">{current+1} / {options.length} · {options[current]}</span><button type="button" className="field-control" disabled={current===options.length-1} onClick={()=>choose(current+1)}>下一条</button></div> : <div className={`field-controls ${n===2?'field-action-controls':''}`} role="group" aria-label="选择界面状态">{options.map((opt,i)=><button key={opt} type="button" className={i===current?'field-control active':''} aria-pressed={i===current} onClick={()=>choose(i)}>{opt}</button>)}</div>}
      <div className={`field-feedback ${n===1&&current===0||n===4&&current===1||n===9&&current===1||n===10&&current===3?'warning':''}`} aria-live="polite">{feedback?.replace('{x}',options[current]||'')}</div>
    </>}
  </div>;
}
