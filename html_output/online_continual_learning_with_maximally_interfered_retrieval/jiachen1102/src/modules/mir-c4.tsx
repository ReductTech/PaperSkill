import React,{useState} from 'react';
import {C,useCanvas,drawInstrument,roundRect,arrow,Feedback,MathBlock,Source} from './mir-kit';

export function MirC4(){
 const [eta,setEta]=useState(.1);
 const first=[eta,.5*eta],exact=[eta+.05*eta*eta,.5*eta+2*eta*eta];
 const winner=exact[0]>=exact[1]?'A':'B';
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
  drawInstrument(ctx,175,140,.8,[exact[0]/2.5,exact[1]/2.5,0]);
  arrow(ctx,450,230,1020,230);arrow(ctx,450,230,450,50);
  [0,1].forEach(i=>{const x=590+i*250;roundRect(ctx,x-55,230-first[i]*66,45,first[i]*66,3,C.blue);roundRect(ctx,x+5,230-exact[i]*66,45,exact[i]*66,3,C.green);});
  arrow(ctx,170,112,170-eta*80,112,C.orange);
  ctx.font='18px sans-serif';ctx.fillStyle=C.ink;ctx.fillText('线性预测',450,35);ctx.fillText('有限步长',815,35);
 },[eta]);
 return <div className="mir-widget" data-widget="mir-c4">
  <canvas ref={ref} className="mir-canvas" aria-label="改变虚拟学习率，比较线性梯度预测与精确有限步长干扰；旧样本 A、B 各有两条柱" />
  <div className="mir-controls"><label>虚拟学习率 η <input type="range" min="0" max="1" step=".01" value={eta} aria-label="虚拟学习率 η" onChange={e=>setEta(Number(e.target.value))}/><output>{eta.toFixed(2)}</output></label><button onClick={()=>setEta(.1)}>重置学习率</button></div>
  <Feedback tone={eta===0?'blue':winner==='B'?'purple':'green'}>η={eta.toFixed(2)}；A：线性 {first[0].toFixed(4)}，精确 {exact[0].toFixed(4)}；B：线性 {first[1].toFixed(4)}，精确 {exact[1].toFixed(4)}。{eta===0?'尚未移动，两项增量均为零。':winner==='B'?'曲率让 B 的精确风险超过 A；只看梯度内积会选错这个教学例的第一名。':'小步长下，梯度反向程度给出有用的风险近似。'}</Feedback>
  <div className="mir-prose">
   <p>弦的偏离表示旧样本损失增量的教学映射，不是实际音高或论文实测值。右侧每组从左到右为蓝色一阶近似、绿色精确增量；两组依次对应 A、B，纵向高度表示损失增量，横向仅区分样本。数值由同一 η 计算。</p>
   <h3>先从当前批次的目标与梯度开始</h3>
   <p>令 θ∈ℝᵖ 是共享参数，当前批次有 n 个带标签样本，分类器 logits 为 hθ(x)∈ℝᑫ。用 η 表示学习率，避免与原文生成式目标里的熵权重混淆。新批次平均损失为 L新(θ)=(1/n)Σᵣ ℓ(hθ(xᵣ),yᵣ)，新梯度 g新=∇θL新∈ℝᵖ。Stochastic Gradient Descent（随机梯度下降，SGD）沿负梯度试走一步：</p>
   <MathBlock title="原文 §3.1：虚拟更新，不是已执行的正式更新"><p>θᵥ=θ−ηg新，η≥0。对旧样本 i，sᵢ=ℓᵢ(θᵥ)−ℓᵢ(θ)。正值表示新数据单独更新将使该旧样本损失上升；负值表示它反而受益。</p></MathBlock>
   <h3>交叉熵为什么给出这个梯度？</h3>
   <p>对一个样本记 h=hθ(x)，pⱼ=exp(hⱼ)/Σₖexp(hₖ)，y 为真实类别。Cross-Entropy（交叉熵）从正确类别的负对数概率开始：</p>
   <MathBlock title="从定义逐项求导"><p>ℓ(h,y)=−log pᵧ=−hᵧ+log Σₖexp(hₖ)。</p><p>∂ℓ/∂hⱼ=−1[j=y]+exp(hⱼ)/Σₖexp(hₖ)=pⱼ−1[j=y]。</p><p>若 J=∂h/∂θ∈ℝᑫˣᵖ，链式法则给出 ∇θℓ=Jᵀ(p−eᵧ)∈ℝᵖ。对批次求平均即可得到 g新。</p></MathBlock>
   <p>实现 log Σexp 时可减去最大 logit 再加回来，避免指数溢出；这个数值技巧不改变目标。逐样本旧损失用于排名，不能先把候选损失平均成一个数再选 Top-B。</p>
   <h3>一阶展开：梯度冲突为何对应预计遗忘？</h3>
   <p>令 δ=θᵥ−θ=−ηg新，gᵢ=∇θℓᵢ(θ)∈ℝᵖ。Taylor Expansion（泰勒展开）在 θ 附近给出 ℓᵢ(θ+δ)=ℓᵢ(θ)+gᵢᵀδ+O(‖δ‖²)。减去当前旧损失并代入 δ：</p>
   <MathBlock title="教程补充推导：局部一阶解释"><p>sᵢ≈−ηgᵢᵀg新=−η‖gᵢ‖‖g新‖cos φᵢ。</p><p>当两梯度内积为负，按新梯度下降会使该旧损失在一阶上升高；内积为正时旧损失可能下降。零梯度或近乎正交时，一阶贡献很小。</p></MathBlock>
   <p>这解释了 MIR 和 GEM 为何都与梯度干扰有关，但它们的处理位置不同：MIR 用预估损失变化选回放样本，GEM 则用旧任务梯度约束更新方向。MIR 的实际有限差分分数并不需要为每个候选保存一个完整梯度向量。</p>
   <h3>二阶项与排序反转：近似的边界在哪里？</h3>
   <p>若旧损失二阶可微，Hᵢ=∇²θℓᵢ(θ)∈ℝᵖˣᵖ 为 Hessian Matrix（海森矩阵），展开到二阶：</p>
   <MathBlock title="保留曲率项"><p>sᵢ=−ηgᵢᵀg新+(η²/2)g新ᵀHᵢg新+o(η²)，这里固定 g新，令 η→0。</p></MathBlock>
   <p>上方教学例在 θ=(0,0) 取 g新=(1,0)，ℓA(θ)=cA−θ₁+0.05θ₁²+0.5θ₂²，ℓB(θ)=cB−0.5θ₁+2θ₁²+0.5θ₂²。常数可取 cA=cB=10 保持图示区域损失为正，计算差分时会抵消。于是 gA=(−1,0)、gB=(−0.5,0)，HA=diag(0.1,1)、HB=diag(4,1)。θᵥ=(−η,0)，直接代回得到：</p>
   <MathBlock title="这个二次函数例中的精确差分"><p>sA=η+0.05η²；sB=0.5η+2η²。</p><p>对于 η&gt;0，sB&gt;sA ⇔ 1.95η²&gt;0.5η ⇔ η&gt;0.5/1.95≈0.25641。一阶排序却始终把 A 放在 B 前。</p></MathBlock>
   <h3>误差能界定到什么程度？</h3>
   <p>若旧损失的梯度在连接 θ 与 θ+δ 的线段上是 Lᵢ-Lipschitz 连续，则由微积分基本定理，残差为 ∫₀¹[∇ℓᵢ(θ+tδ)−∇ℓᵢ(θ)]ᵀδ dt。用 Cauchy–Schwarz（柯西–施瓦茨）不等式与 Lipschitz 条件，其绝对值不超过 ∫₀¹Lᵢt‖δ‖²dt=Lᵢ‖δ‖²/2。</p>
   <MathBlock title="局部近似误差界"><p>|sᵢ+ηgᵢᵀg新|≤(Lᵢη²/2)‖g新‖²。</p></MathBlock>
   <p>这里的一阶、二阶解释与误差界是教程展开，不是原文给出的普适无遗忘定理。即使有限差分精确，候选集合仍有限，正式更新还混入回放梯度；它无法保证所有旧样本都不受损。</p>
   <Source>正文第 3 页 §3.1 的虚拟更新与干扰分数；本章 Taylor 展开、误差界和二次函数为教学补充。</Source>
  </div>
 </div>;
}
