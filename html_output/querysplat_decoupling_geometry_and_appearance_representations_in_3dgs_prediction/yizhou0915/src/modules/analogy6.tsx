import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["输入视图单独通过 VGM，提供 Fgeo、输入相机和几何坐标系。","输入与监督视图联合通过 VGM，只取相机；两次前向不交换特征。","使用共享输入相机估计相似变换，统一旋转、平移和整体尺度。","高斯、RGB/Plücker 特征与监督相机处于同一 VGM 坐标系；渲染图与目标图计算损失。"];
export const Analogy6:React.FC<WidgetProps>=()=> <Craft action={5}/>;
export const Frames:React.FC<WidgetProps>=()=>{

 const [step,setStep]=useState(0);return <Tool><Choices labels={['输入视图','监督相机','Sim(3) 对齐','渲染监督']} value={step} onChange={setStep}/>
 <Scene label="两次前向隔离和坐标对齐" draw={c=>{
 line(c,535,20,535,260,colors.red,3);
 house(c,255,235,1,true,colors.blue);c.save();c.translate(800,235);if(step<2){c.translate(35,-15);c.rotate(.13);c.scale(.82,.82)}house(c,0,0,1,false,step>=2?colors.green:colors.orange);c.restore();
 for(let k=0;k<3;k++){circle(c,140+k*110,252,9,colors.blue);if(step>0)circle(c,(step>=2?685:710)+k*(step>=2?110:85),252,9,step>=2?colors.green:colors.orange)}
 if(step===3){line(c,645,35,920,35,colors.green,5);circle(c,920,35,8,colors.green)}
 }}/>
 <div className="qs-network"><div><strong>输入视图前向</strong><p>重建特征 + 输入相机</p></div><div><strong>特征隔离</strong><p>不交换目标视图特征</p></div><div><strong>全视图前向</strong><p>只提供监督相机</p></div></div>
 <Steps value={step} max={3} onChange={setStep}/><Feedback tone={step>=2?'good':''}>{feedback[step]}</Feedback></Tool>;

};
