import React from 'react';

export function FinalSummary() {
  return (
    <section className="final-summary" id="summary" aria-labelledby="summary-title">
      <div className="summary-kicker">学习完成</div>
      <h2 id="summary-title">从局部速度到一步生成：把八章收束成一条逻辑链</h2>
      <p className="summary-lead">
        Flow Matching 提供局部速度基础，MeanFlow 定义整段平均速度；DMF 的贡献是用有限差分把二者连接成可训练的课程。
      </p>
      <div className="summary-route" aria-label="DMF 三阶段训练路线">
        <div><b>1 · FM 起步</b><span>先学习稳定的瞬时速度目标</span></div>
        <span aria-hidden="true">→</span>
        <div><b>2 · DMF / DMF† 细化</b><span>逐步缩小有限差分间隔，中间阶段暂不计算 JVP</span></div>
        <span aria-hidden="true">→</span>
        <div><b>3 · MF 收尾</b><span>最后切换连续目标并重新启用 JVP</span></div>
      </div>
      <div className="summary-grid">
        <article><span>方法</span><h3>有限差分桥梁</h3><p>Euler 回退与同一网络的前后预测近似全导数，再整理为加权目标。</p></article>
        <article><span>课程</span><h3>FM → DMF → MF</h3><p>大 Δ 到小 Δ 逐步增强自一致性，最终连续阶段恢复 JVP。</p></article>
        <article><span>实验边界</span><h3>有竞争力，不是全胜</h3><p>CIFAR 一步结果突出；ImageNet 一步 14.53 仍不优于 50 步 SiT 11.52，且 96 epoch 发散。</p></article>
      </div>
      <div className="summary-remember">
        <strong>如果只记住一句话：</strong>
        DMF 在中间阶段省掉 JVP，但最后连续 MeanFlow 阶段仍会把 JVP 加回来。
      </div>
      <a className="summary-back" href="#chap-1">返回第一章复习 ↑</a>
    </section>
  );
}
