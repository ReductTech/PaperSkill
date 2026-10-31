import React,{useState} from 'react';
import {useCoverPlayback} from '../components/CoverPlayback';
import type {WidgetProps} from './registry';
import {mdtaToy,mdtaFeatureToy,localToy,gelu,gdfnPatchToy} from './mechanisms';
import {palette as P,f,Term,Formula,Range,Feedback,Choice,Camera,CalibrationArt,FilmPlate,Matrix} from './restoration-kit';

export function RestCover({moduleId}:WidgetProps){
 const {progress}=useCoverPlayback(),modern=moduleId==='newMethod',p=Math.min(1,progress*1.25);
 return <div className={`lab-cover-art ${modern?'modern':'legacy'}`}><div className="lab-cover-photo"><CalibrationArt/>
  <svg viewBox="0 0 600 400" aria-hidden="true">{modern?<><rect x={40+18*p} y="35" width="210" height="310" fill={P.blue} opacity=".18" stroke={P.blue} strokeWidth="4"/><rect x={195+14*p} y="35" width="210" height="310" fill={P.green} opacity=".2" stroke={P.green} strokeWidth="4"/><rect x={350+10*p} y="35" width="210" height="310" fill={P.orange} opacity=".13" stroke={P.orange} strokeWidth="4"/><path d={`M30 ${35+310*p}H570`} stroke={P.green} strokeWidth="5"/></>:<>{Array.from({length:9},(_,i)=><path key={i} d={`M${45+i*60} 20V380M20 ${40+i*40}H580`} stroke="#fff" opacity=".7" strokeWidth="2"/>)}<circle cx={50+480*p} cy={80+230*p} r="34" fill="none" stroke={P.red} strokeWidth="7"/><path d={`M${80+480*p} ${110+230*p}l32 32`} stroke="#e1bc8b" strokeWidth="12"/></>}</svg>
 </div><div className="lab-cover-caption"><strong>{modern?'C × C':'HW × HW'}</strong></div></div>;
}

function count(v:number){return v>=1e12?f(v/1e12,1)+' 万亿':v>=1e8?f(v/1e8,2)+' 亿':v.toLocaleString();}
export function Complexity(){
 const [side,setSide]=useState(512),n=side*side,entries=n*n;const choices=[128,256,512,1024,2048];
 return <div className="lab-page lab-complexity"><div className="lab-inline-controls"><span>选择相片尺寸</span>{choices.map(s=><Choice key={s} selected={side===s} onClick={()=>setSide(s)}>{s}²</Choice>)}<Camera size={72}/></div>
 <div className="lab-cost-pair"><div className="lab-cost-old"><div className="lab-cost-title"><h3>空间自注意力</h3><span>像素 ↔ 像素</span></div><div className="lab-cost-visual"><div className="lab-photo-print"><CalibrationArt variant="detail"/><div className="lab-photo-rule" style={{backgroundSize:`${Math.max(7,45-side/60)}px ${Math.max(7,45-side/60)}px`}}/></div><div className="lab-cost-number"><strong>{count(entries)}</strong><span>矩阵元素</span><p>边长 × 2<br/>元素数 × 16</p></div></div><Formula><Term meaning="N=H×W：图像中的空间位置数；当前为图像边长的平方。">N²</Term> = ({side}²)²</Formula></div>
 <div className="lab-cost-new"><div className="lab-cost-title"><h3>MDTA 转置注意力</h3><span>通道 ↔ 通道</span></div><div className="lab-cost-visual"><div className="lab-fixed-matrix">{Array.from({length:36},(_,i)=><i key={i} style={{opacity:.2+((i*7)%9)/12}}/>)}</div><div className="lab-cost-number"><strong>2,304</strong><span>矩阵元素</span><p>示例固定 48 通道<br/>矩阵大小不变</p></div></div><Formula><Term meaning="C：本例单个注意力头内的通道数，固定48。多头时每个头使用自己的通道子集。">C²</Term> = 48²</Formula></div></div>
 </div>;
}

export function LocalContext(){
 const [index,setIndex]=useState(12),[depth,setDepth]=useState(true),r=localToy(index,depth);
 return <div className="lab-page lab-local"><div className="lab-local-main"><div className="lab-local-source"><h3>1 × 1：通道混合</h3><div className="lab-channel-inputs">{r.channels.map((c,i)=><div key={i}><span>特征 {i+1}</span><strong>{f(c[index],2)}</strong><div className="lab-channel-swatch" style={{background:[P.blue,P.orange,P.green][i],opacity:.2+c[index]*.8}}/></div>)}</div><Formula>0.55 × {f(r.channels[0][index],2)}<br/>+ 0.30 × {f(r.channels[1][index],2)}<br/>+ 0.15 × {f(r.channels[2][index],2)}</Formula><p>固定权重示例</p></div>
 <div className="lab-local-grid-wrap"><h3>点选位置，观察邻域</h3><div className="lab-local-grid">{r.grid.map((v,i)=><button key={i} aria-label={`像素 ${i+1}`} aria-pressed={i===index} onClick={()=>setIndex(i)} className={depth&&r.neighbours.includes(i)?'neighbour':''} style={{background:`rgba(39,68,110,${v})`,color:v>.55?'#fff':P.ink}}>{i===index?'●':''}</button>)}</div></div>
 <div className="lab-local-result"><Camera size={86}/><h3>{depth?'3 × 3 逐通道卷积':'仅 1 × 1 投影'}</h3><strong className="lab-focal">{f(r.value)}</strong><div className="lab-output-sample" style={{background:`rgba(34,141,92,${r.value})`}}/><p>{depth?'本通道邻域聚合 · 零填充':'同位置跨通道组合'}</p></div></div>
 <div className="lab-inline-controls"><span>局部上下文</span><Choice selected={!depth} onClick={()=>setDepth(false)}>仅 1 × 1</Choice><Choice selected={depth} onClick={()=>setDepth(true)}>加入 3 × 3</Choice></div>
 </div>;
}

export function ChannelAttention(){
 const [mix,setMix]=useState(.15),[column,setColumn]=useState(0),[position,setPosition]=useState(0),r=mdtaFeatureToy(mix);
 return <div className="lab-page lab-channel-page"><div className="lab-attention-workbench"><div className="lab-feature-rack"><h3>① Q/K 的全幅通道模式</h3>{r.features.map((v,i)=><FilmPlate key={i} values={v} label={`通道 ${i+1}`} color={[P.blue,P.orange,P.green][i]}/>)}<p>每条色带：一个通道的 6 个位置</p></div><div className="lab-attention-matrix"><h3>② 通道权重 A</h3><Matrix values={r.weights} selectedColumn={column} label="3 个输入 → 3 个输出" onCell={(_,j)=>setColumn(j)}/></div><div className="lab-mixture"><h3>③ 输出通道 {column+1}</h3><div className="polish-output-map">{r.outputMaps[column].map((v,p)=><button key={p} aria-label={`查看输出第${p+1}个位置`} aria-pressed={position===p} onClick={()=>setPosition(p)} style={{background:`rgba(34,141,92,${.16+.74*v})`}}/>)}</div><p className="polish-position">位置 {position+1} · 权重 × V</p>{r.valueMaps.map((values,i)=><div className="lab-mixture-term" key={i}><span>{f(r.weights[i][column],3)} × {f(values[position],1)}</span><div><i style={{width:`${r.weights[i][column]*100}%`,background:[P.blue,P.orange,P.green][i]}}/></div></div>)}<strong className="lab-focal">{f(r.outputMaps[column][position])}</strong></div></div>
 <div className="lab-attention-bottom"><Range label="通道 2 的空间模式" value={mix} min={0} max={1} step={.05} onChange={setMix}/><Formula><Term meaning="A为通道权重，按列归一化。K为3×6，Q为6×3。示例α固定为1，V是独立设置的3个通道、每通道6个位置的教学值。">A = Softmax(KQ)</Term></Formula></div></div>;
}

export function AttentionScale(){
 const [alpha,setAlpha]=useState(.6),r=mdtaToy(.15,alpha,false);
 return <div className="lab-page lab-alpha"><div className="lab-alpha-top"><div><h3>α 调节权重集中程度</h3><p>固定分数：[{r.scores.map(row=>f(row[0],2)).join(', ')}]</p><Formula><Term meaning="α：点积之后、Softmax之前的可学习缩放参数；本页只手动改变α。">α</Term> = {f(alpha,2)}</Formula></div><Camera size={116}/></div>
 <div className="lab-alpha-main"><div className="lab-weight-ribbons">{r.weights.map((row,i)=><div className="lab-weight-row" key={i}><span>通道 {i+1}</span><div><i style={{width:`${row[0]*100}%`,background:[P.blue,P.orange,P.green][i]}}/></div><strong>{f(row[0])}</strong></div>)}<p>每列权重之和 = 1</p></div><div className="lab-alpha-output"><span>在固定位置混合 V</span><Formula>{r.weights.map((w,i)=><React.Fragment key={i}>{i>0?' + ':''}{f(w[0],2)} × {r.values[i]}</React.Fragment>)}</Formula><strong className="lab-focal">{f(r.output)}</strong></div></div>
 <Range label="缩放参数 α" value={alpha} min={.15} max={2} step={.05} onChange={setAlpha}/>
 </div>;
}

export function GatedFeedforward(){
 const [position,setPosition]=useState(6),[a,setA]=useState(()=>gdfnPatchToy().a),[b,setB]=useState(()=>gdfnPatchToy().b);
 const activated=a.map(gelu),product=activated.map((v,i)=>v*b[i]);
 const sets=[{label:'① 一路经过 GELU',values:activated,output:false},{label:'② 另一支路 b',values:b,output:false},{label:'③ 逐元素乘积',values:product,output:true}];
 return <div className="lab-page polish-gdfn"><div className="polish-gdfn-rule"><span>两路局部卷积后的特征</span><Formula><Term meaning="a、b是两路1×1投影与3×3逐通道卷积后的特征。GELU(a)与b同通道、同位置相乘；随后经过输出投影，并加回输入特征。">GELU(a) ⊙ b</Term></Formula><span>→ 投影 → 加回输入</span></div>
 <div className="polish-gate-maps">{sets.map((set,k)=><React.Fragment key={set.label}>{k>0&&<b className="polish-map-operator">{k===1?'⊙':'='}</b>}<section><h3>{set.label}</h3><div className="polish-patch">{set.values.map((v,i)=><button key={i} aria-label={`选择${set.label}第${i+1}个位置`} aria-pressed={position===i} onClick={()=>setPosition(i)} style={{background:`rgba(${v<0?'39,68,110':set.output?'34,141,92':'39,68,110'},${.16+.7*Math.min(1,Math.abs(v))})`}}/>)}</div><strong className="polish-patch-value">{f(set.values[position])}</strong></section></React.Fragment>)}</div>
 <div className="polish-gate-operation"><span>同一位置 · 第 {Math.floor(position/4)+1} 行，第 {position%4+1} 列</span><span>{b[position]===0?'输出为 0':Math.abs(activated[position])<.000001?'乘数为 0':`幅度 × ${f(Math.abs(activated[position]),2)} · ${activated[position]<0?'符号翻转':'符号不变'}`}</span></div>
 <div className="lab-dual-range"><Range label="所选位置 a（经 GELU）" value={a[position]} min={-3} max={3} step={.1} onChange={v=>setA(old=>old.map((x,i)=>i===position?v:x))}/><Range label="所选位置 b" value={b[position]} min={-1} max={1} step={.1} onChange={v=>setB(old=>old.map((x,i)=>i===position?v:x))}/></div></div>;
}
