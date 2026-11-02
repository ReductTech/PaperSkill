import React,{useState} from 'react';
import {C,River,Person,Notebook,ToolIcon,Feedback} from './earth-kit';
export function EarthScene01(){
 const [mode,setMode]=useState(0);
 const modes=['RGB 照片','Spectrum 光谱','Products 产品'];
 return <div className="ea-page">
  <div className="ea-controls" style={{height:64}}>{modes.map((v,i)=><button key={v} aria-pressed={mode===i} onClick={()=>setMode(i)}>{v}</button>)}</div>
  <div style={{display:'grid',gridTemplateColumns:'900px 544px',gap:28,height:426}}>
   <svg viewBox="0 0 900 426" className="ea-svg" aria-label={modes[mode]+'支持的河岸观测'}>
    <River x={8} y={12} width={880} height={400}><Person x={mode===0?285:370} y={340} scale={1.05}/><ToolIcon kind={mode===0?2:mode===1?0:3} x={440} y={210} size={1.1} selected/>
    <g className="ea-animate" style={{transform:`translate(${mode*36}px,0)`}}><rect x="540" y="90" width="260" height="180" rx="16" fill="#fffdf7" stroke={C.line} strokeWidth="3"/>{mode===0?<><path d="M565 215L610 160L650 195L690 140L770 215Z" fill="#b8c9a7"/><circle cx="580" cy="125" r="16" fill="#d6c7a2"/><text x="563" y="250" fontSize="28" fill={C.blue}>河岸外观</text></>:mode===1?<><text x="565" y="130" fontSize="28" fill={C.ink}>Red = 0.20</text><text x="565" y="175" fontSize="28" fill={C.ink}>NIR = 0.60</text><text x="565" y="225" fontSize="34" fill={C.green}>NDVI = 0.50</text></>:<><text x="562" y="130" fontSize="28" fill={C.ink}>温度记录 / ℃</text><path d="M570 225L635 195L700 165L770 135" fill="none" stroke={C.green} strokeWidth="7"/><text x="565" y="255" fontSize="28" fill={C.blue}>20 → 22 → 24</text></>}</g></River>
   </svg>
    <div style={{padding:'18px 18px'}}>
    <h3 className="ea-heading">{['识别看起来是什么','计算光谱指数','追踪跨期变化'][mode]}</h3>
    <p>{['照片提供形状、颜色和纹理；无法凭空恢复未提供的近红外读数。','同一地物的多个波段提供数值输入，领域工具把它们转换成指数。','经过处理的温度等产品，支持统计与时间变化分析。'][mode]}</p>
    <div style={{borderTop:'2px solid '+C.line,marginTop:17,paddingTop:12}}>
     <strong>Earth-Bench · 248 个专家任务</strong>
     <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginTop:10}}>
      {[['Spectrum','100'],['Products','88'],['RGB','60']].map(([name,count])=><div key={name} style={{padding:'9px 6px',borderRadius:12,background:'#f0f4f8',textAlign:'center'}}><strong style={{display:'block',color:C.blue,fontSize:25}}>{count}</strong><span style={{fontSize:18}}>{name}</span></div>)}
     </div>
     <p style={{margin:'10px 0 0',fontSize:20}}><strong>14</strong> 类任务　·　平均 <strong>5.4</strong> 步推理</p>
    </div>
    <p className="ea-note" style={{fontSize:16,lineHeight:1.35}}>图中读数为合成教学。图像数：摘要 13,729；附录表 4 合计 13,737，原文两处不一致。</p>
   </div>
  </div>
  <Feedback tone={mode===0?'orange':'green'}>{['Earth-Bench 的 248 个专家任务跨越 RGB、光谱与产品数据，不限于看图问答。','提供波段数值后，才有计算 NDVI 的输入；数据与工具必须匹配。','产品数据与时间标签一起，才支持“如何变化”的定量问题。'][mode]}</Feedback>
 </div>;
}
