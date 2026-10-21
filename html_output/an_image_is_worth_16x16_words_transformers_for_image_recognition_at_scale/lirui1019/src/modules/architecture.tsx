import React,{useState} from 'react';
import {C,Stage,Chips,Feedback,clearScene,drawBird,line,pill} from './BirdKit';
import {architectureExample,patchNames,rowNames,projection,positions,clsSeed,headWeights} from './architectureMath';
const models=[{id:'B16',name:'ViT-B/16',p:16,d:768,l:12,h:12,mlp:3072,params:86},{id:'L16',name:'ViT-L/16',p:16,d:1024,l:24,h:16,mlp:4096,params:307},{id:'H14',name:'ViT-H/14',p:14,d:1280,l:32,h:16,mlp:5120,params:632}];
const titles=['把每块像素变成向量','补入 CLS，再加上位置','让各行交换并加工信息','统一每行的特征尺度','只取 CLS 这一行','把全局表示变成类别分数'];
const short=['共享投影','CLS + 位置','编码器','最终 LN','取 CLS','分类头'];
const classes=['鸟类','叶片','其他'];
const note:React.CSSProperties={fontSize:16,color:C.muted,lineHeight:1.75};
const vec=(r:number[])=>`[${r.map(v=>v.toFixed(2)).join(', ')}]`;
const base=architectureExample();
export function Architecture(){
 const [step,setStep]=useState(0),[mask,setMask]=useState(false),[model,setModel]=useState('B16');
 const m=models.find(v=>v.id===model)!,n=(224/m.p)**2,t=n+1,r=architectureExample(mask);
 const inputs=[r.raw,r.seeded,r.positioned,r.encoded,r.final,[r.readout]];
 const outputs=[r.projected,r.positioned,r.encoded,r.final,[r.readout],[r.logits]];
 const before=inputs[step],after=outputs[step];
 const baseline=[base.projected,base.positioned,base.encoded,base.final,[base.readout],[base.logits]][step];
 const changed=after.filter((row,i)=>row.some((v,j)=>Math.abs(v-baseline[i][j])>1e-6)).length;
 const shapes=[`${n}×${m.p*m.p*3} → ${n}×${m.d}`,`${n}×${m.d} → ${t}×${m.d}`,`${t}×${m.d} → ${t}×${m.d}`,`${t}×${m.d} → ${t}×${m.d}`,`${t}×${m.d} → ${m.d}`,`${m.d} → C`];
 const feedback=[
  `左边每行代表一个图块的像素记录，右边每行是它的表示。同一套 E 用在所有图块上；例如鸟嘴行 ${vec(r.raw[1])} 经投影变为 ${vec(r.projected[1])}。此时各块尚未相互参考。`,
  `先在最前面增加可学习的 CLS 初始向量 ${vec(clsSeed)}，再给每行加自己的位置向量。鸟嘴的内容 ${vec(r.projected[1])} 加位置 ${vec(positions[2])}，得到 ${vec(r.positioned[2])}。CLS 此时还没有读到照片内容。`,
  `注意力让每一行参考整串记录，连 CLS 也参与；残差把读到的信息加回原记录。MLP 再逐行加工，并做第二次残差。行数和宽度保持不变，内容已经改变；CLS 从 ${vec(r.positioned[0])} 变成 ${vec(r.encoded[0])}。`,
  `最终 LayerNorm 对每行的特征维度分别归一化，不把不同行平均，也不删除图块。CLS 从 ${vec(r.encoded[0])} 变成 ${vec(r.final[0])}；序列仍有同样多行。`,
  `这里只选择序列第 0 行 ${vec(r.readout)}，数值原样保留；其余图块行不直接交给分类头。CLS 在编码器里已与它们交换信息，因此这一行可供全图分类读取。选择这行不会再次计算注意力。`,
  `全局向量经分类头得到 ${vec(r.logits)} 三个分数；softmax 将其变成总和为 1 的概率。这里的三类与权重都用于示意，没有训练识鸟模型；真实任务的输出宽度由类别数 C 决定。`
 ];
 return <div>
  <p style={note}>跟踪同一张照片。示例只用 4 个图块、4 维表示和 1 个微型编码块；数值由固定权重计算，便于看清路径。</p>
  <div className="ctrl" style={{flexWrap:'wrap'}}>
   <button className="tiny ghost" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button>
   <strong>第 {step+1} / 6 步</strong>
   <button className="tiny" disabled={step===5} onClick={()=>setStep(step+1)}>{step<5?`继续：${short[step+1]}`:'已得到类别概率'}</button>
   <button className="tiny ghost" onClick={()=>{setStep(0);setMask(false);}}>从原图重新开始</button>
  </div>
  <Chips value={step} onChange={setStep} label="查看 ViT 的具体计算步骤" options={short.map((label,value)=>({value,label:`${value+1}. ${label}`}))}/>
  <p style={{fontWeight:700,fontSize:20}}>{titles[step]}</p>
  <Stage height={475} label={`第${step+1}步：${titles[step]}。输入${before.length}行、输出${after.length}行。${feedback[step]}${mask?`鸟嘴图块输入置零，相对原图，本步输出有${changed}行改变。`:''}`} render={(c,w,h)=>{
   clearScene(c,w,h);
   const text=(s:string,x:number,y:number,color:string=C.ink,size=18)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
   const panel=(x:number,title:string)=>{pill(c,x,14,326,416,'#fffefa');text(title,x+15,44,C.ink,20);};
   panel(14,step===0?'输入：四块图像的记录':step===1?'先在序列最前补入 CLS':step===4?'输入：完整序列':'输入：上一步的结果');panel(377,'本步实际做什么');panel(740,step===5?'输出：类别分数与概率':'输出：变化后的表示');
   line(c,345,213,365,213,C.blue,3);line(c,710,213,730,213,C.blue,3);
   const matrix=(rows:number[][],x:number,y:number,names:string[],highlight=false,markChanges=false)=>{
    rows.forEach((row,i)=>{
     const yy=y+i*58;
     text(names[i]||'全图',x,yy+22,highlight&&i===0?C.purple:C.muted,17);
     row.forEach((v,j)=>{const xx=x+63+j*57,different=mask&&markChanges&&Math.abs(v-baseline[i][j])>1e-6;pill(c,xx,yy,53,35,different?'#fff0e7':highlight&&i===0?'#f0e8fc':'#edf2f6');text(v.toFixed(2),xx+3,yy+24,different?C.support:highlight&&i===0?C.purple:C.blue,19);});
    });
   };
   if(step===0){
    const crops=[[0,0],[.5,.25],[.25,.5],[.25,.75]];
    r.raw.forEach((row,i)=>{const y=65+i*78;
     c.save();c.beginPath();c.rect(29,y,54,54);c.clip();if(mask&&i===1){c.fillStyle='#d9dfe5';c.fillRect(29,y,54,54);}else drawBird(c,29-crops[i][0]*216,y-crops[i][1]*216,216);c.restore();
     text(patchNames[i],92,y+18,C.ink,17);text(vec(row),92,y+42,C.blue,17);
    });
    text('像素展开；此处每块只留 3 个示意数',29,414,C.muted,15);
    text('所有图块共用同一个 E',394,82,C.blue,20);
    text('示意 E：3×4',394,117,C.muted,18);
    projection.forEach((row,i)=>text(vec(row),394,154+i*34,C.ink,18));
    text('每行 × E',394,298,C.blue,22);text('长度 3 → 长度 4',394,337,C.ink,20);
    matrix(after,754,87,patchNames,false,true);text('同宽不等于同内容',755,370,C.blue,20);
   }else if(step===1){
    matrix(before,28,80,rowNames,true);text('先插入紫色 CLS 初始行',28,406,C.purple,17);
    text('每行分别做：内容 + 位置',394,82,C.blue,19);
    text('鸟嘴这一行的位置向量',394,152,C.muted,18);text(vec(positions[2]),394,190,C.purple,18);
    text('每个位置的向量不同',394,259,C.ink,19);text('CLS 也有自己的位置项',394,296,C.muted,17);
    text('增加一行，再逐元素相加',394,368,C.blue,19);
    matrix(after,754,80,rowNames,true,true);
   }else if(step===2){
    matrix(before,28,80,rowNames,true);matrix(after,754,80,rowNames,true,true);
    const items=['LN → 2 头注意力','＋ 输入（第一次残差）','LN → MLP：4 → 8 → 4','＋ 中间结果（第二次残差）'];
    items.forEach((s,i)=>{pill(c,392,83+i*65,296,48,i%2?'#edf2f6':'#f0e8fc');text(s,404,113+i*65,i%2?C.ink:C.purple,17);});
    text('注意力：跨行交换信息',394,373,C.blue,18);text('MLP：每行分别加工',394,404,C.blue,18);
   }else if(step===3){
    matrix(before,28,80,rowNames,true);matrix(after,754,80,rowNames,true,true);
    const mean=r.encoded[0].reduce((s,v)=>s+v,0)/4;
    text('每行单独算均值与方差',394,92,C.blue,20);text('CLS 行的均值：'+mean.toFixed(3),394,152,C.ink,18);
    text('减去均值，再除以标准差',394,213,C.ink,18);text('示意 γ=1、β=0、ε=10⁻⁵',394,255,C.muted,17);
    text('各行都保留，宽度也不变',394,343,C.blue,19);
   }else if(step===4){
    matrix(before,28,80,rowNames,true);
    text('选择第 0 行',394,109,C.purple,24);text('CLS 已在编码器里汇入图像信息',394,171,C.ink,17);
    text('取出这一行，不再改它的数值',394,229,C.ink,17);text('其余行不直接送入任务头',394,287,C.muted,18);
    matrix(after,754,145,['CLS'],true,true);text('序列 → 一个全局向量',755,264,C.purple,20);
    text('左、右紫色行的数值完全相同',755,315,C.muted,17);
   }else{
    matrix(before,28,145,['CLS'],true);text('读出的全局向量',28,249,C.purple,20);
    text('示意线性分类头：4 → 3',394,83,C.blue,20);
    text('固定权重 W：4×3',394,123,C.muted,18);headWeights.forEach((row,i)=>text(vec(row),394,164+i*33,C.ink,18));
    text('分数 = CLS × W',394,339,C.ink,20);text('概率 = softmax(分数)',394,382,C.blue,19);
    classes.forEach((name,i)=>{const y=95+i*92;text(`${name}：分数 ${r.logits[i].toFixed(2)}`,755,y,C.ink,18);pill(c,755,y+15,283,24,'#e3e9df');pill(c,755,y+15,283*r.probabilities[i],24,C.blue);text(`${(r.probabilities[i]*100).toFixed(1)}%`,755,y+65,C.blue,19);});
   }
   text(mask?'橙底表示相对原图改变的输出数值；置零操作保留图块的位置。':step===2?'微型图只计算 1 块；论文编码器堆叠多个块，每块有自己的参数。':'数值为同一套微型计算；行代表 token，列代表特征，保留两位小数。',24,458,C.muted,17);
  }}/>
  <Feedback>{["共享 E 逐块投影到同一宽度；此时图块之间尚未交换信息。","补入可学习 CLS，再逐行加位置向量。CLS 此时尚未读取图像。","注意力跨行交换，MLP 逐行加工；两次残差保留直接通路，形状不变。","最终 LN 逐行归一化特征，不对图块取平均，也不删除行。","取出第 0 行 CLS，数值不变；图像信息已经在编码器中汇入。","分类头输出三个分数，softmax 转成概率。此处权重未训练，不能判断识别对错。"][step]}</Feedback>
  <div className="ctrl" style={{flexWrap:'wrap',marginTop:20}}><button className={mask?'tiny':'tiny ghost'} aria-pressed={mask} onClick={()=>setMask(!mask)}>{mask?'恢复鸟嘴图块的输入':'对照：把鸟嘴图块输入置零'}</button><span>只改变输入，权重和位置固定</span></div>
  <p aria-live="polite" style={note}>{mask?<>输出 {changed}/{after.length} 行改变。{["共享投影不跨行，只改鸟嘴行。","加位置不跨行，仍只改鸟嘴行。","注意力将变化传给其他行与 CLS。","逐行 LN 延续此前交换带来的差异。","取出的 CLS 保留输入变化的影响。","概率改变不等于识别正确。"][step]}</>:"把鸟嘴置零，再沿六步追踪变化；token 和位置仍保留。"}</p>
  <p style={{fontWeight:700,marginTop:25}}>对应论文的完整型号：{m.name}</p>
  <Chips value={model} onChange={setModel} label="论文完整型号的尺寸" options={models.map(v=>({value:v.id,label:v.name}))}/>
  <p style={{fontWeight:650}}>当前步骤的真实形状：{shapes[step]}</p>
  <p style={note}>论文型号：224×224、P={m.p}、N={n}、T={t}；深度 {m.l}，宽度 D={m.d}，{m.h} 个头，MLP={m.mlp}，约 {m.params}M 参数。</p>
  <details><summary>配置口径与示例边界</summary><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>切换论文型号只更新完整尺寸；上面的四维示例固定。每头宽度为 D/h。预训练分类头含一层隐藏层，迁移微调使用线性头；C 表示类别数。</p><p style={note}>依据 Figure 1、Eq. 1–4、Table 1。真实投影 E 为 (P²·3)×D；编码器是 Pre-LN，注意力和 MLP 后各有残差，最终 LN 后读出 CLS。示例使用固定投影，分类头只演示读出；此处是前向计算，参数学习见上一章。</p></details>
 </div>;
}
