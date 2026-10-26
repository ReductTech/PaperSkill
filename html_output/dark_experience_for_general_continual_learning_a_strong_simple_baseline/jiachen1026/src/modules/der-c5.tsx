import React, { useState } from 'react';
import { C, useCanvas, drawPhoto, bars, softmax, mse, normCenter, Feedback, Source, MathBlock } from './der-kit';

export function DerC5() {
  const [tau, setTau] = useState(1), [shift, setShift] = useState(false);
  const z = [2, 1, 0], s = [1.8, .3, -.1].map(v => v + (shift ? 3 : 0));
  const p = softmax(z, tau), q = softmax(s, tau);
  const kl = p.reduce((sum, v, i) => sum + v * Math.log(v / q[i]), 0);
  const scaled = tau * tau * kl;
  const centeredDistance = mse(normCenter(z), normCenter(s), false) / 6;
  const raw = mse(z, s, false), mean = raw / 3;
  const ref = useCanvas((ctx, w, h) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawPhoto(ctx, 42, 52, 150, 170, softmax(z), C.green);
    drawPhoto(ctx, 217, 52, 150, 170, softmax(s), C.blue);
    bars(ctx, p, 440, 62, 240, 155, C.green, .8);
    bars(ctx, q, 725, 62, 240, 155, C.blue, .8);
    ctx.font = '18px sans-serif'; ctx.fillStyle = C.ink;
    ctx.fillText('旧概率', 442, 40); ctx.fillText('当前概率', 725, 40);
  }, [tau, shift]);
  return <div className="der-widget" data-widget="der-c5">
    <canvas ref={ref} className="der-canvas" aria-label="旧输出与当前输出的三类别概率；温度与共同平移改变数值对照" />
    <div className="der-controls">
      <label>分析温度 τ <input aria-label="分析温度 τ" type="range" min="1" max="100" step="1" value={tau} onChange={e => setTau(Number(e.target.value))} /> <output>{tau}</output></label>
      <label><input type="checkbox" checked={shift} onChange={e => setShift(e.target.checked)} />当前 logits 共同平移 +3</label>
    </div>
    <Feedback tone={tau >= 20 ? 'green' : 'blue'}>τ² KL={scaled.toFixed(6)}；中心化近似={centeredDistance.toFixed(6)}；原始平方和={raw.toFixed(4)}，均方={mean.toFixed(4)}。{shift ? '共同平移不改变 softmax，却显著改变原始 MSE。' : '升高温度，观察前两项趋近。'} 照片色阶是得分关系的教学映射。</Feedback>
    <div className="der-prose">
      <h4>① 原文公式的逻辑：希望保留无法再完整访问的旧分布</h4>
      <p>设 θ∈ℝᵖ 是参数，hθ(x)∈ℝᶜ 是 logits，fθ(x)=softmax(hθ(x))，y 是类别索引。原文式 (1) 希望最小化从第 1 个任务到当前任务 t 的总风险 Σₖ₌₁ᵗ Lₖ(θ)，其中 Lₖ=𝔼₍ₓ,ᵧ₎∼Dₖ ℓ(y,fθ(x))。问题在于旧分布 Dₖ 的完整数据不能继续保存。</p>
      <MathBlock title="式 (2) → (3)：用旧输出与有限记忆近似旧知识">Lₜ(θ)+α Σₖ&lt;ₜ 𝔼ₓ∼Dₖ KL(fθₖ*(x) ∥ fθ(x)) → Lₜ(θ)+α Σₖ&lt;ₜ 𝔼₍ₓ,𝓏₎∼Mₖ KL(softmax(z) ∥ fθ(x))。θₖ* 是解释蒸馏动机时的任务末教师，z 是缓存中的旧输出；实际 DER 沿训练轨迹保存 z，不等待任务结束，也不保留整套旧模型。</MathBlock>
      <p>Kullback–Leibler Divergence（KL 散度）比较两个概率分布。式 (4) 进一步改用一个全局水库 M：Lₜ+α𝔼₍ₓ,𝓏₎∼M KL(softmax(z)∥fθ(x))。注意，逐任务求和与流中所有样本均匀平均的<strong>混合权重不同</strong>；只有任务规模、采样权重与整体缩放匹配时才可对应，不能无条件写成严格等号。</p>
      <h4>② 交叉熵与 KL 的梯度：从定义逐项求导</h4>
      <MathBlock title="Cross-Entropy（交叉熵）">令 s=hθ(x)，pⱼ=exp(sⱼ)/Σₖ exp(sₖ)。ℓ(y,p)=−log pᵧ=−sᵧ+log Σₖ exp(sₖ)。对 sⱼ 求导：∂ℓ/∂sⱼ=−𝟙[j=y]+exp(sⱼ)/Σₖ exp(sₖ)=pⱼ−𝟙[j=y]。因此 ∇θℓ=Jᵀ(p−eᵧ)，其中 J=∂hθ/∂θ∈ℝᶜˣᵖ，eᵧ 是独热向量。</MathBlock>
      <MathBlock title="固定教师的 KL">令 p=softmax(z/τ)，q=softmax(s/τ)，τ&gt;0。KL(p∥q)=Σⱼ pⱼ(log pⱼ−log qⱼ)。教师 p 不对 θ 求导；因为 ∂log qⱼ/∂sₖ=(𝟙[j=k]−qₖ)/τ，故 ∂KL/∂sₖ=−Σⱼpⱼ(𝟙[j=k]−qₖ)/τ=(qₖ−pₖ)/τ。教师若未停止梯度，这一步就不再成立。</MathBlock>
      <h4>③ 数学精读：高温近似需要“中心化”</h4>
      <p>下面是教程补全的 Taylor Expansion（泰勒展开），用来澄清式 (5) 的动机；不是声称论文给出了无条件等价定理。保持 z、s 有界并令 τ 足够大。对任意向量 a，exp(aⱼ/τ)=1+aⱼ/τ+O(τ⁻²)，分母 Σₖ exp(aₖ/τ)=C+Cā/τ+O(τ⁻²)。利用 1/(1+u)=1−u+O(u²)，得到：</p>
      <MathBlock>softmax(a/τ)ⱼ = 1/C + (aⱼ−ā)/(Cτ) + O(τ⁻²)，其中 ā=(1/C)Σₖaₖ。记中心化矩阵 P=I−11ᵀ/C，则 Pa=a−ā1。</MathBlock>
      <p>再令 p=u+δ、q=u+ε，uⱼ=1/C，Σδⱼ=Σεⱼ=0。把 log(1+v)=v−v²/2+O(v³) 代入 (uⱼ+δⱼ)log[(uⱼ+δⱼ)/(uⱼ+εⱼ)]，二阶项为 (δⱼ²−2δⱼεⱼ+εⱼ²)/(2uⱼ)，一阶项 δⱼ−εⱼ 求和为 0。因此：</p>
      <MathBlock title="合并两个展开">KL(p∥q)=(C/2)Σⱼ(δⱼ−εⱼ)²+O(τ⁻³)=∥P(s−z)∥²/(2Cτ²)+O(τ⁻³)。所以 τ² KL → ∥P(s−z)∥²/(2C)。相应地，τ²∇ₛKL≈P(s−z)/C。</MathBlock>
      <p>只有当两组 logits 的均值相同，或显式中心化，才能去掉 P；比例因子也必须计入 α 的定义。上图固定 z=[2,1,0] 与基准 s=[1.8,0.3,−0.1]，数值由这些向量直接计算。温度是<strong>分析工具</strong>，不是这里假定 DER 训练必须使用的超参数。</p>
      <h4>④ 原文式 (5) 选择原始 logits 的平方距离</h4>
      <MathBlock title="DER 的实际目标">LDER(θ)=Lₜ(θ)+α 𝔼₍ₓ,𝓏₎∼M ∥hθ(x)−z∥²。z∈ℝᶜ 是固定历史目标，α≥0 是保留旧输出的强度。设 r=hθ(x)−z，则 ∇θ(αrᵀr)=2αJᵀr。若 α=0 就只剩当前监督损失；增大 α 会加强输出保留，也可能阻碍适应。</MathBlock>
      <p>反例最清楚：若 s=z+c1，则 softmax(s)=softmax(z)，KL=0，但原始平方距离为 Cc²。因此原始 logits MSE 还约束共同偏移，不能把它与任意温度、任意 logits 的 KL 完全画等号。这是目标函数的选择及其额外约束。</p>
      <details><summary>实现归一化：同一个 α 为什么可能不是同一个强度</summary><p>论文写的是类别维上的平方和，再对记忆样本取期望。PyTorch 的 F.mse_loss 默认对批次 Bᵣ 与类别 C 同时平均，即 (1/(BᵣC))ΣᵢΣⱼ(sᵢⱼ−zᵢⱼ)²，梯度为 2(sᵢⱼ−zᵢⱼ)/(BᵣC)。若想与“先求类别和、再求批次平均”完全对应，应令 αmean=C·αsum；否则重新选择超参数。不能只复制 α 而忽略 reduction。</p></details>
      <Source>依据：正文第 3 页式 (1)–(5)。中心化高温推导、共同平移反例与梯度展开为教程补充；实现归一化对照原始随文源码。</Source>
    </div>
  </div>;
}
