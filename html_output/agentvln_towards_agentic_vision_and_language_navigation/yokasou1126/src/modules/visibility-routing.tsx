import React, { useState } from 'react';
import { Room, Painting, Person, Range, useTween } from './museum-cover';
const blue='#27446e',green='#228d5c',orange='#f07e47',ink='#21324a';
export function VisibilityRouting() {
 const [curtain,setCurtain]=useState(80);
 const visible=curtain<40;
 const clothX=useTween(265+(100-curtain)*1.9,500);
 return <div className="av-root" style={{display:'grid',gridTemplateRows:'360px 100px 122px',gap:20}}>
   <div style={{display:'grid',gridTemplateColumns:'500px 440px 484px',gap:24}}>
     <div>
       <h3 style={{fontSize:34,lineHeight:1.2,margin:'0 0 10px',color:ink}}>当前观测</h3>
       <div style={{height:300}}><Room width={500} height={300}>
         <Painting x={270} y={45} w={120} h={125} color={blue}/>
         <path d="M255 25 H475" stroke="#92400e" strokeWidth={8}/>
         <g transform={`translate(${clothX} 30)`}>
           <path d="M0 0 H145 V205 Q110 190 73 205 Q35 189 0 205Z" fill="#889dad" stroke={blue} strokeWidth={3}/>
           {[20,45,70,95,120].map(x=><path key={x} d={`M${x} 4 V193`} stroke="#6f879c" strokeWidth={5}/>)}
         </g>
         <Person x={95} y={274} scale={.6}/>
         {visible&&<circle cx={332} cy={194} r={17} fill={green} stroke="white" strokeWidth={3}/>}
         <text x={25} y={293} fontSize={28} fill={visible?green:blue}>{visible?'目标已可辨认':'继续探索目标'}</text>
       </Room></div>
     </div>
     <div style={{padding:'0 12px'}}>
       <h3 style={{fontSize:34,lineHeight:1.2,margin:'0 0 25px',color:ink}}>样本阶段</h3>
       <div style={{fontSize:44,lineHeight:1.3,fontWeight:750,color:visible?green:blue,marginBottom:22}}>{visible?'局部目标定位':'全局路径导航'}</div>
       <p style={{fontSize:28,lineHeight:1.45,margin:0,color:ink}}>{visible?'目标出现后，学习查询缺失几何线索，并精确定位目标。':'目标不可见时，学习选择与指令一致的可行路点，继续探索。'}</p>
       <p style={{fontSize:28,lineHeight:1.4,margin:'18px 0 0',color:'#68778f'}}>可用技能：{visible?'距离查询、精确导航':'环境感知、路点导航'}</p>
     </div>
     <div style={{paddingLeft:18,borderLeft:'2px solid #d7deea'}}>
       <h3 style={{fontSize:34,lineHeight:1.2,margin:'0 0 20px',color:ink}}>监督目标</h3>
       <svg viewBox="0 0 450 150" width="450" height="150" role="img" aria-label={visible?'从图像目标像素回映三维位置':'选择可行路点编号'}>
         <rect x={0} y={2} width={445} height={145} rx={18} fill="#f6f4ed"/>
         <rect x={270} y={25} width={75} height={75} fill={blue} stroke="#92400e" strokeWidth={6}/>
         {visible?<g><circle cx={307} cy={115} r={22} fill="none" stroke={orange} strokeWidth={4}/><path d="M279 115 h56 M307 87 v56" stroke={orange} strokeWidth={3}/></g>:<g>{[80,180,307].map((x,i)=><g key={x}><circle cx={x} cy={115} r={22} fill={i===2?green:'#b8c9a7'}/><text x={x} y={125} fontSize={28} textAnchor="middle" fill="white">{i+1}</text></g>)}</g>}
       </svg>
       <div style={{fontSize:34,lineHeight:1.4,fontWeight:700,marginTop:10,color:visible?green:blue}}>{visible?'目标像素 (420, 240)':'候选路点 ID = 3'}</div>
       <p style={{fontSize:28,lineHeight:1.4,margin:'8px 0 0',color:'#68778f'}}>教学示例，非真实训练记录</p>
     </div>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'700px 1fr',gap:40,alignItems:'center',padding:'10px 24px',borderRadius:18,background:'#edf2f6'}}>
      <Range label="布帘遮挡程度" value={curtain} min={0} max={100} step={5} unit="%" onChange={setCurtain}/>
      <p aria-live="polite" style={{fontSize:28,lineHeight:1.4,margin:0,color:visible?green:blue}}>{visible?'训练样本改为局部监督。40%只是网页示意，不是论文阈值。':'训练样本先教全局寻路；推理时的切换细节，后面再追问。'}</p>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:28,padding:'12px 24px',color:ink}}>
      <div style={{fontSize:34,lineHeight:1.3,fontWeight:700}}>AgentVLN-Instruct</div>
      <p style={{fontSize:28,lineHeight:1.45,margin:0}}>这两种侧重点是怎么学出来的？作者用 Habitat 生成“阶段—技能”对齐样本，再微调 Qwen2.5-VL-3B。视觉编码器和投影层保持冻结。</p>
   </div>
 </div>;
}
