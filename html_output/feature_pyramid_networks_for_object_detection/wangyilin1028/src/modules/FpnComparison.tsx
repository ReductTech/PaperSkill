import React,{useState} from 'react';
import {C,MiniStreet,Feedback,Choice} from './FpnKit';
const modes=[
 {name:'图像金字塔',calls:3,explain:'多种输入尺寸分别提取特征，照顾尺度变化；代价是重复计算。这里以三个尺寸为例。'},
 {name:'单层深层特征',calls:1,explain:'一次提取，只用深层特征预测。语义较强，但特征较粗，小目标可用的空间位置有限。'},
 {name:'骨干多层特征',calls:1,explain:'一次提取，直接使用多个骨干层。分辨率覆盖多个尺度，但浅层与深层之间仍有语义差距。'},
 {name:'FPN',calls:1,explain:'一次骨干提取，通过自顶向下与横向连接，让多个分辨率的特征都得到语义增强。'}
];
const xs=[130,390,650,910],sizes=[108,86,64,44];
function Diagram({method}:{method:number}){
 return <svg width="1096" height="370" viewBox="0 0 1096 370" role="img" aria-label={method===3?'FPN：C2至C5横向加入自顶向下的信息通路，形成P2至P5；骨干只运行一次。':`${modes[method].name}的多尺度表示方案示意`}>
 <defs><marker id="comparison-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill={C.green}/></marker></defs>
 {method===0?<>{[170,530,890].map((x,i)=><g key={x}><rect x={x-[140,100,70][i]/2} y={154-[140,100,70][i]} width={[140,100,70][i]} height={[140,100,70][i]} rx="8" fill={C.sky} stroke={C.blue} strokeWidth="3"/><text x={x} y="203" textAnchor="middle">{['大输入','中输入','小输入'][i]}</text><text x={x} y="261" textAnchor="middle">骨干 × 1</text></g>)}<text x="548" y="337" textAnchor="middle">输入图像变尺度 → 分别提取特征</text></>:<>
 {xs.map((x,i)=><g key={x} opacity={method===1&&i!==3?.16:1}>
 <rect x={x-sizes[i]/2} y={144-sizes[i]} width={sizes[i]} height={sizes[i]} rx="8" fill={i===3?'#edf7f1':'#eef2f8'} stroke={i===3?C.green:C.blue} strokeWidth="3"/>
 <text x={x} y="179" textAnchor="middle">C{i+2}</text>
 {method!==3&&<text x={x} y="249" textAnchor="middle">{i===3?'深层语义':i===0?'高分辨率':'中间层'}</text>}
 </g>)}
 {method===3?<>{xs.map((x,i)=><g key={x}><path d={`M${x} 192V235`} stroke={C.blue} strokeWidth="4"/>{i!==3&&<text x={x} y="245" textAnchor="middle">＋</text>}<path d={`M${x} 254V277`} stroke={C.green} strokeWidth="4" markerEnd="url(#comparison-arrow)"/><rect x={x-61} y="282" width="122" height="48" rx="8" fill="#edf7f1" stroke={C.green} strokeWidth="3"/><text x={x} y="316" textAnchor="middle">P{i+2}</text>{i<3&&<path d={`M${xs[i+1]-25} 235H${x+25}`} stroke={C.green} strokeWidth="4" markerEnd="url(#comparison-arrow)"/>}</g>)}<text x="770" y="211" textAnchor="middle" style={{fill:C.green}}>自顶向下传递</text><text x="548" y="360" textAnchor="middle">每个尺度都结合细节与深层信息</text></>:<text x="548" y="337" textAnchor="middle">{method===1?'仅使用一张深层特征图预测':'直接使用多层，层间语义强度不同'}</text>}
 </>}
 </svg>;
}
export function FpnComparison(){const [method,setMethod]=useState(3);const m=modes[method];return <div className="fpn-scene" style={{gap:20}}>
 <div className="fpn-row" style={{height:76,gap:12,alignItems:'center'}}>{modes.map((v,i)=><Choice key={v.name} active={method===i} onClick={()=>setMethod(i)}>{v.name}</Choice>)}</div>
 <div className="fpn-row" style={{height:380,gap:36,alignItems:'center'}}><div className="fpn-col" style={{width:340,gap:12}}><MiniStreet height={228}/><p>同一个街口<br/>比较远近目标的表示</p><p style={{color:C.blue}}>骨干运行 {m.calls} 次</p></div><Diagram method={method}/></div>
 <Feedback tone={method===3?'green':'blue'}>{m.explain}<br/>{method===3?'重点：兼顾多尺度、语义与计算复用；下一页展开两路特征怎样相加。':'切换至 FPN，比较它如何在同一次骨干计算上补充多尺度语义。'}</Feedback>
 </div>}
