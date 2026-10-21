import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, ring, arrow, drawStudent, drawDesk } from './scene';

// 第6章：新同学来了坐哪（推理路径，分步）
// 一步一停：门口 → 主干（冻结）→ 侧分支（适配器）→ 相加 → 讲台分类。

const W = 1000;
const H = 300;

const STEPS = [
  {
    name: '新同学到门口',
    detail: '输入 Q：只有新类的图像，形状 32×32×3。旧样本一个都没有。',
    shape: '32 × 32 × 3',
  },
  {
    name: '走主干',
    detail: '主干特征提取器是上一批冻结下来的，输出老特征 rⁿ⁻¹，512 维。这一段一个参数都不改。',
    shape: '512 维（冻结）',
  },
  {
    name: '走侧分支',
    detail: '每个卷积块旁边的残差适配器只做 1×1 卷积，输出 Δr，512 维。新知识只往这里写。',
    shape: 'Δr：512 维（训练）',
  },
  {
    name: '两路相加',
    detail: 'rⁿ = rⁿ⁻¹ ⊕ Δr。训练时是两条路，重参数化之后就合成一条路，输出维度不变。',
    shape: '512 维',
  },
  {
    name: '讲台分类',
    detail: '全连接层把 512 维映射到已见类别数上，取分数最高的那一类。每批 c 个类时，第 n 批的输出维度就是 cn。',
    shape: 'cn 类',
  },
];

export default function InferencePath() {
  const [step, setStep] = useState(0);

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const on = (i: number) => step >= i;
    const active = (i: number) => step === i;

    // 输入：门口的学生
    drawStudent(ctx, 74, 214, 20, step === 0 ? C.novice : C.old, { bag: true });
    if (step === 0) ring(ctx, 74, 176, 26, C.orange, t);

    // 主干
    rr(ctx, 170, 66, 350, 66, 10);
    ctx.fillStyle = step === 1 ? 'rgba(39,68,110,0.10)' : '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = step === 1 ? C.blue : C.line;
    ctx.lineWidth = step === 1 ? 2.4 : 1.4;
    ctx.stroke();
    txt(ctx, '主干', 188, 104, 14, step === 1 ? C.blue : C.muted, 'left', 700);
    // 冻结锁
    ctx.fillStyle = C.woodDark;
    rr(ctx, 480, 80, 12, 10, 2);
    ctx.fill();
    ctx.strokeStyle = C.woodDark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(486, 80, 4, Math.PI, 0);
    ctx.stroke();

    // 侧分支
    rr(ctx, 170, 176, 350, 66, 10);
    ctx.fillStyle = step === 2 ? 'rgba(34,141,92,0.10)' : '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = step === 2 ? C.green : C.line;
    ctx.lineWidth = step === 2 ? 2.4 : 1.4;
    ctx.stroke();
    txt(ctx, '侧分支', 188, 214, 14, step === 2 ? C.green : C.muted, 'left', 700);

    // 融合节点
    const mgX = 570;
    const mgY = 154;
    dot(ctx, mgX, mgY, 17, step >= 3 ? 'rgba(39,68,110,0.12)' : '#f1ece2');
    ctx.save();
    ctx.strokeStyle = step >= 3 ? C.blue : C.line;
    ctx.lineWidth = step >= 3 ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.arc(mgX, mgY, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mgX - 7, mgY);
    ctx.lineTo(mgX + 7, mgY);
    ctx.moveTo(mgX, mgY - 7);
    ctx.lineTo(mgX, mgY + 7);
    ctx.stroke();
    ctx.restore();
    if (step === 3) ring(ctx, mgX, mgY, 24, C.orange, t);

    // 路径连线
    const link = (i: number) => (on(i) ? C.blue : C.line);
    arrow(ctx, 108, 190, 166, 104, link(1), step === 1 ? 2.4 : 1.4);
    arrow(ctx, 108, 196, 166, 208, link(2), step === 2 ? 2.4 : 1.4);
    arrow(ctx, 522, 100, mgX - 20, mgY - 8, link(3), step === 3 ? 2.4 : 1.4);
    arrow(ctx, 522, 210, mgX - 20, mgY + 8, link(3), step === 3 ? 2.4 : 1.4);
    arrow(ctx, mgX + 20, mgY, 686, mgY, link(4), step === 4 ? 2.4 : 1.4);

    // 讲台分类器
    rr(ctx, 690, 116, 120, 76, 10);
    ctx.fillStyle = step === 4 ? 'rgba(39,68,110,0.10)' : '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = step === 4 ? C.blue : C.line;
    ctx.lineWidth = step === 4 ? 2.4 : 1.4;
    ctx.stroke();
    drawDesk(ctx, 706, 132, 88, 20, C.deskTop);
    drawStudent(ctx, 750, 168, 12, C.old, { mood: 0 });

    // 输出
    const outX = 860;
    rr(ctx, outX, 116, 110, 76, 10);
    ctx.fillStyle = step === 4 ? 'rgba(34,141,92,0.12)' : '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = step === 4 ? C.green : C.line;
    ctx.lineWidth = step === 4 ? 2.2 : 1.4;
    ctx.stroke();
    const conf = 0.87;
    if (step === 4) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      txt(ctx, conf.toFixed(2), outX + 55, 160, 20, C.green, 'center', 700);
      ctx.restore();
      ring(ctx, outX + 55, 152, 32, C.green, t);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.35;
      txt(ctx, '—', outX + 55, 160, 20, C.muted, 'center', 700);
      ctx.restore();
    }
    arrow(ctx, 814, mgY, outX - 4, mgY, on(4) ? C.blue : C.line, step === 4 ? 2.4 : 1.4);
  });

  const s = STEPS[step];
  return (
    <div>
      <canvas ref={ref} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 5 步 · {s.name}
        </span>
        <button
          className="tiny"
          onClick={() => setStep((v) => Math.min(4, v + 1))}
          disabled={step === 4}
        >
          {step === 4 ? '已到讲台' : '下一步 →'}
        </button>
        <button className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前阶段</div>
          <div className="v" style={{ fontSize: 15 }}>{s.name}</div>
        </div>
        <div className="metric">
          <div className="l">张量 / 特征</div>
          <div className="v" style={{ fontSize: 15 }}>{s.shape}</div>
        </div>
        <div className="metric">
          <div className="l">参数是否更新</div>
          <div className="v" style={{ fontSize: 15, color: step === 2 ? C.green : C.muted }}>
            {step === 2 ? '只更新侧分支' : step === 1 ? '冻结' : '—'}
          </div>
        </div>
      </div>
      <div className={`feedback ${step === 4 ? 'good' : ''}`}>{s.detail}</div>
    </div>
  );
}
