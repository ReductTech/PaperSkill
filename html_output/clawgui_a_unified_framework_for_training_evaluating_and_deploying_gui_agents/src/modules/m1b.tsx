import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, line, arrow, phone, uiRows } from './kit';

/* ============================================================================
   模块 1.2 —— 走一遍 GUI 智能体的单步循环
   分步推进（P2）：感知 → 推理 → 动作 → 结果，四步闭环
   ============================================================================ */

/* kit 中若干图元用默认值推断出了字面量色类型，这里在本文件内放宽为 string，
   不改动 kit 本身。 */
const strokeLine = line as unknown as (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color?: string,
  lw?: number,
  dash?: number[]
) => void;
const drawArrow = arrow as unknown as (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color?: string,
  lw?: number,
  head?: number
) => void;
const screenRows = uiRows as unknown as (
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  rows: number,
  highlight?: number,
  hlColor?: string
) => void;

const STEPS = [
  { title: '感知 · 读截图', sub: '唯一的输入就是这张屏幕像素' },
  { title: '推理 · 决定点哪', sub: '结合任务指令与历史动作定位目标' },
  { title: '动作 · TAP / SWIPE / TYPE', sub: '输出一个落在屏幕坐标上的低层动作' },
  { title: '结果 · 屏幕变化', sub: '新截图成为下一轮的观测' },
];

const DESC = [
  '智能体截下当前屏幕——它拿不到 App 后台，看得见的就是全部信息。',
  '模型在这张截图上找到目标控件，算出手指该落在哪个坐标。',
  '动作只有 TAP / SWIPE / TYPE 这几种低层操作，此处输出 TAP(412, 980)。',
  '点击生效，界面更新；这张新截图又回到第 1 步，循环继续。',
];

const FB: { text: string; cls: string }[] = [
  {
    text:
      '第 1 步：智能体手里只有这一张截图。没有接口、没有后台数据——看得见的信息，就是它全部的信息。',
    cls: '',
  },
  { text: '第 2 步：模型要自己在像素里定位目标，并把它变成一对屏幕坐标。', cls: '' },
  {
    text:
      '第 3 步：动作空间朴素得惊人——只有点击、滑动、输入。正是这种朴素，让它能操作任何软件。',
    cls: '',
  },
  {
    text:
      '第 4 步：屏幕变了，新截图又成为下一轮的输入，一圈闭合。GUI 智能体就是这样一步一步把任务磨完的，也正因为步数长，中间每一步该不该给分才会变成大问题。',
    cls: 'good',
  },
];

export const M1b: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(1);

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    // ── 左：手机 ──────────────────────────────────────────────
    text(ctx, '手机屏幕', 83, 42, { size: 12, color: C.muted, align: 'center' });
    const s = phone(ctx, 30, 52, 106, 168);
    const done4 = step === 4;
    screenRows(ctx, s.sx, s.sy, s.sw, 9, done4 ? 5 : 2, done4 ? C.pass : C.emph);

    // 目标十字准星（第 2、3 步）
    if (step === 2 || step === 3) {
      const ty = s.sy + 7 + 5 * 11 + 3.5;
      const tx = s.sx + 42;
      const r = 10 + 2.5 * Math.sin(t / 220);
      ctx.save();
      ctx.strokeStyle = C.emph;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - r - 5, ty);
      ctx.lineTo(tx + r + 5, ty);
      ctx.moveTo(tx, ty - r - 5);
      ctx.lineTo(tx, ty + r + 5);
      ctx.stroke();
      ctx.restore();
    }

    // 发出的动作（第 3 步起）
    if (step >= 3) {
      fillRound(ctx, 30, 228, 106, 22, 6, C.white, step === 3 ? C.emph : C.axis, 1.4);
      text(ctx, 'TAP(412, 980)', 83, 239, {
        size: 11.5,
        mono: true,
        weight: '700',
        color: step === 3 ? C.emph : C.muted,
        align: 'center',
        baseline: 'middle',
      });
    }

    // ── 右：循环四节点 ────────────────────────────────────────
    text(ctx, '智能体的单步循环', 178, 42, { size: 12, color: C.muted });

    const NX = 178;
    const NW = 352;
    const NH = 34;
    const ys = [52, 98, 144, 190];

    ys.forEach((ny, i) => {
      const active = i === step - 1;
      const done = i < step - 1;
      const bg = active
        ? 'rgba(39,68,110,0.10)'
        : done
        ? 'rgba(31,111,67,0.10)'
        : C.white;
      const bd = active ? C.guide : done ? C.pass : C.axis;
      const fg = active ? C.guide : done ? C.pass : C.muted;

      fillRound(ctx, NX, ny, NW, NH, 8, bg, bd, active ? 2 : 1);
      ctx.beginPath();
      ctx.arc(NX + 21, ny + NH / 2, 11, 0, Math.PI * 2);
      ctx.fillStyle = active ? C.guide : done ? C.pass : C.axis;
      ctx.fill();
      text(ctx, String(i + 1), NX + 21, ny + NH / 2, {
        size: 12,
        weight: '700',
        color: active || done ? C.white : C.muted,
        align: 'center',
        baseline: 'middle',
      });
      text(ctx, STEPS[i].title, NX + 40, ny + 14, { size: 13, weight: '700', color: fg });
      text(ctx, STEPS[i].sub, NX + 40, ny + 27, { size: 11.5, color: C.muted });

      if (i < 3) {
        drawArrow(ctx, NX + 21, ny + NH, NX + 21, ny + NH + 12, i < step - 1 ? C.pass : C.axis, 2, 5);
      }
    });

    // 回环：第 4 步 → 第 1 步
    const loopOn = step === 4;
    const lc = loopOn ? C.aux : C.axis;
    const yB = ys[3] + NH / 2;
    const yT = ys[0] + NH / 2;
    strokeLine(ctx, NX + NW, yB, 544, yB, lc, loopOn ? 2 : 1, loopOn ? [] : [4, 4]);
    strokeLine(ctx, 544, yB, 544, yT, lc, loopOn ? 2 : 1, loopOn ? [] : [4, 4]);
    drawArrow(ctx, 544, yT, NX + NW + 2, yT, lc, loopOn ? 2 : 1, 6);
    if (loopOn) {
      const my = (yT + yB) / 2;
      fillRound(ctx, 534, my - 15, 21, 30, 5, C.field);
      text(ctx, '循', 544, my - 7, { size: 11, color: C.aux, align: 'center', baseline: 'middle' });
      text(ctx, '环', 544, my + 7, { size: 11, color: C.aux, align: 'center', baseline: 'middle' });
    }
  });

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 1} onClick={() => setStep((v) => Math.max(1, v - 1))}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step}</b> / 4 步
        </span>
        <button className="tiny" onClick={() => setStep((v) => (v === 4 ? 1 : v + 1))}>
          {step === 4 ? '重新开始' : '下一步'}
        </button>
      </div>
      <div className="step-desc">{DESC[step - 1]}</div>
      <div className={`feedback ${FB[step - 1].cls}`}>{FB[step - 1].text}</div>
    </div>
  );
};

export default M1b;
