import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clamp, clearScene, inset, lcg, text } from './kit';

const W = 720;
const H = 260;
const AX_Y = 150;
const X0 = 44;
const X1 = 470;

const rand = lcg(20260516);
const DOTS = Array.from({ length: 100 }, () => ({ u: rand(), j: rand() }));
const S_LO = 40.5;
const S_HI = 53.5;
const H_LO = 53;
const H_HI = 59;
const OPT = 61.5;

const sx = (score: number) => X0 + ((score - 34) / (70 - 34)) * (X1 - X0);

const STEP_TITLES = [
  '第 0 步：空白数轴（34–70 分）',
  '第 1 步：随机 FP 旋转开始抽签',
  '第 2 步：100 次铺满——最差 40.5，最好 53.5',
  '第 3 步：Hadamard 带窄一些，但仍差 6 分',
  '第 4 步：Cayley 优化后聚焦到一个点',
];

// ch3-trials：P2 步进——随机抽样 → 铺开 → Hadamard → 优化点
export const Ch3Trials: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);

    // 数轴
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X0, AX_Y);
    ctx.lineTo(X1, AX_Y);
    ctx.stroke();
    for (let v = 35; v <= 70; v += 5) {
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(v), AX_Y - 4);
      ctx.lineTo(sx(v), AX_Y + 4);
      ctx.stroke();
      text(ctx, String(v), sx(v), AX_Y + 18, C.muted, 11, 'center');
    }

    const dimOthers = step >= 4;

    // 随机 FP 散点
    if (step >= 1) {
      const n = step === 1 ? 28 : 100;
      ctx.globalAlpha = dimOthers ? 0.18 : 1;
      DOTS.slice(0, n).forEach((d) => {
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(sx(S_LO + d.u * (S_HI - S_LO)), AX_Y - 12 - d.j * 74, 3.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    if (step >= 2) {
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx(S_LO), AX_Y - 92);
      ctx.lineTo(sx(S_HI), AX_Y - 92);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '差 13 分', sx(47), AX_Y - 102, C.red, 13, 'center');
    }

    // Hadamard 带
    if (step >= 3) {
      ctx.globalAlpha = dimOthers ? 0.3 : 1;
      ctx.fillStyle = 'rgba(124,58,237,0.16)';
      ctx.fillRect(sx(H_LO), AX_Y - 86, sx(H_HI) - sx(H_LO), 78);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx(H_LO), AX_Y - 86, sx(H_HI) - sx(H_LO), 78);
      text(ctx, '差 6 分', sx(56), AX_Y - 94, C.purple, 13, 'center');
      ctx.globalAlpha = 1;
    }

    // 优化点
    if (step >= 4) {
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(sx(OPT), AX_Y - 44, 7, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '优化后', sx(OPT), AX_Y - 62, C.green, 13, 'center');
    }
    text(ctx, '随机 FP', sx(47), 30, dimOthers ? C.muted : C.red, 13, 'center');

    // 右侧统计面板
    inset(ctx, 492, 20, 212, 212);
    text(ctx, '最好 − 最差', 598, 42, C.muted, 12, 'center');
    const rows: [string, string, string, boolean][] = [
      ['随机 FP', '40.5 ~ 53.5', '差 13', step >= 2],
      ['Hadamard', '53 ~ 59', '差 6', step >= 3],
      ['Cayley 优化', '61.5 聚焦', '≈0', step >= 4],
    ];
    rows.forEach(([name, span, gap, on], i) => {
      const y = 74 + i * 52;
      ctx.globalAlpha = on ? 1 : 0.35;
      text(ctx, name, 508, y, on ? C.ink : C.muted, 13);
      text(ctx, span, 508, y + 20, C.muted, 12);
      text(
        ctx,
        gap,
        688,
        y + 10,
        gap === '≈0' ? C.green : C.red,
        16,
        'right'
      );
      ctx.globalAlpha = 1;
    });
    text(ctx, 'W4A4 RTN · 0-shot 均值', 598, 216, C.muted, 11, 'center');
  });

  const fb =
    step === 0
      ? { t: '每点一次「下一步」，抽签开始。', c: '' }
      : step === 1
      ? { t: '随机 FP 旋转开始落点——每一次抽样都是一个独立的量化结果。', c: '' }
      : step === 2
      ? { t: '100 次随机：最差 40.5，最好 53.5，差 13 分——同一个方法，纯看手气。', c: 'bad' }
      : step === 3
      ? { t: 'Hadamard 稳一些（53~59），但仍有 6 分方差——只是「较好的起点」。', c: '' }
      : { t: 'Cayley 优化后聚焦到一个点（示意汇总 Table 4 均值）：与其抽签，不如直接学。', c: 'good' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" disabled={step >= 4} onClick={() => setStep((s) => clamp(s + 1, 0, 4))}>
          {step >= 4 ? '已完成' : '下一步'}
        </button>
        <button className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
        <span className="step-label">
          <b>{step}</b> / 4
        </span>
      </div>
      <div className="step-desc">{STEP_TITLES[step]}</div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="sq-note">
        <b>口径说明：</b>散点带（差 13 分）与 Hadamard 带（差 6 分）来自论文 Figure 4 的
        100 次试验统计（W4A4 RTN，LLaMA-2 7B，0-shot 均值）；第 4 步的 61.5 为 Table 4 中
        Cayley 优化后 RTN 的均值，此处作示意汇总，散点为确定性伪随机。
      </p>
    </div>
  );
};

export default Ch3Trials;
