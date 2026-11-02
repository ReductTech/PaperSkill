import React,{useState} from 'react';
import {C,ToolIcon,Feedback} from './earth-kit';
const tools=[{name:'Index',label:'指数',input:'Red、NIR 波段',output:'NDVI 等指数'}, {name:'Inversion',label:'反演',input:'热红外与辅助参数',output:'地表温度等参数'}, {name:'Perception',label:'感知',input:'RGB 图像',output:'类别、框或掩码'}, {name:'Analysis',label:'分析',input:'带时间标签的序列',output:'趋势或变化信息'}, {name:'Statistics',label:'统计',input:'数值或栅格区域',output:'均值、方差或面积'}];
export function EarthScene02(){const [task,setTask]=useState(0);const [tool,setTool]=useState(0);const ok=task===tool;return <div className="ea-page">
 <div className="ea-controls" style={{height:64}}><label>当前目标 <select aria-label="当前科学任务" value={task} onChange={e=>setTask(Number(e.target.value))}>{['计算植被指数','反演地表温度','识别场景类别','估计时间趋势','计算区域均值'].map((v,i)=><option key={v} value={i}>{v}</option>)}</select></label><span style={{marginLeft:28}}>104 个专业工具 · Index / Inversion / Perception / Analysis / Statistics</span></div>
 <svg viewBox="0 0 1472 270" style={{width:'100%',height:270,display:'block'}} role="group" aria-label="选择巡查工具箱中的工具">
  <path d="M30 230H1440" stroke="#92400e" strokeWidth="14"/>
  {tools.map((t,i)=><g key={t.name} role="button" tabIndex={0} aria-label={'选择'+t.name+'工具包'} aria-pressed={tool===i} onClick={()=>setTool(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setTool(i)}}} style={{cursor:'pointer'}}>
   <rect x={20+i*290} y="12" width="268" height="236" rx="20" fill={tool===i?'#e8eef5':'#f6f7f2'} stroke={tool===i?C.blue:C.line} strokeWidth={tool===i?4:2}/>
   <g className="ea-animate" style={{transform:`translate(0,${tool===i?-10:0}px)`}}><ToolIcon kind={i} x={154+i*290} y={107} size={1.05} selected={tool===i}/></g>
   <text x={154+i*290} y="202" textAnchor="middle" fontSize="34" fill={C.blue}>{t.name}</text><text x={154+i*290} y="237" textAnchor="middle" fontSize="28" fill={C.muted}>{t.label}</text>
  </g>)}
 </svg>
 <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:28,padding:'24px 20px',height:155}}>
  <div><strong>所选功能包</strong><p>{tools[tool].name} · {tools[tool].label}</p></div><div><strong>需要的输入</strong><p>{tools[tool].input}</p></div><div><strong>返回的观测</strong><p>{ok?tools[tool].output:'操作与目标不匹配'}</p></div>
 </div>
 <Feedback tone={ok?'green':'red'}>{ok?'MCP 为领域工具提供标准化接入；LLM 仍负责按任务选择工具并组织参数。工具包本身不等于智能体。':'相机能识别外观，但不能替代光谱指数、反演或统计。选择与目标对应的操作。'}</Feedback>
 </div>}
