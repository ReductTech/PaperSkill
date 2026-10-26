import React, { useState } from 'react';
import { C, useCanvas, drawCamera, drawPhoto, roundRect, Feedback, Source, MathBlock } from './der-kit';

export function DerC1() {
  const [weight, setWeight] = useState(1);
  const oldLoss = (weight - 1) ** 2 / 2;
  const newLoss = (weight + 1) ** 2 / 2;
  const position = (1 - weight) / 2;
  const canvas = useCanvas((ctx) => {
    drawPhoto(ctx, 65, 42, 170, 124, [.25, .68, .42], C.green);
    drawPhoto(ctx, 845, 42, 170, 124, [.68, .28, .55], C.blue);
    ctx.strokeStyle = C.axis; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(220, 188); ctx.lineTo(860, 188); ctx.stroke();
    const x = 230 + position * 620;
    drawCamera(ctx, 445, 45, .72);
    roundRect(ctx, x - 39, 145, 78, 61, 10, C.bg, C.orange);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(x - 22, 161); ctx.lineTo(x - 22, 155); ctx.lineTo(x - 15, 155);
    ctx.moveTo(x + 22, 183); ctx.lineTo(x + 22, 192); ctx.lineTo(x + 15, 192); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = '18px sans-serif';
    ctx.fillText('旧场景', 115, 29); ctx.fillText('新场景', 890, 29);
    roundRect(ctx, 65, 237, 450, 12, 6, C.axis);
    roundRect(ctx, 65, 237, Math.max(1, oldLoss / 2 * 450), 12, 6, C.red);
    roundRect(ctx, 565, 237, 450, 12, 6, C.axis);
    roundRect(ctx, 565, 237, Math.max(1, newLoss / 2 * 450), 12, 6, C.blue);
  }, [weight]);
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 1080;
    const u = Math.max(0, Math.min(1, (x - 230) / 620));
    setWeight(1 - 2 * u);
  }
  const change = (delta: number) => setWeight(w => Math.max(-1, Math.min(1, w + delta)));
  return <div className="der-widget">
    <canvas ref={canvas} className="der-canvas" role="slider" tabIndex={0}
      aria-label="左右拖动橙色取景框，观察新旧场景损失；左右方向键也可操作"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number((position * 100).toFixed(1))}
      aria-valuetext={`取景位置 ${(position * 100).toFixed(0)}%；参数 ${weight.toFixed(2)}；旧损失 ${oldLoss.toFixed(3)}，新损失 ${newLoss.toFixed(3)}`}
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(event); }}
      onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event); }}
      onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); change(event.key === 'ArrowLeft' ? .1 : -.1); } }} />
    <div className="der-controls"><button onClick={() => change(.2)}>移向旧场景</button><button onClick={() => change(-.2)}>移向新场景</button><button onClick={() => setWeight(1)}>重置</button><output>θ = {weight.toFixed(2)} · 旧损失 {oldLoss.toFixed(3)} · 新损失 {newLoss.toFixed(3)}</output></div>
    <Feedback tone={weight < -.5 ? 'red' : 'blue'}>{weight > .8 ? '旧场景已学会，新的场景仍待学习。向右拖动取景框，尝试只拟合新场景。' : weight < -.8 ? '新损失接近零，旧损失却升高：这是玩具优化问题中的遗忘。' : '两个损失随同一参数一起变化。拟合新经验，会改变旧经验依赖的参数。'}</Feedback>
    <div className="der-prose">
      <h3>从标题、摘要到研究动机</h3>
      <p><em>Dark Experience for General Continual Learning: a Strong, Simple Baseline</em> 由 Pietro Buzzega、Matteo Boschini、Angelo Porrello、Davide Abati、Simone Calderara 提出，发表于 NeurIPS 2020。论文关注 Continual Learning（持续学习）：模型面对持续到来的数据，学习新内容时仍需保留旧能力。</p>
      <p>只在新数据上更新模型，可能发生 Catastrophic Forgetting（灾难性遗忘）。现实数据还可能缓慢或突然变化，系统却得不到“上一任务结束了”的提示，也不能无限保存历史数据。作者因此强调 General Continual Learning（通用持续学习，GCL）的资源与信息约束。</p>
      <p>摘要的主线是：将 Experience Replay（经验回放）、Knowledge Distillation（知识蒸馏）和输出正则化结合。保存少量旧输入，以及模型当时产生的 Logits（未归一化类别得分），在后续训练中对齐旧输出。这就是 Dark Experience Replay（暗经验回放，DER）；DER++ 再加入旧样本真实标签的监督回放。</p>
      <MathBlock title="上方交互的数学含义：教学示例">
        <p>令标量参数 θ ∈ [−1, 1]，旧损失 L旧(θ) = (θ − 1)² / 2，新损失 L新(θ) = (θ + 1)² / 2。旧任务最优点为 θ = 1，新任务最优点为 θ = −1，两者共享同一个 θ。</p>
        <p>对新损失求导：∂L新/∂θ = θ + 1。无约束梯度下降 θ下一步 = θ − η(θ + 1) 满足误差关系 θ下一步 + 1 = (1 − η)(θ + 1)。因此，收敛到 −1 需要 |1 − η| &lt; 1，即 0 &lt; η &lt; 2；较大的正学习率可能过冲或发散。收敛后代回旧损失，L旧 从 0 增至 2。上方交互直接移动有界的 θ，并没有运行这段梯度下降；它展示共享权重造成的竞争，不是论文训练曲线，也没有实现 DER。</p>
      </MathBlock>
      <h3>四遍阅读，各自要能回答什么</h3>
      <div className="der-table-wrap"><table><thead><tr><th>阅读阶段</th><th>本教程位置</th><th>学习产出</th></tr></thead><tbody>
        <tr><td>第一遍：整体理解</td><td>第 1–3 章</td><td>解释问题、GCL 设定及 DER 与 ER、GEM 的差异。</td></tr>
        <tr><td>第二遍：数学精读</td><td>第 4–6、8 章</td><td>推导水库采样、KL 近似与损失梯度，指出推导条件。</td></tr>
        <tr><td>第三遍：算法实现</td><td>第 7、9 章</td><td>按更新前输出、旧缓存采样、优化、入库的顺序实现核心步骤。</td></tr>
        <tr><td>第四遍：研究视角</td><td>第 9–10 章</td><td>审视实验协议、反例与资源开销，提出能证伪的改进假设。</td></tr>
      </tbody></table></div>
      <p>论文逻辑映射：标题／摘要／引言在第 1 章，问题定义在第 2 章，相关工作在第 3 章，方法在第 4–7 章，数学与理论边界在第 5、8 章，实验和结论在第 9–10 章。作者没有提出“永不遗忘”的一般定理；教学推导会明确标注。</p>
      <Source>原文 pp. 1–2：Abstract、Introduction 与 Table 1。上方二次函数为教学构造。</Source>
    </div>
  </div>;
}
