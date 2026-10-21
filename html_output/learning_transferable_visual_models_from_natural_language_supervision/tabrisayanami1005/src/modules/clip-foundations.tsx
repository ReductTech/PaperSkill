import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, Chips, Feedback, arrow, card, label } from './clip-scenes';

const fixed = (value:number, digits=3) => (Math.abs(value)<1e-10?0:value).toFixed(digits);
function Table({headers,rows}:{headers:string[];rows:string[][]}){
 return <div style={{maxWidth:'100%',overflowX:'auto'}}><table className="paper" style={{whiteSpace:'normal'}}><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Model(){
 const [mode,setMode]=useState(0);
 const x=mode===1?[4,1]:[2,1];const w=mode===2?[.8,.2]:[.5,.5];
 const terms=x.map((value,i)=>value*w[i]);const output=terms[0]+terms[1];
 return <div>
  <p>输入是提供给系统的信息，输出是系统算出的结果。模型是一套带有可调整数字的计算规则；这些可以调整的数字叫参数，计算结构叫架构，二者需要分开理解。</p>
  <p>先看一个只有两个参数的小模型：f_w(x) = w₁x₁ + w₂x₂。它先把两个输入分别乘以参数，再相加；此处数字没有“猫的程度”等图片属性含义，只用于看清计算过程。</p>
  <Canvas ariaLabel="两个输入分别乘以参数，两个加权项相加得到模型输出" draw={ctx=>{
   label(ctx,'输入',65,35);label(ctx,'模型输出',847,35);
   card(ctx,55,65,165,58,`x₁ = ${x[0]}`,C.blue);card(ctx,55,165,165,58,`x₂ = ${x[1]}`,C.blue);
   arrow(ctx,240,94,337,94,C.orange);arrow(ctx,240,195,337,195,C.orange);
   card(ctx,357,65,265,58,`${w[0]} × ${x[0]} = ${fixed(terms[0],1)}`,C.orange);card(ctx,357,165,265,58,`${w[1]} × ${x[1]} = ${fixed(terms[1],1)}`,C.orange);
   arrow(ctx,642,94,777,141,C.blue);arrow(ctx,642,195,777,150,C.blue);
   card(ctx,797,114,235,64,`${fixed(terms[0],1)} + ${fixed(terms[1],1)} = ${fixed(output,1)}`,C.green);
  }}/>
  <Chips options={['初始输入与参数','只改变输入','只改变参数']} value={mode} onChange={setMode} label="比较输入与参数对模型输出的影响"/>
  <Feedback tone="good">算例：输入 x = ({x.join(', ')})，参数 w = ({w.join(', ')})，输出为 {fixed(output,1)}。{mode===0?'现在是初始状态，两项分别为 1.0 和 0.5。':mode===1?'计算规则和参数不变，换了输入，所以输出从 1.5 变为 2.5。这是在使用模型。':'输入回到 (2, 1)，参数改为 (0.8, 0.2)，输出变为 1.8。本操作只是手动改参数，实际训练会按数据与损失自动更新参数。'}</Feedback>
  <Table headers={['术语','在这个小例子中','与 CLIP 的关系']} rows={[
   ['输入','x₁、x₂ 两个数字','CLIP 的原始输入是图片像素或文字，经各自编码器处理。'],
   ['模型','先乘参数，再把两项相加','CLIP 的计算规则复杂得多，但同样由计算结构与参数组成。'],
   ['架构','两项加权求和的计算结构','ResNet、ViT、Transformer 是不同的神经网络结构。'],
   ['参数','w₁、w₂ 两个可调整数字','CLIP 中包括两个编码器、投影层及匹配分数缩放的可学习参数。'],
   ['输出','加权求和得到的数值','CLIP 先得到图文特征，再比较特征得到匹配分数。'],
   ['训练','根据目标评价误差，再调整参数','利用大量图文配对，让原始对应关系更突出。'],
   ['推理','参数固定，用规则计算新输入','训练后给新图片和候选文字计算分数，通常不再更新参数。']
  ]}/>
  <p>神经网络可以理解为把多层可学习计算连接起来的模型。这一小模型不代表 CLIP 的架构，但足以区分“换输入”和“改模型参数”：后面所有推理演示都使用固定的教学分数或固定规则。</p>
 </div>;
}

const scores=[.8,.5,.1];const temperature=.5;
const scaled=scores.map(x=>x/temperature);const exponent=scaled.map(x=>Math.exp(x));
const expSum=exponent.reduce((a,b)=>a+b,0);const weights=exponent.map(x=>x/expSum);
const stages=['原始相似度','除以温度','指数转正值','除以总和'];
const descriptions=[
 '余弦相似度是方向匹配分数，可以为负，也不要求相加等于 1，因此不能直接当概率。这个例子的三个固定分数为 0.8、0.5、0.1。',
 '温度 τ 是正的缩放参数，与摄氏温度无关。τ = 0.5 时把每个分数除以 0.5，相当于乘以 2；三个结果为 1.6、1.0、0.2，排名不变。',
 'exp(z) 表示 e 的 z 次方，e 约等于 2.718。指数函数把实数变为正值，并保持从大到小的顺序，所以这些结果可以作为归一化前的权重。',
 '每个正值除以三个正值的总和，得到相加为 1 的权重。这是 softmax：一种把候选分数变为归一化权重的函数，方便比较和计算训练目标。'
];
function Softmax(){
 const [step,setStep]=useState(0);const values=[scores,scaled,exponent,weights][step];const maximum=Math.max(...values);
 return <div>
  <p>前面得到的余弦分数在 −1 到 1 之间。接下来先理解 softmax（归一化指数函数）：它先对分数取指数，再除以所有候选的指数之和，得到非负且总和为 1 的权重。</p>
  <p>下面固定三个候选的分数，逐步展开计算。温度 τ = 0.5 暂时不变；τ 越小，分数差经过放大后，权重越偏向高分项，下一模块再动手调整它。</p>
  <Canvas ariaLabel={`softmax第${step+1}步：${stages[step]}，三条柱对应三个候选的当前计算值`} draw={ctx=>{
   label(ctx,stages[step],70,35);label(ctx,step===3?'权重总和':'当前数值',815,35);
   values.forEach((value,i)=>{const y=64+i*65;ctx.fillStyle=i===0?C.green:C.blue;ctx.fillRect(110,y,540*value/maximum,32);ctx.fillStyle=C.text;ctx.font='24px "Microsoft YaHei",sans-serif';ctx.fillText(`${i+1}`,65,y+25);ctx.fillText(fixed(value),670,y+26);});
   ctx.fillStyle=C.text;ctx.font='30px "Microsoft YaHei",sans-serif';ctx.fillText(step===3?'Σ = 1.000':`Σ = ${fixed(values.reduce((a,b)=>a+b,0))}`,810,137);
   ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(110,248);ctx.lineTo(650,248);ctx.stroke();
  }}/>
  <div className="step-ctrl" role="group" aria-label="逐步展开softmax计算">
   <button type="button" className="tiny" disabled={step===0} onClick={()=>setStep(x=>x-1)}>上一步</button>
   <span>{step+1} / 4</span>
   <button type="button" className="tiny" disabled={step===3} onClick={()=>setStep(x=>x+1)}>下一步</button>
   <button type="button" className="tiny" onClick={()=>setStep(0)}>重置计算</button>
  </div>
  <Feedback tone={step===3?'good':''}>固定分数算例：{descriptions[step]}{step===3?` 当前权重为 ${weights.map(x=>fixed(x)).join('、')}，分母为 ${fixed(expSum)}。`:''}</Feedback>
  <Table headers={['候选','原始分数 s','s / τ','exp(s / τ)','归一化权重']} rows={scores.map((score,i)=>[
   `${i+1}`,fixed(score),step>=1?fixed(scaled[i]):'下一步计算',step>=2?fixed(exponent[i]):'后续计算',step>=3?fixed(weights[i]):'后续计算'
  ])}/>
  <p>图中的柱长只比较当前步骤内的相对大小，精确数值见表格；不同步骤的单位和比例尺不同。分数、指数和权重都来自同一组固定输入，并不是运行了真实 CLIP。</p>
  <p>这些权重取决于候选集合：增加或删除候选，就会改变分母。即使总和等于 1，也不能直接当成已经校准的置信度，更不能把 0.557 读成“这张照片有 55.7% 的概率一定属于第一类”。</p>
 </div>;
}

function Gradient(){
 const [rateIndex,setRateIndex]=useState(0);const [steps,setSteps]=useState(0);
 const eta=[.1,.5,1.1][rateIndex];
 const parameterAt=(n:number)=>2-2*Math.pow(1-2*eta,n);
 const w=parameterAt(steps);const oldW=parameterAt(Math.max(0,steps-1));const gradient=2*(oldW-2);const loss=(w-2)**2;
 const history=Array.from({length:steps+1},(_,i)=>parameterAt(i));
 const low=Math.min(-1,...history)-.2,high=Math.max(5,...history)+.2;
 const peak=Math.max((low-2)**2,(high-2)**2,4)*1.12;
 const X=(x:number)=>80+(x-low)/(high-low)*635;const Y=(y:number)=>235-y/peak*185;
 const changeRate=(index:number)=>{setRateIndex(index);setSteps(0);};
 return <div>
  <p>损失是评价模型当前结果与目标差距的数值，通常希望它下降。梯度是损失对参数的导数，告诉我们参数变化时损失怎样变化；反向传播负责计算这些导数，优化器再按更新规则修改参数。</p>
  <p>用一个参数 w 练习更新：目标为 2，教学损失 L = (w − 2)²，梯度 g = 2(w − 2)。导数可理解为当前位置的曲线斜率；例如 w=0 时 g=−4，表示参数略微增加，损失局部趋向下降。这里先给出求导结果，不要求先掌握微积分。学习率 η 是每次沿梯度反方向移动的步长系数，更新规则为 w_new = w_old − ηg。</p>
  <Canvas ariaLabel="平方损失曲线与参数更新轨迹，绿色标记当前位置，橙色标记上一次位置" draw={ctx=>{
   label(ctx,'损失曲线',80,30);label(ctx,'本次更新',789,30);
   ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,45);ctx.lineTo(80,235);ctx.lineTo(720,235);ctx.stroke();
   ctx.strokeStyle=C.blue;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=160;i++){const wx=low+(high-low)*i/160;const px=X(wx),py=Y((wx-2)**2);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
   ctx.fillStyle=C.muted;ctx.font='20px sans-serif';ctx.fillText('2',X(2)-5,263);ctx.fillText('w',731,244);ctx.fillText('L',59,49);
   history.slice(0,-1).forEach(value=>{ctx.fillStyle=C.passive;ctx.beginPath();ctx.arc(X(value),Y((value-2)**2),4,0,2*Math.PI);ctx.fill();});
   if(steps>0){ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(X(oldW),Y((oldW-2)**2),8,0,2*Math.PI);ctx.fill();if(Math.abs(w-oldW)>.001)arrow(ctx,X(oldW),Y((oldW-2)**2),X(w),Y(loss),C.orange);}
   ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(X(w),Y(loss),9,0,2*Math.PI);ctx.fill();
   ctx.fillStyle=C.text;ctx.font='24px "Microsoft YaHei",sans-serif';ctx.fillText(`w_old = ${fixed(oldW)}`,789,79);ctx.fillText(`g = ${fixed(gradient)}`,789,124);ctx.fillText(`w = ${fixed(w)}`,789,169);ctx.fillText(`L = ${fixed(loss)}`,789,214);
  }}/>
  <Chips options={['学习率 0.1','学习率 0.5','学习率 1.1']} value={rateIndex} onChange={changeRate} label="选择教学学习率，切换后重新开始"/>
  <div className="step-ctrl" role="group" aria-label="执行一次参数更新">
   <button type="button" className="tiny" disabled={steps>=8} onClick={()=>setSteps(x=>x+1)}>更新一次参数</button><span>已更新 {steps} / 8 次</span><button type="button" className="tiny" onClick={()=>setSteps(0)}>重置参数</button>
  </div>
  <Feedback tone={steps>0?(rateIndex===2?'bad':'good'):''}>单参数算例：{steps===0?`初始 w = 0，损失 L = 4，梯度 g = −4。下一次更新将是 0 − ${eta} × (−4) = ${fixed(parameterAt(1))}。`:`第 ${steps} 次：w_new = ${fixed(oldW)} − ${eta} × (${fixed(gradient)}) = ${fixed(w)}，损失由 ${fixed((oldW-2)**2)} 变为 ${fixed(loss)}。`}{rateIndex===0?'学习率 0.1 在本例中逐步靠近目标。':rateIndex===1?'学习率 0.5 在本例中一步到达目标，之后梯度为零。':'学习率 1.1 在本例中越过目标并振荡，误差幅度逐步扩大。'}</Feedback>
  <Table headers={['更新次数','参数 w','损失 (w − 2)²']} rows={history.map((value,i)=>[String(i),fixed(value),fixed((value-2)**2)])}/>
  <p>点击一次时，先用旧参数计算梯度，再根据学习率得到新参数；图中橙点是这次更新前的位置，绿点是更新后的位置。参数轴与损失轴会随轨迹范围自动缩放，数值仍以表格为准。</p>
  <p>这个平方损失只是用来学习梯度下降，不是 CLIP 的训练损失，也不是推荐的 CLIP 学习率。真实 CLIP 优化图找文、文找图的对称交叉熵，更新两个编码器、线性投影和可学习的对数分数缩放参数，实际优化器也比这里的一行规则更复杂。</p>
 </div>;
}

const protocols=['零样本分类','线性探测','微调'];
const protocolExplanations=[
 '零样本分类：编码器参数保持固定，把候选类别写成文字，用图文相似度决定类别。不用该下游任务的标注样本来拟合分类器，但预训练时可能已见过相关概念。',
 '线性探测：固定编码器，先提取图片特征，再用下游训练集的标签学习一个线性分类器。它使用了下游标注，因此不能把这种结果标成零样本。',
 '微调：使用下游训练集的标签，继续更新编码器及任务分类头的部分或全部参数。这是理解评测方式的背景知识，不表示本文所有实验都采取这种训练方式。'
];
function Protocols(){
 const [mode,setMode]=useState(0);const usingLabels=mode>0;
 return <div>
  <p>数据集是一组用于学习或评估的数据，单条数据叫样本，任务要求的正确答案叫标签。评测协议规定模型能用哪些数据、哪些参数可以更新、最终怎样打分；比较论文数字之前，必须先确认协议是否相同。</p>
  <Canvas ariaLabel="零样本、线性探测与微调中冻结和更新参数的区别" draw={ctx=>{
   label(ctx,mode===2?'更新编码器':'冻结编码器',205,38,mode===2?C.orange:C.blue);label(ctx,usingLabels?'使用任务标签':'使用类别文字',719,38,usingLabels?C.orange:C.blue);
   card(ctx,55,99,130,75,'图片',C.blue);arrow(ctx,200,137,243,137,C.blue);
   card(ctx,265,92,227,90,mode===2?'可更新参数':'固定参数',mode===2?C.orange:C.blue);arrow(ctx,512,137,562,137,C.blue);
   card(ctx,584,99,198,75,mode===0?'匹配分数':'学习分类头',usingLabels?C.orange:C.green);arrow(ctx,802,137,845,137,C.blue);card(ctx,865,99,158,75,'预测类别',C.green);
   if(mode===0){card(ctx,585,211,197,45,'文字特征',C.purple);arrow(ctx,684,205,684,188,C.purple);}
   else{card(ctx,585,211,197,45,'训练标签',C.orange);arrow(ctx,684,205,684,188,C.orange);if(mode===2)arrow(ctx,571,234,377,193,C.orange);}
  }}/>
  <Chips options={protocols} value={mode} onChange={setMode} label="比较三种下游评测协议"/>
  <Feedback tone="good">协议对照：{protocolExplanations[mode]}“冻结”表示参数保持不变，仍然会进行前向计算，并不是停用编码器。</Feedback>
  <Table headers={['术语','读论文时怎么理解']} rows={[
   ['数据集 / 样本 / 标签','例如很多照片构成数据集，一张照片是一个样本，“猫”可作为分类任务的标签；图文配对中的说明也提供监督信息。'],
   ['训练集','用于根据数据更新参数；线性探测只更新分类器，微调还会更新编码器。'],
   ['验证集','用于选择设置或检查开发过程；它与最终报告用的测试集应区分，反复据测试结果选设置会影响结论。'],
   ['测试集','按评测协议报告最终效果的数据；比较时要核对数据版本和划分。'],
   ['基线','用来比较的参考方法；要核对其模型、训练数据、协议与资源，不能只看到一个方法名字。'],
   ['指标','给结果打分的计算规则；不同数据集可能采用不同指标，不能混读。'],
   ['Top-1 准确率','最高分预测类别等于标签的样本数，除以测试样本总数；数值越高越好。'],
   ['百分点','两个百分比直接相减的差值，与相对百分比增长不同。']
  ]}/>
  <p>教学算术例子：准确率从 76% 升到 81%，增加 81 − 76 = 5 个百分点；相对增长为 5 / 76 × 100% ≈ 6.58%。这两个说法分母不同，此处 76 与 81 是教学数字，不是新增论文实验。</p>
  <p>CLIP 的零样本、在 CLIP 特征上的线性探测，以及与 ResNet 特征分类器的比较，回答的是不同问题。接下来每组论文结果都要连同数据集、模型版本、基线和指标一起读，不能只凭一个更大的数字得出全面胜出的结论。</p>
 </div>;
}

export const ClipFoundations:React.FC<WidgetProps>=({chapterId})=>{
 if(chapterId==='chap-1')return <Model/>;
 if(chapterId==='chap-4')return <Softmax/>;
 if(chapterId==='chap-7')return <Gradient/>;
 return <Protocols/>;
};
