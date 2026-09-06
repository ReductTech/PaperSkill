import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STEPS = [
  { key:'arch', no:'01', title:'统一架构', action:'建立共同接口', training:'MLLM + VAE + MMDiT', evidence:'同一系统承载理解、生成与编辑', color:'#9933ff' },
  { key:'understand', no:'02', title:'看懂空间', action:'从图像语义走向几何关系', training:'OpenSpatial + 通用数据 + KL 保持', evidence:'空间九项平均 64.4，较 Base +5.3', color:'#33ccff' },
  { key:'generate', no:'03', title:'生成空间', action:'将语义与空间条件落实为图像', training:'多粒度/OCR/多视角数据 + 四阶段训练', evidence:'LongText 双语 0.963；Composition 94.2', color:'#ffcc00' },
  { key:'edit', no:'04', title:'操纵空间', action:'按指令改变物体或相机', training:'Static-Camera + Dynamic-Camera 两分支', evidence:'Object 0.649；Camera Error 0.429', color:'#ff3366' },
  { key:'twnv', no:'05', title:'用新视角思考', action:'主动生成缺失的观察证据', training:'Planner → Synthesizer → Reasoner', evidence:'Figure 14 消歧；Figure 15 改善 3D 重建', color:'#69c58a' }
] as const;

export const SecSummaryLoop: React.FC<WidgetProps> = () => {
  const [active,setActive] = useState(0);
  const item = STEPS[active];
  return <div className="summary-loop">
    <div className="summary-loop-route">
      {STEPS.map((step,index) => <React.Fragment key={step.key}>
        <button className={active === index ? 'active' : ''} style={{'--summary-color':step.color} as React.CSSProperties} onClick={() => setActive(index)}><b>{step.no}</b><span>{step.title}</span></button>
        {index < STEPS.length - 1 ? <i>→</i> : null}
      </React.Fragment>)}
    </div>
    <div className="summary-detail" style={{'--summary-color':item.color} as React.CSSProperties}>
      <div className="summary-detail-title"><b>{item.no}</b><div><span>{item.title}</span><strong>{item.action}</strong></div></div>
      <div className="summary-detail-grid">
        <article><b>HOW · 如何获得</b><p>{item.training}</p></article>
        <article><b>EVIDENCE · 如何证明</b><p>{item.evidence}</p></article>
      </div>
    </div>
    <div className="summary-closure">
      <div><b>MLLM Planner</b><span>规划可暴露关键证据的相机运动</span></div><i>→</i>
      <div><b>JoyAI-Image-Edit</b><span>执行相机运动并合成新视角</span></div><i>→</i>
      <div><b>Reasoner</b><span>联合原图与新视角重新判断</span></div>
      <strong>这是推理期组合，不是参数反馈训练</strong>
    </div>
    <div className="feedback good">JoyAI-Image 在同一框架中覆盖理解、生成与编辑；TwNV 进一步把 Planner、空间编辑器和 Reasoner 串成一次主动求证过程。</div>
  </div>;
};

export default SecSummaryLoop;
