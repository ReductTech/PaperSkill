import React, { useState } from 'react';
import { C, useCanvas, drawCamera, drawPhoto, roundRect, arrow, Feedback, Source, MathBlock } from './der-kit';

type Protocol = 'stream' | 'standard' | 'single';
export function DerC9() {
  const [protocol, setProtocol] = useState<Protocol>('stream');
  const [step, setStep] = useState(0);
  const [classes, setClasses] = useState(10);
  const pair = step % 9, round = Math.floor(step / 9) + 1;
  const extraBytes = 4 * 500 * classes;
  const ref = useCanvas(ctx => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
    drawCamera(ctx, 150, 155, .9);
    if (protocol === 'stream') {
      ctx.save(); ctx.translate(700, 135); ctx.rotate(step * Math.PI * 2 / 27);
      ctx.beginPath(); ctx.ellipse(0, 0, 112, 92, 0, 0, Math.PI * 2); ctx.fillStyle = C.env; ctx.fill();
      ctx.font = 'bold 70px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.blue;
      ctx.fillText(String(pair), -48, 0); ctx.fillText(String((pair + 1) % 9), 48, 0); ctx.restore();
      for (let i = 0; i < 27; i++) roundRect(ctx, 270 + 27 * i, 246, 20, 12, 3, i === step ? C.orange : C.env);
    } else {
      for (let i = 0; i < 5; i++) {
        const x = 315 + i * 140;
        drawPhoto(ctx, x, 85, 110, 130, [.2 + i * .12, .65, .4], protocol === 'single' ? C.purple : C.blue);
        if (i < 4) arrow(ctx, x + 112, 150, x + 135, 150);
        const ticks = protocol === 'single' ? 1 : 5;
        for (let j = 0; j < ticks; j++) roundRect(ctx, x + 4 + j * 18, 229, 12, 8, 2, protocol === 'single' ? C.purple : C.blue);
      }
    }
  }, [protocol, step]);
  return <div className="der-widget">
    <canvas ref={ref} className="der-canvas" aria-label="MNIST-360 类别旋转与标准任务训练轮数对照示意" />
    <div className="der-controls">
      <button type="button" aria-pressed={protocol === 'stream'} onClick={() => setProtocol('stream')}>MNIST-360</button>
      <button type="button" aria-pressed={protocol === 'standard'} onClick={() => setProtocol('standard')}>标准多轮</button>
      <button type="button" aria-pressed={protocol === 'single'} onClick={() => setProtocol('single')}>单轮消融</button>
      <button type="button" disabled={protocol !== 'stream' || step === 26} onClick={() => setStep(s => Math.min(26, s + 1))}>推进类别组合</button>
      <button type="button" onClick={() => setStep(0)}>重置序列</button>
      <button type="button" onClick={() => setClasses(c => c === 10 ? 200 : 10)}>内存核算：C={classes}</button>
    </div>
    <Feedback tone={protocol === 'stream' ? 'green' : 'blue'}>{protocol === 'stream'
      ? `第 ${round}/3 轮，类别组合 (${pair},${(pair + 1) % 9})。旋转示意随序列改变；实际算法收到的是样本，没有组合切换通知。`
      : protocol === 'standard' ? '标准 CIFAR-10 每任务 50 轮、Tiny ImageNet 每任务 100 轮；这些结果不能当作严格单遍证据。' : '单轮消融把每任务训练轮数降为 1；应同时检查欠拟合与遗忘。'}</Feedback>
    <div className="der-prose">
      <p>图中相机面对变化的拍摄对象，映射学习器面对数据分布变化。MNIST-360 的 27 个刻度表示类别组合的三轮访问；图中旋转角仅为教学示意，不复刻逐样本角度计数。标准图像基准的短线表示“多次更新”，不是实际轮数比例。右侧内存核算固定 K=500：float32 logits 需要 4KC={extraBytes.toLocaleString()} 字节，即 {(extraBytes / 1e6).toFixed(2)} MB（十进制）。</p>
      <h4>数据集为什么这样选？</h4>
      <div className="der-table-wrap"><table><thead><tr><th>数据与来源</th><th>特点</th><th>标准协议与检验对象</th></tr></thead><tbody>
        <tr><td>MNIST 手写数字</td><td>28×28 灰度，输入 784 维，10 类</td><td>Permuted MNIST（像素置换）与 Rotated MNIST（图像旋转）各 20 个任务，每任务 1 轮；同一标签空间下检验域变化。</td></tr>
        <tr><td>CIFAR-10 小型自然图像</td><td>32×32 RGB，10 类</td><td>Sequential CIFAR-10 分为 5 个任务，每次 2 类、50 轮；检验类别增量。</td></tr>
        <tr><td>Tiny ImageNet 图像子集</td><td>64×64 RGB，200 类</td><td>10 个任务，每次 20 类、100 轮；扩大类别竞争和表征学习难度。</td></tr>
      </tbody></table></div>
      <p>MNIST 变体使用两个隐藏层、每层 100 个 ReLU 单元的 Multilayer Perceptron（多层感知机，MLP）；CIFAR-10 与 Tiny ImageNet 使用未预训练的 ResNet-18（18 层残差网络）。旋转 MNIST 标准协议为各任务抽取 [0,π) 的旋转角；MNIST-360 则在整个流中逐渐覆盖一整圈，两者不能混为一谈。</p>
      <h4>MNIST-360 的准确构造与 Fig. 1</h4>
      <p>MNIST-360 使用 0–8，去掉数字 9，以避免旋转后 6/9 难以区分。类别组合依次为 (0,1)、(1,2)、…、(7,8)、(8,0)，共 9 种，重复访问 3 轮，形成 27 个供实验组织使用的“伪任务”；这些边界不通知学习器。每张原始训练图像在整个过程中只出现一次，不是把同一批图片重复三次。</p>
      <p>每类样本按该类已展示数量逐渐旋转，整条训练流覆盖 2π，并设置类别专属的初始相位。类别组合变化产生突然变化，组合内部的旋转产生平滑变化。批次构造按剩余样本数量保持比例；补充材料默认批量大小为 16，具体方法和预算的调参结果也可能选用其他大小。测试在训练结束后进行：测试数字也逐渐旋转，但不加训练中的类别相位偏移。</p>
      <p>正文 Fig. 1 展示按时间排列的示例批次，没有准确率纵轴。阅读时应沿批次顺序观察“哪些数字出现”和“它们怎样旋转”。它证明协议确实同时包含平滑与突然分布变化，不能单凭该图判断算法优劣。这里仍是合成旋转分布，并不等价于真实传感器漂移。</p>
      <h4>公平比较要控制哪些因素？</h4>
      <p>论文使用 Stochastic Gradient Descent（随机梯度下降，SGD），从训练集留出 10% 验证调参，图像基准对当前样本与回放样本均使用随机裁剪和水平翻转。Class-IL 与 Task-IL 结合两个设定的最终准确率选择配置；Domain-IL 用最终平均准确率选择。标准结果跨 10 个不同初始化运行，类别顺序固定。固定顺序不能检验对任务排列的鲁棒性。</p>
      <p>标准实验会把任务边界提供给需要它们的比较方法；Task-IL 还在测试时提供任务身份。这让比较覆盖更广，但不能把所有标准实验都称为无边界 GCL。MNIST-360 采用可在该流中工作的比较实现，包括把缓存替换为水库采样的 A-GEM-R。</p>
      <div className="der-table-wrap"><table><thead><tr><th>基线</th><th>比较目的</th><th>解释边界</th></tr></thead><tbody>
        <tr><td>SGD / JOINT</td><td>无抗遗忘机制的顺序训练 / 能访问全部任务的离线联合训练</td><td>上下参照，JOINT 不是任意优化条件下的数学最优保证。</td></tr>
        <tr><td>ER / FDR</td><td>隔离真实标签回放 / 论文所比较实现中的任务末输出正则</td><td>缓存策略、目标保存时刻和训练预算都影响结果。</td></tr>
        <tr><td>GEM / A-GEM / GSS / MER</td><td>梯度约束、样本选择或元学习回放，与简单 logits 回放比较</td><td>时间和可运行协议不同，缺失项不是得分为零。</td></tr>
        <tr><td>oEWC / SI / LwF / iCaRL / PNN</td><td>参数正则、蒸馏、样本记忆、结构增长等不同机制</td><td>固定开销、任务信息与内存字节数不同，不能只看缓存个数。</td></tr>
      </tbody></table></div>
      <h4>评价指标的公式、符号与使用条件</h4>
      <p>令 T 为用于评价的任务数，R<sub>i,j</sub> 为训练完任务 i 后在任务 j 测试集上的准确率，b<sub>j</sub> 为随机初始化网络在任务 j 上的准确率。以下矩阵指标用于任务划分明确的标准实验；不能未经说明直接套到无边界 MNIST-360 流。</p>
      <MathBlock title="从任务准确率矩阵得到最终性能与迁移">
        <p>ACC=(1/T)Σ<sub>j=1</sub><sup>T</sup>R<sub>T,j</sub>。先逐任务测试，再等权平均；这是最终平均准确率，不是按任务测试样本量加权的总正确率。</p>
        <p>BWT=(1/(T−1))Σ<sub>j=1</sub><sup>T−1</sup>(R<sub>T,j</sub>−R<sub>j,j</sub>)。把最终表现减去当时刚学完的表现，衡量 Backward Transfer（后向迁移）；正值表示后续训练反而帮助旧任务。</p>
        <p>FRG=(1/(T−1))Σ<sub>j=1</sub><sup>T−1</sup>(max<sub>i∈{'{j,…,T−1}'}</sub>R<sub>i,j</sub>−R<sub>T,j</sub>)。这里明确采用末次训练前的历史最好表现作参照，衡量 Forgetting（遗忘）；越低越好。</p>
        <p>FWT=(1/(T−1))Σ<sub>j=2</sub><sup>T</sup>(R<sub>j−1,j</sub>−b<sub>j</sub>)。在尚未学习任务 j 时测试，与初始网络比较，衡量 Forward Transfer（前向迁移）。</p>
      </MathBlock>
      <p>这些式子都是“先对每个可比任务作差，再平均”。准确率若用百分数表示，差值单位就是百分点。BWT 的参照是刚学完时的值，不一定是历史最好值；初期没有学好也可能使 BWT 看起来很好。在上述 FRG 约定下，若末次表现超过先前最好值，差值也可以为负，不能偷偷截断再混用数值。类别互斥设定与域变化设定下，FWT 的可解释性不同。本文主结果强调 ACC，完整迁移数值表见补充材料 Tables 6–8，本教程用明确记号解释指标，不逐项抄录全部迁移表。</p>
      <h4>同样 K，为什么内存仍可能不同？</h4>
      <p>把每个输入所需字节记为 B<sub>x</sub>。只算缓存，DER 为 K(B<sub>x</sub>+4C)，DER++ 若标签为 int64 则为 K(B<sub>x</sub>+4C+8)；普通 ER 若只存输入和同样标签，则为 K(B<sub>x</sub>+8)。还须另计模型、优化器和临时梯度内存。4C 来自每个 float32 4 字节、共 C 个 logits；输入存储格式不同会改变 B<sub>x</sub>。</p>
      <p>补充材料 Fig. 3 把准确率与总内存占用一起比较，提醒读者非回放方法也有固定开销。固定 K 不自动意味着所有方法字节相同；固定 K 且固定 C 才能维持这里的固定缓存开销。类别空间扩张时，旧 logits 的维度对齐也需要额外设计。</p>
      <Source>正文 §4、Tables 2–3、Fig. 1；补充材料 §§B、C、F.3、F.4。</Source>
    </div>
  </div>;
}
