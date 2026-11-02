import React,{useState} from 'react';
import {C,useCanvas,roundRect,arrow,Feedback,Source,MathBlock} from './mir-kit';
const points=[{z:[.2,.2],p:[.52,.48],q:[.05,.95]},{z:[.35,.25],p:[.95,.05],q:[.4,.6]},{z:[.8,.75],p:[.85,.15],q:[.55,.45]}];
const kl=(p:number[],q:number[])=>p.reduce((a,v,i)=>a+v*Math.log(v/q[i]),0);
const ent=(p:number[])=>-p.reduce((a,v)=>a+v*Math.log(v),0);
export function MirC7(){
 const [mode,setMode]=useState(0);
 const scores=points.map(a=>kl(a.p,a.q)-(mode>0?ent(a.p):0));
 const pairs=[[0,1],[0,2],[1,2]].map(([i,j])=>({i,j,d:points[i].z.reduce((a,v,k)=>a+(v-points[j].z[k])**2,0),score:scores[i]+scores[j]}));
 const ranked=pairs.map(a=>({...a,gain:a.score-(mode===2?3*Math.max(0,.3-a.d):0)})).sort((a,b)=>b.gain-a.gain);
 const winner=ranked[0];
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
  arrow(ctx,50,140,325,140);roundRect(ctx,85,100,150,80,10,C.env,C.leaf);
  arrow(ctx,330,140,500,140,C.purple);roundRect(ctx,350,110,105,60,10,C.bg,C.blue);
  arrow(ctx,500,140,600,140,C.purple);
  points.forEach((p,i)=>{const x=650+p.z[0]*350,y=235-p.z[1]*200;ctx.beginPath();ctx.arc(x,y,8+6*(scores[i]+1),0,Math.PI*2);ctx.fillStyle=i===winner.i||i===winner.j?C.green:C.env;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.stroke();});
  const a=points[winner.i].z,b=points[winner.j].z;ctx.beginPath();ctx.moveTo(650+a[0]*350,235-a[1]*200);ctx.lineTo(650+b[0]*350,235-b[1]*200);ctx.strokeStyle=C.green;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=C.ink;ctx.font='18px sans-serif';ctx.fillText('解码与预测',75,70);ctx.fillText('潜空间',650,40);
 },[mode]);
 return <div className="mir-widget"><canvas ref={ref} className="mir-canvas" aria-label="解码器与潜空间中选中的两个生成回放候选点"/>
 <div className="mir-controls">{['只看 KL','KL 减熵','再约束多样性'].map((n,i)=><button key={n} aria-pressed={mode===i} onClick={()=>setMode(i)}>{n}</button>)}</div>
 <Feedback tone={mode===2?'green':'blue'}>选中候选 {winner.i+1}、{winner.j+1}；联合目标 {winner.gain.toFixed(3)}，平方距离 {winner.d.toFixed(3)}。{mode===0?'大预测变化可能来自模糊样本。':mode===1?'减去教师熵，偏向教师更确定的候选。':'近邻点还会受到重复惩罚。'} 这是固定候选的教学比较，不是论文测量。</Feedback>
 <div className="mir-prose">
 <p>Generative Replay（生成式回放）不保存原始旧样本，而用生成器重现它们。上图左侧表示解码与预测，右侧为二维教学潜空间；绿色点是所选集合。三组概率与坐标固定如下，所有数字由它们实时计算。点的半径=8+6(s+1)，s 是当前单点目标，因此切换熵项会改变每个点的大小；加 1 仅用于把本例的负分映射为正半径，半径不是概率。绿色只表示联合目标选中的两个点。</p>
 <div className="mir-table-wrap"><table><thead><tr><th>候选</th><th>z</th><th>参考 p</th><th>虚拟 q</th><th>KL</th><th>H(p)</th></tr></thead><tbody>{points.map((a,i)=><tr key={i}><td>{i+1}</td><td>{a.z.join(', ')}</td><td>{a.p.join(', ')}</td><td>{a.q.join(', ')}</td><td>{kl(a.p,a.q).toFixed(3)}</td><td>{ent(a.p).toFixed(3)}</td></tr>)}</tbody></table></div>
 <h3>从真实标签下的干扰，走向可计算代理</h3>
 <p>原文式 (1) 令 Z∈ℝ<sup>B×Dᶻ</sup> 为 B 个待检索潜向量，gγ 为解码器，θᵥ 为当前批次诱导的虚拟分类器，θ′ 为参考分类器。目标是在解码后寻找损失增幅最大的点，同时让不同 z 保持距离：</p>
 <MathBlock title="原文式 (1)：有真实标签时的理想目标"><p>max<sub>Z</sub> L(fθᵥ(gγ(Z)),Y*)−L(fθ′(gγ(Z)),Y*)，约束 ‖zᵢ−zⱼ‖²&gt;ε，i≠j。</p><p>ε 是平方距离阈值。Y* 表示生成图像在真实分布中的标签，实际并不直接可得；这正是不能直接执行式 (1) 的原因。</p></MathBlock>
 <p>用参考网络的概率 p(z)=fθ′(gγ(z)) 近似旧知识，用 q(z)=fθᵥ(gγ(z)) 表示虚拟更新后的概率。定义 Soft Pseudo-label（软伪标签），并用 KL Divergence（KL 散度）作为变化代理：</p>
 <MathBlock title="从定义推导 KL 与交叉熵"><p>KL(p∥q)=Σᶜpᶜlog(pᶜ/qᶜ)=Σᶜpᶜlog pᶜ−Σᶜpᶜlog qᶜ=CE(p,q)−H(p)。</p><p>其中 CE(p,q)=−Σᶜpᶜlog qᶜ，H(p)=−Σᶜpᶜlog pᶜ。KL 衡量两组概率的差异，不等于真实标签下损失增量的恒等式。</p></MathBlock>
 <p>Variational Autoencoder（变分自编码器，VAE）可能产生模糊或类别混合图像。高 KL 点可能恰恰是这种不可靠区域；原文式 (2) 另外减去参考预测的熵，鼓励参考网络确信其类别：</p>
 <MathBlock title="原文式 (2) 与一个显式标注的教学软约束"><p>max<sub>Z</sub> Σ<sub>z∈Z</sub>[KL(p(z)∥q(z))−λ<sub>H</sub>H(p(z))]，仍满足成对平方距离大于 ε。</p><p>本教程将硬距离约束替换为教学铰链罚项：G(Z)=Σ[KL−λ<sub>H</sub>H]−λ<sub>d</sub>Σ<sub>i&lt;j</sub>max(0,ε−‖zᵢ−zⱼ‖²)。上图 λ<sub>H</sub>=1、λ<sub>d</sub>=3、ε=0.3；这不是声称原代码使用同一个铰链公式。</p></MathBlock>
 <p>原论文把熵系数写为 α；为避免与学习率混用，这里改记 λ<sub>H</sub>。最大化 G 时作梯度上升 Z←Z+ρ∇ZG，ρ&gt;0；若代码使用梯度下降，则需最小化 −G。对距离 dᵢⱼ 的活跃罚项，∇zᵢ[−λd(ε−dᵢⱼ)]=2λd(zᵢ−zⱼ)，更新将太近的点推开。边界处使用次梯度。</p>
 <p>搜索期间网络参数固定，但输出仍是 z 的函数。完整梯度为 ∇z KL=Σᶜ[(log(pᶜ/qᶜ)+1)∇zpᶜ−(pᶜ/qᶜ)∇zqᶜ]，熵梯度为 −Σᶜ(log pᶜ+1)∇zpᶜ。冻结 θ′ 不等于切断 p 对 z 的导数。若把 p 整体 detach，会得到另一个代理搜索；应明确区别。正式训练分类器时，生成样本上的旧目标才需要作为固定监督信号。</p>
 <h3>为什么连生成器也要保护：式 (3)</h3>
 <p>如果生成器遗忘，分类器即使想回放也得不到合适旧数据。为此原文对编码器 φ 与解码器 γ 同样构建虚拟更新，再比较生成损失。先从 VAE 的定义推导：</p>
 <MathBlock title="Jensen 不等式得到 Evidence Lower Bound（证据下界，ELBO）"><p>log pγ(x)=log ∫qφ(z|x)[pγ(x,z)/qφ(z|x)]dz ≥ E<sub>qφ</sub>[log pγ(x,z)−log qφ(z|x)]。</p><p>因为 log 是凹函数，log E[A]≥E[log A]。代入 pγ(x,z)=pγ(x|z)p(z)，得到 ELBO=E<sub>qφ</sub>log pγ(x|z)−KL(qφ(z|x)∥p(z))。</p><p>负 ELBO 损失 Jφ,γ(x)=E<sub>qφ</sub>[−log pγ(x|z)]+KL(qφ(z|x)∥p(z))，由重建项与先验正则项组成，越低越好。</p></MathBlock>
 <p>若 pγ(x|z)=N(gγ(z),σₓ²I)，则 −log pγ(x|z)=‖x−gγ(z)‖²/(2σₓ²)+(d/2)log(2πσₓ²)。固定 σₓ 时就是按方差缩放的重建平方误差，不能任意丢弃影响优化强度的系数。</p>
 <MathBlock title="对角高斯的 KL 展开"><p>设 q=N(μ,diag(σ²))、p=N(0,I)。log(q/p)=−Σlog σⱼ−Σ(zⱼ−μⱼ)²/(2σⱼ²)+Σzⱼ²/2。</p><p>对 q 求期望，E(zⱼ−μⱼ)²=σⱼ²，Ezⱼ²=μⱼ²+σⱼ²，所以 KL(q∥p)=½Σⱼ(μⱼ²+σⱼ²−1−log σⱼ²)。μ、σ∈ℝ<sup>Dᶻ</sup>，σⱼ&gt;0。</p></MathBlock>
 <p>原文式 (3) 对 Zgen 搜索虚拟 VAE 与参考 VAE 的负 ELBO 之差。按原式各分支的解码记号，可写为 Jφᵥ,γᵥ(gγᵥ(Zgen))−Jφ′,γ′(gγ′(Zgen))，再附加潜变量多样性约束。展开 J 就得到两组重建期望之差，加上两组后验到先验 KL 之差。注意这里原式两分支各自解码；不宜静默改写成固定同一个真实输入的损失差。</p>
 <p>Algorithm 2 分别检索分类器的 B<sub>C</sub> 与生成器的 B<sub>G</sub>，再用新数据联合各自回放集更新。θ′、φ′、γ′ 在任务开始时由旧模型复制；因此这一版本使用任务划分。搜索从当前输入编码初始化并限制迭代次数，计算预算仍是限制。</p>
 <p>官方当前主分支还有交叉熵、熵、多样性与潜变量壳层等加权实现，不能把每一行都当作式 (2) 的逐字实现。复现应固定版本、系数、优化方向、教师梯度路径以及生成质量；本页二维候选例不运行 VAE 训练。</p>
 <Source>原文 pp. 4–5，§3.2，式 (1)–(3)，Algorithm 2；Jensen、Gaussian 与梯度展开为教程补全。</Source>
 </div></div>;
}
