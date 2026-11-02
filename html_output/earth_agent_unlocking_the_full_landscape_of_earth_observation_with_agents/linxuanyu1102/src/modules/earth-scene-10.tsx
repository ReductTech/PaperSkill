import React from 'react';
import { C, ToolIcon, Feedback } from './earth-kit';

const rows = [
  ['GPT-Agent', 40.42, false],
  ['MGX', 18.60, false],
  ['Manus', 26.14, false],
  ['Coze', 15.30, false],
  ['Earth-Agent / GPT-5', 55.83, true],
  ['Earth-Agent / DeepSeek-V3.1', 47.84, true],
] as const;

export function EarthScene10() {
  return <div className="ea-page">
    <p style={{margin:'0 0 8px'}}>Earth-Bench-Lite · Table 2 · 60 题 · 平均准确率（%，越高越好）</p>
    <svg viewBox="0 0 1472 440" style={{width:1472,height:440}} className="ea-chart" role="img" aria-label="Earth-Bench-Lite 的六种智能体平均准确率比较">
      {[0,25,50,75,100].map(value=><g key={value}><path d={`M${370+value*7} 15V380`} stroke={C.line} strokeDasharray="5 7"/><text x={370+value*7} y="422" textAnchor="middle" fontSize="26" fill={C.muted}>{value}</text></g>)}
      {rows.map(([name,value,isEarthAgent],index)=>{
        const y=18+index*57;
        return <g key={name}>
          <text x="6" y={y+31} fontSize="25" fill={C.ink}>{name}</text>
          <rect x="370" y={y} width={value*7} height="36" rx="7" fill={isEarthAgent?C.green:C.blue}/>
          <text x={384+value*7} y={y+29} fontSize="25" fontWeight="700" fill={isEarthAgent?C.green:C.blue}>{value.toFixed(2)}</text>
        </g>;
      })}
      <rect x="1160" y="106" width="280" height="205" rx="22" fill="#f3f5ed" stroke={C.line} strokeWidth="2"/>
      <ToolIcon kind={0} x={1235} y={202}/><ToolIcon kind={4} x={1360} y={202}/>
      <text x="1300" y="358" textAnchor="middle" fontSize="25" fill={C.muted}>专用工具 × 通用推理</text>
    </svg>
    <Feedback tone="green">Earth-Bench-Lite 是为通用智能体比较构造的 60 题子集，三类模态各 20 题。Earth-Agent 两种骨干的平均准确率高于此表中的通用智能体；这是 Lite 协议结果，不是完整 248 题总榜，也不是单个工具的因果消融。</Feedback>
  </div>;
}
