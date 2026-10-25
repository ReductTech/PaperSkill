import React, { useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, inset, rrect, text } from './kit';

const W = 720;
const H = 280;
const AX = 44;
const AY = 224;
const AW = 410;
const AH = 176;
const STEPS = 6;

const loss = (i: number) => 5.5 + 1.4 * Math.exp(-i / 35);
const xOf = (i: number) => AX + (i / 100) * AW;
const yOf = (L: number) => AY - ((L - 5.4) / 1.6) * AH;

const FLOW = [
  { label: '校准样本 x', color: C.blue, step: 0 },
  { label: 'W 前向（冻结）', color: C.muted, step: 1 },
  { label: 'Q 量化激活', color: C.orange, step: 2 },
  { label: '损失 L_Q', color: C.blue, step: 3 },
  { label: '∇ 只对 R 求梯度', color: C.blue, step: 4 },
  { label: 'Cayley 更新 R', color: C.green, step: 5 },
];

// ch7-train：P2 步进——六步看完一次「Q 在回路」的优化迭代
export const Ch7Train: React.FC = () => {
  const [step, setStep] = useState(0);

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    // 损失曲线坐标轴
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(AX, AY + 4);
    ctx.lineTo(AX + AW + 12, AY + 4);
    ctx.moveTo(AX, AY + 4);
    ctx.lineTo(AX, AY - AH - 10);
    ctx.stroke();
    text(ctx, '步数 ×100', AX + AW - 6, AY + 18, C.muted, 12, 'right');
    text(ctx, 'L_Q', AX - 6, AY - AH - 2, C.muted, 12, 'right');

    // 目标带（收敛区）
    ctx.fillStyle = 'rgba(34,141,92,0.08)';
    ctx.fillRect(AX, yOf(5.6), AW, yOf(5.4) - yOf(5.6));

    // 曲线（已走部分）
    const upto = step * 20;
    ctx.strokeStyle = step >= 5 ? C.green : C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= upto; i += 2) {
      const px = xOf(i);
      const py = yOf(loss(i));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 已走过的采样点
    for (let s = 1; s <= step; s++) {
      const i = s * 20;
      ctx.fillStyle = s === 5 ? C.green : C.blue;
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(loss(i)), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 当前步端点
    if (step > 0) {
      const i = upto;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(loss(i)), 5 + Math.sin(t * 5), 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, '示意曲线', xOf(46), yOf(loss(46)) - 16, C.muted, 12);
    if (step >= 5) text(ctx, '收敛', xOf(100) - 8, yOf(loss(100)) - 16, C.green, 13, 'right');

    // 右侧数据流微图
    inset(ctx, 490, 20, 210, 240);
    text(ctx, '一次迭代的数据流', 595, 40, C.muted, 12, 'center');
    FLOW.forEach((f, i) => {
      const ny = 66 + i * 34;
      const active = step > 0 && f.step === step;
      const flash = active && f.step === 2;
      const fill = active ? (f.step === 2 ? '#fff3e8' : f.step === 5 ? '#e8f5ec' : '#eef3fa') : C.white;
      const line = flash ? C.orange : active ? f.color : C.axis;
      ctx.strokeStyle = line;
      ctx.lineWidth = flash ? 2.5 + Math.sin(t * 6) : active ? 2 : 1.2;
      ctx.beginPath();
      ctx.roundRect(504, ny - 12, 182, 24, 6);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
      text(ctx, f.label, 512, ny + 0.5, active ? f.color : C.muted, 12.5);
      if (f.step === 1) text(ctx, '🔒', 672, ny + 0.5, C.muted, 12, 'right');
      if (i < FLOW.length - 1) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(595, ny + 12);
        ctx.lineTo(595, ny + 22);
        ctx.stroke();
        ctx.fillStyle = C.axis;
        ctx.beginPath();
        ctx.moveTo(595, ny + 25);
        ctx.lineTo(592, ny + 19);
        ctx.lineTo(598, ny + 19);
        ctx.closePath();
        ctx.fill();
      }
    });
  });

  const fb =
    step === 0
    ? { text: '六步微图待命：W 冻结，只有 R 在流动', cls: '' }
    : step === 2
    ? { text: 'Q 只作用于激活——权重全程不量化（源码口径）', cls: 'warn' }
    : step === 5
    ? { text: '一步迭代完成：损失下降，R 仍正交', cls: 'good' }
    : step === 1
    ? { text: '固定 W 前向：128 条校准样本过一遍网络', cls: '' }
    : step === 3
    ? { text: '在校准集上算交叉熵损失 L_Q——目标是量化后的网络', cls: '' }
    : { text: '梯度只对 R 求：W 冻结，更新落在 Stiefel 流形上', cls: '' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" disabled={step >= 5} onClick={() => setStep((s) => Math.min(5, s + 1))}>
          下一步
        </button>
        <button className="chip" onClick={() => setStep(0)}>
          重置
        </button>
        <span className="val">步骤 {step} / 5</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <p className="sq-note">
        <b>读图方式：</b>左图为收敛示意曲线（非论文实测），每步在曲线上落一个采样点；右栏微图与步骤同步高亮。
        目标函数与「Q 在回路」来自论文 §3.2；「128 条校准样本、100 步迭代」来自附录 A.3；
        「训练只量化激活」为源码核实口径——它与最终 W4A4KV4 评测之间存在训练-量化 gap。
      </p>
    </div>
  );
};

export default Ch7Train;
