import React, { useState } from 'react';
import { Scene, Feedback, Prose, MathBox, Controls, Chips, Source, palette as P, arrow, bar, dot, paintPaper, paintBrush, paintStencil } from './ace-kit';

const fmt=(x:number)=>x.toFixed(4);
function softmax(values:number[]){const m=Math.max(...values),e=values.map(v=>Math.exp(v-m)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s);}

export function AceA1(){
 const [mode,setMode]=useState(0);
 const p=softmax(mode?[.2,-.2]:[2,1,.2,-.2]);
 const grad=mode?0:Math.hypot(p[0],p[1]);
 const delta=.1*grad;
 return <div className="ace-widget">
 <Scene label="新样本对旧类别分类器的直接梯度教学算例" draw={ctx=>{
   paintPaper(ctx,35,28,420,218); if(mode)paintStencil(ctx,220,65,180,140);
   ctx.strokeStyle=P.green;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(140,140,45,55,0,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle=mode?P.green:P.red;ctx.setLineDash([7,5]);ctx.beginPath();ctx.ellipse(140+delta*550,140,45,55,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   paintBrush(ctx,290,120,-.6,P.blue); arrow(ctx,190,140,190+delta*550,140,mode?P.green:P.red);
   bar(ctx,570,92,400,30,P.border);bar(ctx,570,92,Math.min(400,grad*400),30,mode?P.green:P.red);
   ctx.fillStyle=P.ink;ctx.font='22px sans-serif';ctx.fillText('直接梯度',570,63);ctx.fillText(fmt(grad),570,177);
 }}/>
 <Controls><Chips options={['普通 ER','非对称新数据损失']} value={mode} onChange={setMode}/></Controls>
 <Feedback tone={mode?'green':'red'}>{mode?'旧类别退出新样本的 softmax 竞争，其分类器行在这一项中的直接梯度为零；回放项和共享特征网络仍会更新。':'普通回放仍让旧类别参与新样本的竞争。即使旧样本已经学好，新样本仍会推动这些分类器行变化。'}</Feedback>
 <Prose>
 <h3>Title（标题）：研究对象是表示突变</h3>
 <p>论文完整标题是 <b>New Insights on Reducing Abrupt Representation Change in Online Continual Learning</b>，发表于 ICLR 2022。中文可译为“减少在线持续学习中表示突变的新认识”。Representation Drift（表示漂移）指同一旧样本经过不断更新的模型后，其特征位置随时间变化。</p>
 <h3>Abstract（摘要）：从“回放什么”转向“怎样施加损失”</h3>
 <p>Online Continual Learning（在线持续学习）要求模型连续处理分布变化的数据，并在有限内存、有限计算下保留旧知识。Experience Replay（经验回放，ER）保存少量旧样本并与新数据一起训练，但作者观察到：新类别刚出现时，旧知识仍可能迅速退化。</p>
 <p>本文用两类非对称目标限制新数据对旧表示的直接干扰：Experience Replay with Asymmetric Metric Learning（非对称度量学习经验回放，ER-AML）和 Experience Replay with Asymmetric Cross-Entropy（非对称交叉熵经验回放，ER-ACE）。两者保留全局回放损失，让新旧类别最终能够共同辨别。</p>
 <h3>Introduction（引言）：为什么有旧样本还不够？</h3>
 <p>Catastrophic Forgetting（灾难性遗忘）不能仅用“没有见到旧样本”解释。新类别尚未形成稳定特征，其样本可能落在旧类别簇附近；普通交叉熵把旧类别也作为竞争对象，因此一次新样本更新就可能改变旧类别原型和共享表示。</p>
 <p>小缓冲只能给出少量纠偏信号，未必能修复最初的破坏。大缓冲可能逐渐恢复准确率，却消耗更多存储。论文的关键问题是：能否先减少不必要的冲击，而不是把恢复旧知识的负担全部交给缓冲？</p>
 <MathBox><b>上方是可计算的教学例子，不是原文测量。</b><br/>固定特征 h=(1,0)，四类分数 z=(2,1,0.2,−0.2)，新样本标签 y=2，旧类为 0、1。线性分类器的旧行梯度范数为 √(p₀²+p₁²)‖h‖={fmt(grad)}；学习率取 0.1 时，旧行直接更新范数为 {fmt(delta)}。画纸轮廓仅把该直接通路可视化，不能由此推出真实旧样本特征位移。</MathBox>
 <h3>怎样读原文 Figure 1？</h3>
 <p>左图用 t-SNE（t 分布随机邻域嵌入）展示第一次任务切换附近的特征与类别原型。二维坐标只是降维布局，不是两个有明确物理意义的输入变量；箭头用于观察更新方向，不能把图上的距离直接当高维梯度范数。</p>
 <p>右图横轴是第二个任务上的训练步，纵轴是第一个任务的准确率。ER 使用总缓冲 200 时出现明显下降，增至 1000 后恢复较好；ACE 在图示协议下减轻了切换时的突降。这里是经验机制证据，不是不遗忘定理，也不意味着所有分布变化都能用掩码解决。</p>
 <details><summary>查看原文 Figure 1 所在页</summary><p><a href="https://arxiv.org/pdf/2104.05025#page=2" target="_blank" rel="noreferrer">打开论文第 2 页查看原图</a></p></details>
 <h3>四遍阅读路线</h3>
 <ol><li>第一遍：先理解问题、两种非对称损失及其贡献，重点看第 1–4 章。</li><li>第二遍：推导候选集合上的概率、特征梯度和共享参数影响，重点看第 3–5、7 章。</li><li>第三遍：核对更新顺序、缓冲采样和论文与代码的掩码差异，重点看第 6 章。</li><li>第四遍：评价机制证据、实验公平性与迁移条件，重点看第 8–10 章。</li></ol>
 </Prose><Source locator="原文 p1 Abstract/Introduction；p2 Figure 1；p6 §4.3"/>
 </div>;
}

export function AceA2(){
 const [mode,setMode]=useState(0);
 const enabled=mode===1?[2,3]:[0,1,2,3];
 const messages=['模型必须在所有已见类别之间做选择，不能借助任务编号缩小答案集合。','任务 oracle 预先给出所属任务，候选只剩对应两类；这是更宽松的对照，不是本文测试条件。','边界变模糊后仍有样本标签；当前批次的唯一标签集合即可决定掩码，不需要任务切换信号。'];
 return <div className="ace-widget">
 <Scene label="单头、任务提示与模糊任务边界的候选类别比较" draw={ctx=>{
   paintPaper(ctx,30,30,430,220);
   if(mode===1)paintStencil(ctx,240,50,190,175);
   for(let j=0;j<4;j++) {const x=100+(j%2)*210,y=95+Math.floor(j/2)*100;dot(ctx,x,y,23,enabled.includes(j)?P.blue:P.light);if(mode===2){dot(ctx,x+32,y-20,6,P.orange);}}
   for(let j=0;j<4;j++){const x=575+j*115;bar(ctx,x,100,75,enabled.includes(j)?105:12,enabled.includes(j)?P.blue:P.border);}
   ctx.fillStyle=P.ink;ctx.font='22px sans-serif';ctx.fillText('候选类别',575,55);ctx.fillText(String(enabled.length),575,255);
 }}/>
 <Controls><Chips options={['共享单头','任务 oracle 对照','模糊任务边界']} value={mode} onChange={setMode}/></Controls>
 <Feedback tone={mode===1?'red':'blue'}>{messages[mode]}</Feedback>
 <Prose>
 <h3>Problem Definition（问题定义）：分布变，标签仍可用</h3>
 <p>在时间 t，学习器收到带标签的小批次 (Xᵢₙ,Yᵢₙ)，来自分布 Dₜ。Dₜ 可以突然切换，也可以逐渐变化；学习器不会收到任务边界通知。模型参数 θ 随流更新，目标是在学到当前内容的同时保持已见分布上的表现。</p>
 <p>本文采用 Single-Head Classification（单头分类）：所有已见类别共享一个分类输出空间。训练和测试均不能利用任务编号。Task Oracle（任务提示器）告诉模型“样本属于哪一个任务”，从而排除其他任务的类别；上方对照展示了它为什么会使问题更容易。</p>
 <div className="ace-table-wrap"><table><thead><tr><th>符号</th><th>含义与类型</th><th>容易混淆之处</th></tr></thead><tbody>
 <tr><td>Xᵢₙ，Yᵢₙ</td><td>当前输入批次及其真实类别标签</td><td>标签可用不等于任务编号可用。</td></tr>
 <tr><td>h=fθ(x)∈ℝᵈ</td><td>分类器之前的特征向量</td><td>教程用 h 表示特征，z 表示输出分数，避免把两者混用。</td></tr>
 <tr><td>W∈ℝᶜˣᵈ</td><td>分类器权重，每一行对应一个类别原型</td><td>共享网络参数也会影响所有样本的表示。</td></tr>
 <tr><td>C꜀ᵤᵣᵣ</td><td>当前小批次中出现的唯一标签集合</td><td>不是“当前任务的完整类别”，也不只包含首次出现的新类别。</td></tr>
 <tr><td>Cₒₗd</td><td>此前已见、但不在当前批次中的类别</td><td>历史旧类别若在本批再次出现，会进入 C꜀ᵤᵣᵣ。</td></tr>
 <tr><td>Cₐₗₗ=Cₒₗd∪C꜀ᵤᵣᵣ</td><td>截至当前时刻的已见类别</td><td>推理时在这个整体集合内分类。</td></tr>
 <tr><td>ℳ，M，K</td><td>ℳ 是记忆缓冲；表中 M 为名义每类预算，K 为总容量</td><td>例如十类数据 M=20 对应总容量约 200，不是总共只存 20。</td></tr>
 </tbody></table></div>
 <h3>Related Work（相关工作）：四篇论文各改了哪一层？</h3>
 <div className="ace-table-wrap"><table><thead><tr><th>方法</th><th>主要干预位置</th><th>与本文的联系</th></tr></thead><tbody>
 <tr><td>GEM</td><td>约束参数更新方向，使其不伤害记忆任务的一阶损失。</td><td>从优化更新方向控制干扰，本文从产生梯度的损失结构入手。</td></tr>
 <tr><td>MIR</td><td>通过虚拟更新寻找损失增加大的记忆样本。</td><td>回答“回放谁”，本文回答“新数据与回放数据怎样不同地学”。</td></tr>
 <tr><td>DER / DER++</td><td>存储并回放历史 logits（未归一化分类分数），保持输出一致性。</td><td>修改回放目标；本文主要限制新数据竞争集合，两者可以组合。</td></tr>
 <tr><td>SS-IL</td><td>分离当前数据与回放数据的 softmax，并使用任务相关蒸馏。</td><td>两边都隔离可能无法及时学习跨任务辨别，本文保留全局回放竞争。</td></tr>
 <tr><td>ER-AML / ER-ACE</td><td>非对称地处理当前流与记忆流。</td><td>两种具体目标实现同一机制，而不是两种新的网络骨干。</td></tr>
 </tbody></table></div>
 <p>原文实验中的 MIR、iCaRL 和 SS-IL 标有 †，表示这些具体实现利用了训练任务编号。因此模糊边界实验只比较无需这类信息的方法。这是本文实现和协议的区别，不能扩展成“所有 MIR 变体在无边界流上都不能使用”。</p>
 <p>与离线增量学习相比，这里不能在任务结束后反复遍历整批新数据来补救初始扰动。数据只从流中经过一次，缓冲允许有限重复；Single Pass（单次遍历）因此不表示每个样本永远只参与一次梯度计算。</p>
 </Prose><Source locator="原文 p3–4 §2 Related Work；p4 §3 Learning Setting；p7 §5.1–2；p13–14 Appendix A"/>
 </div>;
}

export function AceA3(){
 const [angle,setAngle]=useState(.15),[mode,setMode]=useState(0),[dragging,setDragging]=useState(false);
 const tau=.2,anchor=[Math.cos(angle),Math.sin(angle)];
 const candidates=[{a:.55,color:P.green},{a:2.6,color:P.blue},...(mode?[]:[{a:.05,color:P.red}])];
 const scores=candidates.map(v=>Math.cos(angle-v.a)/tau),prob=softmax(scores),loss=-Math.log(prob[0]);
 const oldGrad=mode?0:prob[2]*Math.abs(Math.sin(angle-.05))/tau;
 function point(e:React.PointerEvent<HTMLCanvasElement>){const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)*1080/rect.width,y=(e.clientY-rect.top)*280/rect.height;setAngle(Math.atan2(-(y-140),x-220));}
 return <div className="ace-widget">
 <Scene label="可拖动新类别锚点，比较两种负例集合的 SupCon 损失" tabIndex={0}
 onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);point(e);}}
 onPointerMove={e=>{if(dragging)point(e);}}
 onPointerUp={e=>{setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();setAngle(v=>v+(['ArrowLeft','ArrowUp'].includes(e.key)?.08:-.08));}}}
 draw={ctx=>{
  paintPaper(ctx,25,20,455,240);ctx.strokeStyle=P.border;ctx.lineWidth=2;ctx.beginPath();ctx.arc(220,140,92,0,Math.PI*2);ctx.stroke();
  candidates.forEach((v,i)=>{const x=220+92*Math.cos(v.a),y=140-92*Math.sin(v.a);ctx.strokeStyle=v.color;ctx.lineWidth=i===0?3:1.5;ctx.beginPath();ctx.moveTo(220+92*anchor[0],140-92*anchor[1]);ctx.lineTo(x,y);ctx.stroke();dot(ctx,x,y,10,v.color);});
  if(mode){ctx.setLineDash([5,5]);ctx.strokeStyle=P.muted;ctx.strokeRect(301,126,22,22);ctx.setLineDash([]);}
  dot(ctx,220+92*anchor[0],140-92*anchor[1],14,P.orange);paintBrush(ctx,220+92*anchor[0],115-92*anchor[1],-.7,P.orange);
  prob.forEach((q,i)=>bar(ctx,560,55+i*65,q*390,26,candidates[i].color));
  ctx.fillStyle=P.ink;ctx.font='22px sans-serif';ctx.fillText('候选概率',560,30);ctx.fillText(fmt(loss),975,245);
 }}/>
 <Controls><Chips options={['所有类别作负例','仅当前类别作负例']} value={mode} onChange={setMode}/><button onClick={()=>setAngle(.15)}>锚点归位</button></Controls>
 <div className="ace-table-wrap"><table><thead><tr><th>实时量</th><th>数值</th><th>含义</th></tr></thead><tbody><tr><td>正例概率 q₊</td><td>{fmt(prob[0])}</td><td>绿色条；越接近 1，当前正例越易区分。</td></tr><tr><td>SupCon 损失</td><td>{fmt(loss)}</td><td>当前仅一个正例，因此等于 −log q₊。</td></tr><tr><td>旧负例切向梯度范数</td><td>{fmt(oldGrad)}</td><td>单位向量下，qₒₗd |sin(角差)| / τ；候选中排除时严格为 0。</td></tr></tbody></table></div>
 <Feedback tone={mode?'green':'red'}>{mode?'旧类别不再充当当前锚点的负例，这一项直接作用于旧负例特征的梯度为零。当前类之间仍可学习，完整新旧辨别由回放损失完成。':'旧类别被选作负例时，新锚点会对旧特征施加排斥。改变相对角度会改变 softmax 权重与梯度；高相似度不一定对应最大切向梯度。'}</Feedback>
 <Prose>
 <h3>Method §4.1：让距离结构可控</h3>
 <p>Metric Learning（度量学习）直接组织特征间的接近与远离。论文先提出 ER-AML，使用 Supervised Contrastive Learning（监督式对比学习，SupCon）处理当前批次，用全局余弦分类损失处理回放样本。这样可以明确控制谁会成为负例。</p>
 <p>对当前样本 xᵢ，其特征 hᵢ=fθ(xᵢ)∈ℝᵈ。Pᵢ 是与它同类的正例集合，Nᵢ 是与它异类的负例集合；候选可以来自当前批次和缓冲，锚点自身不作为候选。关键限制在于<b>负例的类别必须属于当前批次标签集合</b>，不是要求负例样本一定来自当前批次。</p>
 <h3>原公式与符号：Eq. (1)</h3>
 <MathBox>sim(a,b)=exp(aᵀb / (τ‖a‖‖b‖))。<br/>L₁(Xᵢₙ)=−∑ᵢ [1/|Pᵢ|] ∑ₚ∈Pᵢ log [sim(hₚ,hᵢ) / ∑ₐ∈Pᵢ∪Nᵢ sim(hₐ,hᵢ)]。</MathBox>
 <p>τ&gt;0 是 Temperature（温度），控制相似度差异转为概率差异的敏感度。h 需非零才能直接使用余弦；实现通常在范数上加小量以避免除零。原式对锚点求和，对每个锚点的多个正例取平均；实现对批次也常取平均，整体尺度要和学习率、γ 配合。</p>
 <h3>从相似度到损失：一步一步推导</h3>
 <ol><li>定义 uᵢ=hᵢ/‖hᵢ‖，uₐ=hₐ/‖hₐ‖，sᵢₐ=uᵢᵀuₐ/τ。相似度就是 exp(sᵢₐ)。</li>
 <li>在候选集合 Aᵢ=Pᵢ∪Nᵢ 内归一化：qᵢₐ=exp(sᵢₐ)/∑ᵦ∈Aᵢ exp(sᵢᵦ)。这使正负候选共享一个概率总量。</li>
 <li>对所有正例均匀分配目标概率 rᵢₐ=1/|Pᵢ|，负例为 0。于是单锚点损失 ℓᵢ=−∑ₐrᵢₐ log qᵢₐ。</li>
 <li>用 log(exp(s)/Z)=s−log Z 展开：ℓᵢ=−∑ₐrᵢₐsᵢₐ+log∑ᵦ exp(sᵢᵦ)，因为 ∑ₐrᵢₐ=1。</li>
 <li>对 sᵢₐ 求导，用 log-sum-exp 的导数得到 ∂ℓᵢ/∂sᵢₐ=qᵢₐ−rᵢₐ。负例 r=0，因此系数 q 为正；最小化损失会压低其与锚点的相似度。</li></ol>
 <p>这解释了为什么负例选择会影响旧表示：如果旧样本在 Nᵢ 内，其特征也参与了损失计算，反向传播会推动它离开新锚点。并非只移动“新样本这一端”。</p>
 <MathBox>对一个非零负例 hₐ，用归一化的链式法则：<br/>∂ℓᵢ/∂hₐ = [qᵢₐ/(τ‖hₐ‖)] (I−uₐuₐᵀ)uᵢ。<br/>其中 I−uₐuₐᵀ 把更新投影到单位球的切向方向。上方二维例子中 ‖hₐ‖=1，范数为 qᵢₐ|sin(角差)|/τ；因此同向时切向导数可为零，不能仅凭概率大就断言梯度大。</MathBox>
 <p>在受限负例版本中，旧类别不在当前候选集合，针对这些旧负例的上述直接项消失。共享网络依然更新，这不等于旧样本的真实表示完全固定，第 7 章会检验这一边界。</p>
 <h3>Eq. (2)：为什么回放还要学习分类？</h3>
 <MathBox>L₂(Xᵦf)=−∑ₓ∈Xᵦf log [sim(wᵧ,hₓ)/∑꜀∈Cₐₗₗ sim(w꜀,hₓ)]。</MathBox>
 <p>w꜀∈ℝᵈ 是分类器第 c 行权重，可以作为可学习的类别原型。把 exp 余弦相似度写成 softmax 分子和分母，再取负对数，就得到归一化原型上的交叉熵。这里分母涵盖所有已见类别，负责恢复整体辨别。</p>
 <p>仅用度量损失时，推理常需要 Nearest Class Mean（最近类均值，NCM）分类器，并重算缓冲特征构造均值。本文用学习的原型输出分类结果，避免这种重算开销。它不是把每个类别的所有旧样本永久保存在模型中。</p>
 <h3>Eq. (3) 与 Algorithm 1：局部学习和全局整合</h3>
 <MathBox>L=γL₁(Xᵢₙ)+L₂(Xᵦf)，γ≥0。<br/>接收带标签批次 → 查找正负候选 → 从缓冲采样回放 → 计算两项损失 → 对总损失做一次参数更新 → 用 Reservoir Sampling（水库抽样）写入当前批次。</MathBox>
 <p>γ 调节流数据度量目标与记忆分类目标的相对权重。γ 越大，新样本的局部几何对总梯度影响越大；它不是保护旧知识程度的单调旋钮。候选正例不足、负例不存在时不能计算空集合平均，代码需要过滤无效锚点；初始阶段还需要训练回退策略。</p>
 <details><summary>查看原文 Figure 2 与 ER-ACE 目标所在页</summary><p><a href="https://arxiv.org/pdf/2104.05025#page=6" target="_blank" rel="noreferrer">打开论文第 6 页查看原图</a></p></details><h3>§4.2 的证据与方法取舍</h3>
 <p>Figure 2 横轴是训练步，背景区分任务，纵轴标为缓冲数据表示的 MSE（均方误差）。正文还以归一化特征的相邻更新距离描述单样本漂移；这两个聚合口径应区分，不能直接把某个 MSE 数当欧氏距离。使用所有负例时在边界附近的尖峰更大，限制负例可减轻这类扰动。</p>
 <p>ER-AML 把干扰机制暴露得很清楚，但需要寻找正负样本并可能增加前向计算。下一章在论文 §4.3 中转向更简单的交叉熵版本：控制分母中的类别，能否达到类似作用？</p>
 </Prose><Source locator="原文 p5 Eq. (1)–(3)、Algorithm 1；p6 §4.2 Figure 2；代码 er_aml.py（固定快照见第 6 章）"/>
 </div>;
}
