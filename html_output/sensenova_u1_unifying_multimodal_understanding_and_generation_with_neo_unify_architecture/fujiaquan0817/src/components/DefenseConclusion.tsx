import React from 'react';

const closingPoints = [
  {
    number: '01',
    title: '统一视觉接口',
    text: '去掉预训练 VE、VAE 与深解码头，让原生像素和文本端到端进入模型。',
  },
  {
    number: '02',
    title: '统一上下文建模',
    text: 'MoT 共享自注意力上下文，同时保留理解流与生成流的专属计算。',
  },
  {
    number: '03',
    title: '统一训练与服务闭环',
    text: '联合目标形成两类能力，分置引擎再按各自负载高效执行。',
  },
];

export function DefenseConclusion() {
  return (
    <section className="defense-conclusion" id="defense-conclusion" aria-labelledby="defense-conclusion-title">
      <span className="defense-conclusion-kicker">FINAL TAKEAWAY</span>
      <h2 id="defense-conclusion-title">SenseNova-U1 到底统一了什么？</h2>
      <p className="defense-conclusion-lead">
        它不是把理解与生成简单装进同一个模型，而是从视觉接口、上下文建模到训练与服务，建立一条原生像素—词的完整闭环。
      </p>

      <div className="defense-conclusion-points">
        {closingPoints.map((point) => (
          <div className="defense-conclusion-point" key={point.number}>
            <span>{point.number}</span>
            <strong>{point.title}</strong>
            <p>{point.text}</p>
          </div>
        ))}
      </div>

      <div className="defense-conclusion-line">
        <span>一句话结论</span>
        <strong>NEO-unify 的关键不是“全部共享”，而是“共享上下文、分流计算”。</strong>
      </div>
    </section>
  );
}
