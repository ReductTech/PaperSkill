import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Scene, Craft, Choices, Steps, Feedback, Source, colors, house, brush, gaussian, circle, line } from './kit';
const feedback=["position 属于几何：三维中心 p 决定高斯放在哪里。","rotation 属于几何：四元数 r 决定各向异性高斯的方向。","scale 属于几何：s 的三个分量控制沿局部轴的尺度。","opacity 属于外观分支输出：alpha 影响覆盖与合成，不是空间尺寸。","SH 属于外观：表示方向相关颜色。一阶 SH 每色通道 4 个系数，共 12 个，数目为基础维度推导。"];
export const Analogy4:React.FC<WidgetProps>=()=> <Craft action={3}/>;
export const Attributes:React.FC<WidgetProps>=()=>{

 const [attr,setAttr]=useState(0),[xy,setXY]=useState([540,140]),[rotation,setRotation]=useState(35),[scale,setScale]=useState(1),[alpha,setAlpha]=useState(.65),[angle,setAngle]=useState(0);
 const names=['position','rotation','scale','opacity','spherical harmonics'];
 return <Tool><Choices label="高斯属性" labels={names} value={attr} onChange={setAttr}/>
 <Scene label="高斯属性二维投影，可拖动位置" onDrag={attr===0?(x,y)=>setXY([Math.max(180,Math.min(900,x)),Math.max(95,Math.min(190,y))]):undefined} draw={c=>{
 line(c,90,140,990,140);line(c,540,25,540,260);
 const color=attr===4? (angle<0?colors.orange:colors.blue):colors.blue;
 gaussian(c,xy[0],xy[1],110*scale,45*scale,rotation*Math.PI/180,color,alpha);
 c.save();c.translate(xy[0],xy[1]);c.rotate(rotation*Math.PI/180);c.strokeStyle=attr<3?colors.orange:colors.green;c.lineWidth=3;c.beginPath();c.ellipse(0,0,110*scale,45*scale,0,0,2*Math.PI);c.stroke();c.restore();
 circle(c,xy[0],xy[1],7,colors.orange);
 if(attr===4){const a=angle*Math.PI/180;const x=540+320*Math.cos(a),y=140+95*Math.sin(a);circle(c,x,y,14,colors.orange);line(c,x,y,xy[0],xy[1],colors.orange,3)}
 }}/>
 <div className="qs-controls">{attr===0?<><label>投影 x<input aria-label="投影 x" type="range" min="180" max="900" value={xy[0]} onChange={e=>setXY([+e.target.value,xy[1]])}/></label><label>投影 y<input aria-label="投影 y" type="range" min="95" max="190" value={xy[1]} onChange={e=>setXY([xy[0],+e.target.value])}/></label></>:<label style={{width:'100%'}}>{['','投影转角','投影尺度','不透明度 α','示意观察方向'][attr]}<input aria-label={names[attr]} type="range" min={attr===1?0:attr===2?.5:attr===3?.02:-90} max={attr===1?180:attr===2?1.5:attr===3?1:90} step={attr===2||attr===3?.01:1} value={[0,rotation,scale,alpha,angle][attr]} onChange={e=>[()=>{},setRotation,setScale,setAlpha,setAngle][attr](+e.target.value)}/><output>{[0,rotation,scale,alpha,angle][attr].toFixed(2)}</output></label>}</div>
 <div className="qs-readout"><strong>{attr<3?'几何属性':'外观属性'}</strong><span>{['三维向量 p','四元数 r：4 分量','三维向量 s','标量 α','一阶 SH：每色通道 4 系数'][attr]}</span></div>
 <Feedback>{feedback[attr]}{attr===4?' 图中两种颜色只示意方向相关性，不是论文中的 SH 系数或颜色预测。':''}</Feedback></Tool>;

};
