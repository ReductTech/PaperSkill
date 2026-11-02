import React,{useState} from 'react';
import {C,useCanvas,roundRect,arrow,Feedback,MathBlock,Source} from './mir-kit';
const names=['准备原始状态','计算新梯度','构造虚拟参数','检查旧损失增量','检索 Top-B','从原点正式更新','最后写入水库'];
type Hot='model'|'scores'|'memory';
const code=`from copy import deepcopy
import torch
from torch.nn import functional as F

def mir_step(net, opt, memory, x, y, eta, C, B):
    # 教学接口 memory.sample(k)->(old_x,old_y)
    # memory.admit_batch 对每项做水库采样。
    # 限定无 BN/dropout 的无状态网络、普通 SGD，
    # opt 学习率为 eta，无 momentum/weight_decay。
    assert 1 <= B <= C
    params = tuple(net.parameters())
    new_loss = F.cross_entropy(net(x), y)
    grads = torch.autograd.grad(new_loss, params)
    virtual = deepcopy(net)
    with torch.no_grad():
        for vp, original, grad in zip(virtual.parameters(), params, grads):
            vp.copy_(original - eta * grad)
    selected_x = selected_y = None
    if len(memory):
        old_x, old_y = memory.sample(min(C, len(memory)))
        with torch.no_grad():
            pre = F.cross_entropy(net(old_x), old_y, reduction='none')
            post = F.cross_entropy(virtual(old_x), old_y, reduction='none')
            idx = (post-pre).topk(min(B, len(old_y))).indices
        selected_x, selected_y = old_x[idx], old_y[idx]
    del virtual
    opt.zero_grad()
    if selected_x is None:
        actual_loss = F.cross_entropy(net(x), y)
    else:
        joined_x = torch.cat([x, selected_x])
        joined_y = torch.cat([y, selected_y])
        actual_loss = F.cross_entropy(net(joined_x), joined_y)
    actual_loss.backward()  # 在原始参数处重新求梯度
    opt.step()
    memory.admit_batch(x.detach().clone(), y.detach().clone())
    return actual_loss.detach().item()

# 推断仅用当前 net；缓存、设备与数据接口需另行接入。
# 这是原创核心示意，不是完整论文训练脚本。`;
export function MirC6(){
 const [phase,setPhase]=useState(0),[hasMemory,setMemory]=useState(true),[hot,setHot]=useState<Hot>('model');
 const detail:Record<Hot,string>={model:'当前输入 n×d、logits n×Q。θ、θᵥ 各 p 维，结构相同、存储独立。',scores:'候选输入 C×d，逐样本损失各 C 维；选 B 个索引后在真实网络重算带梯度的旧损失。',memory:'固定 K 个 (x,y)；先取旧候选，最后再插当前项，空库时跳过旧回放。'};
 const copy=['真实 θ=0，尚未移动。','新损失 (θ−1)²/2 在 θ=0 的梯度是 −1，真实参数仍不改变。','η=0.1，因此 θᵥ=0.1；真实 θ 仍为 0。',hasMemory?'旧目标 [−0.5,0,0.5]：pre=[0.125,0,0.125]，post=[0.180,0.005,0.080]，差分=[0.055,0.005,−0.045]。':'空库跳过候选评分。',hasMemory?'回放 B=1，选损失预计上升 0.055 的第一项。':'空库只使用当前监督。',hasMemory?'丢弃 θᵥ；从原 θ=0 对新旧等权平均目标求梯度 (−1+0.5)/2=−0.25，正式 θ=0.025。':'丢弃 θᵥ；从 θ=0 只用新数据更新，正式 θ=0.1。','更新结束，才逐样本按水库策略插入当前 (x,y)。'];
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
  const nodes=[{x:70,y:94,w:185,key:'model',active:phase>=1},{x:340,y:35,w:190,key:'model',active:phase>=2},{x:612,y:95,w:190,key:'scores',active:hasMemory&&phase>=3},{x:850,y:95,w:170,key:'memory',active:hasMemory||phase===6}];
  nodes.forEach((n,i)=>roundRect(ctx,n.x,n.y,n.w,75,10,C.bg,hot===n.key?C.orange:n.active?i===1?C.purple:C.blue:C.axis));
  arrow(ctx,260,115,335,75,phase>=2?C.purple:C.axis);arrow(ctx,535,75,607,115,hasMemory&&phase>=3?C.purple:C.axis);
  arrow(ctx,844,132,807,132,hasMemory?C.blue:C.axis);arrow(ctx,1020,190,1020,232,hasMemory?C.blue:C.axis);arrow(ctx,1020,232,165,232,hasMemory?C.blue:C.axis);arrow(ctx,165,232,165,174,hasMemory?C.blue:C.axis);
  if(phase>=5){arrow(ctx,260,150,320,195,C.green);roundRect(ctx,320,174,200,48,8,C.bg,C.green);}
  if(phase===6)arrow(ctx,525,199,900,179,C.green);
  ctx.fillStyle=C.ink;ctx.font='18px sans-serif';ctx.fillText('当前模型',92,82);ctx.fillText('虚拟副本',365,24);
  for(let i=0;i<(hasMemory?3:phase===6?1:0);i++)roundRect(ctx,875+i*34,117,22,31,3,C.env);
 },[phase,hasMemory,hot]);
 return <div className="mir-widget" data-widget="mir-c6">
  <canvas ref={ref} className="mir-canvas" aria-label="可点击当前和虚拟模型、候选评分与水库节点的六步训练图"
   onClick={e=>{const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*1080,y=(e.clientY-b.top)/b.height*280;if(x>=70&&x<530&&y<180)setHot('model');else if(x>=610&&x<805&&y>=90&&y<175)setHot('scores');else if(x>=850&&y>=90&&y<175)setHot('memory');}}/>
  <div className="mir-controls"><button onClick={()=>setPhase(v=>Math.min(6,v+1))} disabled={phase===6}>下一步训练流程</button><button onClick={()=>setPhase(0)} disabled={!phase}>重置流程</button><label><input type="checkbox" checked={hasMemory} onChange={e=>{setMemory(e.target.checked);setPhase(0);}}/>已有旧记忆</label>{(['model','scores','memory'] as Hot[]).map((h,i)=><button key={h} aria-pressed={hot===h} onClick={()=>setHot(h)}>{['模型节点','评分节点','记忆节点'][i]}</button>)}</div>
  <Feedback tone={phase>=5?'green':'blue'}>步骤 {phase}/6 · {names[phase]}：{copy[phase]} {detail[hot]} 这是固定标量教学例，不是神经网络训练结果。</Feedback>
  <div className="mir-prose">
   <p>左侧当前网络，上方独立虚拟副本，中右侧候选评分，右侧水库，底部绿色方框为正式更新。蓝色下方回路把旧输入送回当前网络；紫色表示虚拟预测；绿色表示正式更新和最后入库。点选方框或使用同名按钮，会同步改变高亮和形状说明。模型节点同时高亮两份参数，表示结构相同而存储独立。</p>
   <h3>输入、状态和输出</h3>
   <div className="mir-table-wrap"><table><thead><tr><th>组成</th><th>内容与形状</th><th>注意</th></tr></thead><tbody><tr><td>输入</td><td>当前 x∈ℝⁿˣᵈ、标签 y∈ℕⁿ、缓存 𝓜</td><td>图像实际可为 n×通道×高×宽。</td></tr><tr><td>维护状态</td><td>真实 θ、优化器、水库、已见计数，MI-2 还维护历史最好记录</td><td>历史最好仅指已观察到的最小损失。</td></tr><tr><td>输出</td><td>更新后的真实网络、缓存和损失统计</td><td>推断无需虚拟网络或检索排名。</td></tr></tbody></table></div>
   <h3>Algorithm 1：试走与正式移动不能混成两步训练</h3>
   <ol><li>计算当前批次梯度，保持真实参数不动。</li><li>构造 θᵥ=θ−ηg新 的独立副本。</li><li>随机抽 C 个旧候选，分别在 θ 与 θᵥ 处计算逐样本损失。</li><li>按 MI-1 或 MI-2 的降序排名取 B 项。</li><li>丢弃 θᵥ，从原 θ 重新计算混合目标梯度并正式更新。</li><li>最后将当前样本逐项写入水库，更新已见计数。</li></ol>
   <MathBlock title="原文目标的正式起点"><p>θ正式=θ−η∇θL(新批次∪检索旧批次；θ)，不能写成 θᵥ−η∇L(混合批次；θᵥ)。后者多做了一次新样本更新。</p></MathBlock>
   <p>上图以当前目标 1、选中旧目标 −0.5 的平方损失解释起点。等权混合时，在 θ=0 的梯度为 (−1+0.5)/2=−0.25，因此真实参数仅到 0.025；虚拟的 0.1 只是用于预测风险。预估分数并不等于正式混合更新后的实际遗忘量。</p>
   <h3>哪些“看不见的状态”也可能被试走改变？</h3>
   <p>只恢复参数未必够。Batch Normalization（批归一化，BN）的运行均值与方差是 buffers；Dropout（随机失活）和数据增强消耗随机数；Momentum（动量）与 Adam 的优化器状态影响下一步。拿真实优化器 step() 再只恢复权重，可能遗留这些变化，无法视作独立虚拟探针。</p>
   <p>可使用深拷贝或 Functional Parameters（函数式参数），明确哪套缓冲区、训练模式和随机数用于评分。评分时固定 BN 统计可避免污染，但与训练态预估有所不同；对随机层应选择受控、前后一致的随机数，并恢复原 RNG 状态。若实际优化器有动量或权重衰减，要说明虚拟步仍是原文普通 SGD 探针，还是复制完整优化器的前瞻；它们可能给出不同排序。</p>
   <details open><summary>原创 PyTorch 核心示意</summary><pre><code>{code}</code></pre><p>代码限定无状态分类器与普通 SGD，避免把未处理的 BN、随机层或优化器状态隐藏起来。memory.sample 与 admit_batch 是明确声明的教学接口，需连接实际缓存、设备及逐项水库逻辑。候选排名可不保留梯度，但选中旧输入必须在真实网络中重新前向并参与反向传播。</p></details>
   <h3>合并平均和两个批次均值相加并非完全相同</h3>
   <p>令 L新、L旧 各自为批次均值，新批次有 n 项、旧批次有 B 项，合并平均损失为 (nL新+BL旧)/(n+B)。官方仓库当前 mir.py 的经验回放函数先 backward 当前均值，再 backward 旧均值，累计的是 L新+L旧 的梯度。</p>
   <MathBlock title="归一化换算"><p>若 n=B，合并平均=(L新+L旧)/2，所以两个均值相加是其两倍；普通 SGD 下应对应调整学习率或损失系数才有相同步长。若 n≠B，还会改变相对样本权重。</p></MathBlock>
   <p>本例采用合并平均对应 Algorithm 1。复现须固定源码版本、reduction、批次大小与学习率，不把同一个 η 当作相同有效强度。当前代码还包含按任务排除候选和可选多头分支，不能把所有公开实现都描述成完全不使用任务身份。当前 master 也不是已经固定的 2019 历史快照。</p>
   <h3>可复现的起步配置与检查顺序</h3>
   <p>正文经验回放主实验每个到达批次一次更新，新批次与回放均为 10，C=50。MNIST 使用两层各 400 隐藏节点的 MLP、η=0.05、MI-2；CIFAR-10 使用 ResNet-18、验证选择 η=0.1、MI-1。每类 M、全局容量 K、候选 C、回放 B 必须分别记录。</p>
   <p>先做单步检查：虚拟前后真实参数、buffers 与优化器状态是否不变；手算 Top-B 与代码索引是否一致；空缓存与少量缓存是否越界；正式梯度是否从原点计算。再固定类别顺序和初始化种子，记录准确率、遗忘、每次更新数、评分前向次数、内存字节与墙钟时间。网页不构成完整基准训练复现。</p>
   <Source>正文第 3–6 页 §3.1、Algorithm 1、§4.1，补充材料 §B.1；归一化与状态审计参考官方仓库当前 mir.py，源码快照与论文表述的差别已分别说明。</Source>
  </div>
 </div>;
}
