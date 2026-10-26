import React, { useState } from 'react';
import { C, useCanvas, roundRect, drawCamera, drawAlbum, arrow, Feedback, Source, MathBlock } from './der-kit';

const phaseNames = ['准备输入', '当前前向与目标快照', '抽取旧记忆', '合并损失', '反向传播', '更新参数', '再写入水库'];
const phaseCopy = [
  '输入原始图像 raw_x、增强图像 a(raw_x) 与监督标签 y，维护 θ、优化器、固定容量 M 和已见样本计数 n。',
  '只用当前 θ 前向一次：out=hθ(a(raw_x))，z=out.detach().clone()。此时还没有执行参数更新。',
  '先从旧 M 取 logits 回放；DER++ 再独立取一批标签回放。空缓存跳过两条旧样本分支。',
  '合并当前交叉熵、α 倍旧 logits 均方；DER++ 额外加 β 倍旧标签交叉熵。',
  'loss.backward() 让当前网络及旧样本前向分支获得梯度；历史目标 z 不获得梯度。',
  '优化器执行最小化：θ←θ−η∇θL。模型已经改变，早先捕获的 z 仍保持不变。',
  '逐样本进行 reservoir 插入，保存原始 x 与更新前的 z；DER++ 同时保存 y。样本计数按图像数增加。',
];
const coreCode = `import torch
from torch.nn import functional as F

def learn_batch(net, opt, memory, raw_x, x_aug, y,
                augment, replay_size, alpha, beta, use_labels=True):
    # 教学接口：memory.sample(k, fields=...) 返回指定字段，
    # k 不超过当前缓存长度；memory.admit_batch 内逐项做水库采样。
    net.train()
    opt.zero_grad()
    scores = net(x_aug)
    historical = scores.detach().clone()  # 更新前，固定的目标
    loss = F.cross_entropy(scores, y)
    if len(memory) > 0:
        k = min(replay_size, len(memory))
        old_x, old_z = memory.sample(k, fields=("x", "z"))
        replay_scores = net(augment(old_x))
        loss = loss + alpha * F.mse_loss(replay_scores, old_z)
        if use_labels:  # DER++，另一批独立采样
            label_x, label_y = memory.sample(k, fields=("x", "y"))
            loss = loss + beta * F.cross_entropy(net(augment(label_x)), label_y)
    loss.backward()
    opt.step()
    memory.admit_batch(raw_x.detach(), historical,
                       y.detach() if use_labels else None)
    return float(loss.detach())

# 推断：net.eval(); with torch.no_grad(): pred=net(x).argmax(1)
# DER 的 use_labels=False；缓存只保留 x,z，不要求旧 y。
# 这段原创教学核心需连接数据、设备与缓存实现，并非可直接复现全论文的脚本。`;
const checkCode = `# 纯 Python，检验同一个错误旧目标在 beta=0 / 1 时的纠偏
import math
def softmax(s):
    a = [math.exp(v-max(s)) for v in s]
    return [v/sum(a) for v in a]
def replay(beta):
    z = [2., 1., 0.]; s = z[:]
    for _ in range(20):
        p = softmax(s)
        s = [v-.2*((v-z[j])/3+beta*(p[j]-(j==2)))
             for j,v in enumerate(s)]
    return softmax(s)[2]
assert replay(1.) > replay(0.)
print(replay(0.), replay(1.))`;

export function DerC7() {
  const [phase, setPhase] = useState(0), [plus, setPlus] = useState(true), [hasOld, setHasOld] = useState(false);
  const ref = useCanvas((ctx, w, h) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawCamera(ctx, 95, 133, .7);
    drawAlbum(ctx, 850, 70, 190, 120, hasOld ? [1, 2, 3] : phase === 6 ? [1] : [], 3);
    const nodes = [{ x: 235, y: 110 }, { x: 390, y: 110 }, { x: 545, y: 110 }, { x: 700, y: 110 }];
    const thresholds = [1, 2, 3, 5];
    const enabled = (i: number) => phase >= thresholds[i] && (i !== 1 || hasOld);
    arrow(ctx, 145, 133, 233, 133, phase >= 1 ? C.blue : C.axis);
    nodes.forEach((p, i) => {
      const active = enabled(i);
      roundRect(ctx, p.x, p.y, 82, 45, 9, C.bg, active ? C.blue : C.axis);
      if (i < 3) arrow(ctx, p.x + 87, p.y + 23, nodes[i + 1].x - 5, p.y + 23, enabled(i + 1) ? C.blue : C.axis);
    });
    // The current supervised path reaches the total loss without needing a replay target.
    arrow(ctx, 276, 106, 276, 72, phase >= 1 ? C.blue : C.axis);
    arrow(ctx, 276, 72, 587, 72, phase >= 3 ? C.blue : C.axis);
    arrow(ctx, 587, 72, 587, 106, phase >= 3 ? C.blue : C.axis);
    arrow(ctx, 786, 132, 846, 132, phase >= 6 ? C.green : C.axis);
    if (hasOld) {
      // Raw replay inputs pass through the very same first network node.
      arrow(ctx, 846, 176, 276, 176, phase >= 2 ? C.blue : C.axis);
      arrow(ctx, 276, 176, 276, 160, phase >= 2 ? C.blue : C.axis);
      // Stored logits bypass the network and serve only as detached matching targets.
      arrow(ctx, 899, 65, 899, 35, phase >= 2 ? C.purple : C.axis);
      arrow(ctx, 899, 35, 432, 35, phase >= 2 ? C.purple : C.axis);
      arrow(ctx, 432, 35, 432, 105, phase >= 2 ? C.purple : C.axis);
      if (plus) { arrow(ctx, 899, 195, 899, 244, phase >= 3 ? C.green : C.axis); arrow(ctx, 899, 244, 587, 244, phase >= 3 ? C.green : C.axis); arrow(ctx, 587, 244, 587, 160, phase >= 3 ? C.green : C.axis); }
    }
    ctx.font = '18px sans-serif'; ctx.fillStyle = C.ink;
    ctx.fillText('共享网络', 235, 91); ctx.fillText('固定缓存', 850, 52);
    if (phase >= 5) { ctx.beginPath(); ctx.arc(741, 132, 12, 0, 2 * Math.PI); ctx.fillStyle = C.orange; ctx.fill(); }
  }, [phase, plus, hasOld]);
  return <div className="der-widget" data-widget="der-c7">
    <canvas ref={ref} className="der-canvas" aria-label={`DER${plus ? '++' : ''}训练流程，当前步骤：${phaseNames[phase]}；${hasOld ? '包含旧记忆回放分支' : '空缓存仅当前监督'}`} />
    <div className="der-controls">
      <button onClick={() => setPhase(v => Math.min(6, v + 1))} disabled={phase === 6}>下一步训练流程</button>
      <button onClick={() => setPhase(0)} disabled={phase === 0}>重置流程</button>
      <button aria-pressed={!plus} onClick={() => { setPlus(false); setPhase(0); }}>DER</button>
      <button aria-pressed={plus} onClick={() => { setPlus(true); setPhase(0); }}>DER++</button>
      <label><input type="checkbox" checked={hasOld} onChange={e => { setHasOld(e.target.checked); setPhase(0); }} />已有旧记忆</label>
    </div>
    <Feedback tone={phase === 6 ? 'green' : 'blue'}>步骤 {phase}/6 · {phaseNames[phase]}：{phaseCopy[phase]} {!hasOld && phase >= 2 && phase <= 4 ? '本轮从空缓存出发，旧回放项为零。' : ''}</Feedback>
    <div className="der-prose">
      <p><strong>读图：</strong>四个方框从左到右依次是<strong>共享网络前向 → 旧输出匹配 → 总损失 → 优化器更新</strong>。蓝色路径表示当前输入及原始旧输入；旧输入从缓存返回同一个网络，重新前向后参与匹配。上方蓝色支路把当前监督直接送到总损失，空缓存时仍能训练。紫色路径是停止梯度的历史 z，直接作为匹配目标；下方绿色路径是 DER++ 的旧标签 y，参与监督交叉熵。输出匹配与标签分支都是损失计算，未增加额外网络。流程推进到反向传播时尚未更新优化器，第 5 步才点亮最后的更新方框。</p>
      <h4>输入、状态、更新与输出</h4>
      <div className="der-table-wrap"><table><thead><tr><th>组成</th><th>含义与形状</th></tr></thead><tbody>
        <tr><td>输入</td><td>原始 x：B×d；增强 a(x)；真实标签 y：B。图像实现中 d 由通道、高、宽展开。</td></tr>
        <tr><td>维护状态</td><td>θ、SGD 优化器、K 个条目的 M、已见图像计数 n。DER 条目 (x,z)，DER++ 条目 (x,z,y)，z 的宽度固定为 C。</td></tr>
        <tr><td>关键中间量</td><td>当前 logits 与目标快照均为 B×C；旧 logits 回放为 Bᵣ×C。当前与旧批次可以不同大小，类别维必须一致。</td></tr>
        <tr><td>本轮输出</td><td>更新后的 θ、经 reservoir 更新的 M，以及训练损失。推断只需网络与 argmax，不查缓存、不需要任务身份。</td></tr>
      </tbody></table></div>
      <h4>原算法顺序中，三个容易写错的地方</h4>
      <ol>
        <li><strong>先采旧记忆，再写新样本。</strong> 否则当前样本可能立刻作为“旧经验”回放，改变论文中的更新过程。空库时跳过回放；缓存少于请求批次时按实现约定缩小采样。</li>
        <li><strong>z 在 optimizer.step() 之前计算。</strong> detach() 让目标不参与自动微分；clone() 进一步避免共享底层存储被后续原地修改。回放网络输出必须保留梯度；不能把整个旧输入前向都放进 no_grad()。</li>
        <li><strong>写原始输入，回放时重新增强。</strong> z 对应当时增强视图的输出；之后另一增强视图去匹配它，也带来一致性约束。不要误以为训练要求每次重复完全相同的像素变换。</li>
      </ol>
      <MathBlock title="更新方向核对">论文 Algorithms 1–2 印出的更新写成 θ←θ+λ∇θ[loss+reg]，与最小化目标下通常定义的正梯度不一致。随文源码调用 SGD optimizer.step()，对应 θ←θ−η∇θL。这里按最小化约定采用减号；不把印刷的加号照搬为梯度上升。</MathBlock>
      <details open><summary>原创 PyTorch 核心示意：把保存时刻写清楚</summary><pre><code>{coreCode}</code></pre><p>这里 memory.sample/admit_batch 是明确声明的教学接口，需按第 4 章补上固定容量、随机索引、逐样本计数以及设备转移；不能将接口名称当作官方仓库的直接调用。默认 F.mse_loss 平均 Bᵣ×C 个元素，权重必须与这个归一化配套。DER++ 的两批独立抽样是原算法做法；共享一批并非必然改变期望目标，但会改变梯度相关性。</p></details>
      <h4>复现从哪套配置起步</h4>
      <div className="der-table-wrap"><table><thead><tr><th>原始随文配置</th><th>网络与轮数</th><th>优化器和损失权重</th><th>当前批次／回放批次</th></tr></thead><tbody>
        <tr><td>S-CIFAR-10，K=500，DER</td><td>ResNet-18，从头训练，50 轮／任务</td><td>SGD，η=0.03，α=0.3</td><td>32／32</td></tr>
        <tr><td>S-CIFAR-10，K=500，DER++</td><td>同上</td><td>SGD，η=0.03，α=0.2，β=0.5</td><td>32／32</td></tr>
        <tr><td>MNIST-360，K=500，DER++</td><td>两层各 100 ReLU 隐单元 MLP，单遍数据流</td><td>SGD，η=0.2，α=0.5，β=1</td><td>16／16</td></tr>
      </tbody></table></div>
      <p>这些值来自 NeurIPS 补充包中的原始 best_args.py，不能保证今天的 Mammoth 主分支保持同一接口与默认值。复现应固定代码版本、类别顺序、初始化与采样种子，记录数据增强、损失 reduction、验证集搜索范围、每项损失、样本计数、最终准确率、字节内存和墙钟时间。评估时使用 eval() 与 no_grad()，以免改变归一化统计或不必要地保留梯度。</p>
      <details><summary>无需深度学习依赖的数值自检</summary><pre><code>{checkCode}</code></pre><p>该脚本只验证第 6 章隔离旧回放项的纠偏方向。浏览器里的图形与小数值例不构成论文全规模训练复现；完整数据流、模型训练与多种子实验仍须在相同协议下运行。</p></details>
      <Source href="https://proceedings.neurips.cc/paper_files/paper/2020/file/b704ea2c39778f07c617f6b7ce480e9e-Supplemental.zip">依据：正文第 4 页 Algorithms 1–2、第 5 页 §4.1；原始补充包 models/der.py、models/derpp.py、utils/best_args.py。下载原始补充材料与随文代码。</Source>
    </div>
  </div>;
}
