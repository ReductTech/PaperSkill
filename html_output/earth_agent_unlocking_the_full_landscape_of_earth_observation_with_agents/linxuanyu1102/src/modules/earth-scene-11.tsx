import React from 'react';
import { C, River, ToolIcon, Feedback } from './earth-kit';

const rows = [
  { task: '分类', benchmark: 'AID', prior: 'VHM', base: 91.70, earth: 93.42 },
  { task: '分类', benchmark: 'WHU-RS19', prior: 'VHM', base: 95.80, earth: 96.12 },
  { task: '检测', benchmark: 'DOTA', prior: 'LHRS-Bot', base: 17.10, earth: 60.88 },
  { task: '检测', benchmark: 'HRSC2016', prior: 'LHRS-Bot', base: 24.40, earth: 65.60 },
  { task: 'Grounding', benchmark: 'DIOR-RSVG', prior: 'MiniGPT-v2', base: 29.892, earth: 60.46 },
];

export function EarthScene11() {
  return <div className="ea-page">
    <div className="ea-controls" style={{marginBottom:4}}><span>Table 3 · 任务专属遥感基准 · 分数越高越好</span><span style={{marginLeft:'auto',fontSize:20}}><i style={{display:'inline-block',width:16,height:16,background:C.blue,marginRight:7}}/>既有 MLLM　<i style={{display:'inline-block',width:16,height:16,background:C.green,margin:'0 7px 0 12px'}}/>Earth-Agent</span></div>
    <svg viewBox="0 0 1472 440" style={{width:1472,height:440}} className="ea-chart" role="img" aria-label="Earth-Agent 与各基准上较强既有 MLLM 的分类、检测和 Grounding 分数比较">
      {[0,25,50,75,100].map(value=><g key={value}><path d={`M${545+value*4.3} 35V420`} stroke={C.line} strokeDasharray="5 8"/><text x={545+value*4.3} y="28" textAnchor="middle" fontSize="20" fill={C.muted}>{value}</text></g>)}
      {rows.map((row,index)=>{
        const y=54+index*73;
        return <g key={row.benchmark}>
          <text x="12" y={y+27} fontSize="22" fontWeight="700" fill={C.orange}>{row.task}</text>
          <text x="150" y={y+29} fontSize="24" fontWeight="700" fill={C.ink}>{row.benchmark}</text>
          <text x="305" y={y+18} fontSize="18" fill={C.muted}>{row.prior}</text>
          <text x="305" y={y+43} fontSize="18" fontWeight="700" fill={C.green}>Earth-Agent</text>
          <rect x="545" y={y} width={row.base*4.3} height="20" rx="5" fill={C.blue}/>
          <rect x="545" y={y+27} width={row.earth*4.3} height="20" rx="5" fill={C.green}/>
          <text x={555+row.base*4.3} y={y+17} fontSize="18" fill={C.blue}>{row.base.toFixed(row.base%1?3:2)}</text>
          <text x={555+row.earth*4.3} y={y+44} fontSize="18" fill={C.green}>{row.earth.toFixed(2)}</text>
        </g>;
      })}
      <rect x="1110" y="50" width="328" height="345" rx="22" fill="#f7f9f7" stroke={C.line} strokeWidth="2"/>
      <River x={1128} y={68} width={292} height={205}/>
      <ToolIcon kind={2} x={1274} y={188} size={1.25} selected/>
      <text x="1274" y="307" textAnchor="middle" fontSize="21" fontWeight="700" fill={C.blue}>不同任务调用不同专家工具</text>
      <text x="1274" y="343" textAnchor="middle" fontSize="19" fill={C.muted}>分类 · 检测 · 视觉定位</text>
      <text x="1274" y="370" textAnchor="middle" fontSize="17" fill={C.muted}>定位任务在表中称 Grounding</text>
    </svg>
    <Feedback>Earth-Agent 在表 3 的五个基准上都高于对应既有模型分数；每一行对应自己的数据集与任务，不能把不同任务的分数横向当作同一指标。Grounding 是视觉定位，不是分割。</Feedback>
  </div>;
}
