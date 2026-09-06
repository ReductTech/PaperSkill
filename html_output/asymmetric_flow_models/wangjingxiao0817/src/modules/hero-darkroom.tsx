import React from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, clearDarkroom, drawPrint, drawBeam, drawBar, label, CanvasView } from './darkroom-core';
export const HeroDarkroom:React.FC<WidgetProps> = ({moduleId}) => { const old=moduleId==='old'; const ref=useCanvas((ctx,time)=>{ const p=(time%3000)/3000; clearDarkroom(ctx,360,190); drawPrint(ctx,104,38,174,108,.95,old?.88:.18); drawBeam(ctx,58+20*Math.sin(p*Math.PI*2),25,178,60,old?C.red:C.blue,old?38:16); if(!old){ ctx.strokeStyle=C.green; ctx.lineWidth=3; ctx.strokeRect(116,49,150,86); }
  drawBar(ctx,36,158,288,old?'噪声通道占用':'低秩噪声 / 满维输出',old?.94:.22,old?C.red:C.green); label(ctx,old?'满维噪声压住结构':'低秩滤片保留结构',96,22,old?C.red:C.blue); },[old],360,190,true); return <CanvasView ref={ref} width={360} height={190} aria-label={old?'满维速度预测示意':'AsymFlow 示意'} />; };
