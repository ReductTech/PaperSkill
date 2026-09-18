import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["几何分支先预测 position、rotation、scale，决定空间支撑。","外观分支接收 Zgeo，并结合 Qapp 和 RGB/Plücker 特征预测 opacity 与 SH。","隐藏几何图层不等于移除几何计算：外观分支仍依赖 Zgeo。"];
export const Analogy3:React.FC<WidgetProps>=()=> <Craft action={2}/>;
export const Branches:React.FC<WidgetProps>=()=>{

 const [geo,setGeo]=useState(true),[app,setApp]=useState(false);
 return <Tool><div className="qs-controls"><label><input type="checkbox" checked={geo} onChange={e=>setGeo(e.target.checked)}/>几何图层</label><label><input type="checkbox" checked={app} onChange={e=>setApp(e.target.checked)}/>外观图层</label></div>
 <Scene label="几何支撑与表面外观的可见图层" draw={c=>{
 if(geo)house(c,330,248,1.2,false,colors.blue);
 if(app){c.globalAlpha=geo?1:.7;house(c,330,248,1.2,true,colors.green);c.globalAlpha=1}
 for(let i=0;i<5;i++){const on=i<3?geo:app;const x=650+(i%3)*130,y=80+Math.floor(i/3)*110;c.fillStyle=on?(i<3?colors.blue:colors.green):colors.line;c.fillRect(x,y,88,48);if(on){c.strokeStyle=colors.orange;c.lineWidth=3;c.strokeRect(x-4,y-4,96,56)}}
 if(geo&&app)line(c,500,155,618,155,colors.green,5)
 }}/>
 <div className="qs-readout"><span>几何：p / r / s</span><span>外观：α / SH</span><strong>{geo&&app?'属性组装':geo?'空间支撑':app?'外观可视化':'图层均隐藏'}</strong></div>
 <Feedback tone={geo&&app?'good':''}>{geo&&app?feedback[1]:geo?feedback[0]:app?feedback[2]:'两个教学图层均已隐藏；网络中的几何到外观依赖仍然存在。'}</Feedback></Tool>;

};
