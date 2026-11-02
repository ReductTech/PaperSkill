import React, { useState } from 'react';
const navy='#203b51', teal='#277363', amber='#d99246', muted='#8ea7b5';
const texts=[
 ['寻找热源时，最亮的灯可能来自岸边。把灯移向弱小的目标，只是在提醒我们：亮度排序不能代替目标判断。','聚光灯照向小船后，局部细节才进入视野。图中的小船和岸灯是教学绘图，不是红外图像的检测结果。'],
 ['缩小观察范围后，窄小标记很难辨认。下面用真实尺寸推算和人工特征示意，区分采样损失与网络识别能力。','保留较细的观察网格，有助于看见窄小标记；它不保证模型已经学会区分目标和背景。'],
 ['全局调光为同一通道提供统一权重。这里用整幅巡检图一起变亮作类比，不表示实际注意力数值。','局部调光保留“在哪里”的差异。ACM 的局部分支逐位置生成通道权重，不是只生成一张通道共享的空间图。'],
 ['在不同巡检平台上安装同一工具，仍要分别比较原平台与加装后的结果。宿主网络的效果不能混成同一个实验。','切换平台后，应保持同一行的实验设置。ALCNet 与 AGPCNet 是后续工作，本章的宿主是原文的 FPN 与 ResNet-20。'],
 ['把所有巡检记录的交集、并集分别合起来，大面积记录的贡献会更大。这对应数据集层面的 IoU 汇总方式。','先算每张记录的 IoU，再平均，各图像权重相同。这对应 nIoU；它并不表示把 TP、FP、FN 都除以目标个数。'],
 ['论文里的实验结论需要表号、数据集和条件。盖上“原文”章，意味着能找到对应证据，而不是保证能推广到所有场景。','“换设备或换数据仍有效”需要新实验支持。把它标为待验证，才能区分论文证据、教学计算与后续假设。']
];
const labels=[['岸边亮灯','弱小船影'],['粗网格','细网格'],['全局调光','局部调光'],['FPN 平台','ResNet 平台'],['合并记录','逐张平均'],['原文证据','待验证判断']];
function Boat({x=280,y=88}:{x?:number,y?:number}) {return <g transform={`translate(${x},${y})`}><path d="M-24 0H24L14 12H-13Z" fill={amber}/><path d="M-8 0V-13H9V0" fill="#e0e8e7"/></g>}
export function ChapterAnalogy({index}:{index:number}) {
 const [state,setState]=useState(0);
 let visual:React.ReactNode;
 if(index===0)visual=<><rect width="560" height="140" fill={navy}/><path d="M0 94Q90 82 180 96T360 96T560 96" fill="none" stroke={muted}/><Boat x={345}/><rect x="90" y="35" width="18" height="55" fill="#516a76"/><circle cx="99" cy="32" r="9" fill="#f4d99f"/><circle cx={state?345:99} cy={state?87:40} r="35" fill="#f3c27c30" stroke={amber} strokeWidth="3"/></>;
 else if(index===1)visual=<><rect width="560" height="140" fill={navy}/><Boat/><g stroke={muted} opacity=".65">{Array.from({length:state?28:7},(_,i)=><path key={i} d={`M${i*(state?20:80)} 0V140`}/>)}{Array.from({length:state?7:2},(_,i)=><path key={i} d={`M0 ${i*(state?20:80)}H560`}/>)}</g></>;
 else if(index===2)visual=<><rect width="560" height="140" fill={navy}/><Boat x={280}/><circle cx="110" cy="52" r="16" fill="#708a94"/><path d="M400 95L450 35L510 95Z" fill="#57717d"/>{state?<circle cx="280" cy="82" r="40" fill="#f2ca7938" stroke={amber} strokeWidth="2"/>:<rect x="16" y="12" width="528" height="116" fill="#f2ca7928" stroke={amber} strokeWidth="2"/>}</>;
 else if(index===3)visual=<><rect width="560" height="140" fill="#edf2ed"/><rect x="170" y="20" width="220" height="100" rx="10" fill={navy}/><rect x="189" y="34" width="182" height="56" rx="3" fill={state?'#376e70':'#507ca0'}/><path d={state?'M205 64H230L250 42L275 78L300 48L325 65H350':'M205 76H240V58H275V42H310V28'} fill="none" stroke="#e8f0e8" strokeWidth="4"/><text x="280" y="109" textAnchor="middle" fontSize="20" fill="#e8f0e8">{state?'ResNet-20':'FPN'}</text></>;
 else if(index===4)visual=<><rect width="560" height="140" fill="#edf2ed"/>{[105,245,385].map((x,i)=><g key={x}><rect x={x-40} y="20" width="100" height="93" rx="5" fill="#fffefa" stroke={muted}/><path d={`M${x-24} 43h60M${x-24} 62h60M${x-24} 81h40`} stroke={muted} strokeWidth="4"/>{state?<circle cx={x+10} cy="107" r="10" fill={teal}/>:null}</g>)}{!state&&<path d="M75 121H445" stroke={teal} strokeWidth="7"/>}</>;
 else visual=<><rect width="560" height="140" fill="#edf2ed"/><rect x="105" y="15" width="350" height="110" rx="6" fill="#fffefa" stroke={muted}/><path d="M132 40H285M132 65H305M132 90H280" stroke={muted} strokeWidth="4"/><g transform={state?'rotate(5 371 73)':'rotate(-4 371 73)'}><rect x="325" y="42" width="96" height="62" rx="4" fill={state?'#f1ebf8':'#e5f0e8'} stroke={state?'#78608f':teal} strokeWidth="3"/><text x="373" y="83" fontSize="25" textAnchor="middle" fill={navy}>{state?'待证':'原文'}</text></g></>;
 return <div className="guide-analogy"><svg viewBox="0 0 560 140" role="img" aria-label={`${labels[index][state]}：夜间巡检教学类比`} style={{display:'block',width:'100%',height:'auto',borderRadius:6}}>{visual}</svg><div className="guide-analogy-switch">{labels[index].map((label,i)=><button type="button" key={label} aria-pressed={i===state} onClick={()=>setState(i)}>{label}</button>)}</div><p className="guide-analogy-caption" aria-live="polite">{texts[index][state]}</p></div>;
}
