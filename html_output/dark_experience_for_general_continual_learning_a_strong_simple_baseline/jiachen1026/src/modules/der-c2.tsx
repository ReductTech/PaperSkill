import React, { useState } from 'react';
import { C, useCanvas, drawCamera, drawPhoto, roundRect, Feedback, Source, MathBlock } from './der-kit';

const settings = [
  {name:'Task-IL', cn:'任务增量学习',train:'标准实验有任务分段；可提供边界',test:'提供测试任务身份，用于限制候选类别',change:'分批引入不同类别',fixed:'不是该设定本身的保证',feedback:'测试先知缩小候选集合：同一模型只需区分当前任务内的类别。'},
  {name:'Class-IL', cn:'类别增量学习',train:'标准实验有任务分段；可提供边界',test:'不提供测试任务身份',change:'分批引入不同类别',fixed:'不是该设定本身的保证',feedback:'必须在所有已见类别中区分，测试时没有任务身份可用。'},
  {name:'Domain-IL', cn:'领域增量学习',train:'标准实验按输入域分段',test:'不提供测试任务身份',change:'类别空间相同，输入分布发生变换',fixed:'不是该设定本身的保证',feedback:'类别含义保持不变，旋转或像素置换改变输入域；测试时不告知域身份。'},
  {name:'GCL', cn:'通用持续学习',train:'不向学习算法提供任务边界',test:'不提供测试任务先知',change:'类别与输入分布可平滑或突然变化',fixed:'要求固定记忆预算',feedback:'不提供任务边界或测试先知；论文仍使用监督标签和有限类别空间。'},
];
export function DerC2() {
  const [mode, setMode] = useState(1);
  const setting = settings[mode];
  const canvas = useCanvas(ctx => {
    drawCamera(ctx, 70, 95, .9);
    for(let i=0;i<6;i++) {
      const active = mode !== 0 || i < 2;
      const x=330+i*112;
      ctx.globalAlpha=active?1:.23;
      ctx.save();
      if(mode===2){ctx.translate(x+44,121);ctx.rotate(.22);ctx.translate(-x-44,-121);}
      drawPhoto(ctx,x,65,88,112,[.25+i*.08,.7-i*.07,.4],active?C.blue:C.axis);
      ctx.restore();
      if(active)roundRect(ctx,x+20,198,48,6,3,mode===0?C.green:C.blue);
    }
    ctx.globalAlpha=1;
    if(mode===3) {
      ctx.strokeStyle=C.orange; ctx.lineWidth=3; ctx.beginPath();
      for(let i=0;i<=100;i++){ const x=330+i*6.5, y=237+Math.sin(i*.12)*12; if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); }ctx.stroke();
    }
    ctx.fillStyle=C.muted;ctx.font='18px sans-serif';ctx.fillText('共享模型',65,48);ctx.fillText(mode===0?'先知限定候选':'无先知的类别判断',490,35);
  },[mode]);
  return <div className="der-widget">
    <canvas ref={canvas} className="der-canvas" aria-label={`${setting.cn}的测试候选集合示意：${mode===0?'限定任务内类别':'不依赖测试任务身份'}`} />
    <div className="der-controls">{settings.map((s,i)=><button key={s.name} aria-pressed={i===mode} onClick={()=>setMode(i)}>{s.name} · {s.cn}</button>)}</div>
    <Feedback tone={mode===3?'green':'blue'}>{setting.feedback}</Feedback>
    <div className="der-prose">
      <div className="der-table-wrap"><table><caption>当前设定的可用信息；上图六张照片仅表示候选集合，不对应论文真实类别数。</caption><tbody>
        <tr><th>设定</th><td>{setting.name}（{setting.cn}）</td></tr><tr><th>训练边界</th><td>{setting.train}</td></tr><tr><th>测试信息</th><td>{setting.test}</td></tr><tr><th>发生什么变化</th><td>{setting.change}</td></tr><tr><th>固定记忆</th><td>{setting.fixed}</td></tr>
      </tbody></table></div>
      <h3>先定义数据、模型与可用信息</h3>
      <p>将连续到来的监督样本记作 (xₙ, yₙ) ∼ Pₙ(x, y)。xₙ ∈ ℝᵈ 是输入，yₙ ∈ {'{0, …, C−1}'} 是类别标签，Pₙ 可随时间变化。θ ∈ ℝᵖ 是模型参数；hθ: ℝᵈ → ℝᶜ 输出 C 个 logits，fθ(x) = softmax(hθ(x)) 是类别概率，预测为 argmaxⱼ hθ(x)ⱼ。这里的流记号是教学统一表达，并不额外假定所有数据流独立同分布。</p>
      <p>记忆缓存 ℳ 只能保留 K 个样本条目。DER 的条目为 (x, z)，其中 z 是该输入在历史训练时刻的输出；DER++ 的条目还包含真实标签 y。算法不需要输入“任务编号”来决定何时保存旧模型。</p>
      <MathBlock title="原文式 (1)：理想历史目标，而非可直接访问的数据">
        <p>对于分段分析，记 Dₜ 为第 t 个任务的数据分布，Lₜ(θ) = 𝔼₍ₓ,ᵧ₎∼Dₜ ℓ(y, fθ(x))。理想目标是最小化 Σₜ₌₁ᵗᶜ Lₜ(θ)，其中 tᶜ 是当前任务序号，ℓ 是分类损失。</p>
        <p>这个和式表达“所有已见任务都要表现好”；训练时旧分布通常已经不可访问，因此不能真的反复对每个 Dₜ 求期望。任务编号在这里用于阐述与评估，不是 DER 必需的输入。若用全局样本流平均替代任务均匀平均，任务样本数不同会改变权重，不能无条件视为相等。</p>
      </MathBlock>
      <h3>三个常见设定与 GCL 的关系</h3>
      <p>Task-Incremental Learning（任务增量学习，Task-IL）在测试时给出任务身份，可屏蔽不属于该任务的类别；Class-Incremental Learning（类别增量学习，Class-IL）不给测试任务身份，必须联合区分已见类别。Domain-Incremental Learning（领域增量学习，Domain-IL）保持标签空间，改变输入分布，例如旋转手写数字。GCL 则强调没有训练边界、没有测试先知和固定记忆三项要求，允许平滑或突然的分布变化。</p>
      <p>GCL 的“没有测试先知”不表示训练时没有标签；本文仍属于监督学习。评估者也可以知道数据如何生成，而不把边界传给学习算法。标准基准为了比较，还向需要边界的方法提供训练边界；因此“DER 不依赖边界”与“所有实验都是无边界单遍训练”是两个不同判断。</p>
      <p>固定 K 也不自动保证所有问题上固定字节数：本文实验预先固定了输出维数 C。若类别数不断增长，每条 logits 向量也会变长，需要额外的对齐与预算机制。补充材料中任务身份与任务边界的对应讨论还依赖任务顺序出现且不重复等条件，不能推广成所有流中的逻辑等价。</p>
      <Source>原文 pp. 1–2 Table 1、p. 4 §4；补充材料 §§A.1–A.3。第 9 章继续核对实验协议。</Source>
    </div>
  </div>;
}
