import React,{useState} from 'react';
import {useTween} from './museum-cover';
const ks=[2,4,8,10], sr=[56.7,59.2,67.2,67.1], spl=[53.9,57.6,64.7,64.5], ne=[4.53,4.39,3.88,3.91];
export function TemporalContext(){
 const [k,setK]=useState(2); const movingK=useTween(k,550);const active=ks.indexOf(k);
 return <div className="av-root" style={{width:1472,height:622,display:'grid',gridTemplateRows:'460px 142px',gap:20}}>
 <div style={{display:'grid',gridTemplateColumns:'560px 888px',gap:24}}>
 <div style={{position:'relative',background:'#f5f1e8',borderRadius:20,padding:20,boxSizing:'border-box'}}>
 <div style={{fontSize:34,color:'#21324a',fontWeight:750,marginBottom:14}}>导览手册保留 {k} 帧</div>
 <svg width="520" height="268" viewBox="0 0 520 268" role="img" aria-label={`示意手册保留最近${k}帧；图片仅说明历史窗口，不是实测输入`}>
 <rect x="4" y="5" width="510" height="250" rx="12" fill="#fffdf7" stroke="#d6c9b6" strokeWidth="3"/>
 {Array.from({length:10},(_,i)=>{const keep=i>=10-k;const revealed=Math.max(0,Math.min(1,movingK-(9-i))); const x=22+(i%5)*99,y=20+Math.floor(i/5)*113+(1-revealed)*12;return <g key={i} transform={`translate(${x} ${y})`} opacity={keep?.4+.6*revealed:.18}>
 <rect width="82" height="91" rx="5" fill={keep?'#e3ece7':'#ece9e2'} stroke={keep?'#228d5c':'#68778f'} strokeWidth={keep?3:1}/><path d="M6 65 L41 41 L76 65 V83 H6Z" fill="#c8d1c5"/><rect x="20" y="14" width="43" height="34" fill={i%2?'#27446e':'#c7a878'} stroke="#92400e" strokeWidth="4"/><circle cx="43" cy="70" r="6" fill="#27446e"/>
 </g>})}
 </svg>
 <div role="group" aria-label="选择历史窗口帧数" style={{display:'flex',gap:12,marginTop:8}}>{ks.map(n=><button key={n} onClick={()=>setK(n)} aria-pressed={k===n} style={{fontSize:28,width:120,height:58,borderRadius:10,border:`2px solid ${k===n?'#27446e':'#d7deea'}`,background:k===n?'#27446e':'white',color:k===n?'white':'#21324a',fontWeight:650,cursor:'pointer'}}>{n} 帧</button>)}</div>
 </div>
 <svg width="888" height="460" viewBox="0 0 888 460" role="img" aria-label={`R2R上下文消融，当前${k}帧：SR ${sr[active]}%，SPL ${spl[active]}%`} style={{fontFamily:'inherit',fontSize:28}}>
 <text x="72" y="40" fill="#21324a" fontSize="34" fontWeight="750">R2R 验证集 · 固定实测点</text>
 <circle cx="572" cy="32" r="9" fill="#27446e"/><text x="590" y="42" fill="#27446e">SR</text><circle cx="701" cy="32" r="9" fill="#228d5c"/><text x="720" y="42" fill="#228d5c">SPL</text>
 {[50,60,70,75].map(n=><g key={n}><line x1="90" x2="810" y1={370-(n-50)*10} y2={370-(n-50)*10} stroke="#d7deea"/><text x="70" y={380-(n-50)*10} textAnchor="end" fill="#68778f">{n}</text></g>)}
 {ks.map((n,i)=>{const x=130+(n-2)*78;return <g key={n}><line x1={x} x2={x} y1="92" y2="370" stroke={k===n?'#f07e47':'#edf0f3'} strokeWidth={k===n?3:1} strokeDasharray="5 6"/><text x={x} y="418" fill={k===n?'#27446e':'#68778f'} textAnchor="middle">{n} 帧</text><circle cx={x} cy={370-(sr[i]-50)*10} r={k===n?12:7} fill="#27446e"/><text x={x} y={350-(sr[i]-50)*10} fill="#27446e" textAnchor="middle" fontWeight={k===n?750:500}>{sr[i]}</text><circle cx={x} cy={370-(spl[i]-50)*10} r={k===n?12:7} fill="#228d5c"/><text x={x} y={407-(spl[i]-50)*10} fill="#228d5c" textAnchor="middle" fontWeight={k===n?750:500}>{spl[i]}</text></g>})}
 <text x="18" y="85" fill="#68778f">%</text>
 </svg>
 </div>
 <div style={{display:'grid',gridTemplateColumns:'440px 1fr',gap:24,padding:'14px 20px',borderTop:'2px solid #d7deea',fontSize:28,lineHeight:1.45,boxSizing:'border-box'}}>
 <div aria-live="polite" style={{color:'#27446e',fontWeight:700}}>当前 {k} 帧：SR {sr[active]}%<br/>SPL {spl[active]}% · NE {ne[active].toFixed(2)} m</div>
 <div>{k===8?'看，这组实验里 8 帧最好，但不是“8 帧永远最优”。':k===10?'10 帧没有继续提高；差距这么小，先别急着下显著性结论。':'历史太短，可能连刚才怎么转弯都记不全。手册只是教学示意。'}<br/><span style={{color:'#68778f'}}>图 5 只测了这四个窗口，且没给方差；结论要留在这个实验范围内。</span></div>
 </div>
 </div>;
}
