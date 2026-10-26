import React, { useMemo, useState } from 'react';
import { C, useCanvas, drawPhoto, bars, arrow, softmax, ce, mse, Feedback, Source, MathBlock } from './der-kit';

function solveOldReplay(beta: number) {
  const z = [2, 1, 0]; let s = [...z];
  for (let k = 0; k < 20; k++) {
    const p = softmax(s);
    s = s.map((v, j) => v - .2 * ((v - z[j]) / 3 + beta * (p[j] - (j === 2 ? 1 : 0))));
  }
  return s;
}
export function DerC6() {
  const [beta, setBeta] = useState(0);
  const z = [2, 1, 0], s = useMemo(() => solveOldReplay(beta), [beta]), p = softmax(s);
  const distance = mse(s, z), supervised = ce(s, 2), total = .5 * distance + beta * supervised;
  const ref = useCanvas((ctx, w, h) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawPhoto(ctx, 40, 48, 165, 176, softmax(z), C.blue);
    arrow(ctx, 234, 135, 320, 135, beta ? C.green : C.blue);
    drawPhoto(ctx, 350, 48, 165, 176, p, p[2] > p[0] ? C.green : C.blue);
    bars(ctx, p, 620, 57, 370, 164, C.blue, 1);
    ctx.font = '18px sans-serif'; ctx.fillStyle = C.ink;
    ctx.fillText('旧参考', 40, 30); ctx.fillText('当前输出', 350, 30);
    const bw = 370 / 3, x = 620 + 2 * bw + .15 * bw;
    ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.strokeRect(x - 4, 53, bw * .7 + 8, 173);
  }, [beta]);
  return <div className="der-widget" data-widget="der-c6">
    <canvas ref={ref} className="der-canvas" aria-label="错误旧输出与纠偏后的当前输出，第三个类别是真实标签" />
    <div className="der-controls">
      <label>真实标签回放权重 β <input aria-label="真实标签回放权重 β" type="range" min="0" max="2" step="0.1" value={beta} onChange={e => setBeta(Number(e.target.value))} /> <output>{beta.toFixed(1)}</output></label>
      <button disabled={beta === 0} onClick={() => setBeta(0)}>重置 β</button>
      <output>α=0.5 · 步长 η=0.2 · 20 步</output>
    </div>
    <Feedback tone={beta === 0 ? 'red' : p[2] > p[0] ? 'green' : 'blue'}>真实类别为索引 2，当前 p(y=2)={p[2].toFixed(4)}；旧输出均方偏离={distance.toFixed(4)}；旧标签交叉熵={supervised.toFixed(4)}；加权旧回放损失={total.toFixed(4)}。{beta === 0 ? '仅保留旧 logits，会把这个错误一并保留。' : '标签纠偏更强，同时允许当前输出偏离历史参考。'}</Feedback>
    <div className="der-prose">
      <h4>为什么有了暗知识，还要加真实标签</h4>
      <p>历史 z 来自学习过程中的某一时刻，可能尚未收敛，也可能在分布突变后偏置。Dark Experience Replay++（暗经验回放增强版，DER++）同时保存 y，让旧输入既保留过去的类别关系，也重新接受正确监督。这增加一个纠偏信号，并不保证每个预算下都超过 DER。</p>
      <MathBlock title="原文式 (6)：三项共同最小化">LDER++(θ)=𝔼₍ₓ,ᵧ₎∼Dₜ ℓ(y,fθ(x)) + α𝔼₍ₓ′,𝓏′₎∼M ∥hθ(x′)−z′∥² + β𝔼₍ₓ″,ᵧ″₎∼M ℓ(y″,fθ(x″))。</MathBlock>
      <p>第一项学习当前样本；第二项在第一批旧输入上匹配历史 logits；第三项在另一批旧输入上回放真实标签。x′ 与 x″ 对应原算法<strong>分别采样的两批记忆</strong>，不是另一套网络。α、β≥0 是两种旧知识信号的权重；图像增强在当前样本和回放样本上分别采样。</p>
      <h4>逐步推导：标签项怎样改变更新方向</h4>
      <p>为看清机制，先对一个旧样本的当前 logits s∈ℝᶜ 求导，使用原始源码的类别均方归一化。令 r=s−z，p=softmax(s)，真实标签独热向量为 eᵧ。旧回放项是 α(rᵀr)/C+β[−sᵧ+logΣⱼexp(sⱼ)]。</p>
      <MathBlock title="先求两项的导数，再相加">∇ₛ[α(rᵀr)/C]=2α(s−z)/C；∇ₛ[βℓ]=β(p−eᵧ)。因此 gₛ=2α(s−z)/C+β(p−eᵧ)，参数梯度为 Jᵀgₛ，其中 J=∂hθ(x)/∂θ∈ℝᶜˣᵖ。真实训练还要加当前监督项和其他批次样本的梯度。</MathBlock>
      <p>上图的教学例令 z=s₀=[2,1,0]，但真实标签 y=2。此时历史得分把类别 0 排第一。若 β=0，s=z 令均方项梯度为零，所以错误会停在原处。若 β&gt;0，真实类别的交叉熵梯度 p₂−1&lt;0，经 s←s−ηg 更新会推高 s₂，同时压低其他类别；均方项则随着偏离 z 增加，把输出拉回历史参考。</p>
      <MathBlock title="本页数值是怎样生成的">固定 α=0.5、C=3、η=0.2，从同一个 s₀ 开始，重复 20 次 sₖ₊₁=sₖ−0.2[(sₖ−z)/3+β(softmax(sₖ)−e₂)]。控件每次变化都重新求这 20 步，显示均方、交叉熵和加权和；它隔离旧回放作用，不是完整训练轨迹，也不是论文的准确率实验。</MathBlock>
      <h4>边界情形与代价</h4>
      <div className="der-table-wrap"><table><thead><tr><th>权重设置</th><th>留下的信号</th><th>应怎样解释</th></tr></thead><tbody>
        <tr><td>β=0</td><td>当前监督＋旧 logits</td><td>DER 的目标；保留旧输出，也可能保留旧错误</td></tr>
        <tr><td>α=0，β&gt;0</td><td>当前监督＋旧标签</td><td>加权 ER 式回放；权重与采样约定仍须一致</td></tr>
        <tr><td>α=β=0</td><td>仅当前监督</td><td>无遗忘保护的 SGD 式训练</td></tr>
      </tbody></table></div>
      <p>β 是损失权重，可以大于 1，不是概率或置信度。增大它既可能纠正旧错误，也可能牺牲新数据适应；不能用测试集选择它。论文对 α=β=0.5 的稳定性观察不构成普适最优结论，正式实验使用验证集搜索；第 10 章保留 DER++ 落后于 DER 的实测反例。</p>
      <Source>依据：正文第 3 页式 (6)、第 4 页 Algorithm 2；梯度和错误标签数值例为教程推导。当前页按类别均方，论文公式按类别平方和，二者 α 的换算见上一章。</Source>
    </div>
  </div>;
}
