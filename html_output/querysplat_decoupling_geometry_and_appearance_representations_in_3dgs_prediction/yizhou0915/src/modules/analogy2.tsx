import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["射线绑定限制高斯位置自由度；深度与相机误差可能形成冗余、偏移和重影。","查询摆脱像素绑定，但共享表示要同时学习空间结构与高频纹理；论文指出这会造成模糊与相机依赖。","几何先验帮助组织空间，独立外观路径补足纹理；这些是架构机制，不是每个场景必胜的保证。"];
export const Analogy2:React.FC<WidgetProps>=()=> <Craft action={1}/>;
export const Methods:React.FC<WidgetProps>=()=>{

 const [mode,setMode]=useState(0);
 return <Tool><Choices labels={['pixel-aligned','共享 query','QuerySplat']} value={mode} onChange={setMode}/>
 <Scene label="相同参照下的三种表示方式示意" draw={(c,t)=>{
 house(c,270,244,1.18,true,colors.blue);line(c,540,25,540,258);house(c,810,244,1.18,mode!==1,mode===2?colors.green:colors.red);
 if(mode===0){c.globalAlpha=.24;house(c,825,235,1.18,true,colors.red);c.globalAlpha=1;for(let i=0;i<7;i++){const yy=65+i*27;line(c,595,130,895,yy,colors.light,1);gaussian(c,737+i*19,yy,16,10,0,colors.red,.6)}}
 if(mode===1){for(let i=0;i<8;i++)gaussian(c,740+(i%4)*44,88+Math.floor(i/4)*96,45,26,.2,colors.blue,.45)}
 if(mode===2){for(let i=0;i<7;i++)circle(c,733+i*26,133+Math.abs(3-i)*18,3,colors.green)}
 brush(c,185+(Math.sin(t/1300)+1)*78,80);brush(c,725+(Math.sin(t/1300)+1)*78,80,mode===2?colors.green:colors.red);
 }}/>
 <div className="qs-readout"><span>左：共同参照</span><strong>右：{['射线绑定','自由位置、共享属性表示','几何先验 + 外观解耦'][mode]}</strong></div>
 <Feedback tone={mode===2?'good':'bad'}>{feedback[mode]}</Feedback></Tool>;

};
