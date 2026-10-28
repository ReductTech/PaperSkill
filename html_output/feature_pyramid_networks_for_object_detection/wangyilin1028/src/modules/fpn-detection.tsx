import React, { useState } from 'react';
import { C, Choice, Feedback, Person, Street } from './FpnKit';

function Comparison({baseline, selected, label}: {baseline:number;selected:boolean;label:string}) {
  const width = 600;
  return <div style={{ padding: '18px 24px', borderRadius: 16, border: `2px solid ${selected ? C.blue : C.line}`, background: selected ? '#f2f6fb' : '#fafbfc', height: 180 }}>
    <h3 style={{ marginBottom: 18 }}>{label}</h3>
    {[['C4',baseline],['FPN',33.9]].map(([name, value]) => <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 20, height: 46 }}>
      <span style={{ width: 78 }}>{name}</span>
      <div style={{ width, height: 28, background: '#e5eaf0', borderRadius: 4 }}><div style={{ width: `${Number(value)/40*100}%`, height: '100%', background: name === 'FPN' ? C.green : '#acbac8', borderRadius: 4 }}/></div>
      <strong>{Number(value).toFixed(1)}</strong>
    </div>)}
  </div>;
}

export function FpnDetection() {
  const [protocol, setProtocol] = useState<'fixed'|'consistent'>('fixed');
  const fixed = protocol === 'fixed';
  return <div className="fpn-scene">
    <div className="fpn-row" style={{ gap: 18 }}>
      <Choice active={fixed} onClick={() => setProtocol('fixed')}>表 2：固定候选</Choice>
      <Choice active={!fixed} onClick={() => setProtocol('consistent')}>表 3：一致骨干</Choice>
      <span style={{ alignSelf: 'center', marginLeft: 'auto', color: C.muted }}>COCO minival · AP ↑</span>
    </div>
    <div className="fpn-row" style={{ height: 396 }}>
      <div className="fpn-col" style={{ width: 936, gap: 18 }}>
        <Comparison baseline={31.9} selected={fixed} label="固定 FPN 候选，比较检测阶段"/>
        <Comparison baseline={31.6} selected={!fixed} label="候选与检测使用一致的骨干"/>
      </div>
      <aside className="fpn-col" style={{ width: 508, gap: 16 }}>
        <svg viewBox="0 0 900 450" width="508" height="150" role="img" aria-label={fixed ? '固定街景候选框，再比较区域检测特征' : '候选生成和区域检测均使用一致的特征骨干'}>
          <Street/><Person x={380} y={410} height={180}/><Person x={490} y={300} height={55} color={C.blue}/>
          <rect x="334" y="223" width="96" height="194" fill="none" stroke={fixed ? C.orange : C.green} strokeWidth="8"/>
          <rect x="470" y="240" width="38" height="65" fill="none" stroke={fixed ? C.orange : C.green} strokeWidth="7"/>
        </svg>
        <div className="fpn-value">+{fixed ? '2.0' : '2.3'} AP 点</div>
        <p>{fixed ? '候选保持相同，观察区域特征与检测头设置下的表现。' : 'RPN 与区域检测采用一致特征，比较完整检测系统。'}</p>
        <p className="fpn-muted">ResNet-50；trainval35k 训练。</p>
      </aside>
    </div>
    <Feedback>相同的 33.9 AP，来自不同对照。先确认候选与基线条件，再解释提升幅度。</Feedback>
  </div>;
}
