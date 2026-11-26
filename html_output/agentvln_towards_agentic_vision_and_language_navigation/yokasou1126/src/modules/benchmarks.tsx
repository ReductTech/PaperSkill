import React from 'react';
const blue='#27446e', green='#228d5c', ink='#21324a';
function Chart({title,rows}:{title:string;rows:[string,number,number][]}){
 return <svg width="720" height="450" viewBox="0 0 720 450" role="img" aria-label={`${title}，SR与SPL，百分数，越高越好`} style={{display:'block',fontSize:28,fontFamily:'inherit'}}>
 <text x="16" y="39" fill={ink} fontSize="34" fontWeight="750">{title}</text>
 <rect x="480" y="19" width="24" height="20" fill={blue}/><text x="516" y="39" fill={ink}>SR</text><rect x="604" y="19" width="24" height="20" fill={green}/><text x="640" y="39" fill={ink}>SPL</text>
 {[0,50,100].map(v=><g key={v}><line x1={210+v*4} x2={210+v*4} y1="69" y2="382" stroke="#d7deea"/><text x={210+v*4} y="420" textAnchor="middle" fill="#68778f">{v}{v===100?'%':''}</text></g>)}
 {rows.map(([name,sr,spl],i)=><g key={name}><text x="16" y={111+i*105} fill={ink} fontWeight={name==='AgentVLN'?750:500}>{name}</text>
 <rect x="210" y={78+i*105} width={sr*4} height="27" rx="5" fill={blue}/><text x={222+sr*4} y={101+i*105} fill={blue}>{sr.toFixed(1)}</text>
 <rect x="210" y={115+i*105} width={spl*4} height="27" rx="5" fill={green}/><text x={222+spl*4} y={138+i*105} fill={green}>{spl.toFixed(1)}</text></g>)}
 </svg>;
}
export function Benchmarks(){return <div className="av-root" style={{width:1472,height:622,display:'grid',gridTemplateRows:'450px 154px',gap:18}}>
 <div style={{display:'flex',gap:32}}><Chart title="R2R-CE · 未见场景" rows={[["EfficientVLN",64.2,55.9],["DualVLN",64.3,58.5],["AgentVLN",67.2,64.7]]}/><Chart title="RxR-CE · 未见场景" rows={[["EfficientVLN",67.0,54.3],["DualVLN",61.4,51.8],["AgentVLN",69.5,61.3]]}/></div>
 <div style={{display:'grid',gridTemplateColumns:'130px 1fr',alignItems:'center',gap:24,borderTop:'2px solid #d7deea',paddingTop:15}}>
 <svg width="130" height="115" viewBox="0 0 130 115" aria-label="博物馆出口与导览册"><rect x="13" y="6" width="74" height="102" rx="4" fill="#e7ede8" stroke={green} strokeWidth="3"/><path d="M37 17 L72 12 V104 L37 97 Z" fill="#b8c9a7"/><path d="M83 73 H119 M106 62 L119 73 L106 84" fill="none" stroke={green} strokeWidth="5"/><rect x="3" y="69" width="31" height="39" rx="3" fill="#e5cfad" stroke="#92400e" strokeWidth="2"/></svg>
 <div style={{fontSize:28,lineHeight:1.45,color:ink}}><div>先看数字：SR 回答“到了没有”，SPL 还要看有没有绕路。</div><div>但要注意输入条件：两基线是 RGB，AgentVLN 还用了深度。</div><div style={{color:'#68778f'}}>RxR 的 NE：3.92 m 对 3.88 m（EfficientVLN）。所以，不能说每项指标都赢了。</div></div></div>
 </div>;}
