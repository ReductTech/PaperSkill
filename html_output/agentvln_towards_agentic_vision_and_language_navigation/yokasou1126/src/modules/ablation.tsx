import React from 'react';
const rows:[string,number,number][]=[['基线',38.6,35.1],['VLM-as-Brain',59.7,55.6],['再加 CDFG',65.6,63.4],['再加 QD-PCoT',67.2,64.7]];
export function Ablation(){return <div className="av-root" style={{width:1472,height:622,display:'grid',gridTemplateRows:'452px 150px',gap:20}}>
 <svg width="1472" height="452" viewBox="0 0 1472 452" role="img" aria-label="R2R逐步消融：SR从38.6到67.2，SPL从35.1到64.7，百分数，越高越好" style={{fontFamily:'inherit',fontSize:28}}>
 <text x="18" y="36" fontSize="34" fill="#21324a" fontWeight="750">R2R 逐步叠加配置</text><rect x="800" y="12" width="26" height="24" fill="#27446e"/><text x="838" y="35" fill="#27446e">SR</text><rect x="944" y="12" width="26" height="24" fill="#228d5c"/><text x="982" y="35" fill="#228d5c">SPL</text>
 {[0,25,50,75,100].map(v=><g key={v}><line x1={310+v*9.7} x2={310+v*9.7} y1="60" y2="393" stroke="#d7deea"/><text x={310+v*9.7} y="434" textAnchor="middle" fill="#68778f">{v}{v===100?'%':''}</text></g>)}
 {rows.map(([label,sr,spl],i)=><g key={label}><text x="18" y={107+i*85} fill="#21324a" fontWeight={i===3?750:500}>{label}</text><rect x="310" y={73+i*85} width={sr*9.7} height="26" rx="5" fill="#27446e"/><text x={324+sr*9.7} y={96+i*85} fill="#27446e">{sr.toFixed(1)}</text><rect x="310" y={107+i*85} width={spl*9.7} height="26" rx="5" fill="#228d5c"/><text x={324+spl*9.7} y={130+i*85} fill="#228d5c">{spl.toFixed(1)}</text></g>)}
 </svg>
 <div style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:24,alignItems:'center',background:'#f5f3ec',borderRadius:18,padding:'10px 24px',fontSize:28,lineHeight:1.5,color:'#21324a'}}>
 <svg width="150" height="120" viewBox="0 0 150 120" aria-label="依次叠加的导览册页"><path d="M18 19 Q45 9 73 22 Q100 9 128 19 V103 Q100 93 73 107 Q45 93 18 103 Z" fill="#fffdf7" stroke="#92400e" strokeWidth="4"/>{[0,1,2,3].map(i=><path key={i} d={`M30 ${37+i*16} H61 M85 ${37+i*16} H116`} stroke={i===3?'#228d5c':'#b8c9a7'} strokeWidth="6"/>)}<path d="M73 23 V106" stroke="#d7deea" strokeWidth="3"/></svg>
 <div><div>先看最大的变化：引入大脑范式后，SR 从 38.6% 到了 59.7%。</div><div>但这是逐步叠加，不是独立因子实验；相邻差值不能当成独立贡献。</div><div style={{color:'#68778f'}}>再追问一句：QD-PCoT 只多了 1.6 个百分点，原因到底是什么？后面单独拆开看。</div></div></div>
 </div>;}
