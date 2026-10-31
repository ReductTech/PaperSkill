import React,{useState} from 'react';
import {Formula,Term,palette as P} from './restoration-kit';

export function NetworkOverview(){
 const [level,setLevel]=useState(0),shapes=['H × W × C','H/2 × W/2 × 2C','H/4 × W/4 × 4C','H/8 × W/8 × 8C'];
 const y=(i:number)=>38+i*94;
 return <div className="network-map"><div className="network-ends"><span>退化图像 I → 3 × 3 特征提取</span><span>Refinement → 3 × 3 → R → I + R</span></div>
 <svg viewBox="0 0 1472 414" role="img" aria-label="四层编码器解码器，横向同尺度跳接，最底层连接两侧。蓝色为当前观察尺度。">
 <defs><marker id="network-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill={P.blue}/></marker></defs>
 {[0,1,2,3].map(i=><g key={i}>
 {i<2&&<><path d={`M278 ${y(i)+48}V${y(i+1)-8}`} fill="none" stroke={P.blue} strokeWidth="3" markerEnd="url(#network-arrow)"/><path d={`M1195 ${y(i+1)-8}V${y(i)+48}`} fill="none" stroke={P.blue} strokeWidth="3" markerEnd="url(#network-arrow)"/></>}
 {i===2&&<><path d="M278 274V340H482" fill="none" stroke={P.blue} strokeWidth="3" markerEnd="url(#network-arrow)"/><path d="M990 340H1195V274" fill="none" stroke={P.blue} strokeWidth="3" markerEnd="url(#network-arrow)"/></>}
 {i<3&&<><path d={`M495 ${y(i)+20}H978`} fill="none" stroke={i===level?P.orange:'#bfcbd3'} strokeWidth={i===level?5:3} strokeDasharray={i<3?'9 7':undefined} markerEnd="url(#network-arrow)"/>
 <text x="736" y={y(i)+10} textAnchor="middle" fontSize="28" fill={P.ink}>同尺度特征拼接</text></>}
 {i===3?<g role="button" tabIndex={0} aria-label="查看最低分辨率潜在层" onClick={()=>setLevel(3)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setLevel(3)}}} style={{cursor:'pointer'}}><rect x="490" y="310" width="492" height="62" rx="12" fill={level===3?'#e7f1ec':'#f0f3f5'} stroke={level===3?P.green:'#bfcbd3'} strokeWidth="3"/><text x="736" y="350" textAnchor="middle" fontSize="28" fill={P.ink}>潜在层 · 最低分辨率 · 8C</text></g>:[false,true].map(dec=><g key={String(dec)} role="button" tabIndex={0} aria-label={`查看第${i+1}层${dec?'解码':'编码'}特征`} onClick={()=>setLevel(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setLevel(i)}}} style={{cursor:'pointer'}}><rect x={dec?986:62} y={y(i)-8} width="424" height="62" rx="12" fill={level===i?'#e7f1ec':'#f0f3f5'} stroke={level===i?P.green:'#bfcbd3'} strokeWidth="3"/><text x={dec?1198:274} y={y(i)+32} textAnchor="middle" fontSize="28" fill={P.ink}>{dec?(i===3?'潜在层 · 8C':`解码层 ${i+1} · ${i===0?'2C':2**i+'C'}`):`编码层 ${i+1} · ${2**i===1?'C':2**i+'C'}`}</text></g>)}
 </g>)}
 </svg>
 <div className="network-reading"><div><h3>第 {level+1} 层 · 编码特征</h3><Formula><Term meaning="H、W是图像高宽，C为基础通道数。这是编码侧的特征形状；各层重复使用同一种Transformer Block。">{shapes[level]}</Term></Formula></div><p>{level===0?'顶层：保留 2C → Refinement':level===3?'潜在层：最低分辨率 → 逐层上采样':'解码：上采样 → 拼接 → 1 × 1 降维'}</p></div></div>;
}

export function TransformerBlock(){
 const [part,setPart]=useState<'mdta'|'gdfn'>('mdta');
 return <div className="block-map">
 <div className="block-sequence"><div className="block-input">输入特征 X</div><span>→</span><button onClick={()=>setPart('mdta')} aria-pressed={part==='mdta'}><span>① LayerNorm → MDTA</span><strong>跨通道交换信息</strong><span>加回输入 X</span></button><span>→</span><button onClick={()=>setPart('gdfn')} aria-pressed={part==='gdfn'}><span>② LayerNorm → GDFN</span><strong>局部变换与门控</strong><span>加回中间特征 Y</span></button><span>→</span><div className="block-input">输出特征 Z</div></div>
 <div className="block-detail"><h3>{part==='mdta'?'MDTA · 通道关系':'GDFN · 局部门控'}</h3><Formula>{part==='mdta'?<><Term meaning="X：当前Transformer Block的输入。LN：层归一化。MDTA内部包含Q/K/V投影、通道注意力和输出投影。">Y = X + MDTA(LN(X))</Term></>:<Term meaning="Y：MDTA残差相加后的特征。GDFN内部包含两路卷积、GELU、逐元素乘积和末端投影；Z与Y形状一致。">Z = Y + GDFN(LN(Y))</Term>}</Formula><p>{part==='mdta'?'1 × 1 → 3 × 3 → Q/K/V → 通道注意力 → 投影':'两路卷积 → GELU ⊙ 另一支路 → 投影'}</p></div>
 </div>;
}
