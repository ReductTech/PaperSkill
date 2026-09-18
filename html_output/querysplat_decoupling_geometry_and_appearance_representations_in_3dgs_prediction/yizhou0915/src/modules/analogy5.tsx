import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["patch token 取第 4、11、17、23 层并学习混合；camera 与 register/scene token 取末层。","预测相机含位姿与内参，定义坐标框架和 Plücker 射线；pose-free 不意味着没有相机。","仅输入视图的深度反投影成伪点云，供早期 Chamfer 正则；深度不是永久位置约束。"];
export const Analogy5:React.FC<WidgetProps>=()=> <Craft action={4}/>;
export const Prior:React.FC<WidgetProps>=()=>{

 const [part,setPart]=useState(0);return <Tool><Choices labels={['几何特征','预测相机','预测深度']} value={part} onChange={setPart}/>
 <Scene label="几何模型输出及用途示意" draw={c=>{
 house(c,310,244,1.2,true);
 if(part===0){for(let k=0;k<4;k++){c.fillStyle=k%2?colors.light:colors.dark;c.fillRect(620+k*82,45+k*24,50,130);for(let j=0;j<6;j++)line(c,620+k*82,60+k*24+j*19,670+k*82,60+k*24+j*19,colors.bg,2)}}
 if(part===1){for(let k=0;k<3;k++){const x=625+k*160,y=65+k*50;circle(c,x,y,12,colors.blue);line(c,x,y,720,240,colors.blue,2);line(c,x,y,850,220,colors.blue,2)}}
 if(part===2){for(let k=0;k<45;k++){const x=650+(k%9)*34,y=80+Math.floor(k/9)*33;circle(c,x,y,4+(k%3),colors.green)}line(c,630,250,960,250,colors.line,3)}
 }}/>
 <div className="qs-readout">{part===0?<><strong>Patch：4 / 11 / 17 / 23 层</strong><span>Camera / Register：末层</span><span>可学习 layer mixer → Fgeo</span></>:part===1?<><strong>位姿 + 内参</strong><span>共同坐标系 / Plücker 射线</span></>:<><strong>深度 → 反投影伪点云</strong><span>只用于早期位置正则</span></>}</div>
 <Feedback>{feedback[part]}</Feedback></Tool>;

};
