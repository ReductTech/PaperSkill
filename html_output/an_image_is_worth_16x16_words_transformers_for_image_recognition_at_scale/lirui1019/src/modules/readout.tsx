import React,{useState} from 'react';
import {C,Stage,Chips,Feedback,clearScene,drawPhoto,line,pill} from './BirdKit';
const names=['鸟嘴','翅膀','叶片背景'];
const original=[[1.8,.1,.4,-.2],[.2,.8,1.2,0],[-.2,0,.1,1.6]];
const seed=[.1,-.1,.1,0];
const exp=[-1,2,1.2,-1].map(Math.exp),den=exp.reduce((a,b)=>a+b,0),alpha=exp.map(v=>v/den);
const colors=[C.blue,C.purple,C.green,C.orange];
const categories=['长嘴型鸟','圆嘴型鸟','背景照片'];
const W=[[1.2,-.4,0],[-.4,1.2,0],[.1,.5,-.3],[0,0,1.2]];
const vec=(v:number[],n=3)=>`[${v.map(x=>x.toFixed(n)).join('，')}]`;
function ln(v:number[]){const m=v.reduce((a,b)=>a+b,0)/4,sd=Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/4+1e-5);return v.map(x=>(x-m)/sd);}
const note:React.CSSProperties={fontSize:16,lineHeight:1.7,color:C.muted};
export function Readout(){
 const [removed,setRemoved]=useState(-1),[method,setMethod]=useState<'cls'|'gap'>('cls');
 const values=original.map((v,i)=>v.map(x=>i===removed?0:x));
 const contributions=values.map((v,i)=>v.map(x=>x*(method==='cls'?alpha[i+1]:1/3)));
 const own=seed.map(x=>x*alpha[0]);
 const global=[0,1,2,3].map(d=>contributions.reduce((s,v)=>s+v[d],method==='cls'?seed[d]+own[d]:0));
 const y=ln(global),scores=[0,1,2].map(k=>y.reduce((s,x,d)=>s+x*W[d][k],0));
 const winner=scores.indexOf(Math.max(...scores));
 const baseline=[0,1,2,3].map(d=>original.reduce((s,v,i)=>s+v[d]*(method==='cls'?alpha[i+1]:1/3),method==='cls'?seed[d]+own[d]:0));
 const by=ln(baseline),bs=[0,1,2].map(k=>by.reduce((s,x,d)=>s+x*W[d][k],0));
 return <div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>① 拿走局部内容</b></p>
  <Chips label="拿走哪份局部内容" value={removed} onChange={setRemoved}
   options={[{value:-1,label:'完整照片'},{value:0,label:'拿走鸟嘴内容'},{value:1,label:'拿走翅膀内容'},{value:2,label:'拿走背景内容'}]}/>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>只将所选 V 置零，保留位置与权重；灰块为标记，非真实遮挡预测。</p>
  <Stage height={390}
   label={`${method==='cls'?'CLS':'平均汇聚'}读出。${removed<0?'保留全部图块内容':`拿走${names[removed]}内容`}。整图表示 ${vec(global)}。预测示意：${categories[winner]}，三个原始分数 ${vec(scores)}。`}
   onClick={e=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*1080,z=(e.clientY-r.top)/r.height*390;
    const pts=[[193,94],[100,133],[32,80]].map(([a,b])=>[28+a/224*270,63+b/224*270]);
    const i=pts.findIndex(([a,b])=>Math.abs(a-x)<30&&Math.abs(b-z)<30);if(i>=0)setRemoved(removed===i?-1:i);}}
   style={{cursor:'pointer'}} render={(c,w,h)=>{
    clearScene(c,w,h);c.fillStyle=C.ink;c.font='600 21px sans-serif';
    c.fillText('同一张照片：点击框内可拿走 / 恢复',23,31);
    drawPhoto(c,28,63,270);
    const pts=[[193,94],[100,133],[32,80]].map(([a,b])=>[28+a/224*270,63+b/224*270]);
    pts.forEach(([x,z],i)=>{
     if(removed===i){pill(c,x-25,z-25,50,50,'#d7deea');c.fillStyle=C.muted;c.font='25px sans-serif';c.fillText('×',x-9,z+8);}
     c.strokeStyle=i===removed?C.muted:C.orange;c.lineWidth=3;c.strokeRect(x-25,z-25,50,50);
     c.fillStyle=C.support;c.font='600 17px sans-serif';c.fillText(String(i+1),x-24,z-31);
     const ry=76+i*88;
     line(c,x+25,z,345,ry+26,i===removed?C.line:C.blue,2);
     pill(c,345,ry,275,69,'#fffefa');c.fillStyle=C.ink;c.font='600 19px sans-serif';c.fillText(`${i+1}. ${names[i]}`,357,ry+24);
     c.fillStyle=C.muted;c.font='17px sans-serif';c.fillText(`取回 ${((method==='cls'?alpha[i+1]:1/3)*100).toFixed(1)}% × V`,357,ry+52);
     line(c,620,ry+33,674,190,removed===i?C.line:C.blue,removed===i?1:3);
    });
    pill(c,674,65,382,260,'#fffefa');c.fillStyle=C.purple;c.font='600 22px sans-serif';
    c.fillText(method==='cls'?'CLS：整张图的记录位':'平均：三行图块表示求均值',690,97);
    c.fillStyle=C.muted;c.font='17px sans-serif';
    c.fillText(method==='cls'?'初始记录 c₀：每张图相同，不含标签':'先有各图块表示，再直接求平均',690,129);
    c.fillText(method==='cls'?vec(seed,1):'无需额外的 CLS 记录位',690,154);
    c.fillStyle=C.ink;c.font='600 19px sans-serif';c.fillText('汇入局部内容后的整图表示 g',690,191);
    global.forEach((v,d)=>{const x=695+d*87;
     pill(c,x,214,75,54,colors[d]);c.fillStyle='white';c.font='600 17px sans-serif';c.fillText(v.toFixed(2),x+8,247);
     c.fillStyle=C.muted;c.font='15px sans-serif';c.fillText(`第 ${d+1} 维`,x+10,291);
    });
    c.fillStyle=C.support;c.font='19px sans-serif';c.fillText('每块贡献的是特征内容，不是一张类别票',28,371);
   }}/>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>② 汇成整图记录</b></p>
  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:16,textAlign:'left',color:C.ink}}>
   <thead><tr>{['来源','携带的 V','参考比例','贡献 = 比例 × V'].map(t=><th key={t} style={{padding:'12px 8px',borderBottom:`1px solid ${C.line}`}}>{t}</th>)}</tr></thead>
   <tbody>{method==='cls'&&<tr><th style={{padding:'12px 8px'}}>CLS 自身</th><td>{vec(seed,1)}</td><td>{(alpha[0]*100).toFixed(1)}%</td><td>{vec(own)}</td></tr>}
    {names.map((name,i)=><tr key={name} style={{background:i===removed?'#eef1f5':undefined}}><th style={{padding:'12px 8px'}}>{name}{i===removed?'（置零）':''}</th><td>{vec(values[i],1)}</td><td>{((method==='cls'?alpha[i+1]:1/3)*100).toFixed(1)}%</td><td>{vec(contributions[i])}</td></tr>)}
   </tbody></table></div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>{method==="cls"?"加权贡献相加，再加回 CLS 初始记录。":"图块逐维取平均。"} g = <strong>{vec(global)}</strong>；被拿走行的贡献为零。</p>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>③ 分类头把记录变成类别分数</b></p>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>LN 后 y = {vec(y)}；s = yW（b=0），取最高分。分数不是概率。</p>
  <Stage height={255} label={`分类头输出：${categories.map((n,i)=>`${n} ${scores[i].toFixed(3)}`).join('，')}。最高分为${categories[winner]}。浅色轮廓是完整内容时的分数，不代表准确率。`}
   render={(c,w,h)=>{
    clearScene(c,w,h);const zero=575,scale=90;
    c.fillStyle=C.muted;c.font='17px sans-serif';c.fillText('灰色轮廓：完整内容；实心：当前内容；同一尺度',24,30);
    categories.forEach((name,i)=>{const z=70+i*58;
     c.fillStyle=i===winner?C.green:C.ink;c.font='600 20px sans-serif';c.fillText(name,24,z+20);
     c.strokeStyle=C.muted;c.lineWidth=1;c.strokeRect(zero+Math.min(0,bs[i])*scale,z+3,Math.max(1,Math.abs(bs[i])*scale),26);
     pill(c,zero+Math.min(0,scores[i])*scale,z+6,Math.max(1,Math.abs(scores[i])*scale),20,i===winner?C.green:C.blue);
     c.fillStyle=C.ink;c.font='19px sans-serif';c.fillText(`${scores[i].toFixed(3)}${i===winner?'  ← 当前最高分':''}`,820,z+23);
    });
    line(c,zero,53,zero,229,C.line,2);c.fillStyle=C.muted;c.font='16px sans-serif';c.fillText('0',zero-4,249);
   }}/>
  <div aria-live="polite"><Feedback tone="green">{removed<0?<>当前示意结果：“{categories[winner]}”。拿走鸟嘴或背景，比较影响。</>:<>拿走{names[removed]}后，全局向量改变，最高分对应“{categories[winner]}”。局部内容先影响整图表示，再影响分数。</>}</Feedback></div>
  <details><summary>CLS 是唯一选择吗？换成平均汇聚做机制对照</summary>
   <Chips label="选择全局读出方式" options={[{value:'cls',label:'CLS 读出'},{value:'gap',label:'平均汇聚'}]} value={method} onChange={setMethod}/>
   <p style={note}>CLS 参与编码阶段的注意力，从其他 token 读取信息；平均汇聚则对编码后的图块表示逐维求平均。此处把相同的三份 V 用于两种汇聚，以隔离读出运算；保留同一分类头仅为演示数值差异，不能据此比较两种完整训练方案的准确率。</p>
   <p style={note}>论文附录 D.3 图 9：CLS 使用学习率 8×10⁻⁴，平均汇聚改用 3×10⁻⁴ 后表现相近。是否使用 CLS，要连同训练设置一起评价。</p>
  </details>
  <details><summary>展开这个例子的固定参数</summary>
   <p style={note}>为单独展开 CLS 如何读取内容，仅保留最后一次注意力中一条 CLS 查询，分数 [−1,2,1.2,−1] 对应自身、鸟嘴、翅膀、背景，权重为其 softmax；例如 Q=[1,0,0,0]、Kⱼ=[2sⱼ,0,0,0] 时，QKⱼᵀ/√4=sⱼ。取 Wᴼ=I，CLS 残差 g=c₀+ΣαⱼVⱼ。省略其他头、其他图块、其他行的更新以及后续 MLP；不表示完整编码块只有这一步。</p>
   <p style={note}>LN 的 γ=1、β=0、ε=10⁻⁵。分类矩阵 W 按四行列出为 {W.map(row=>vec(row,1)).join('；')}，对应三个候选类别。数值、候选类别及参数全部手工构造，四维并非真实模型预先命名的语义属性。</p>
  </details>
  <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>CLS 是可学习的读出位置，不携带真实标签；此处为教学示例。</p><details><summary>真实 ViT 的读出与示例边界</summary><p style={note}>真实 ViT 的 CLS 是与图块一起更新的可学习向量，初始值对所有图片相同，训练时会学习；最终取 LN 后的 CLS 表示交给任务分类头。主实验预训练头含一个隐藏层，微调时更换为线性分类头。本例只演示读出与线性分类，不是真实模型预测，也不能用注意力权重直接解释图块的重要性。依据：§3.1 式（1–4）、附录 A、D.3。</p></details></>
 </div>;
}
