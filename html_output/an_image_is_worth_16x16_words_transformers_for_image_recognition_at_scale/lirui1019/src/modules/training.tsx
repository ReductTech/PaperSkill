import React,{useState} from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill,Feedback} from './BirdKit';
import {initialParams,learningRound,forward,learnRate,parameterKeys} from './learningMath';
const note:React.CSSProperties={fontSize:16,lineHeight:1.75,color:C.muted};
const td:React.CSSProperties={padding:'10px 12px',borderBottom:`1px solid ${C.line}`,textAlign:'left'};
const f=(n:number)=>n.toFixed(3);
const words=['前向：按规则猜','损失：用答案量偏差','反传：算各参数的梯度','更新：改数值，再预测'];
const paramNames={a1:'a₁ · 第一条线索的系数',a2:'a₂ · 第二条线索的系数',v:'v · 读出系数',b:'b · 分数偏置'};
export function Training(){
 const [step,setStep]=useState(0),[theta,setTheta]=useState({...initialParams}),[round,setRound]=useState(1);
 const r=learningRound(theta),t=step===3?r.updated:theta,out=step===3?r.after:r.before;
 const next=()=>{if(step<3)setStep(step+1);else{setTheta(r.updated);setRound(round+1);setStep(0);}};
 const reset=()=>{setTheta({...initialParams});setRound(1);setStep(0);};
 const probeBefore=forward(theta,[.8,-.4]),probeAfter=forward(r.updated,[.8,-.4]);
 return <div>
  <p style={note}>先用一个可验算的小模型：两条线索 → tanh → 二分类。这里实际计算梯度并更新 4 个参数。</p>
  <div style={{display:'flex',flexWrap:'wrap',gap:10,margin:'16px 0'}}>{words.map((s,i)=><span key={s} style={{padding:'8px 12px',border:`1px solid ${i===step?C.blue:C.line}`,borderRadius:8,background:i===step?C.blue:'#fff',color:i===step?'#fff':C.muted,fontSize:16}}>{i+1}. {s}</span>)}</div>
  <div className="ctrl"><button className="tiny" onClick={next}>{['用真实标签计算损失','把损失反传到每个参数','应用这次参数更新','用新参数再训练一轮'][step]}</button><button className="tiny ghost" onClick={reset}>重置训练</button><strong>第 {round} 轮 · 第 {step+1} / 4 步</strong></div>
  <Stage height={375} label={`监督学习第${round}轮，${words[step]}。当前参数 a1=${f(t.a1)}、a2=${f(t.a2)}、v=${f(t.v)}、b=${f(t.b)}。长嘴类概率${f(out.p)}。${step>=1?`真实标签为长嘴类，更新前损失${f(r.before.loss)}。`:''}${step===3?`更新后损失${f(r.after.loss)}。`:''}`}
   render={(c,w,h)=>{
    clearScene(c,w,h);c.fillStyle=C.ink;c.font='600 21px sans-serif';c.fillText(step===3?'同一张照片，再用新参数算一遍':'同一张照片：先算出预测，答案只用于训练',24,32);
    drawPhoto(c,24,95,150);c.fillStyle=C.muted;c.font='17px sans-serif';c.fillText('固定输入线索',24,277);
    const edgeColor=step===2?C.orange:C.blue;
    line(c,181,170,218,170,C.blue,2);
    const box=(x:number,y:number,bw:number,bh:number,title:string,value:string)=>{pill(c,x,y,bw,bh,'#fffefa');c.fillStyle=C.ink;c.font='600 19px sans-serif';c.fillText(title,x+12,y+25);c.fillStyle=step===3?C.green:C.blue;c.font='600 22px sans-serif';c.fillText(value,x+12,y+57);};
    box(220,80,140,76,'鸟嘴线索 x₁','1.000');box(220,213,140,76,'环境线索 x₂','0.400');
    line(c,360,118,467,177,edgeColor,3);line(c,360,251,467,177,edgeColor,3);
    c.fillStyle=step===3?C.green:C.ink;c.font='18px sans-serif';c.fillText(`a₁=${f(t.a1)}`,365,94);c.fillText(`a₂=${f(t.a2)}`,365,280);
    box(470,133,160,83,'h = tanh(u)',f(out.h));
    c.fillStyle=C.muted;c.font='17px sans-serif';c.fillText(`u=${f(out.u)}`,485,247);
    line(c,630,177,730,177,edgeColor,3);c.fillStyle=step===3?C.green:C.ink;c.font='18px sans-serif';c.fillText(`v=${f(t.v)}`,641,139);
    box(735,133,138,83,'z = vh+b',f(out.z));
    c.fillStyle=step===3?C.green:C.muted;c.font='17px sans-serif';c.fillText(`b=${f(t.b)}`,740,247);
    line(c,873,177,925,177,edgeColor,3);box(930,133,128,83,'p = σ(z)',f(out.p));
    c.fillStyle=C.muted;c.font='16px sans-serif';c.fillText('长嘴类概率',936,247);
    if(step===2){
     [[905,177,882,177],[710,177,641,177],[450,170,382,132],[450,184,382,232]].forEach(([x1,y1,x2,y2])=>{line(c,x1,y1,x2,y2,C.orange,4);line(c,x2,y2,x2+10,y2-5,C.orange,3);line(c,x2,y2,x2+10,y2+5,C.orange,3);});
     c.fillStyle=C.support;c.font='19px sans-serif';c.fillText(`反向求导：δz=${f(r.dz)} → δh=${f(r.dh)} → δu=${f(r.du)}`,220,330);
    }else{c.fillStyle=step>=1?C.green:C.muted;c.font='19px sans-serif';c.fillText(step===0?'此时还没用答案，也没有修改参数':`训练标签：长嘴类（y=1） · ${step===3?'更新后的':'更新前的'}损失 L=${f(out.loss)}`,220,330);}
    c.fillStyle=C.muted;c.font='16px sans-serif';c.fillText('人为构造的小模型；参数、语义线索和概率不是真实 ViT 输出',24,362);
   }}/>
  <div aria-live="polite" style={{padding:'16px 0'}}>
   {step===0&&<><strong>① 前向只是在“按当前规则计算”。</strong><details><summary>逐项验算前向计算</summary><p style={note}>u = {f(theta.a1)} × 1 + ({f(theta.a2)}) × 0.4 = {f(out.u)}；h=tanh(u)={f(out.h)}。再算 z={f(theta.v)} × {f(out.h)} + ({f(theta.b)})={f(out.z)}，经 sigmoid 得 p={f(out.p)}。另一类“圆嘴”的概率为 {f(1-out.p)}。</p></details></>}
   {step===1&&<><strong>② 标签告诉我们：这张训练照片属于长嘴类。</strong><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>标签 y=1；正确类概率 {f(r.before.p)}，损失 −log(p)={f(r.before.loss)}。这一步只量偏差，参数未改。</p></>}
   {step>=2&&<><strong>{step===2?'③ 沿计算依赖反传，找到每个数值该往哪改。':'④ 将梯度乘学习率，再从旧参数中减去。'}</strong><><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>{step===2?"梯度已算出，参数尚未改。":"按 θ新=θ旧−0.5×梯度更新。"}</p><details><summary>展开链式求导</summary><p style={note}>δz=∂L/∂z=p−y={f(r.dz)}；δh=δz·v={f(r.dh)}；δu=δh·(1−h²)={f(r.du)}。因此 ∂L/∂aᵢ=δu·xᵢ，∂L/∂v=δz·h，∂L/∂b=δz。{step===2?'梯度已经算出，但尚未改参数。':'采用普通梯度下降，θ新=θ旧−η∇θL，固定 η=0.5。'}</p></details></>
    <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>梯度表示“参数增大时，损失怎样变化”。a₁ 梯度 {f(r.gradient.a1)}；其余不变，a₁ 增加 0.01，损失约减少 {(-r.gradient.a1*.01).toFixed(5)}（局部近似）。</p>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:16}}><thead><tr>{['参数','更新前','梯度 ∂L/∂θ','改变量 −0.5×梯度',step===3?'更新后':'下一步将得到'].map(s=><th key={s} style={td}>{s}</th>)}</tr></thead><tbody>{parameterKeys.map(k=><tr key={k}><th style={td}>{paramNames[k]}</th><td style={td}>{f(theta[k])}</td><td style={td}>{f(r.gradient[k])}</td><td style={td}>{f(-learnRate*r.gradient[k])}</td><td style={{...td,color:step===3?C.green:C.muted}}>{f(r.updated[k])}</td></tr>)}</tbody></table></div>
   </>}
   {step===3&&<><p style={{fontWeight:650,color:C.green}}>同一张照片，正确类概率 {(r.before.p*100).toFixed(1)}% → {(r.after.p*100).toFixed(1)}%；损失 {f(r.before.loss)} → {f(r.after.loss)}。</p><details><summary>换一张照片，新参数会继续起作用吗？</summary><p style={note}>换一份固定线索 [0.8, −0.4]，沿用这套新参数，不提供其标签，长嘴类概率也从 {f(probeBefore.p)} 变成 {f(probeAfter.p)}。这说明更新的是可复用的计算规则；这份新样本没有给出答案，所以不能声称它也变准了。</p></details></>}
  </div>
  <Feedback tone={step===3?"green":"blue"}>{["预测只依赖输入与当前参数，尚未使用标签。","标签把目标变成可求导的损失；下一步求梯度。","本轮梯度为负，减去梯度就增大参数；方向取决于当前样本与参数。","后续照片沿用新参数；继续训练需重新前向与求梯度。"][step]}</Feedback>
  <details><summary>训练示例的边界与论文口径</summary><p style={note}>这是实际执行计算的二分类小模型，只解释链式求导与一次梯度下降，并未运行 ViT 训练。ViT 使用多类 softmax 交叉熵，梯度还会传到投影、位置、CLS、注意力与 MLP；论文主实验使用有标签监督预训练与 Adam。训练样本变好不保证未见样本变好，推理时不提供答案。依据：§3.1、§4.1、附录 B。</p></details>
 </div>;
}
