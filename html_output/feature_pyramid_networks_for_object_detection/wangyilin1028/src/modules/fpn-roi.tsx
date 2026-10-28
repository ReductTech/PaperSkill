import React, { useState } from 'react';
import { C, Street, Person, Range, Choice, Feedback, clamp } from './FpnKit';
import { SymbolHint } from '../components/SymbolHint';

export function FpnRoi(){
  const [width,setWidth]=useState(224);
  const [height,setHeight]=useState(224);
  const scale=Math.sqrt(width*height);
  const raw=4+Math.log2(scale/224);
  const floored=Math.floor(raw+1e-12);
  const level=clamp(floored,2,5);
  const f=.34;
  const preset=(w:number,h:number)=>{setWidth(w);setHeight(h);};
  return <div className="fpn-scene" style={{gap:18}}>
    <div className="fpn-formula" style={{height:70,flex:'0 0 70px',display:'flex',alignItems:'center',gap:18}}>
      <span><SymbolHint meaning="k：RoI使用的特征金字塔层编号；先向下取整，再限制在P2至P5。">k</SymbolHint> = ⌊4 + log₂(√(<SymbolHint meaning="w：候选区域在输入图像坐标中的宽度，单位为像素。">w</SymbolHint> · <SymbolHint meaning="h：候选区域在输入图像坐标中的高度，单位为像素。">h</SymbolHint>) / <SymbolHint meaning="224：参考尺度；面积为224²像素的RoI分到P4。">224</SymbolHint>)⌋</span>
      <span style={{color:C.green,marginLeft:'auto'}}>选用 P{level}</span>
    </div>
    <div className="fpn-row" style={{height:402,flex:'0 0 402px',gap:30}}>
      <div style={{width:650,display:'flex',flexDirection:'column',gap:14}}>
        <p style={{color:C.muted}}>街景取景框示意 · 不运行检测器</p>
        <svg width="650" height="264" viewBox="0 0 900 435" role="img" aria-label={`当前RoI宽${width}、高${height}像素，几何平均尺度${scale.toFixed(1)}像素，映射到P${level}。`} style={{borderRadius:18,background:C.sky}}>
          <Street/>
          <Person x={450} y={320} height={160}/>
          <rect x={450-width*f/2} y={230-height*f/2} width={width*f} height={height*f} fill={C.orange} fillOpacity=".10" stroke={C.orange} strokeWidth="6"/>
          <line x1={450-width*f/2} y1={230+height*f/2+20} x2={450+width*f/2} y2={230+height*f/2+20} stroke={C.orange} strokeWidth="3"/>
        </svg>
        <div style={{display:'flex',gap:12}}>
          <Choice active={width===112&&height===112} onClick={()=>preset(112,112)}>112 × 112</Choice>
          <Choice active={width===224&&height===224} onClick={()=>preset(224,224)}>224 × 224</Choice>
          <Choice active={width===112&&height===448} onClick={()=>preset(112,448)}>112 × 448</Choice>
        </div>
      </div>
      <div style={{width:792,display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:30}}>
          <Range label="区域宽度 w / 像素" value={width} min={28} max={896} step={28} onChange={setWidth}/>
          <Range label="区域高度 h / 像素" value={height} min={28} max={896} step={28} onChange={setHeight}/>
        </div>
        <div className="fpn-panel" style={{padding:'18px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
          <div><p>面积平方根</p><div className="fpn-value">{scale.toFixed(1)} px</div></div>
          <div><p>取整前 → 取整</p><div className="fpn-value">{raw.toFixed(2)} → {floored}</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[2,3,4,5].map(l=><div key={l} style={{height:100,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:4,border:`3px solid ${level===l?C.green:C.line}`,background:level===l?'#edf7f1':'#f7f9fb',borderRadius:12,transition:'background .2s,border-color .2s'}}><strong style={{fontSize:34,color:level===l?C.green:C.ink}}>P{l}</strong><span>步长 {2**l}</span></div>)}
        </div>
        <p style={{color:C.muted}}>{floored!==level?`原始编号${floored}超出范围，限制为P${level}。`:'同样的面积可以对应不同形状，但选层相同。'}</p>
      </div>
    </div>
    <Feedback tone="green">RoI 选层决定到哪里提取区域特征；不是给 RPN 锚框分配正负标签。原论文随后使用 RoI Pooling，并共享分类与回归头。</Feedback>
  </div>;
}
