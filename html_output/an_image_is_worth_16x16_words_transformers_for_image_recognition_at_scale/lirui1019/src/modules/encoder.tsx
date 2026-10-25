import React,{useState} from 'react';
import {C,Stage,Steps,Feedback,clearScene,line,pill} from './BirdKit';
const names=['鸟嘴','翅膀','背景'];
const base=[[.25,.75,.42,.55],[.7,.4,.6,.2],[.55,.28,.65,.48]];
const vec=(a:number[])=>`[${a.map(v=>v.toFixed(3)).join('，')}]`;
function norm(a:number[]){const m=a.reduce((s,v)=>s+v,0)/4,sd=Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/4+1e-5);return a.map(v=>(v-m)/sd);}
function softmax(a:number[]){const e=a.map(v=>Math.exp(v-Math.max(...a))),s=e.reduce((x,y)=>x+y,0);return e.map(v=>v/s);}
function gelu(x:number){return .5*x*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+.044715*x*x*x)));}
function msa(input:number[][]){
 const n=input.map(norm);
 return n.map(q=>[0,1].flatMap(h=>{
  const weights=softmax(n.map(k=>(q[h*2]*k[h*2]+q[h*2+1]*k[h*2+1])/Math.sqrt(2)));
  return [0,1].map(d=>.25*n.reduce((sum,v,j)=>sum+weights[j]*v[h*2+d],0));
 }));
}
function hidden(r:number[]){const n=norm(r);return [...n,...n.map(v=>-v)].map(gelu);}
function mlp(input:number[][]){return input.map(r=>{const h=hidden(r);return [0,1,2,3].map(j=>.45*h[j]+.2*h[(j+1)%4]-.3*h[j+4]);});}
function add(a:number[][],b:number[][]){return a.map((r,i)=>r.map((v,d)=>v+b[i][d]));}
const fixedMiddle=add(base,msa(base));
const note:React.CSSProperties={fontSize:16,lineHeight:1.7,color:C.muted};
const titles=['参考别人的记录：LN → 多头注意力','加回原记录：第一次残差','加工自己的记录：LN → MLP','再次加回底稿：第二次残差'];
export function Encoder(){
 const [step,setStep]=useState(0),[delta,setDelta]=useState(.5);
 const isMlp=step>=2,isAdd=step%2===1;
 // The controlled change is at the entrance of the currently inspected sublayer.
 const reference=isMlp?fixedMiddle:base;
 const input=reference.map((r,i)=>r.map((v,d)=>v+(i===0&&d===0?delta:0)));
 const fn=isMlp?mlp:msa,update=fn(input),baselineUpdate=fn(reference);
 const output=isAdd?add(input,update):update;
 const baselineOutput=isAdd?add(reference,baselineUpdate):baselineUpdate;
 const changed=output.map((r,i)=>Math.max(...r.map((v,d)=>Math.abs(v-baselineOutput[i][d]))));
 const wingChange=update[1].map((v,d)=>v-baselineUpdate[1][d]);
 return <div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>先跨行参考，再逐行加工；两次更新都加回原记录。</p>
  <Steps step={step} max={3} onChange={setStep}/>
  <p style={{fontWeight:700,color:C.ink}}>{step+1}. {titles[step]}</p>
  <div className="ctrl" style={{flexWrap:'wrap'}}>
   <label htmlFor="encoder-change">只改本子层入口：鸟嘴第 1 格增加</label>
   <input id="encoder-change" type="range" min={0} max={1} step={.1} value={delta}
    onChange={e=>setDelta(Number(e.target.value))} onKeyDown={e=>e.stopPropagation()}/>
   <output htmlFor="encoder-change" className="val">{delta.toFixed(1)}</output>
   <button className="tiny ghost" onClick={()=>setDelta(0)}>与未改动时比较</button>
  </div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>只改当前子层入口的鸟嘴行。橙色标记变化；MLP 实验固定前半块。</p>
  <Stage height={360} label={`${titles[step]}。当前鸟嘴第1格增加${delta.toFixed(1)}。输出相对未改动的最大差值：鸟嘴${changed[0].toFixed(3)}，翅膀${changed[1].toFixed(3)}，背景${changed[2].toFixed(3)}。`}
   render={(c,w,h)=>{
    clearScene(c,w,h);
    c.font='600 20px sans-serif';c.fillStyle=C.ink;c.fillText(isMlp?'入口：第一条残差后的三行记录':'入口：三行图块记录',20,30);
    c.fillText(isAdd?'出口：原记录 + 本次更新':'出口：本次计算的更新',754,30);
    const rows=[83,175,267];
    // Connections are drawn before record cards, with no crossing through text.
    rows.forEach((y,i)=>{
      if(!isMlp)rows.forEach((ty,j)=>{c.save();c.globalAlpha=.28;line(c,340,y+8,746,ty+8,C.blue,i===j?2:1);c.restore();});
      else line(c,340,y+8,746,y+8,C.blue,2);
    });
    if(isAdd){c.save();c.setLineDash([6,4]);line(c,345,44,1024,44,C.green,2);c.restore();c.fillStyle=C.green;c.font='16px sans-serif';c.fillText('原记录走旁路，在出口逐格相加',421,61);}
    rows.forEach((y,i)=>{
      pill(c,16,y-13,324,69,'#fffefa');pill(c,746,y-13,318,69,'#fffefa');
      c.fillStyle=i===0&&delta>0?C.orange:C.blue;c.font='600 19px sans-serif';c.fillText(names[i],30,y+10);
      c.fillStyle=C.ink;c.font='17px sans-serif';c.fillText(vec(input[i]),30,y+37);
      c.fillStyle=changed[i]>1e-8?C.orange:C.green;c.font='600 19px sans-serif';
      c.fillText(`${names[i]} · ${changed[i]>1e-8?'已变化':'未变化'}`,760,y+10);
      c.fillStyle=C.ink;c.font='17px sans-serif';c.fillText(vec(output[i]),760,y+37);
      pill(c,414,y-8,266,52,'#e4eaf2');c.fillStyle=C.blue;c.font='600 18px sans-serif';
      c.fillText(isMlp?'本行 LN → 4 → 8 → 4':'LN 后向三行取回信息',430,y+23);
    });
    c.fillStyle=C.muted;c.font='17px sans-serif';c.fillText(isMlp?'三行使用同一套 MLP 参数；没有跨行取值':'两个头各看 2 维，拼接后投影回 4 维；连线表示可参考的来源',20,347);
   }}/>
  <div aria-live="polite"><Feedback tone="green">{delta===0?"拖动滑块：只改鸟嘴，翅膀会变吗？":isMlp?"翅膀不变：MLP 只加工本行，参数共享不等于跨行读取。":<>翅膀更新量改变 {vec(wingChange)}：注意力读取其他行的 K、V。</>}{isAdd?" 残差将更新逐格加回入口记录。":""}</Feedback></div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>翅膀行：{isMlp?"加工已有信息":"读取其他图块"} → {isAdd?"加回原记录":"得到更新量"}</b></p>
  <div style={{padding:'12px 16px',background:'#f5f8f0',color:C.ink,fontSize:17,lineHeight:2}}>
   <div>入口记录 = {vec(input[1])}</div>
   <div>本行 LN = {vec(norm(input[1]))}</div>
   <div>{isMlp?'MLP 输出':'MSA 输出'} = {vec(update[1])}</div>
   <div><strong>出口 = {isAdd?`${vec(input[1])} + ${vec(update[1])} = `:''}{vec(output[1])}</strong></div>
  </div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>{isMlp?"本例 MLP：4 维 → 8 维 → GELU → 4 维，逐行使用同一组参数。":"注意力取回跨位置的信息；后续 MLP 再加工各行特征。"}</p>
  <details><summary>数值怎么计算？为什么两次残差都能相加？</summary>
   <p style={note}>完整顺序：z′ = z + MSA(LN(z))；zₙₑₓₜ = z′ + MLP(LN(z′))。LN 对每行的 4 维单独计算，示例 γ=1、β=0、ε=10⁻⁵。每个子层的更新都回到 T×D，才能逐位置、逐分量相加。</p>
   <p style={note}>本例 MSA 将 LN 的前后两维分别作两个头的 Q、K、V，权重为 softmax(QKᵀ/√2)；拼接后以 Wᴼ = 0.25I 投影。MLP 隐层为 h = GELU([LN(x),−LN(x)])（8 维），输出第 j 维为 0.45hⱼ + 0.2h₍ⱼ₊₁₎mod4 − 0.3hⱼ₊₄；这同一套参数用于三行。</p>
   {isMlp&&<p style={note}>当前翅膀的 8 维中间结果 h = {vec(hidden(input[1]))}</p>}
  </details>
  <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>三行四维为教学示例；改整网输入时，前面的注意力也会传播变化。</p><details><summary>实验边界与论文依据</summary><p style={note}>三行、四维及参数均为教学构造，省略 CLS、其他图块、训练与 dropout，不代表真实 ViT 的语义维度或精度。此实验只改当前子层入口的一行；若从整网输入改照片，前面的注意力可能已把变化传给其他行，后面的 MLP 也会随之改变。残差保留直接路径，不保证某个分量数值始终不变。依据：§3.1 式（2–3）、附录 A。</p></details></>
 </div>;
}
