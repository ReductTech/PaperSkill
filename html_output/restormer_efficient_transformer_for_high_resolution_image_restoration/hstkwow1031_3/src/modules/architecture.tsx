import React,{useState} from 'react';
import {encoderShape,residualToy,trainingSchedule,mdtaToy} from './mechanisms';
import {palette as P,f,Term,Formula,Range,Feedback,Camera,CalibrationArt,Choice,Lens} from './restoration-kit';

function FeatureSlab({level,selected}:{level:number;selected:boolean}){
 const edge=205-level*31,offset=18+level*8;
 return <svg viewBox="0 0 330 240" aria-hidden="true"><path d={`M${50+offset} 30h${edge}v${edge*.7}h-${edge}Z`} fill="#dbe4dc" stroke="#bdc9c4" strokeWidth="2"/><path d={`M50 ${30+offset}h${edge}v${edge*.7}h-${edge}Z`} fill={selected?'#e3f1e6':'#e7e9e2'} stroke={selected?P.green:P.blue} strokeWidth={selected?4:2}/>{Array.from({length:6},(_,i)=><g key={i} stroke={selected?P.green:P.blue} opacity=".35"><path d={`M${50+edge*(i+1)/7} ${30+offset}v${edge*.7}`}/><path d={`M50 ${30+offset+edge*.7*(i+1)/7}h${edge}`}/></g>)}<path d={`M50 ${30+offset}l${offset} -${offset}h${edge}l-${offset} ${offset}`} fill={selected?'#95bea7':'#aebfc5'}/><path d={`M${50+edge} ${30+offset}l${offset} -${offset}v${edge*.7}l-${offset} ${offset}`} fill={selected?'#5f9b7b':'#79939c'}/><circle cx={50+edge*.65} cy={30+offset+edge*.35} r={edge*.16} fill={selected?P.green:P.blue} opacity=".7"/><path d={`M65 ${30+offset+edge*.6}l${edge*.2} -${edge*.2} ${edge*.18} ${edge*.2}`} fill="none" stroke={P.orange} strokeWidth="5"/></svg>;
}
export function Multiscale(){
 const [level,setLevel]=useState(0),s=encoderShape(level);
 return <div className="lab-page lab-scale"><div className="lab-pyramid">{[0,1,2,3].map(l=>{const shape=encoderShape(l);return <button key={l} className={level===l?'selected':''} aria-pressed={level===l} onClick={()=>setLevel(l)}><div className="lab-level-label">编码层 {l+1}</div><FeatureSlab level={l} selected={level===l}/><strong>{shape.side}² × {shape.channels}</strong><span>{shape.blocks} 个块 · {shape.heads} 个头</span></button>})}</div>
 <div className="lab-scale-explanation"><div><span>当前观察的特征</span><Formula>{s.side} × {s.side} × {s.channels}</Formula></div><div><h3>空间减半，通道翻倍</h3><p>编码器逐层缩小空间分辨率。解码器恢复分辨率，并通过跳接拼接同尺度细节。</p></div><Camera size={94}/></div>
 <Feedback>输入示例为 512²。顶层解码保留 2C=96 通道，再用 4 个 refinement 块细化；图中的网格仅表示尺度，不是实际激活。</Feedback></div>;
}

export function ResidualRestore(){
 const [gain,setGain]=useState(.5),r=residualToy(gain);
 const rows=[{label:'输入 I',values:r.input,mode:'image'},{label:'修正量 R',values:r.residual.map(v=>v*gain),mode:'signed'},{label:'输出 Î',values:r.output,mode:'image'},{label:'已知目标',values:r.target,mode:'target'}];
 return <div className="lab-page lab-residual"><div className="lab-residual-heading"><Formula><Term meaning="Î：复原输出。">Î</Term> = <Term meaning="I：退化输入，当前是固定的合成一维像素条。">I</Term> + <Term meaning="R：预测的残差。示例用已知目标构造修正，再以滑杆缩放；不是模型输出。">R</Term></Formula><span>12 个合成像素 · 每格是一个亮度值</span><Camera size={65}/></div>
 <div className="lab-pixel-rows">{rows.map(row=><div className={`lab-pixel-row ${row.mode}`} key={row.label}><span>{row.label}</span><div>{row.values.map((v,i)=><div key={i} style={{background:row.mode==='signed'?(v<0?'#dbe7ee':'#f5ddc9'):`rgb(${255*v},${255*v},${255*v})`,color:row.mode==='signed'?P.ink:v<.5?'white':P.ink}}>{row.mode==='signed'?(v>0?'+':'')+f(v,2):f(v,2)}</div>)}</div></div>)}</div>
 <div className="lab-residual-control"><Range label="修正强度" value={gain} min={0} max={1.8} step={.1} onChange={setGain} display={`${f(gain,1)} ×`}/><div className="lab-error-readout"><span>示例均方误差</span><strong>{f(r.mse,5)}</strong></div></div>
 <Feedback tone={r.mse<1e-6?'green':'blue'}>{gain===1?'当前修正刚好抵消合成退化。':gain>1?'继续加大修正会越过目标。':'从输入出发，只学习需要补上的差异。'}本例已知目标，不能用来代表 Restormer 的推理效果。</Feedback></div>;
}

export function ProgressiveTraining(){
 const [stage,setStage]=useState(0),s=trainingSchedule[stage],box=s.patch*.84;
 return <div className="lab-page lab-training"><div className="lab-training-main"><div className="lab-crop-board"><CalibrationArt variant="detail"/><svg viewBox="0 0 600 400" aria-hidden="true"><path d={`M50 35H${50+box}V${35+box}H50Z`} fill="#f07e47" fillOpacity=".1" stroke={P.orange} strokeWidth="7"/><Lens x={50+box} y={35+box} r={28}/></svg><span>{s.patch} × {s.patch} 训练裁块</span></div>
 <div className="lab-schedule"><div className="lab-schedule-header"><span>起始迭代</span><span>裁块</span><span>batch</span></div>{trainingSchedule.map((item,i)=><button key={item.patch} className={stage===i?'selected':''} aria-pressed={stage===i} onClick={()=>setStage(i)}><span>{item.start}K</span><strong>{item.patch}²</strong><span>{item.batch}</span></button>)}</div></div>
 <div className="lab-training-summary"><h3>看见更大的上下文</h3><p>AdamW + L1 · 共 300K 次迭代。裁块逐渐变大，batch 逐渐缩小，以控制每步训练时间。</p></div>
 <Feedback>另一个 100K 次消融：固定/渐进为 29.71/29.78 dB、22.5/23.1 h（表 9）。不是上方 300K 课程的阶段得分。</Feedback></div>;
}

export function GlobalBoundary(){
 const [far,setFar]=useState(false),base=mdtaToy(.15,1,false),r=mdtaToy(.15,1,far),delta=r.output-base.output;
 return <div className="lab-page lab-boundary"><div className="lab-boundary-workbench"><div className="lab-local-fixed"><h3>近处的 V 保持不变</h3><div className="lab-fixed-values">{r.values.map((v,i)=><div key={i}><i style={{height:80+v*150,background:[P.blue,P.orange,P.green][i]}}/><strong>{f(v,1)}</strong></div>)}</div><p>同一个位置 · 3 个通道</p></div>
 <div className="lab-remote-patch"><h3>只改远处的两项特征</h3><button onClick={()=>setFar(!far)} aria-pressed={far} aria-label="切换远处特征"><div className="lab-remote-grid">{r.features.map((values,i)=><div key={i}>{values.map((v,j)=><span key={j} className={i===1&&j>=4?'editable':''} style={{background:`rgba(39,68,110,${.15+.7*v})`,color:v>.6?'white':P.ink}}>{f(v,1)}</span>)}</div>)}</div><span>{far?'点击恢复原模式':'点击改变橙框内的值'}</span></button><p>其余四个位置保持相同</p></div>
 <div className="lab-boundary-output"><Camera size={84}/><span>本地混合结果</span><strong className="lab-focal">{f(r.output,4)}</strong><p>相对原模式<br/>{delta>=0?'+':''}{f(delta,4)}</p></div></div>
 <div className="lab-boundary-rule"><Formula><Term meaning="V：本地特征值；A：由全幅通道关系产生的权重。本页保持本地V不变，只改变全幅统计。">VA</Term></Formula><p>远处特征改变了通道关系，因此本地的加权结果也会改变。<br/>这仍然不同于对所有像素对显式计算空间注意力。</p></div>
 <Feedback>全局上下文是一种建模能力，不是未知退化的质量保证。这里重算的是小型特征算例，不能据此推断真实图像的复原效果。</Feedback></div>;
}
