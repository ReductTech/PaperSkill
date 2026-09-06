import React, { useEffect, useRef, useState } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 300;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  fill = '#ffffff',
  dashed = false
) {
  ctx.save();
  ctx.shadowColor = 'rgba(35, 51, 75, 0.12)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  roundedRect(ctx, x, y, width, height, 9);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([7, 5]);
  roundedRect(ctx, x + 1, y + 1, width - 2, height - 2, 8);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#23334b',
  size = 14,
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

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  dashed = false
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - Math.cos(angle - 0.5) * 10, toY - Math.sin(angle - 0.5) * 10);
  ctx.lineTo(toX - Math.cos(angle + 0.5) * 10, toY - Math.sin(angle + 0.5) * 10);
  ctx.closePath();
  ctx.fill();
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#c43f52';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 12);
  ctx.lineTo(x + 12, y + 12);
  ctx.moveTo(x + 12, y - 12);
  ctx.lineTo(x - 12, y + 12);
  ctx.stroke();
}

function pathPoint(progress: number) {
  if (progress < 0.5) {
    const local = easeInOutQuad(progress / 0.5);
    return { x: 155 + (215 - 155) * local, y: 112 };
  }
  const local = easeInOutQuad((progress - 0.5) / 0.5);
  return { x: 345 + (405 - 345) * local, y: 112 };
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const cycleRef = useRef(1);
  const [cycle, setCycle] = useState(1);

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
      const raw = reduceMotion ? 1 : (time % 2800) / 2800;
      const progress = easeInOutQuad(clamp((raw - 0.06) / 0.72, 0, 1));
      const point = pathPoint(progress);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f4f7fa';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e7edf3';
      for (let x = 18; x < W; x += 28) {
        for (let y = 54; y < H; y += 28) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawLabel(ctx, `第 ${cycleRef.current} 轮：仍沿单一临时轨迹继续`, 24, 26, '#c43f52', 16, 800, 'left');
      drawLabel(ctx, '执行历史没有被整理成可操作、可审计的研究状态', 24, 49, '#627286', 13, 600, 'left');

      drawPanel(ctx, 25, 76, 130, 102, '#315886', '#ffffff');
      drawLabel(ctx, '本轮输入', 90, 92, '#315886', 14);
      drawLabel(ctx, '初始制品  M₀', 48, 117, '#23334b', 12, 650, 'left');
      drawLabel(ctx, '目标  O', 48, 139, '#23334b', 12, 650, 'left');
      drawLabel(ctx, '结构化约束  ∅', 48, 161, '#c43f52', 12, 700, 'left');

      drawPanel(ctx, 215, 82, 130, 78, '#315886', '#dce8f5');
      drawLabel(ctx, '短期执行器', 280, 105, '#315886', 15);
      drawLabel(ctx, '运行一次局部实验', 280, 132, '#51667d', 12, 600);

      drawPanel(ctx, 405, 76, 130, 102, '#c43f52', '#f5dfe3');
      drawLabel(ctx, '失败结果', 470, 94, '#c43f52', 14);
      drawCross(ctx, 470, 131);
      drawLabel(ctx, '原因未结构化写回', 470, 162, '#c43f52', 12, 700);

      drawArrow(ctx, 160, 112, 208, 112, '#315886');
      drawArrow(ctx, 352, 112, 398, 112, '#c43f52');

      ctx.save();
      ctx.shadowColor = 'rgba(212, 122, 22, 0.38)';
      ctx.shadowBlur = 10;
      roundedRect(ctx, point.x - 25, point.y - 15, 50, 30, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#d47a16';
      ctx.lineWidth = 2.5;
      roundedRect(ctx, point.x - 25, point.y - 15, 50, 30, 6);
      ctx.stroke();
      drawLabel(ctx, '尝试', point.x, point.y, '#d47a16', 12);

      drawPanel(ctx, 184, 211, 192, 50, '#c43f52', '#ffffff', true);
      drawLabel(ctx, '长期研究状态：未结构化', 280, 229, '#c43f52', 13);
      drawLabel(ctx, '后续轮次难以可靠检索并复用证据', 280, 249, '#6f7f91', 11, 600);
      drawArrow(ctx, 464, 187, 374, 226, '#c43f52', true);
      drawArrow(ctx, 184, 235, 102, 187, '#c43f52', true);

      ctx.fillStyle = '#315886';
      ctx.fillRect(0, H - 4, W * raw, 4);
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

  const repeat = () => {
    const next = cycle >= 5 ? 1 : cycle + 1;
    cycleRef.current = next;
    setCycle(next);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}-old`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="单轨执行反复运行局部实验，但失败证据没有被整理成可操作的持久研究状态。"
        style={{ width: '100%', height: 'auto', maxWidth: W }}
      />
      <div className="ctrl">
        <button type="button" onClick={repeat} aria-label="再运行一轮局部尝试">
          再运行一轮
        </button>
      </div>
      <div className="feedback bad" role="status" aria-live="polite">
        第 {cycle} 轮：尝试次数增加了，但后续决策仍缺少可直接检索的假设、失败归因与制品引用。
      </div>
    </div>
  );
};

export default HeroOld;
