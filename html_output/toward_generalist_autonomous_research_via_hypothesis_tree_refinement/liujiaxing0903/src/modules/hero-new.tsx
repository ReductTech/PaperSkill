import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 300;
const STEPS = [
  { label: '持久研究状态', note: '假设、失败证据、洞见和产物引用都写入长期状态。' },
  { label: '协调器选择', note: '长期协调器读取全局证据并选择待执行叶节点；一个批次可以并行派发多个节点。' },
  { label: '隔离执行', note: '每个短期执行器在独立工作树中验证一条固定假设，只调用开发评估 Edev。' },
  { label: '证据写回', note: '实验结果写回持久状态，供后续选择、剪枝和审计使用。' },
  { label: '候选送审', note: '当前批次执行完成后，协调器按方向统一后的开发分数选择 n†，再送往独立留出评测门。' },
  { label: '留出决策', note: '只在决定阶段开启 Etest；通过门控的候选才能成为 Mbest。' },
] as const;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#23334b',
  size = 13,
  weight = 700,
  align: CanvasTextAlign = 'center'
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  active: boolean,
  color = '#315886',
  fill = '#ffffff',
  dashed = false
) {
  ctx.save();
  ctx.shadowColor = active ? 'rgba(35, 51, 75, 0.24)' : 'rgba(35, 51, 75, 0.10)';
  ctx.shadowBlur = active ? 12 : 6;
  ctx.shadowOffsetY = active ? 5 : 3;
  roundedRect(ctx, x, y, width, height, 9);
  ctx.fillStyle = active ? color : fill;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = active ? color : '#aab8c6';
  ctx.lineWidth = active ? 3 : 1.7;
  if (dashed) ctx.setLineDash([7, 5]);
  roundedRect(ctx, x + 1, y + 1, width - 2, height - 2, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  drawLabel(ctx, label, x + width / 2, y + height / 2, active ? '#ffffff' : color, 13, 750);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  active: boolean,
  time: number
) {
  const color = active ? '#24845a' : '#b8c5d1';
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 5 : 2.5;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - Math.cos(angle - 0.5) * 10, toY - Math.sin(angle - 0.5) * 10);
  ctx.lineTo(toX - Math.cos(angle + 0.5) * 10, toY - Math.sin(angle + 0.5) * 10);
  ctx.closePath();
  ctx.fill();
  if (active) {
    const travel = (time % 1300) / 1300;
    const x = fromX + (toX - fromX) * travel;
    const y = fromY + (toY - fromY) * travel;
    ctx.save();
    ctx.shadowColor = 'rgba(36, 132, 90, 0.50)';
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxWidth = `${W}px`;
    } catch {
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (time: number) => {
      const active = stepRef.current;
      const displayTime = reduceMotion ? 900 : time;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f4f7fa';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e7edf3';
      for (let x = 18; x < W; x += 28) {
        for (let y = 50; y < H; y += 28) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawLabel(ctx, `Arbor 系统总览 · ${active + 1}/6`, 20, 24, '#23334b', 16, 800, 'left');
      drawLabel(ctx, '研究状态负责记忆，协调器管理前沿，每个执行器验证一条假设', 20, 47, '#627286', 12, 600, 'left');

      drawPanel(ctx, 20, 67, 154, 185, '持久研究状态', active === 0 || active === 3, '#315886', '#ffffff');
      const records = [
        { y: 111, label: 'h₁  已验证', color: '#24845a' },
        { y: 151, label: 'h₂  待探索', color: '#315886' },
        { y: 191, label: 'h₃  已反证', color: '#c43f52' },
      ];
      records.forEach((record, index) => {
        const highlighted = (active === 1 && index === 1) || (active === 3 && index === 2);
        roundedRect(ctx, 36, record.y - 14, 122, 29, 6);
        ctx.fillStyle = highlighted ? record.color : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = record.color;
        ctx.lineWidth = highlighted ? 3 : 1.7;
        ctx.stroke();
        drawLabel(ctx, record.label, 97, record.y + 1, highlighted ? '#ffffff' : record.color, 11, 700);
      });
      drawLabel(ctx, '证据 · 洞见 · 产物引用', 97, 230, '#6f7f91', 10, 600);

      drawPanel(ctx, 221, 69, 130, 52, '长期协调器', active === 1 || active === 4, '#315886', '#ffffff');
      drawPanel(ctx, 205, 169, 162, 77, '隔离工作树', active === 2 || active === 3, '#7650a8', 'rgba(255,255,255,0.75)', true);
      drawPanel(ctx, 220, 190, 132, 39, '短期执行器', active === 2 || active === 3, '#315886', '#ffffff');

      const gateActive = active === 5;
      drawPanel(ctx, 415, 77, 120, 91, gateActive ? 'Etest 通过' : 'Etest 锁定', gateActive, gateActive ? '#24845a' : '#d47a16', '#ffffff');
      drawLabel(ctx, '仅 Decide 阶段', 475, 151, gateActive ? '#ffffff' : '#6f7f91', 10, 600);
      drawPanel(ctx, 430, 207, 90, 48, 'Mbest', gateActive, '#24845a', '#ffffff');

      drawArrow(ctx, 174, 143, 214, 95, active === 1, displayTime);
      drawArrow(ctx, 286, 126, 286, 181, active === 2, displayTime);
      drawArrow(ctx, 218, 214, 174, 205, active === 3, displayTime);
      drawArrow(ctx, 352, 94, 407, 112, active === 4 || active === 5, displayTime);
      drawArrow(ctx, 475, 173, 475, 199, active === 5, displayTime);

      ctx.fillStyle = '#315886';
      ctx.fillRect(0, H - 4, W * ((active + 1) / 6), 4);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseStep = (next: number) => {
    const safe = Math.max(0, Math.min(STEPS.length - 1, next));
    stepRef.current = safe;
    setStep(safe);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}-new`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`Arbor 系统总览：${STEPS[step].label}`}
        style={{ width: '100%', height: 'auto', maxWidth: W }}
      />
      <div className="ctrl hero-overview-steps" role="group" aria-label="选择 Arbor 系统步骤">
        {STEPS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={step === index}
            onClick={() => chooseStep(index)}
            title={item.label}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className={`feedback ${step === 5 ? 'good' : ''}`} role="status" aria-live="polite">
        <strong>{STEPS[step].label}：</strong>{STEPS[step].note}
      </div>
    </div>
  );
};

export default HeroNew;
