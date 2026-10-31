import React,{useState} from 'react';
import {encoderShape,trainingSchedule,mdtaToy} from './mechanisms';
import {palette as P,f,Term,Formula,Range,Feedback,Camera,CalibrationArt,Choice,Lens} from './restoration-kit';

function FeatureSlab({level,selected}:{level:number;selected:boolean}){
 const edge=205-level*31,offset=18+level*8;
 return <svg viewBox="0 0 330 240" aria-hidden="true"><path d={`M${50+offset} 30h${edge}v${edge*.7}h-${edge}Z`} fill="#dbe4dc" stroke="#bdc9c4" strokeWidth="2"/><path d={`M50 ${30+offset}h${edge}v${edge*.7}h-${edge}Z`} fill={selected?'#e3f1e6':'#e7e9e2'} stroke={selected?P.green:P.blue} strokeWidth={selected?4:2}/>{Array.from({length:6},(_,i)=><g key={i} stroke={selected?P.green:P.blue} opacity=".35"><path d={`M${50+edge*(i+1)/7} ${30+offset}v${edge*.7}`}/><path d={`M50 ${30+offset+edge*.7*(i+1)/7}h${edge}`}/></g>)}<path d={`M50 ${30+offset}l${offset} -${offset}h${edge}l-${offset} ${offset}`} fill={selected?'#95bea7':'#aebfc5'}/><path d={`M${50+edge} ${30+offset}l${offset} -${offset}v${edge*.7}l-${offset} ${offset}`} fill={selected?'#5f9b7b':'#79939c'}/><circle cx={50+edge*.65} cy={30+offset+edge*.35} r={edge*.16} fill={selected?P.green:P.blue} opacity=".7"/><path d={`M65 ${30+offset+edge*.6}l${edge*.2} -${edge*.2} ${edge*.18} ${edge*.2}`} fill="none" stroke={P.orange} strokeWidth="5"/></svg>;
}
export function Multiscale(){
 const [level,setLevel]=useState(0),s=encoderShape(level);
 return <div className="lab-page lab-scale"><div className="lab-pyramid">{[0,1,2,3].map(l=>{const shape=encoderShape(l);return <button key={l} className={level===l?'selected':''} aria-pressed={level===l} onClick={()=>setLevel(l)}><div className="lab-level-label">编码层 {l+1}</div><FeatureSlab level={l} selected={level===l}/><strong>{shape.side}² × {shape.channels}</strong><span>{shape.blocks} 个块 · {shape.heads} 个头</span></button>})}</div>
 <div className="lab-scale-explanation"><div><span>当前观察的特征</span><Formula>{s.side} × {s.side} × {s.channels}</Formula></div><div><h3>空间减半，通道翻倍</h3><p>编码器逐层缩小空间分辨率。解码器恢复分辨率，并通过跳接拼接同尺度细节。</p></div><Camera size={94}/></div>
 </div>;
}

export function ResidualRestore(){
 const [index,setIndex]=useState(0);
 const input=[.35,.45,.52,.60,.42,.70,.28,.55,.64,.38,.75,.48];
 const residual=[.10,-.08,.04,-.12,.15,-.05,.12,-.10,.06,.08,-.15,.02];
 const output=input.map((v,i)=>v+residual[i]);
 const rows=[{label:'输入 I',values:input,mode:'image'},{label:'预测残差 R',values:residual,mode:'signed'},{label:'输出 Î',values:output,mode:'image'}];
 return <div className="lab-page lab-residual"><div className="lab-residual-heading"><Formula><Term meaning="Î：复原输出，与输入图像形状一致。">Î</Term> = <Term meaning="I：退化输入。这里用12个合成亮度值演示。">I</Term> + <Term meaning="R：网络末端预测的残差图像，与输入逐位置相加。本页的残差是人工设置的教学数值，不是模型推理。">R</Term></Formula><span>合成像素示例</span><Camera size={65}/></div>
 <div className="lab-pixel-rows">{rows.map(row=><div className={`lab-pixel-row ${row.mode}`} key={row.label}><span>{row.label}</span><div>{row.values.map((v,i)=><button key={i} aria-label={`查看${row.label}第${i+1}个位置`} aria-pressed={index===i} onClick={()=>setIndex(i)} style={{background:row.mode==='signed'?(v<0?'#dbe7ee':'#f5ddc9'):`rgb(${255*v},${255*v},${255*v})`,color:row.mode==='signed'?P.ink:v<.5?'white':P.ink}}>{row.mode==='signed'?(v>0?'+':'')+f(v,2):f(v,2)}</button>)}</div></div>)}</div>
 <div className="lab-residual-addition"><span>第 {index+1} 个位置</span><Formula>{f(input[index],2)} {residual[index]<0?'−':'+'} {f(Math.abs(residual[index]),2)} = {f(output[index],2)}</Formula><span>{residual[index]>0?'残差为正 → 亮度增加':'残差为负 → 亮度降低'}</span></div>
 </div>;
}

export function ProgressiveTraining(){
 const [stage,setStage]=useState(0),s=trainingSchedule[stage],box=s.patch*.84;
 return <div className="lab-page lab-training"><div className="lab-training-main"><div className="lab-crop-board"><CalibrationArt variant="detail"/><svg viewBox="0 0 600 400" aria-hidden="true"><path d={`M50 35H${50+box}V${35+box}H50Z`} fill="#f07e47" fillOpacity=".1" stroke={P.orange} strokeWidth="7"/><Lens x={50+box} y={35+box} r={28}/></svg><span>{s.patch} × {s.patch} 训练裁块</span></div>
 <div className="lab-schedule"><div className="lab-schedule-header"><span>起始迭代</span><span>裁块</span><span>batch</span></div>{trainingSchedule.map((item,i)=><button key={item.patch} className={stage===i?'selected':''} aria-pressed={stage===i} onClick={()=>setStage(i)}><span>{item.start}K</span><strong>{item.patch}²</strong><span>{item.batch}</span></button>)}</div></div>
 <div className="lab-training-summary"><h3>看见更大的上下文</h3><p>AdamW · L1 · 300K 次迭代</p></div>
 </div>;
}

export function GlobalBoundary(){
 const [far,setFar]=useState(false),base=mdtaToy(.15,1,false),r=mdtaToy(.15,1,far),delta=r.output-base.output;
 return <div className="lab-page lab-boundary"><div className="lab-boundary-workbench"><div className="lab-local-fixed"><h3>近处的 V 保持不变</h3><div className="lab-fixed-values">{r.values.map((v,i)=><div key={i}><i style={{height:80+v*150,background:[P.blue,P.orange,P.green][i]}}/><strong>{f(v,1)}</strong></div>)}</div><p>同一个位置 · 3 个通道</p></div>
 <div className="lab-remote-patch"><h3>只改远处的两项特征</h3><button onClick={()=>setFar(!far)} aria-pressed={far} aria-label="切换远处特征"><div className="lab-remote-grid">{r.features.map((values,i)=><div key={i}>{values.map((v,j)=><span key={j} className={i===1&&j>=4?'editable':''} style={{background:`rgba(39,68,110,${.15+.7*v})`,color:v>.6?'white':P.ink}}>{f(v,1)}</span>)}</div>)}</div><span>{far?'点击恢复原模式':'点击改变橙框内的值'}</span></button><p>其余四个位置保持相同</p></div>
 <div className="lab-boundary-output"><Camera size={84}/><span>本地混合结果</span><strong className="lab-focal">{f(r.output,4)}</strong><p>相对原模式<br/>{delta>=0?'+':''}{f(delta,4)}</p></div></div>
 <div className="lab-boundary-rule"><Formula><Term meaning="V：本地特征值；A：由全幅通道关系产生的权重。本页保持本地V不变，只改变全幅统计。">VA</Term></Formula><p>远处特征改变了通道关系，因此本地的加权结果也会改变。<br/>这仍然不同于对所有像素对显式计算空间注意力。</p></div>
 </div>;
}
