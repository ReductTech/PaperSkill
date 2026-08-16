import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearDesk, posterColor } from './poster-kit';

const W = 800;
const H = 320;
const BLUE = posterColor('current');
const GREEN = posterColor('success');
const RED = posterColor('failure');
const ORANGE = posterColor('emphasis');
const INK = posterColor('text');
const MUTED = posterColor('muted');
const BORDER = posterColor('border');

const STEPS = ['闭源壁垒', '开源两难', '能力缺口', '论文目标'] as const;
type Step = 0 | 1 | 2 | 3;

const FEEDBACK = [
  '领先闭源模型虽然能力强，却限制深入研究、私有部署与垂直领域微调。',
  '扩大规模会增加计算需求并遇到边际收益问题；高效小模型在困难任务上仍有短板。',
  '论文锁定三项核心能力缺口：复杂指令遵循、文字渲染和审美图像生成。',
  'ERNIE-Image 的目标是构建一个开放、强大、易用的文生图模型。',
] as const;

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  lineWidth = 1
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
}

function centeredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = INK,
  font = '13px "Segoe UI", sans-serif'
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawProgress(ctx: CanvasRenderingContext2D, step: Step, pulse: number) {
  const left = 40;
  const gap = 184;
  STEPS.forEach((label, index) => {
    const x = left + index * gap;
    const completed = index < step;
    const active = index === step;
    if (index < STEPS.length - 1) {
      ctx.strokeStyle = index < step ? GREEN : BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 130, 63);
      ctx.lineTo(x + gap - 10, 63);
      ctx.stroke();
    }
    rect(
      ctx,
      x,
      43,
      130,
      40,
      active ? '#eef3fb' : completed ? '#ecfdf5' : '#f3f6fa',
      active ? BLUE : completed ? GREEN : BORDER,
      active ? 2.5 + pulse * 0.8 : 1
    );
    centeredText(ctx, `${index + 1}. ${label}`, x + 65, 68, active ? BLUE : completed ? GREEN : MUTED, `${active ? '700' : '500'} 13px "Segoe UI", sans-serif`);
  });
}

function drawClosedBarrier(ctx: CanvasRenderingContext2D) {
  rect(ctx, 60, 118, 210, 125, '#f8fafc', BLUE, 2);
  centeredText(ctx, '领先闭源模型', 165, 148, BLUE, '700 16px "Segoe UI", sans-serif');
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.strokeRect(139, 169, 52, 43);
  ctx.beginPath();
  ctx.arc(165, 169, 18, Math.PI, 0);
  ctx.stroke();
  centeredText(ctx, '不可拆解与改造', 165, 232, RED, '12px "Segoe UI", sans-serif');
  arrow(ctx, 285, 180, 365, 180, RED);
  ['深入研究', '私有部署', '垂直微调'].forEach((label, index) => {
    const y = 116 + index * 50;
    rect(ctx, 390, y, 310, 36, '#fff7f8', RED, 1.5);
    centeredText(ctx, label, 520, y + 23, INK, '13px "Segoe UI", sans-serif');
    centeredText(ctx, '受限', 663, y + 23, RED, '700 12px "Segoe UI", sans-serif');
  });
}

function drawOpenDilemma(ctx: CanvasRenderingContext2D) {
  rect(ctx, 52, 112, 300, 137, '#fffaf0', ORANGE, 2);
  centeredText(ctx, '直接扩大模型规模', 202, 140, ORANGE, '700 15px "Segoe UI", sans-serif');
  [0, 1, 2].forEach((layer) => {
    const size = 48 + layer * 18;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(86 - layer * 5, 169 - layer * 5, size, size);
  });
  centeredText(ctx, '计算需求 ↑', 242, 183, RED, '13px "Segoe UI", sans-serif');
  centeredText(ctx, '边际收益递减', 242, 210, RED, '13px "Segoe UI", sans-serif');

  rect(ctx, 448, 112, 300, 137, '#f8fafc', BLUE, 2);
  centeredText(ctx, '高效的小型开源模型', 598, 140, BLUE, '700 15px "Segoe UI", sans-serif');
  rect(ctx, 490, 167, 70, 57, '#eef3fb', BLUE, 2);
  centeredText(ctx, '小模型', 525, 200, BLUE, '700 13px "Segoe UI", sans-serif');
  centeredText(ctx, '复杂指令仍受限', 646, 181, RED, '13px "Segoe UI", sans-serif');
  centeredText(ctx, '中文文字仍受限', 646, 209, RED, '13px "Segoe UI", sans-serif');
  centeredText(ctx, '能力—成本—易用性难以同时兼顾', 400, 278, MUTED, '13px "Segoe UI", sans-serif');
}

function drawCapabilityGap(ctx: CanvasRenderingContext2D) {
  centeredText(ctx, '现有开源模型需要补齐三项核心能力', 400, 125, BLUE, '700 15px "Segoe UI", sans-serif');
  const cards = [
    ['复杂指令遵循', '对象、关系与约束'],
    ['文字渲染', '尤其是中文与长文本'],
    ['审美图像生成', '真实场景中的整体观感'],
  ];
  cards.forEach(([title, desc], index) => {
    const x = 52 + index * 248;
    rect(ctx, x, 151, 200, 88, '#fff', index === 1 ? ORANGE : RED, 2);
    centeredText(ctx, title, x + 100, 184, INK, '700 14px "Segoe UI", sans-serif');
    centeredText(ctx, desc, x + 100, 213, MUTED, '12px "Segoe UI", sans-serif');
  });
}

function drawPaperGoal(ctx: CanvasRenderingContext2D, pulse: number) {
  const cx = 400;
  const cy = 174;
  ['开放', '强大', '易用'].forEach((label, index) => {
    const x = cx - 210 + index * 210;
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 2 + pulse;
    ctx.beginPath();
    ctx.arc(x, cy, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    centeredText(ctx, label, x, cy + 5, GREEN, '700 16px "Segoe UI", sans-serif');
    if (index < 2) arrow(ctx, x + 53, cy, x + 157, cy, GREEN);
  });
  centeredText(ctx, 'ERNIE-Image · 8B 单流 DiT', 400, 247, BLUE, '700 15px "Segoe UI", sans-serif');
  centeredText(ctx, '通过更有效的数据挖掘与更高的训练监督质量缩小开源—闭源差距', 400, 277, MUTED, '12px "Segoe UI", sans-serif');
}

function drawScene(ctx: CanvasRenderingContext2D, step: Step, pulse: number) {
  clearDesk(ctx, W, H);
  rect(ctx, 18, 22, 764, 278, 'rgba(255,255,255,0.95)', BORDER);
  drawProgress(ctx, step, pulse);
  if (step === 0) drawClosedBarrier(ctx);
  else if (step === 1) drawOpenDilemma(ctx);
  else if (step === 2) drawCapabilityGap(ctx);
  else drawPaperGoal(ctx, pulse);
}

export const Ch1MotivationWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let raf: number | null = null;
    const paint = (time = 0) => {
      const pulse = motion.matches ? 0.6 : (Math.sin(time / 420) + 1) * 0.5;
      drawScene(ctx, step, pulse);
      canvas.classList.add('is-ready');
    };
    const tick = (time: number) => {
      paint(time);
      raf = visible && !motion.matches ? requestAnimationFrame(tick) : null;
    };
    const start = () => {
      visible = true;
      if (motion.matches) paint();
      else if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      visible = false;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    paint();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [step]);

  const choose = (next: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, next)) as Step);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`论文动机第 ${step + 1} 步：${FEEDBACK[step]}`}
      />
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="论文动机四步链"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          choose(step + (event.key === 'ArrowRight' ? 1 : -1));
        }}
      >
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`chip ${step === index ? 'selected' : ''}`}
            role="radio"
            aria-checked={step === index}
            tabIndex={step === index ? 0 : -1}
            onClick={() => choose(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button type="button" className="tiny" disabled={step === 0} onClick={() => choose(step - 1)}>上一步</button>
        <span>第 {step + 1} / {STEPS.length} 步</span>
        <button type="button" className="tiny" disabled={step === 3} onClick={() => choose(step + 1)}>下一步</button>
      </div>
      <div className={`feedback ${step === 3 ? 'good' : step < 2 ? 'bad' : ''}`} aria-live="polite">
        {FEEDBACK[step]}
      </div>
    </div>
  );
};

export default Ch1MotivationWidget;
