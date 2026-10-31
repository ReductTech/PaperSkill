import React,{useState} from 'react';
import {useCoverPlayback} from '../components/CoverPlayback';
import type {WidgetProps} from './registry';
import {mdtaToy,localToy,gelu,gateToy} from './mechanisms';
import {palette as P,f,Term,Formula,Range,Feedback,Choice,Camera,CalibrationArt,FilmPlate,Matrix} from './restoration-kit';

export function RestCover({moduleId}:WidgetProps){
 const {progress}=useCoverPlayback(),modern=moduleId==='newMethod',p=Math.min(1,progress*1.25);
 return <div className={`lab-cover-art ${modern?'modern':'legacy'}`}><div className="lab-cover-photo"><CalibrationArt/>
  <svg viewBox="0 0 600 400" aria-hidden="true">{modern?<><rect x={40+18*p} y="35" width="210" height="310" fill={P.blue} opacity=".18" stroke={P.blue} strokeWidth="4"/><rect x={195+14*p} y="35" width="210" height="310" fill={P.green} opacity=".2" stroke={P.green} strokeWidth="4"/><rect x={350+10*p} y="35" width="210" height="310" fill={P.orange} opacity=".13" stroke={P.orange} strokeWidth="4"/><path d={`M30 ${35+310*p}H570`} stroke={P.green} strokeWidth="5"/></>:<>{Array.from({length:9},(_,i)=><path key={i} d={`M${45+i*60} 20V380M20 ${40+i*40}H580`} stroke="#fff" opacity=".7" strokeWidth="2"/>)}<circle cx={50+480*p} cy={80+230*p} r="34" fill="none" stroke={P.red} strokeWidth="7"/><path d={`M${80+480*p} ${110+230*p}l32 32`} stroke="#e1bc8b" strokeWidth="12"/></>}</svg>
 </div><div className="lab-cover-caption"><span>{modern?'全幅观察，建立通道关系':'逐点比较，空间关系迅速增多'}</span><strong>{modern?'C × C':'HW × HW'}</strong></div></div>;
}

function count(v:number){return v>=1e12?f(v/1e12,1)+' 万亿':v>=1e8?f(v/1e8,2)+' 亿':v.toLocaleString();}
export function Complexity(){
 const [side,setSide]=useState(512),n=side*side,entries=n*n;const choices=[128,256,512,1024,2048];
 return <div className="lab-page lab-complexity"><div className="lab-inline-controls"><span>选择相片尺寸</span>{choices.map(s=><Choice key={s} selected={side===s} onClick={()=>setSide(s)}>{s}²</Choice>)}<Camera size={72}/></div>
 <div className="lab-cost-pair"><div className="lab-cost-old"><div className="lab-cost-title"><h3>空间自注意力</h3><span>像素 ↔ 像素</span></div><div className="lab-cost-visual"><div className="lab-photo-print"><CalibrationArt variant="detail"/><div className="lab-photo-rule" style={{backgroundSize:`${Math.max(7,45-side/60)}px ${Math.max(7,45-side/60)}px`}}/></div><div className="lab-cost-number"><strong>{count(entries)}</strong><span>矩阵元素</span><p>边长 × 2<br/>元素数 × 16</p></div></div><Formula><Term meaning="N=H×W：图像中的空间位置数；当前为图像边长的平方。">N²</Term> = ({side}²)²</Formula></div>
 <div className="lab-cost-new"><div className="lab-cost-title"><h3>MDTA 转置注意力</h3><span>通道 ↔ 通道</span></div><div className="lab-cost-visual"><div className="lab-fixed-matrix">{Array.from({length:36},(_,i)=><i key={i} style={{opacity:.2+((i*7)%9)/12}}/>)}</div><div className="lab-cost-number"><strong>2,304</strong><span>矩阵元素</span><p>示例固定 48 通道<br/>矩阵大小不变</p></div></div><Formula><Term meaning="C：本例单个注意力头内的通道数，固定48。多头时每个头使用自己的通道子集。">C²</Term> = 48²</Formula></div></div>
 <Feedback>省掉的是巨大的空间配对矩阵。MDTA 的投影与聚合仍随像素数增长；这不是整网显存或耗时测量。</Feedback></div>;
}

export function LocalContext(){
 const [index,setIndex]=useState(12),[depth,setDepth]=useState(true),r=localToy(index,depth);
 return <div className="lab-page lab-local"><div className="lab-local-main"><div className="lab-local-source"><h3>1 × 1：通道混合</h3><div className="lab-channel-inputs">{r.channels.map((c,i)=><div key={i}><span>特征 {i+1}</span><strong>{f(c[index],2)}</strong><div className="lab-channel-swatch" style={{background:[P.blue,P.orange,P.green][i],opacity:.2+c[index]*.8}}/></div>)}</div><Formula>0.55 × {f(r.channels[0][index],2)}<br/>+ 0.30 × {f(r.channels[1][index],2)}<br/>+ 0.15 × {f(r.channels[2][index],2)}</Formula><p>固定权重的 1 × 1 投影示例</p></div>
 <div className="lab-local-grid-wrap"><h3>点选位置，观察邻域</h3><div className="lab-local-grid">{r.grid.map((v,i)=><button key={i} aria-label={`像素 ${i+1}`} aria-pressed={i===index} onClick={()=>setIndex(i)} className={depth&&r.neighbours.includes(i)?'neighbour':''} style={{background:`rgba(39,68,110,${v})`,color:v>.55?'#fff':P.ink}}>{f(v,2)}</button>)}</div></div>
 <div className="lab-local-result"><Camera size={86}/><h3>{depth?'3 × 3 逐通道卷积':'仅 1 × 1 投影'}</h3><strong className="lab-focal">{f(r.value)}</strong><div className="lab-output-sample" style={{background:`rgba(34,141,92,${r.value})`}}/><p>{depth?'当前通道的邻域参与输出。边界使用零填充。':'同一位置跨通道组合；邻近位置尚未参与。'}</p></div></div>
 <div className="lab-inline-controls"><span>局部上下文</span><Choice selected={!depth} onClick={()=>setDepth(false)}>仅 1 × 1</Choice><Choice selected={depth} onClick={()=>setDepth(true)}>加入 3 × 3</Choice><span>点网格移动观察位置</span></div>
 <Feedback>先跨通道投影，再注入空间邻域。这里用固定权重与均值核展示计算；论文中的卷积权重由训练学习。</Feedback></div>;
}

export function ChannelAttention(){
 const [mix,setMix]=useState(.15),[column,setColumn]=useState(0),r=mdtaToy(mix,1,false);const output=r.values.reduce((s,v,i)=>s+v*r.weights[i][column],0);
 return <div className="lab-page lab-channel-page"><div className="lab-attention-workbench"><div className="lab-feature-rack"><h3>整幅图像上的通道模式</h3>{r.features.map((v,i)=><FilmPlate key={i} values={v} label={`通道 ${i+1}`} color={[P.blue,P.orange,P.green][i]}/>)}<p>每行 6 个位置 · 不是 RGB 颜色</p></div><div className="lab-attention-matrix"><h3>通道注意力</h3><Matrix values={r.weights} selectedColumn={column} label="A · 3 × 3" onCell={(_,j)=>setColumn(j)}/></div><div className="lab-mixture"><h3>输出通道 {column+1}</h3>{r.values.map((v,i)=><div className="lab-mixture-term" key={i}><span>{f(r.weights[i][column],3)} × {f(v,1)}</span><div><i style={{width:`${r.weights[i][column]*100}%`,background:[P.blue,P.orange,P.green][i]}}/></div></div>)}<strong className="lab-focal">{f(output)}</strong><p>选择矩阵的一列，重算混合。</p></div></div>
 <div className="lab-attention-bottom"><Range label="改变通道 2 的空间模式" value={mix} min={0} max={1} step={.05} onChange={setMix}/><Formula><Term meaning="A：每个输出通道的归一化权重；本例按列归一化。">A</Term> = <Term meaning="Softmax：将每一列的关联分数归一化为和为1的权重。">Softmax</Term>(<Term meaning="K为3×6，Q为6×3。本例由相同的单位范数通道向量组成；不是训练得到的Q/K。">KQ</Term>)</Formula></div>
 <Feedback>全幅位置先参与通道关系计算，再用同一张小矩阵混合特征。它并不为每一对像素学习独立的空间权重。</Feedback></div>;
}

export function AttentionScale(){
 const [alpha,setAlpha]=useState(.6),r=mdtaToy(.15,alpha,false);
 return <div className="lab-page lab-alpha"><div className="lab-alpha-top"><div><h3>同一组关联分数，不同的集中程度</h3><p>第一输出通道的分数固定为 [{r.scores.map(row=>f(row[0],2)).join(', ')}]。</p><Formula><Term meaning="α：点积之后、Softmax之前的可学习缩放参数；本页只手动改变α。">α</Term> = {f(alpha,2)}</Formula></div><Camera size={116}/></div>
 <div className="lab-alpha-main"><div className="lab-weight-ribbons">{r.weights.map((row,i)=><div className="lab-weight-row" key={i}><span>通道 {i+1}</span><div><i style={{width:`${row[0]*100}%`,background:[P.blue,P.orange,P.green][i]}}/></div><strong>{f(row[0])}</strong></div>)}<p>每列的权重和始终为 1</p></div><div className="lab-alpha-output"><span>在固定位置混合 V</span><Formula>{r.weights.map((w,i)=><React.Fragment key={i}>{i>0?' + ':''}{f(w[0],2)} × {r.values[i]}</React.Fragment>)}</Formula><strong className="lab-focal">{f(r.output)}</strong></div></div>
 <Range label="缩放参数 α" value={alpha} min={.15} max={2} step={.05} onChange={setAlpha}/>
 <Feedback>较小 α 使权重更集中，较大 α 使权重更均匀。论文让网络学习这个尺度；单独变尖或变平不等于质量提升。</Feedback></div>;
}

export function GatedFeedforward(){
 const [a,setA]=useState(1),[b,setB]=useState(.8);const activated=gelu(a),out=gateToy(a,b),x=(v:number)=>70+(v+3)/6*560,y=(v:number)=>280-v*65;
 const curve=Array.from({length:121},(_,i)=>{const v=-3+i*.05;return `${i?'L':'M'}${x(v)},${y(gelu(v))}`}).join(' ');
 return <div className="lab-page lab-gate"><div className="lab-gate-main"><div className="lab-gelu-plot"><h3>一路经过 GELU</h3><Camera size={60}/><svg viewBox="0 0 700 355" role="img" aria-label={`GELU曲线，输入${f(a,1)}，输出${f(activated)}`}><path d="M70 280H655M350 35V325" stroke="#c8c9c2" strokeWidth="2"/><path d={curve} fill="none" stroke={P.blue} strokeWidth="5"/><path d={`M${x(a)} 280V${y(activated)}H350`} fill="none" stroke={P.orange} strokeWidth="3" strokeDasharray="7 7"/><circle cx={x(a)} cy={y(activated)} r="10" fill={P.orange}/><text x="70" y="330">−3</text><text x="350" y="330">0</text><text x="625" y="330">3</text><text x="70" y="55">GELU(a)</text></svg></div><div className="lab-gate-arithmetic"><div className="lab-gate-factors"><div><span>非线性支路</span><strong>{f(activated)}</strong></div><b>×</b><div><span>另一支路</span><strong>{f(b)}</strong></div></div><div className={`lab-gate-product ${out<0?'negative':''}`}><span>逐元素乘积</span><strong>{f(out)}</strong></div><p>两路均包含 1 × 1 与 3 × 3 卷积。乘积再投影，并与原特征相加。</p></div></div>
 <div className="lab-dual-range"><Range label="实数特征 a" value={a} min={-3} max={3} step={.1} onChange={setA}/><Range label="实数特征 b" value={b} min={-1} max={1} step={.1} onChange={setB}/></div>
 <Feedback tone={out<0?'red':'green'}><Term meaning="GDFN门控为GELU(a)⊙b。a、b代表两路投影与局部卷积后的特征；这里是单标量例子。">GELU(a) ⊙ b</Term> 的结果可以为负或大于 1，因此它不是 0～1 的概率遮罩。</Feedback></div>;
}
