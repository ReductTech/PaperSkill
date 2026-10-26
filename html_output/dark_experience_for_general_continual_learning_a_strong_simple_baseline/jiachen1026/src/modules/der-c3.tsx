import React, { useState } from 'react';
import { C, useCanvas, drawPhoto, roundRect, softmax, ce, mse, Feedback, Source, MathBlock } from './der-kit';

export function DerC3() {
  const [swapped,setSwapped]=useState(false);
  const z=[2,1,0], s=swapped?[2,0,1]:[2,1,0];
  const oldP=softmax(z),newP=softmax(s);
  const canvas=useCanvas(ctx=>{
    const drawSide=(x:number,values:number[],color:string)=>{
      drawPhoto(ctx,x,50,160,140,values.map(v=>.22+.25*v),color);
      values.forEach((v,i)=>{
        roundRect(ctx,x+193+i*58,211-v*65,36,Math.max(3,v*65),5,color);
      });
      ctx.strokeStyle=C.axis;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+178,215);ctx.lineTo(x+365,215);ctx.stroke();
    };
    drawSide(55,z,C.green);drawSide(595,s,C.blue);
    ctx.fillStyle=C.muted;ctx.font='18px sans-serif';ctx.fillText('历史输出',55,30);ctx.fillText('后续输出',595,30);
  },[swapped]);
  return <div className="der-widget">
    <canvas ref={canvas} className="der-canvas" aria-label={`历史 logits 为2,1,0；当前 logits 为${s.join(',')}；第0类真实标签不变。`} />
    <div className="der-controls"><button onClick={()=>setSwapped(v=>!v)}>{swapped?'恢复历史输出':'模拟后续训练'}</button><output>标签 0 · 当前预测 0 · CE {ce(s,0).toFixed(4)} · logits 均方差 {mse(s,z).toFixed(4)}</output></div>
    <Feedback tone={swapped?'red':'green'}>{swapped?'标签与交叉熵没有变化，但两个非目标类别的相对关系交换了；完整输出距离能检测到这种变化。':'历史输出与当前输出一致。点击后，观察标签与完整得分向量分别保留了什么。'}</Feedback>
    <div className="der-prose">
      <div className="der-table-wrap"><table><caption>同一教学样本，真实类别 y = 0；照片色阶只是向量的视觉映射。</caption><thead><tr><th>量</th><th>历史 z</th><th>当前 hθ(x)</th></tr></thead><tbody>
        <tr><td>Logits</td><td>[2, 1, 0]</td><td>[{s.join(', ')}]</td></tr>
        <tr><td>Softmax 概率</td><td>[{oldP.map(x=>x.toFixed(3)).join(', ')}]</td><td>[{newP.map(x=>x.toFixed(3)).join(', ')}]</td></tr>
        <tr><td>真实类交叉熵</td><td>{ce(z,0).toFixed(4)}</td><td>{ce(s,0).toFixed(4)}</td></tr>
        <tr><td>与历史的平方距离</td><td>0</td><td>按类别求和 {mse(s,z,false).toFixed(3)}；按类别平均 {mse(s,z,true).toFixed(3)}</td></tr>
      </tbody></table></div>
      <h3>为什么“只记答案”可能不够</h3>
      <p>真实标签只说“这个样本是第 0 类”。旧模型的整个输出还表达第 1 类比第 2 类更相似等相对关系。Dark Knowledge（暗知识）指这类软输出中超出单个硬标签的信息。它是模型曾经学到的结构，也可能含有偏差与错误。</p>
      <MathBlock title="把这个反例完整算一遍">
        <p>Softmax 第 j 维为 pⱼ = exp(hⱼ) / Σₖ exp(hₖ)。类别 0 的 Cross-Entropy（交叉熵，CE）为 ℓ = −log p₀ = −h₀ + log Σₖ exp(hₖ)。</p>
        <p>历史 z = [2, 1, 0]，改变后 s = [2, 0, 1]。因为 exp(2) + exp(1) + exp(0) 的和不受后两项交换影响，而且 h₀ 都是 2，所以两者 CE 都等于 log(exp(2) + exp(1) + exp(0)) − 2 ≈ 0.4076。</p>
        <p>但 s − z = [0, −1, 1]，平方距离为 0² + (−1)² + 1² = 2；按 C = 3 取平均则为 2/3。DER 用整个 logits 向量匹配，可以对这种偏移施加惩罚。</p>
      </MathBlock>
      <p>这个构造只说明硬标签损失在该排列反例中无法区分两组输出；它不表示 CE 永远无法学习非目标类别的关系。DER 也仍然保存原始输入 x，以便当前模型再次前向计算，绝不是仅存 logits 就能恢复过去数据。</p>
      <p>接下来的问题是：哪些方法也在回放、蒸馏或限制梯度？DER 真正改变的是旧知识的载体与采样时刻，需要通过下一组对照来定位。</p>
      <Source>原文 pp. 2–4 §§2–3.1；向量、概率与 CE 等值反例均为教学推导。</Source>
    </div>
  </div>;
}
