import React,{useState} from 'react';
import {C,useCanvas,drawInstrument,roundRect,Feedback,Source,MathBlock} from './mir-kit';
const scenarios=[
 {name:'稳定关系',risk:[.8,.3,.1],proposal:'先检验精确 MIR 是否能用固定检索预算保留仍然有效的旧关系；比较等计算随机回放。'},
 {name:'突然漂移',risk:[.2,.9,.6],proposal:'高干扰可能来自已经失效的旧规则。测试年龄上限／漂移触发衰减，防止追随旧关系阻碍适应。'},
 {name:'缓慢漂移',risk:[.5,.6,.3],proposal:'比较连续衰减与固定 MIR，检验是否在相同保留水平下缩短适应延迟；加入稳定流对照。'},
 {name:'旧状态复现',risk:[.9,.2,.7],proposal:'长期参考可能再次有价值。比较 FIFO、随机水库与兼顾多样性／复现状态的检索，但不预设哪一种胜出。'}
];
export function MirC10(){
 const [index,setIndex]=useState(0),e=scenarios[index];
 const ref=useCanvas(ctx=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);drawInstrument(ctx,180,140,.85,e.risk);e.risk.forEach((v,i)=>{const x=465+i*175;roundRect(ctx,x,230-v*170,100,v*170,6,i===e.risk.indexOf(Math.max(...e.risk))?C.orange:C.env);});ctx.fillStyle=C.ink;ctx.font='18px sans-serif';ctx.fillText('参考弦',70,40);ctx.fillText('假设风险',470,40);},[index]);
 return <div className="mir-widget"><canvas ref={ref} className="mir-canvas" aria-label="四种研究场景及明确假设的风险优先级，不是测量结果"/><div className="mir-controls">{scenarios.map((s,i)=><button key={s.name} aria-pressed={index===i} onClick={()=>setIndex(i)}>{s.name}</button>)}</div><Feedback tone="purple">研究场景：{e.name}。{e.proposal} 图中三条风险值是人为设定的设计示例，不是论文结果或预测准确率。</Feedback>
 <div className="mir-prose"><h3>贡献与局限同时怎样理解？</h3><p>MIR 把“回放谁”从随机选择变成与当前梯度相关的前瞻风险排序。它在经验、生成与压缩回放中复用这一想法，而不是提出新的专用分类器；论文的价值还在于把单遍、共享分类器和生成器遗忘等条件拉进讨论。强基线的研究价值是提供可解释且可检验的比较对象，不是证明它在今天所有系统中最优。</p>
 <p>局限包括：候选池可能漏掉重要样本；大损失增量可能对应标签噪声或已经过时的规律；虚拟一步与最终联合更新不同；增加候选量提高成本；高阶曲率会改变排序；生成器模糊、伪标签错误及任务末教师依赖；AE 多轮离线训练和压缩精度假设。论文没有给出任意数据流无遗忘保证，也没有在所有预算、所有指标上获胜。</p>
 <h3>把它放回自己的知识体系</h3><p>Online Learning（在线学习）强调逐步接收与更新，Continual Learning（持续学习）进一步要求旧能力保留；Concept Drift（概念漂移）提醒我们旧关系也可能失效。Optimization（优化）解释新旧梯度冲突以及有限步长曲率；Time Series Forecasting（时间序列预测）则要求把分类损失换成预测损失，并严格尊重标签到达时间。</p>
 <MathBlock title="面向预测任务的研究改造，不是原文实验"><p>令 xₜ 为历史窗口，gθ(xₜ)∈ℝ<sup>H×D</sup> 为未来 H 步 D 维预测。标签到达后才可计算 ℓᵢ(θ)=mean|gθ(xᵢ)−yᵢ| 或 mean(gθ(xᵢ)−yᵢ)²。</p><p>对已标注旧窗口，先从新近已标注批次构建 θᵥ，再取 sᵢ=ℓᵢ(θᵥ)−ℓᵢ(θ)。MAE=(1/N)Σ|ŷ−y|，RMSE=√[(1/N)Σ(ŷ−y)²]；维度与预测步长的平均规则须固定。</p></MathBlock>
 <p>未来 y 尚未观测时，不能为了打分先读取它。应先发出预测，将输入时间、预测时间、标签到达时间和模型版本记入等待队列；收到标签后才计算监督分数、更新与入库。等待队列也占字节，并非“记忆外免费存储”。按时间滚动划分，避免跨训练／验证／测试的窗口重叠、归一化或插值使用未来信息。输入可立即归档与监督标签可用，是两个独立事件。</p>
 <p>传感器预测、设备工况监测、视觉质检可借鉴少量历史回放，但需要有标签或延迟标签、适当隐私权限、可接受的训练延迟和存储预算。真实概念变化下，保留旧知识有时与适应新规律冲突，应同时报告近期误差、复现状态保留和适应时间。</p>
 <h3>三个可以被实验推翻的方向（新颖性尚未检索）</h3>
 <div className="mir-table-wrap"><table><thead><tr><th>假设与改造</th><th>基线／消融</th><th>检验与反证</th></tr></thead><tbody>
 <tr><td>一阶梯度代理足够近似精确虚拟损失差，能降低检索开销。</td><td>ER、精确 MIR、一阶代理、二阶小模型、随机等量检索；固定实际墙钟与回放次数。</td><td>测 Top-B 重合率、近期／旧任务误差、耗时；跨步长和曲率运行。若仅排序相似但固定时间下效果不改善，效率假设不获支持。</td></tr>
 <tr><td>漂移与年龄信息可抑制“高干扰但应被遗忘”的旧记忆。</td><td>FIFO、随机水库、MIR、仅年龄、仅漂移触发、组合策略；另外注入标签噪声，分离鲁棒性来源。</td><td>稳定、突然、渐变、复现流都测试，统一延迟标签和十个种子。若只能以显著损害复现状态保留来降低新误差，不支持兼顾两者的假设。</td></tr>
 <tr><td>在严格字节与计算预算下，选择检索、目标或压缩方式能形成更好的资源折中。</td><td>ER、MIR、DER、DER+MIR 组合设想、不同精度压缩；逐项消融选择规则和训练目标，固定骨干与搜索预算。</td><td>同时测误差／ACC、少数类保留、峰值内存、缓存及等待队列字节、前向次数和墙钟。若等预算后收益消失，原收益可能主要来自资源差异。</td></tr>
 </tbody></table></div>
 <p>DER 发表于 2020，晚于本论文：它是联系已有知识时的后续工作，不是这篇 2019 论文做过的基线。DER+MIR 仅是组合假设；发表价值还需检索已有组合和近似检索工作，不能把未经查新的想法称作空白。</p>
 <h3>十二项精读记录</h3><ol>
 <li><strong>Problem（问题）</strong>：新数据到来时，固定回放预算应优先保护哪些旧经验？</li>
 <li><strong>Background（背景）</strong>：灾难性遗忘与有限计算使随机回放可能把预算用在没有受害的样本上。</li>
 <li><strong>Setting（设定）</strong>：非独立同分布有标签流、共享分类器、有限缓存；单遍访问不自动等于一次更新或无任务信息。</li>
 <li><strong>Main Idea（核心思想）</strong>：用新批次预测一次虚拟更新，以旧损失增长排序，再从原参数联合更新。</li>
 <li><strong>Method（方法）</strong>：ER-MIR 在随机候选内排序；GEN-MIR 在潜空间搜索；AE-MIR 利用压缩代码、近邻和重建。</li>
 <li><strong>Mathematics（数学）</strong>：区分 MI-1 与历史最佳参照 MI-2；能推导一阶冲突、高阶修正、KL 与熵、负 ELBO；知道证明和经验结论的边界。</li>
 <li><strong>Algorithm（算法）</strong>：新梯度、虚拟复制、候选评估、Top-B、丢弃虚拟分支、真实联合更新、缓存维护；推断通常只需当前分类器，AE 版本还需重建。</li>
 <li><strong>Experiments（实验）</strong>：逐项记录 M 每类记忆、候选 C、回放 B、更新次数、共享头、运行数和指标方向；不混合表之间的条件。</li>
 <li><strong>Strength（贡献）</strong>：把检索规则与当前学习冲突相连，多个回放形式上提供证据，也揭示生成与重建困难。</li>
 <li><strong>Limitation（局限）</strong>：候选遗漏、标签噪声、陈旧知识、虚拟估计偏差和计算开销；GEN／AE 并非全部满足最严格无边界单遍要求。</li>
 <li><strong>Connection（联系）</strong>：GEM 管更新方向、DER 管旧输出目标、MIR 管回放选择；预测任务还需处理漂移与未来标签不可见。</li>
 <li><strong>Research Extension（研究延伸）</strong>：用计算代理、漂移鲁棒性和等字节控制构造可证伪研究，再查新和复现。</li>
 </ol><h3>四遍学习与复现出口</h3><p>第一遍用第 1–3 章解释问题与贡献；第二遍逐行推导第 3–5、7 章；第三遍用第 6 章实现核心，并按第 8–9 章固定变体及协议；第四遍用本章的反例与研究计划评价改进。浏览器小例仅验证机制，不冒充完整基准训练；复现需固定代码、数据、随机种子、损失归一化和预算，保留每任务矩阵与所有运行记录。</p>
 <Source>原文 Conclusion 与方法／实验；本章预测迁移和三个研究方案为待验证教学延伸。</Source></div></div>;
}
