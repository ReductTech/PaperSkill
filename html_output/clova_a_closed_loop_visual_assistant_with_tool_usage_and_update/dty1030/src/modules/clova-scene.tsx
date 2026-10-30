import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', paper: '#ffffff', pale: '#e7eee1', env: '#b8c9a7',
  contour: '#76906a', wood: '#92400e', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', mute: '#68778f', line: '#d7deea',
};
type Mode = 'ana' | 'hero' | 'module';
type State = { choice: number; step: number; race: 'idle' | 'running' | 'done'; raceStart: number };

function box(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, r = 8, stroke?: string) {
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
}
function line(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.stroke();
}
function circle(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
}
function label(c: CanvasRenderingContext2D, value: string, x: number, y: number, size = 17, color = C.ink, align: CanvasTextAlign = 'left') {
  c.font = `600 ${size}px "Segoe UI", sans-serif`; c.fillStyle = color; c.textAlign = align; c.fillText(value, x, y);
}
function desk(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = C.bg; c.fillRect(0, 0, w, h);
  line(c, 0, h - 16, w, h - 16, C.env, 5);
}
function photo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mood: 'neutral'|'old'|'new' = 'neutral') {
  const ix=x+9, iy=y+9, iw=w-18, ih=h-27;
  c.save(); c.shadowColor = '#60705a33'; c.shadowBlur = 13; c.shadowOffsetY = 5;
  box(c, x, y, w, h, C.paper, 6, C.line); c.restore();
  c.save(); c.beginPath(); c.roundRect(ix,iy,iw,ih,3); c.clip();
  c.fillStyle='#cfddd6';c.fillRect(ix,iy,iw,ih);
  c.fillStyle='#e4eadf';c.fillRect(ix,iy,iw*.35,ih);
  line(c,ix+iw*.35,iy,ix+iw*.35,iy+ih,'#8da99d',Math.max(1,w*.012));
  line(c,ix,iy+ih*.58,ix+iw*.35,iy+ih*.58,'#8da99d',Math.max(1,w*.012));
  c.fillStyle='#a9c0b0';c.beginPath();c.ellipse(ix+iw*.88,iy+ih*.79,iw*.23,ih*.30,0,0,Math.PI*2);c.fill();
  const cx=x+w*.54, cy=y+h*.43, r=Math.min(w,h)*.165;
  c.fillStyle='#546b70';c.beginPath();c.ellipse(cx,y+h*.87,w*.31,h*.25,0,Math.PI,0);c.fill();
  c.fillStyle='#e4b79b';c.beginPath();c.moveTo(cx-r*.28,cy+r*.85);c.lineTo(cx+r*.28,cy+r*.85);c.lineTo(cx+r*.23,cy+r*1.55);c.lineTo(cx-r*.23,cy+r*1.55);c.closePath();c.fill();
  circle(c,cx,cy,r,'#dfaf91');
  c.fillStyle='#263b4b';c.beginPath();c.moveTo(cx-r*.98,cy-r*.1);
  c.bezierCurveTo(cx-r*1.15,cy-r*1.75,cx+r*.76,cy-r*1.85,cx+r*1.05,cy-r*.22);
  c.bezierCurveTo(cx+r*.61,cy-r*.53,cx-r*.25,cy-r*.36,cx-r*.98,cy-r*.1);c.fill();
  c.fillStyle='#684e43';circle(c,cx-r*.33,cy+r*.12,Math.max(1,r*.065),'#684e43');
  circle(c,cx+r*.34,cy+r*.12,Math.max(1,r*.065),'#684e43');
  line(c,cx-r*.12,cy+r*.52,cx+r*.18,cy+r*.55,'#9a675d',Math.max(1,r*.05));
  c.fillStyle='#f0f4e9bb';c.beginPath();c.moveTo(ix,iy);c.lineTo(ix+iw*.45,iy);c.lineTo(ix,iy+ih*.92);c.fill();
  c.restore();
  line(c,x+w*.13,y+h*.88,x+w*.85,y+h*.88,'#d5d9d0',Math.max(1,h*.012));
  if (mood !== 'neutral') {
    const mark=mood==='new'?C.green:C.red;
    circle(c, x + w - 18, y + 18, 10, mark);
    if(mood==='new') {
      line(c, x+w-23,y+18,x+w-19,y+22,C.paper,2);
      line(c, x+w-19,y+22,x+w-12,y+14,C.paper,2);
    } else {
      line(c,x+w-22,y+14,x+w-14,y+22,C.paper,2);
      line(c,x+w-14,y+14,x+w-22,y+22,C.paper,2);
    }
  }
}
function lens(c: CanvasRenderingContext2D, x: number, y: number, r = 22) {
  c.save(); c.shadowColor = '#253b4a33'; c.shadowBlur = 8; c.shadowOffsetY = 3;
  circle(c, x, y, r, '#d5ecef88', C.blue); c.restore();
  line(c, x + r * .7, y + r * .7, x + r * 1.4, y + r * 1.4, C.wood, 7);
  circle(c, x - 6, y - 7, 4, '#ffffff99');
}
function target(c: CanvasRenderingContext2D, x: number, y: number, good = true) {
  const col = good ? C.green : C.red;
  line(c, x - 12, y, x - 3, y + 9, col, 4);
  line(c, x - 3, y + 9, x + 14, y - 12, col, 4);
}
function pencil(c: CanvasRenderingContext2D, x: number, y: number, angle = -.3) {
  c.save(); c.translate(x,y); c.rotate(angle);
  box(c,-5,-47,10,37,C.orange,3,C.wood); c.fillStyle=C.wood;
  c.beginPath(); c.moveTo(-5,-10); c.lineTo(5,-10); c.lineTo(0,1); c.closePath(); c.fill(); c.restore();
}
function motion(n:number,t:number) {
  const duration=2.9+n*.19;
  const u=(t/duration)%1;
  const e=(v:number)=>v*v*(3-2*v);
  if(u<.08)return 0;
  if(u<.46)return e((u-.08)/.38);
  if(u<.58)return 1;
  if(u<.96)return e(1-(u-.58)/.38);
  return 0;
}
function analogy(c: CanvasRenderingContext2D, n: number, t: number, hero = '') {
  desk(c, 560, 140);
  const p=motion(n,t);
  if (hero) {
    photo(c, 215, 15, 130, 105, hero === 'new' ? 'new' : 'old');
    lens(c, 170 + 35 * p, 56, 18);
    return;
  }
  if (n === 1) {
    photo(c, 204, 15, 132, 105, p>.8?'new':'old');
    lens(c, 138 + 104*p, 72, 21);
    box(c,388,33,110,59,p>.8?'#e1f2e7':'#fff0f1',7);
    label(c,p>.8?'已补足':'能力缺口',443,68,16,p>.8?C.green:C.red,'center');
    line(c,343,69,379,69,p>.8?C.green:C.red,3);
  }
  if (n === 2) {
    photo(c, 138, 15, 126, 105);
    c.strokeStyle=C.orange; c.lineWidth=3; c.setLineDash([5,4]);
    c.strokeRect(167,39,39+51*p,49); c.setLineDash([]);
    pencil(c,206+51*p,40,-.2);
    line(c,277,65,307,65,C.blue,3);
    box(c,318,28,154,72,C.paper,6,C.line);
    box(c,338,43,48,40,C.pale,3);
    label(c,'裁剪',422,68,17,C.blue,'center');
  }
  if (n === 3) {
    photo(c,115,16,128,104);
    c.strokeStyle=C.orange; c.lineWidth=4; c.strokeRect(152,43,47+8*p,48);
    line(c,250,68,309,68,C.orange,3);
    box(c,320,24,138,89,C.paper,6,C.line);
    c.fillStyle='#dce9e3'; c.fillRect(329,34,120,68);
    circle(c,388,72,24,'#dfaf91');
    c.fillStyle='#263b4b'; c.beginPath(); c.arc(388,63,25,Math.PI,0); c.fill();
    circle(c,380,73,2,'#684e43');circle(c,396,73,2,'#684e43');
    line(c,383,84,393,84,'#9a675d',2);
    label(c,'局部目标',389,116,13,C.blue,'center');
  }
  if (n === 4) {
    c.fillStyle='#284158';c.fillRect(0,0,560,124);
    box(c,315,12,144,99,C.paper,6);
    photo(c,325,17,124,89);
    const x=91,y=29;
    c.fillStyle='#ffde7980';c.beginPath();c.moveTo(x+33,y+13);
    c.lineTo(346+80*p,25);c.lineTo(346+80*p,108);c.closePath();c.fill();
    box(c,x,y,40,27,C.blue,5,'#9fb3c8');
    circle(c,x+14,y+13,6,'#f8ce77');
    label(c,'中间证据',218,104,16,C.paper,'center');
  }
  if (n === 5) {
    const names=['定位','裁剪','问答','结论'];const xs=[50,176,302,428];
    line(c,91,61,471,61,C.line,4);
    xs.forEach((x,i)=>{box(c,x,37,83,48,i===2?'#fff0f1':C.paper,6,i===2?C.red:C.line);
      label(c,names[i],x+41,67,16,i===2?C.red:C.blue,'center');});
    lens(c,91+378*p,103,13);
    circle(c,343,28,6,C.red);
  }
  if (n === 6) {
    const names=['VQA推断','开放词汇','网页图像'];
    [62,206,350].forEach((x,i)=>{box(c,x,27,126,72,C.paper,7,i===Math.round(2*p)?C.orange:C.line);
      label(c,names[i],x+63,53,14,C.blue,'center');
      if(i===0){box(c,x+27,64,72,17,C.pale,3);label(c,'答案',x+63,77,10,C.ink,'center');}
      if(i===1){c.strokeStyle=C.green;c.lineWidth=3;c.strokeRect(x+48,61,33,27);}
      if(i===2){circle(c,x+63,74,15,C.env);line(c,x+53,76,x+72,76,C.paper,2);}
    });
    circle(c,125+144*Math.round(2*p),109,6,C.orange);
  }
  if (n === 7) {
    box(c,45,42,118,49,C.paper,7,C.line);label(c,'候选样本',104,72,17,C.blue,'center');
    line(c,168,66,211,66,C.blue,3);
    box(c,216,30,120,72,C.paper,7,C.line);label(c,'提示调优',276,61,17,C.blue,'center');
    for(let i=0;i<4;i++)circle(c,240+i*23,80,5,i<4*p?C.purple:C.pale);
    line(c,341,66,377,66,C.blue,3);
    box(c,383,42,128,49,p>.78?'#e1f2e7':C.paper,7,p>.78?C.green:C.line);
    label(c,p>.78?'验证保留':'独立验证',447,72,17,p>.78?C.green:C.blue,'center');
  }
  if (n === 8) {
    box(c,50,47,110,44,C.paper,6,C.line);label(c,'当前图像',105,74,16,C.blue,'center');
    line(c,166,69,208,69,C.blue,3);
    box(c,216,19,160,94,C.paper,7,C.line);
    ['提示 A','提示 B','零向量'].forEach((v,i)=>{
      const y=31+i*27;box(c,228,y,136,23,i===Math.round(2*p)?C.pale:C.paper,4);
      label(c,v,246,y+17,14,i===Math.round(2*p)?C.green:C.mute);
    });
    line(c,383,69,423,69,C.blue,3);
    circle(c,458,69,25,p>.78?'#e1f2e7':C.env,p>.78?C.green:undefined);
    if(p>.78)target(c,458,69,true);
  }
  if (n === 9) {
    label(c,'计划示例',132,28,15,C.blue,'center');
    label(c,'程序示例',425,28,15,C.blue,'center');
    const y=40;
    for(const [x,col] of [[62,C.green],[172,C.red],[355,C.green],[465,C.red]] as const){
      box(c,x,y,73,65,C.paper,5,col);
      circle(c,x+36,y+18,9,col);
      line(c,x+15,y+40,x+58,y+40,C.line,3);
      line(c,x+15,y+51,x+45,y+51,C.line,3);
    }
    const x=62+403*p;
    box(c,x,107,73,5,C.orange,2);
  }
  if (n === 10) {
    label(c,'同一任务 · 同一刻度',280,27,16,C.blue,'center');
    line(c,148,100,454,100,C.mute,2);
    for(let i=0;i<4;i++){const x=148+i*102;line(c,x,94,x,105,C.mute,2);label(c,String(40+i*10),x,119,10,C.mute,'center');}
    label(c,'VISPROG',137,57,13,C.mute,'right');
    label(c,'CLOVA',137,87,13,C.green,'right');
    box(c,148,41,100,19,C.mute,3);
    box(c,148,72,100+49*p,19,C.green,3);
    label(c,'49.8',256,56,12,C.mute);
    label(c,p>.9?'54.6':'对照中',305,87,12,C.green);
  }
}
function frame(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  box(c,x,y,w,h,C.paper,9,C.line);
}
function panelBase(c: CanvasRenderingContext2D) {
  desk(c,1080,280);
  frame(c,35,30,1010,215);
}
function body(c: CanvasRenderingContext2D, n: number, id: string, s: State, t: number, progress: number) {
  panelBase(c);
  const pulse = .5 + .5 * Math.sin(t * 3);
  if(n===1) {
    photo(c,105,54,230,170,s.choice===0?'old':'new');
    lens(c,345+8*pulse,120,27);
    line(c,445,135,575,135,s.choice?C.green:C.red,5);
    circle(c,650,135,37,s.choice?C.green:C.red);
    if(s.choice) target(c,650,135,true);
    else { line(c,635,120,665,150,C.paper,5); line(c,665,120,635,150,C.paper,5); }
    box(c,745,75,225,120,s.choice?'#e8f5ed':'#fff0f1',8);
    label(c,s.choice?'已验证':'未识别',857,143,27,s.choice?C.green:C.red,'center');
  } else if(n===2) {
    photo(c,78,59,175,155);
    const xs=[340,545,750,955];
    line(c,340,136,955,136,C.line,5);
    xs.forEach((x,i)=>{
      circle(c,x,136,25,i===s.step?C.blue:i<s.step?C.green:C.pale,i===s.step?C.orange:C.line);
      if(i<s.step) target(c,x,136,true);
    });
    const names=['指令','计划','程序','执行'];
    label(c,names[s.step],645,84,24,C.blue,'center');
    box(c,468,173,355,42,C.pale,6);
    label(c,['一条自然语言任务','先定位，再裁剪，再问答','LOC → CROP → VQA','检查中间视觉结果'][s.step],646,200,19,C.ink,'center');
  } else if(n===3) {
    const xs=[135,335,535,735]; const colors=[C.blue,C.orange,C.purple,C.green];
    xs.forEach((x,i)=>{ box(c,x,72,158,132,i===s.choice?'#e9f0f8':C.bg,10,i===s.choice?C.blue:C.line);
      if(i===0){c.strokeStyle=colors[i];c.lineWidth=4;c.strokeRect(x+51,105,55,55);}
      if(i===1){box(c,x+45,116,65,43,colors[i],10);circle(c,x+58,162,5,colors[i]);}
      if(i===2){circle(c,x+80,136,34,colors[i]);box(c,x+69,124,22,22,C.paper,4);}
      if(i===3){circle(c,x+79,136,33,colors[i]);target(c,x+79,136,true);}
    });
    box(c,925,97,82,80,C.pale,7);
    label(c,['框','回答','掩码','类别'][s.choice],966,145,22,C.blue,'center');
  } else if(n===4 && id==='4.1') {
    frame(c,60,50,445,174); frame(c,575,50,445,174);
    photo(c,91,72,128,113,'old');
    line(c,248,125,302,125,C.red,4);
    box(c,315,89,152,75,'#fff0f1',7);
    label(c,'最终答错',391,135,20,C.red,'center');
    label(c,'无法定位原因',282,207,17,C.mute,'center');
    if(s.choice){
      photo(c,603,81,110,100,'old');
      line(c,724,131,755,131,C.blue,3);
      box(c,764,93,94,68,C.pale,5);label(c,'图像描述',811,132,16,C.blue,'center');
      line(c,866,131,886,131,C.blue,3);
      box(c,895,93,91,68,'#e1f2e7',5);label(c,'人工反馈',940,132,16,C.green,'center');
      label(c,'过程证据帮助追查',800,207,17,C.green,'center');
    }else{
      box(c,658,84,276,99,C.bg,7);
      label(c,'中间证据尚未加入',796,140,20,C.mute,'center');
      label(c,'只有结果，难以归因',796,207,17,C.mute,'center');
    }
  } else if(n===4) {
    photo(c,90,56,227,166);
    frame(c,410,81,250,110); frame(c,755,81,240,110);
    line(c,325,137,405,137,s.step>=1?C.blue:C.line,4);line(c,665,137,750,137,s.step>=2?C.green:C.line,4);
    if(s.step===0) lens(c,205,131,28);
    label(c,'BLIP描述',535,110,18,C.blue,'center');
    line(c,443,138,625,138,s.step>=1?C.blue:C.line,4);
    line(c,443,159,587,159,s.step>=1?C.blue:C.line,4);
    label(c,'人工期望',875,110,18,C.blue,'center');
    circle(c,875,147,19,C.pale,C.line);
    if(s.step===2)target(c,875,147,true);
    label(c,'观察 → 描述 → 反馈',535,65,20,C.blue,'center');
  } else if(n===5) {
    const xs=[76,324,572,820], names=['定位','裁剪','问答','结果'];
    xs.forEach((x,i)=>{
      box(c,x,67,174,128,i===s.step?(i===2?'#fff0f1':'#e9f0f8'):C.paper,8,i===s.step?(i===2?C.red:C.blue):C.line);
      if(i===0){c.strokeStyle=C.blue;c.lineWidth=4;c.strokeRect(x+57,89,60,55);}
      if(i===1){box(c,x+47,88,80,67,C.pale,4);circle(c,x+87,121,20,C.env);}
      if(i===2){box(c,x+45,93,85,49,C.orange,10);circle(c,x+107,151,6,C.red);}
      if(i===3){circle(c,x+87,118,31,C.red);line(c,x+73,104,x+101,132,C.paper,4);line(c,x+101,104,x+73,132,C.paper,4);}
      label(c,names[i],x+87,178,19,i===s.step?i===2?C.red:C.blue:C.mute,'center');
      if(i<3)line(c,x+184,129,x+236,129,i<s.step?C.blue:C.line,4);
    });
    label(c,['候选区域','裁剪区域','错误问答','最终判断'][s.step],535,226,20,s.step===2?C.red:C.blue,'center');
  } else if(n===6) {
    photo(c,90,65,182,150);
    const sourceX=[420,580,740][s.choice];
    frame(c,388,64,530,154);
    if(s.choice===0) { box(c,485,92,280,45,C.pale,8); line(c,500,158,746,158,C.blue,4); }
    if(s.choice===1) { c.strokeStyle=C.green;c.lineWidth=4;c.strokeRect(557,96,130,83); }
    if(s.choice===2) {for(let i=0;i<3;i++) box(c,495+i*90,94,70,75,i===1?C.pale:'#e7edf2',5);}
    line(c,285,140,sourceX,140,C.blue,4);
    label(c,['推断答案','公开标注','网页图像'][s.choice],652,203,23,C.blue,'center');
  } else if(n===7) {
    const xs=[74,324,574,824], names=['候选样本','提示调优','独立验证','池中保留'];
    xs.forEach((x,i)=>{
      box(c,x,68,173,128,i===s.step?'#e9f0f8':C.paper,8,i===s.step?C.blue:C.line);
      if(i===0){for(let j=0;j<3;j++)box(c,x+34+j*33,100,27,48,[C.env,C.pale,C.orange][j],4);}
      if(i===1){for(let j=0;j<5;j++)line(c,x+46+j*17,113,x+46+j*17,145,C.purple,4);}
      if(i===2){line(c,x+37,144,x+76,118,C.line,3);line(c,x+76,118,x+120,132,s.choice?C.red:C.green,5);}
      if(i===3){box(c,x+40,97,92,58,s.step===3&&s.choice?'#fff0f1':'#e1f2e7',5);label(c,s.step===3&&s.choice?'丢弃':'提示池',x+86,134,19,s.step===3&&s.choice?C.red:C.green,'center');}
      label(c,names[i],x+86,182,17,i===s.step?C.blue:C.mute,'center');
      if(i<3)line(c,x+181,132,x+239,132,i<s.step?C.green:C.line,4);
    });
    label(c,s.step===3?(s.choice?'验证未通过':'验证通过'):['数据收集','冻结权重','检查提升'][s.step],535,227,19,s.step===3?(s.choice?C.red:C.green):C.blue,'center');
  } else if(n===8) {
    frame(c,70,83,210,110);frame(c,385,54,325,170);frame(c,820,83,190,110);
    line(c,285,137,378,137,C.blue,4);line(c,717,137,812,137,s.choice===2?C.line:C.green,4);
    const y0=[91,132,173];
    y0.forEach((y,i)=>{const selected=s.choice===2?false:i===s.choice;
      box(c,434,y,220,23,selected?C.blue:C.pale,4);
      box(c,657,y,35,23,selected?C.orange:C.env,4);
    });
    if(s.choice===2) {circle(c,906,139,34,C.pale,C.line);label(c,'0',906,147,23,C.mute,'center');}
    else target(c,906,139,true);
    label(c,s.choice===2?'未学习':'已学习',175,149,22,C.blue,'center');
  } else if(n===9) {
    const coords=[[110,74],[380,74],[110,163],[380,163]] as const;
    coords.forEach(([x,y],i)=>{
      box(c,x,y,215,66,i===s.choice?C.pale:C.paper,7,i===s.choice?C.blue:C.line);
      if(i===s.choice) {circle(c,x+30,y+33,13,i%2?C.red:C.green);line(c,x+60,y+25,x+170,y+25,C.blue,4);line(c,x+60,y+42,x+140,y+42,C.blue,3);}
      else {line(c,x+32,y+33,x+165,y+33,C.line,4);}
    });
    frame(c,715,84,264,136);
    line(c,742,127,940,127,s.choice%2?C.orange:C.green,5);
    line(c,742,156,908,156,C.line,4);
    line(c,742,184,880,184,C.line,4);
    label(c,['计划正例','计划错例','程序正例','程序错例'][s.choice],846,55,22,C.blue,'center');
  } else if(n===10) {
    const a=s.choice===0?[49.8,54.6]:[60.8,65.6];
    const y=[108,178];const col=[C.mute,C.green];
    a.forEach((v,i)=>{
      const width=(v-40)*23;
      if(i===1){box(c,240,y[i],width,36,'#e1f2e7',4);}
      box(c,240,y[i],Math.max(2,width*(i===0?1:progress)),36,col[i],4);
      label(c,i===0?'VISPROG':'CLOVA',75,y[i]+26,20,i===0?C.mute:C.green);
      if(i===0||progress>.98) label(c,v.toFixed(1)+'%',250+width,y[i]+26,19,C.ink);
    });
    line(c,240,222,930,222,C.line,2);
    for(let k=0;k<=3;k++){const x=240+k*230;line(c,x,219,x,226,C.line,2);label(c,String(40+k*10),x,243,15,C.mute,'center');}
    if(s.race==='idle')label(c,'选择任务，开始比较',810,69,19,C.blue,'center');
  }
}

function compactBody(c: CanvasRenderingContext2D, n: number, id: string, s: State, progress: number) {
  desk(c,560,320); frame(c,18,18,524,268);
  if(n===1) {
    photo(c,46,59,172,178,s.choice?'new':'old');
    line(c,232,146,278,146,s.choice?C.green:C.red,5);
    circle(c,295,146,16,s.choice?C.green:C.red);
    box(c,337,85,167,117,s.choice?'#e1f2e7':'#fff0f1',8);
    label(c,s.choice?'已验证':'未识别',420,148,25,s.choice?C.green:C.red,'center');
    label(c,s.choice?'更新后':'冻结工具',420,177,17,C.mute,'center');
  } else if(n===2) {
    const names=['指令','计划','程序','执行'];
    names.forEach((v,i)=>{const x=43+(i%2)*242,y=63+Math.floor(i/2)*96;
      box(c,x,y,229,79,i===s.step?'#e9f0f8':C.paper,8,i===s.step?C.blue:C.line);
      circle(c,x+33,y+39,17,i<s.step?C.green:i===s.step?C.blue:C.pale);
      label(c,v,x+66,y+46,22,i===s.step?C.blue:C.ink);
    });
    label(c,['理解视觉目标','先定位再问答','LOC→CROP→VQA','检查中间结果'][s.step],280,263,21,C.blue,'center');
  } else if(n===3) {
    const names=['LOC 位置','VQA 回答','SEG 掩码','分类 类别'];
    names.forEach((v,i)=>{const x=42+(i%2)*243,y=53+Math.floor(i/2)*90;
      box(c,x,y,229,75,i===s.choice?'#e9f0f8':C.paper,8,i===s.choice?C.blue:C.line);
      circle(c,x+35,y+37,17,[C.blue,C.orange,C.purple,C.green][i]);
      label(c,v,x+70,y+45,20,C.ink);
    });
    label(c,'不同工具，各有输出边界',280,260,19,C.blue,'center');
  } else if(n===4 && id==='4.1') {
    frame(c,40,57,225,172);frame(c,295,57,225,172);
    photo(c,79,82,135,107,'old');photo(c,332,82,135,107,'old');
    label(c,'只看结果',152,214,18,C.red,'center');
    if(s.choice){box(c,444,112,52,43,C.pale,4);target(c,470,133,true);}
    label(c,s.choice?'加入过程':'缺少证据',407,214,18,s.choice?C.green:C.red,'center');
  } else if(n===4) {
    const names=['图像','BLIP描述','人工反馈'];
    names.forEach((v,i)=>{const x=41+i*173;
      box(c,x,94,151,110,i===s.step?'#e9f0f8':C.paper,8,i===s.step?C.blue:C.line);
      if(i===0)photo(c,x+37,109,77,70);
      if(i===1){line(c,x+24,132,x+125,132,C.blue,4);line(c,x+24,152,x+101,152,C.blue,4);}
      if(i===2)target(c,x+75,148,true);
      label(c,v,x+75,228,17,C.blue,'center');
    });
    label(c,'中间图像转文字后参与批评',280,72,18,C.mute,'center');
  } else if(n===5) {
    const names=['定位区域','裁剪区域','问答输出','最终判断'];
    names.forEach((v,i)=>{const y=43+i*54;
      box(c,81,y,401,46,i===s.step?(i===2?'#fff0f1':'#e9f0f8'):C.paper,7,i===s.step?(i===2?C.red:C.blue):C.line);
      circle(c,113,y+23,14,i===2?C.red:i===s.step?C.blue:C.pale);
      label(c,v,146,y+31,20,i===2&&i===s.step?C.red:C.ink);
    });
    label(c,'逐步回看，才能定位错误',280,273,18,C.blue,'center');
  } else if(n===6) {
    const names=['VQA · 推断答案','LOC/SEG · 开放词汇','SELECT等 · 网页图像'];
    names.forEach((v,i)=>{const y=50+i*72;
      box(c,48,y,464,60,i===s.choice?'#e9f0f8':C.paper,8,i===s.choice?C.blue:C.line);
      circle(c,82,y+30,15,[C.orange,C.green,C.purple][i]);
      label(c,v,113,y+38,19,C.ink);
    });
    label(c,'来源变了，噪声风险也变',280,273,18,C.mute,'center');
  } else if(n===7) {
    const names=['收集样本','提示调优','独立验证','保留 / 丢弃'];
    names.forEach((v,i)=>{const y=44+i*54;
      box(c,68,y,424,46,i===s.step?'#e9f0f8':C.paper,7,i===s.step?C.blue:C.line);
      circle(c,101,y+23,13,i<s.step?C.green:i===s.step?C.blue:C.pale);
      label(c,v,134,y+31,19,C.ink);
    });
    if(s.step===3)label(c,s.choice?'未通过':'验证通过',447,277,18,s.choice?C.red:C.green,'right');
  } else if(n===8) {
    box(c,52,46,456,48,C.pale,7);
    label(c,'当前图像 → 提示池检索',280,77,21,C.blue,'center');
    ['已学习概念 A','已学习概念 B','未学习 → 零向量'].forEach((v,i)=>{const y=111+i*49;
      box(c,83,y,394,40,i===s.choice?'#e9f0f8':C.paper,6,i===s.choice?C.blue:C.line);
      label(c,v,112,y+28,18,i===s.choice?C.blue:C.mute);
      if(i===s.choice)circle(c,445,y+20,7,i===2?C.orange:C.green);
    });
  } else if(n===9) {
    const names=['计划正例','计划错例','程序正例','程序错例'];
    names.forEach((v,i)=>{const x=43+(i%2)*245,y=56+Math.floor(i/2)*94;
      box(c,x,y,230,80,i===s.choice?'#e9f0f8':C.paper,7,i===s.choice?C.blue:C.line);
      circle(c,x+29,y+28,11,i%2?C.red:C.green);
      label(c,v,x+51,y+34,18,C.ink);
      line(c,x+50,y+53,x+175,y+53,C.line,3);
    });
    label(c,'按相似任务检索示例',280,267,18,C.blue,'center');
  } else if(n===10) {
    const values=s.choice===0?[49.8,54.6]:[60.8,65.6];
    label(c,s.choice===0?'GQA 准确率':'NLVRv2 准确率',280,59,22,C.blue,'center');
    line(c,140,244,483,244,C.line,2);
    for(let i=0;i<4;i++){const x=140+i*112;line(c,x,239,x,250,C.line,2);label(c,String(40+i*10),x,268,13,C.mute,'center');}
    values.forEach((v,i)=>{const y=95+i*67;const w=Math.max(3,(v-40)*11.2*(i===0?1:progress));
      box(c,140,y,w,39,i===0?C.mute:C.green,5);
      label(c,i===0?'VISPROG':'CLOVA',42,y+27,18,i===0?C.mute:C.green);
      if(i===0||progress>.96)label(c,v.toFixed(1)+'%',Math.min(478,150+w),y+27,17,C.ink);
    });
  }
}

function getFeedback(n: number, id: string, s: State) {
  if(n===1) return s.choice
    ? ['闭环更新针对已经定位的能力缺口；仍须人工反馈、数据与验证。','good']
    : ['工具调用可以成功，但冻结模型未必认识新概念。','bad'];
  if(n===2) return [
    ['任务尚未分解：模型需要先理解视觉目标。',''],
    ['计划说明先定位、再裁剪、最后问答；它可被检查。',''],
    ['程序指定LOC、CROP、VQA及参数；语义仍需执行验证。',''],
    ['中间结果决定这条计划是否真正解决问题。','good']
  ][s.step];
  if(n===3) return [
    ['LOC输出位置框，可用目标概念样本更新。',''],
    ['VQA回答图像问题；论文用推断答案收集样本。',''],
    ['SEG输出分割区域，可用开放词汇标注更新。',''],
    ['CLASSIFY输出类别；网页图像可用于补充新概念。','']
  ][s.choice];
  if(n===4 && id==='4.1') return s.choice
    ? ['中间证据加上人工反馈，可把批评指向更具体的步骤；仍需后续验证。','good']
    : ['只有最终错误，无法区分定位、问答与程序逻辑问题。','bad'];
  if(n===4) return [
    ['图像是原始观察；语言模型不直接获得每一处像素细节。',''],
    ['BLIP将中间图像转为描述，方便进入反思提示，但可能遗漏细节。',''],
    ['描述与人工期望共同约束批评，不能取代人工反馈。','good']
  ][s.step];
  if(n===5) return [
    ['先检查定位区域是否合理，不要提前归因。',''],
    ['裁剪区域若偏离目标，后面的问答也会受影响。',''],
    ['这里的示意错误出在问答输出，应针对该步骤继续核实。','bad'],
    ['最终判断只是结果；定位根因需要回看前面步骤。','']
  ][s.step];
  if(n===6) return [
    ['VQA：结合期望答案和中间结果，让语言模型推断工具答案；推断可能带噪声。',''],
    ['LOC/SEG：从开放词汇数据集中取图像与框或掩码。','good'],
    ['SELECT/CLASSIFY/REPLACE：搜索网络图像，之后必须验证训练效果。','']
  ][s.choice];
  if(n===7) return [
    ['收集到的样本只是候选监督，还未更新工具。',''],
    ['保持工具网络参数冻结，只调实例提示向量。',''],
    ['验证候选提示是否改善目标工具的响应。',''],
    s.choice ? ['验证不通过：丢弃提示，减少噪声传入。','bad'] : ['验证通过：把提示及对应特征存入提示池。','good']
  ][s.step];
  if(n===8) return s.choice===2
    ? ['提示池找不到该概念时，使用零向量提示并回退原工具。','bad']
    : ['已学概念：依据当前图像与库存特征的相似度组合已验证提示。','good'];
  if(n===9) return [
    ['计划正例为相似任务提供可用分解。','good'],
    ['计划错例连同批评提醒模型避免重复误解指令。',''],
    ['程序正例提供可执行的工具调用结构。','good'],
    ['程序错例指出参数或调用顺序上的问题。','']
  ][s.choice];
  if(n===10) return s.race==='idle'
    ? ['选择同一任务的准确率，再启动比较；不同任务指标不可混排。','']
    : s.race==='running'
    ? ['两种方法正在同一准确率刻度上比较。','']
    : s.choice===0
    ? ['GQA：54.6% 对 49.8%，高4.8个百分点；仅针对论文的500样本测试协议。','good']
    : ['NLVRv2：65.6% 对 60.8%，高4.8个百分点；测试阶段不再更新工具。','good'];
  return ['', ''];
}

export const ClovaScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const n = chapterId==='hero' ? 0 : Number(chapterId.replace('chap-',''));
  const kind: Mode = moduleId==='ana' ? 'ana' : chapterId==='hero' ? 'hero' : 'module';
  const [choice,setChoice] = useState(0);
  const [step,setStep] = useState(0);
  const [race,setRace] = useState<State['race']>('idle');
  const [compact,setCompact] = useState(()=>window.matchMedia('(max-width: 768px)').matches);
  const startRef = useRef(0);
  const stateRef = useRef<State>({choice,step,race,raceStart:0});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  stateRef.current = {choice,step,race,raceStart:startRef.current};
  const W = kind==='module'?(compact?560:1080):560;
  const H = kind==='module'?(compact?320:280):140;

  useEffect(()=>{
    const query=window.matchMedia('(max-width: 768px)');
    const sync=()=>setCompact(query.matches);
    query.addEventListener('change',sync);
    return ()=>query.removeEventListener('change',sync);
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=setupCanvas(canvas,W,H); let raf=0; let active=false;
    canvas.style.width='100%';
    canvas.style.height='auto';
    const draw=()=>{
      const s=stateRef.current; const now=performance.now();
      ctx.clearRect(0,0,W,H);
      if(kind==='ana') analogy(ctx,n,now/1000);
      else if(kind==='hero') {
        ctx.save(); ctx.scale(W/560,H/140);
        analogy(ctx,1,now/1000,moduleId); ctx.restore();
      } else {
        const progress=s.race==='idle'?0:s.race==='done'?1:clamp((now-s.raceStart)/1100,0,1);
        if(compact) compactBody(ctx,n,moduleId,s,progress);
        else body(ctx,n,moduleId,s,now/1000,progress);
        if(s.race==='running'&&progress===1) setRace('done');
      }
      if(!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if(active) raf=requestAnimationFrame(draw);
    };
    const start=()=>{if(!active){active=true;raf=requestAnimationFrame(draw);}};
    const stop=()=>{active=false;cancelAnimationFrame(raf);};
    const disconnect=observeCanvas(canvas,start,stop);
    return ()=>{stop();disconnect();};
  },[W,H,kind,n,moduleId,compact]);

  const pick=(v:number)=>{setChoice(v);if(n===10){setRace('idle');startRef.current=0;}};
  const advance=(d:number,max:number)=>setStep(v=>clamp(v+d,0,max));
  const startRace=()=>{startRef.current=performance.now();setRace('running');};
  const onPointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    if(kind!=='module'||compact)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-rect.left)*1080/rect.width;
    const y=(e.clientY-rect.top)*280/rect.height;
    if(n===5) setStep(clamp(Math.round((x-130)/260),0,3));
    if(n===3 && y>=72 && y<=204 && x>=135 && x<=893) {
      const centers=[214,414,614,814];
      setChoice(centers.reduce((best,v,i)=>Math.abs(v-x)<Math.abs(centers[best]-x)?i:best,0));
    }
    if(n===8 && x>=434 && x<=692 && y>=91 && y<=196) {
      setChoice(clamp(Math.round((y-102)/41),0,2));
    }
  };
  const chips=(options:string[],current:number,choose:(x:number)=>void)=>(
    <div className="chip-row" role="group" aria-label="选择观察条件">
      {options.map((v,i)=><button key={v} type="button" className={`chip ${current===i?'selected':''}`} aria-pressed={current===i} onClick={()=>choose(i)}>{v}</button>)}
    </div>
  );
  const steps=(max:number)=>(
    <div className="step-ctrl">
      <button type="button" onClick={()=>advance(-1,max)} disabled={step===0} aria-label="上一步">←</button>
      <span className="step-label"><b>{step+1}</b> / {max+1}</span>
      <button type="button" onClick={()=>advance(1,max)} disabled={step===max} aria-label="下一步">→</button>
    </div>
  );
  const controls=()=>{
    if(n===1) return chips(['冻结工具','完成更新'],choice,pick);
    if(n===2) return steps(3);
    if(n===3) return chips(['LOC定位','VQA问答','SEG分割','CLASSIFY分类'],choice,pick);
    if(n===4&&moduleId==='4.1') return chips(['只看最终答案','加入中间证据'],choice,pick);
    if(n===4) return steps(2);
    if(n===5) return chips(['定位','裁剪','问答','结果'],step,setStep);
    if(n===6) return chips(['VQA','LOC / SEG','SELECT等'],choice,pick);
    if(n===7) return <>{steps(3)}{step>=2?chips(['通过验证','未通过验证'],choice,pick):null}</>;
    if(n===8) return chips(['已学习概念 A','已学习概念 B','未学习概念'],choice,pick);
    if(n===9) return chips(['计划正例','计划错例','程序正例','程序错例'],choice,pick);
    if(n===10) return <><div className="ctrl compare-controls" style={{justifyContent:'space-between'}}>{chips(['GQA','NLVRv2'],choice,pick)}<button className="compare-btn" type="button" onClick={startRace}>{race==='idle'?'开始比较':'重新比较'}</button></div><p style={{margin:'6px 0',color:C.mute,fontSize:14}}>图像编辑：准确率 40.2% → 65.4%；知识标注：F1 0.393 → 0.502。两者采用不同协议，不参与上方赛道。</p></>;
    return null;
  };
  const [message,cls]=getFeedback(n,moduleId,stateRef.current);
  return <div>
    <canvas ref={canvasRef} width={W} height={H} onPointerDown={onPointer} onPointerMove={e=>{if(e.buttons&&n===5)onPointer(e);}} style={kind==='module'&&[3,5,8].includes(n)?{cursor:n===5?'grab':'pointer',touchAction:'none'}:undefined}/>
    {kind==='module' && <>{controls()}<div className={`feedback ${cls}`} role="status">{message}</div></>}
  </div>;
};
