import React, { useState } from 'react';
import { C, useCanvas, roundRect, arrow, Feedback, Source, MathBlock } from './der-kit';

type Metric = 'noise' | 'fisher' | 'ece';
const metrics: { id: Metric; name: string }[] = [{ id: 'noise', name: '扰动损失' }, { id: 'fisher', name: '经验 Fisher' }, { id: 'ece', name: '置信校准' }];

export function DerC8() {
  const [metric, setMetric] = useState<Metric>('fisher');
  const [label, setLabel] = useState(0);
  const [confidence, setConfidence] = useState(.9);
  const empirical = (.9 - label) ** 2;
  const hessian = .9 * .1;
  const ece = Math.abs(.6 - confidence);
  const ref = useCanvas((ctx) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
    metrics.forEach((m, i) => {
      const x = 200 + 340 * i;
      ctx.beginPath(); ctx.arc(x, 38, 23, 0, Math.PI * 2);
      ctx.fillStyle = m.id === metric ? C.orange : C.env; ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
      if (i < 2) arrow(ctx, x + 38, 38, x + 300, 38, C.axis);
    });
    if (metric === 'fisher') {
      roundRect(ctx, 140, 100, 800, 46, 8, C.axis);
      roundRect(ctx, 140, 100, 800 * empirical, 46, 8, C.blue);
      roundRect(ctx, 140, 185, 800, 46, 8, C.axis);
      roundRect(ctx, 140, 185, 800 * hessian, 46, 8, C.purple);
    } else if (metric === 'ece') {
      arrow(ctx, 280, 248, 920, 248); arrow(ctx, 280, 248, 280, 85);
      ctx.beginPath(); ctx.moveTo(280, 248); ctx.lineTo(920, 85); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.stroke();
      const x = 280 + confidence * 640, y = 248 - .6 * 163;
      ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, 248 - confidence * 163); ctx.strokeStyle = ece > .01 ? C.red : C.green; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.fillStyle = C.blue; ctx.fill();
    } else {
      arrow(ctx, 180, 247, 940, 247); arrow(ctx, 560, 247, 560, 86);
      [1, 5].forEach((curvature, i) => {
        ctx.beginPath();
        for (let j = 0; j <= 100; j++) {
          const delta = (j - 50) / 50, x = 560 + delta * 340, y = 245 - .5 * curvature * delta ** 2 * 54;
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i === 0 ? C.green : C.red; ctx.lineWidth = 3; ctx.stroke();
      });
    }
  }, [metric, label, confidence]);
  const feedback = metric === 'fisher'
    ? `同一个模型 p=0.9、x=1，观测标签 y=${label}：经验 Fisher=${empirical.toFixed(2)}，Hessian=${hessian.toFixed(2)}。二者一般不相等。`
    : metric === 'ece' ? `10 次预测仍有 6 次正确；平均置信度 ${confidence.toFixed(1)}，ECE=${ece.toFixed(1)}。校准改善并不等于准确率提高。`
    : '教学二次函数在同一参数扰动下，曲率 5 的损失升高更多；这说明测量思路，不是论文曲线的数字复刻。';
  return <div className="der-widget">
    <canvas ref={ref} className="der-canvas" aria-label="三个可点击指标节点与对应数学示意图" onClick={e => {
      const box = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width * 1080, y = (e.clientY - box.top) / box.height * 280;
      if (y < 76) { const index = Math.round((x - 200) / 340); if (index >= 0 && index < 3 && Math.abs(x - (200 + 340 * index)) < 90) setMetric(metrics[index].id); }
    }} />
    <div className="der-controls" role="group" aria-label="选择图中的指标节点">
      {metrics.map(m => <button key={m.id} type="button" aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>{m.name}</button>)}
      {metric === 'fisher' && <><button type="button" aria-pressed={label === 0} onClick={() => setLabel(0)}>观测标签 y=0</button><button type="button" aria-pressed={label === 1} onClick={() => setLabel(1)}>观测标签 y=1</button></>}
      {metric === 'ece' && <><button type="button" aria-pressed={confidence === .9} onClick={() => setConfidence(.9)}>置信度 0.9</button><button type="button" aria-pressed={confidence === .6} onClick={() => setConfidence(.6)}>置信度 0.6</button></>}
    </div>
    <Feedback tone={metric === 'fisher' ? 'purple' : metric === 'ece' && ece === 0 ? 'green' : 'blue'}>{feedback}</Feedback>
    <div className="der-prose">
      <p>点选上方三个圆形节点，或使用同名按钮。经验 Fisher 图中，上条是观测样本的梯度平方，下条是 Hessian，条长以 1 为上限；校准图横轴为置信度、纵轴为正确率，绿线是二者相等；扰动图横轴为参数偏移 δ，纵轴为损失增量。所有图形均为可计算的教学例，论文实测结论留到第十章。</p>
      <h4>功能空间约束为何会限制参数移动？</h4>
      <p>Function-space Regularization（功能空间正则化）直接约束输出。固定一个旧输入 x，令 J=∂h<sub>θ</sub>(x)/∂θ∈ℝ<sup>C×p</sup>，δ∈ℝ<sup>p</sup> 是小参数位移。对可微输出作一阶 Taylor Expansion（泰勒展开）：</p>
      <MathBlock title="局部推导：这里是教程解释，不是论文的全局定理">
        <p>h<sub>θ+δ</sub>(x)=h<sub>θ</sub>(x)+Jδ+O(‖δ‖²)。</p>
        <p>若当前旧输出已匹配目标，即 h<sub>θ</sub>(x)=z，则 ‖h<sub>θ+δ</sub>(x)−z‖²=‖Jδ‖²+O(‖δ‖³)=δᵀJᵀJδ+O(‖δ‖³)。</p>
        <p>因为 δᵀJᵀJδ=‖Jδ‖²≥0，JᵀJ 是半正定矩阵。输出敏感的参数方向会受到更强的局部惩罚。</p>
      </MathBlock>
      <p>这不等于直接把全部权重固定住。若 Jδ≈0，参数仍可沿不明显改变旧输出的方向移动。若原来存在残差 r=h<sub>θ</sub>(x)−z，展开还含有 2rᵀJδ 等项，不能直接套用“零残差二次型”。有限缓存也不能代表全部旧数据，更不能由这个局部展开推出全局无遗忘保证。</p>
      <h4>经验 Fisher 的迹怎样计算？</h4>
      <p>令单样本损失为 ℓ<sub>i</sub>(θ)，g<sub>i</sub>=∇<sub>θ</sub>ℓ<sub>i</sub>∈ℝ<sup>p</sup>。Empirical Fisher Information Matrix（经验费舍尔信息矩阵）为 F̂=(1/N)Σ<sub>i</sub>g<sub>i</sub>g<sub>i</sub>ᵀ。它使用每个样本的梯度，不能先平均梯度再取外积。</p>
      <MathBlock title="从矩阵定义到一个标量">
        <p>Tr(F̂)=(1/N)Σ<sub>i</sub>Tr(g<sub>i</sub>g<sub>i</sub>ᵀ)，因为迹对矩阵求和与常数乘法线性。</p>
        <p>Tr(g<sub>i</sub>g<sub>i</sub>ᵀ)=Σ<sub>k=1</sub><sup>p</sup>g<sub>ik</sub>²=‖g<sub>i</sub>‖²，因此 Tr(F̂)=(1/N)Σ<sub>i</sub>‖g<sub>i</sub>‖²。</p>
      </MathBlock>
      <p>无需存储 p×p 矩阵就能累计迹。但它不是一般意义上 Hessian Matrix（海森矩阵）的精确替身。以单参数 Bernoulli（伯努利）分类器 p=σ(wx) 为例，ℓ=−y log p−(1−y)log(1−p)。利用 dp/dw=p(1−p)x，链式法则得到 dℓ/dw=(p−y)x，继续求导得到 d²ℓ/dw²=p(1−p)x²。令 x=1、p=0.9、y=0，经验梯度平方为 0.81，而 Hessian 为 0.09；改成 y=1，前者为 0.01，后者仍为 0.09。</p>
      <p>若再对模型自身的 y∼Bernoulli(p) 求期望，E[(p−y)²]=p(1−p)²+(1−p)p²=p(1−p)，才在这个模型下恢复相等。这个期望条件不等于有限观测数据天然满足。因此“迹较低”是论文选用的诊断依据，不能自动升级为严格的曲率或泛化定理。</p>
      <h4>校准误差如何得到？</h4>
      <p>Expected Calibration Error（期望校准误差，ECE）先把预测按最大类别概率 q<sub>i</sub>=max<sub>c</sub>f<sub>θ,c</sub>(x<sub>i</sub>) 分入置信区间 B<sub>b</sub>。区间内 acc(B<sub>b</sub>) 是预测正确的比例，conf(B<sub>b</sub>) 是 q 的均值。</p>
      <MathBlock title="先求区间偏差，再按样本占比加权">
        <p>acc(B<sub>b</sub>)=Σ<sub>i∈Bᵦ</sub>1[argmax f<sub>θ</sub>(x<sub>i</sub>)=y<sub>i</sub>]/|B<sub>b</sub>|；conf(B<sub>b</sub>)=Σ<sub>i∈Bᵦ</sub>q<sub>i</sub>/|B<sub>b</sub>|。</p>
        <p>ECE=Σ<sub>b:|Bᵦ|&gt;0</sub>(|B<sub>b</sub>|/N)·|acc(B<sub>b</sub>)−conf(B<sub>b</sub>)|。</p>
      </MathBlock>
      <p>单区间例中，10 次预测有 6 次正确，平均置信度 0.9，故 ECE=1×|0.6−0.9|=0.3；若只把平均置信度降到 0.6，ECE 变为 0，正确率仍是 60%。ECE 依赖分箱方案，不能替代准确率，也不能单独证明部署可靠性。</p>
      <p>本教程区分三类证据：水库采样的概率证明、带条件的局部／高温展开，以及论文的经验模型分析。论文没有给出“DER 在任意数据流上都不会遗忘”的定理。</p>
      <Source>正文第 7–9 页，§5 与 Fig. 2；以上局部展开、反例和指标逐步推导为教学补充。</Source>
    </div>
  </div>;
}
