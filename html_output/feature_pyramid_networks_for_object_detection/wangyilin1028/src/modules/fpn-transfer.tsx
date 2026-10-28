import React, { useState } from 'react';
import { C, Choice, Feedback, Person, Street } from './FpnKit';

function isPersonCell(row:number,col:number) {
  if (row === 1 || row === 2) return col >= 6 && col <= 7;
  if (row >= 3 && row <= 7 && col >= 5 && col <= 8) return true;
  if (row >= 4 && row <= 6) return col === 4 || col === 9;
  if (row >= 8 && row <= 12) return col === 5 || col === 6 || col === 8;
  return false;
}
const cells = Array.from({length:196},(_,i) => ({row:Math.floor(i/14),col:i%14}));
const selectedCount = cells.filter(c => isPersonCell(c.row,c.col)).length;

export function FpnTransfer() {
  const [mode, setMode] = useState<'box'|'mask'>('box');
  const mask = mode === 'mask';
  return <div className="fpn-scene">
    <div className="fpn-row" style={{ gap: 18 }}>
      <Choice active={!mask} onClick={() => setMode('box')}>框候选：圈出矩形范围</Choice>
      <Choice active={mask} onClick={() => setMode('mask')}>掩码候选：选择目标像素</Choice>
    </div>
    <div className="fpn-row" style={{ height: 394 }}>
      <div style={{ width: 856, position: 'relative', background: C.sky, borderRadius: 18 }}>
        <svg viewBox="0 0 900 450" width="856" height="394" role="img" aria-label={mask ? '教学人形掩码显示目标轮廓，矩形中的背景未被选中' : '矩形框包围行人，但同时包括周围背景'}>
          <Street/><Person x={422} y={375} height={250}/>
          {mask ? <g>{cells.map(({row,col}) => <rect key={`${row}-${col}`} x={310+col*16} y={100+row*20} width="16" height="20" fill={isPersonCell(row,col) ? C.green : 'white'} fillOpacity={isPersonCell(row,col) ? .68 : .13} stroke="white" strokeOpacity=".5" strokeWidth="1"/>)}</g> : <rect x="374" y="120" width="96" height="240" fill={C.orange} fillOpacity=".15" stroke={C.orange} strokeWidth="6"/>}
        </svg>
      </div>
      <aside className="fpn-col" style={{ width: 588, gap: 18 }}>
        <h3>{mask ? '轮廓比矩形更细' : '矩形中也包含背景'}</h3>
        <p>{mask ? `教学掩码从 14×14 个网格中选择 ${selectedCount} 格，不再将整个矩形视作目标。` : '框候选描述可能有物体的位置；它还没有给出精细轮廓。'}</p>
        <p className="fpn-caption">教学示意，非模型输出。</p>
        <div style={{ borderTop: `2px solid ${C.line}`, paddingTop: 16 }}>
          <p>论文表 6 · 掩码候选 AR@1000 ↑</p>
          <div className="fpn-row" style={{ gap: 28, marginTop: 14, alignItems: 'baseline' }}>
            <span>基础 <strong style={{ color: C.blue }}>43.4</strong></span>
            <span>最佳配置 <strong style={{ color: C.green }}>48.1</strong></span>
          </div>
        </div>
      </aside>
    </div>
    <Feedback tone={mask ? 'green' : 'blue'}>FPN 提供多尺度特征；更换预测头可生成类别无关的掩码候选。它不是直接输出完整实例分类。</Feedback>
  </div>;
}
