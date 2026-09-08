import React from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, clearDarkroom, drawPrint, drawBeam, label, CanvasView } from './darkroom-core';

export const DarkroomAnalogy:React.FC<WidgetProps> = ({chapterId}) => {
  const n=Number(chapterId.replace('chap-',''))||1;
  const ref=useCanvas((ctx,time)=>{ const p=(time%3000)/3000; clearDarkroom(ctx,244,130); drawPrint(ctx,92,26,114,78,.92,n===1?.72:n===9?.36:.12);
    ctx.fillStyle=C.support; ctx.fillRect(24,15,8,78); ctx.fillRect(18,13,36,8);
    if(n===1){ drawBeam(ctx,48+44*p,20,136,52,C.red,24); label(ctx,'满维颗粒',8,120,C.red); }
    else if(n===2){ const x=58+128*p; ctx.fillStyle=C.orange; ctx.fillRect(x,99,8,16); label(ctx,'曝光时间 t',72,121,C.orange); }
    else if(n===3){ ctx.save(); ctx.translate(71,48); ctx.rotate(p*Math.PI*2); ctx.strokeStyle=C.blue; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*.65); ctx.stroke(); ctx.restore(); label(ctx,'低秩滤片',18,120,C.blue); }
    else if(n===4){ const x=42+38*p; ctx.fillStyle=C.blue; ctx.fillRect(x,42,12,44); ctx.fillStyle=C.green; ctx.fillRect(x+12,42,12,44); label(ctx,'互补对齐',28,120,C.green); }
    else if(n===5){ const y=24+10*Math.sin(p*Math.PI*2); ctx.fillStyle=C.blue; ctx.beginPath(); ctx.arc(70,y,13,0,Math.PI*2); ctx.fill(); drawBeam(ctx,70,y+10,144,52,C.blue,16); label(ctx,'底片抬升',28,120,C.blue); }
    else if(n===6){ ctx.strokeStyle=C.orange; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(68,55,21,p*Math.PI*2,p*Math.PI*2+Math.PI*1.4); ctx.stroke(); label(ctx,'尺度校准',30,120,C.orange); }
    else if(n===7){ const x=46+36*(.5+.5*Math.sin(p*Math.PI*2)); ctx.fillStyle=C.purple; ctx.fillRect(x,45,16,48); label(ctx,'试条减差',28,120,C.purple); }
    else if(n===8){ const x=44+28*p; ctx.fillStyle=C.blue; ctx.fillRect(x,35,15,50); label(ctx,'只换接口',30,120,C.blue); }
    else if(n===9){ const x=98+92*p; ctx.strokeStyle=C.green; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(x,34); ctx.lineTo(x-18,78); ctx.stroke(); label(ctx,'感知修片',28,120,C.green); }
    else { ctx.save(); ctx.beginPath(); ctx.rect(92,26,114*p,78); ctx.clip(); drawPrint(ctx,92,26,114,78,1,.05); ctx.restore(); label(ctx,'按证据验收',20,120,C.green); }
  },[n],244,130,true); return <CanvasView ref={ref} width={244} height={130} aria-label={`第${n}章暗房类比动画`} />;
};
