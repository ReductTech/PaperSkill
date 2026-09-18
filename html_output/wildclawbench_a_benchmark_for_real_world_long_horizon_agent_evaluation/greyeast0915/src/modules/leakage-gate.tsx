import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 270;

const COLORS = {
  bg: '#f5f8f0',
  rock: '#e3eadc',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

type Timing = 'before' | 'after';

type GateModel = {
  timing: Timing;
};

function drawAgent(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = COLORS.orange;
  ctx.beginPath();
  ctx.arc(x, y - 22, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y + 34);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x - 24, y + 20);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x + 24, y + 20);
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('智能体', x, y + 60);
}

function drawFolder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  open: boolean,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x + 64, y + 12);
  ctx.lineTo(x + 80, y + 27);
  ctx.lineTo(x + 170, y + 27);
  ctx.lineTo(x + 170, y + 108);
  ctx.lineTo(x, y + 108);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x + 22, y + 45, 126, 42);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('评分专用材料', x + 85, y + 71);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  if (open) {
    ctx.beginPath();
    ctx.arc(x + 143, y + 26, 10, Math.PI, 0);
    ctx.stroke();
  } else {
    ctx.strokeRect(x + 135, y + 25, 17, 15);
    ctx.beginPath();
    ctx.arc(x + 143.5, y + 25, 8, Math.PI, 0);
    ctx.stroke();
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  dashed: boolean
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dashed ? [9, 7] : []);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 12 * Math.cos(angle - Math.PI / 6), toY - 12 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 12 * Math.cos(angle + Math.PI / 6), toY - 12 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, model: GateModel, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.rock;
  ctx.beginPath();
  ctx.moveTo(0, 175);
  ctx.bezierCurveTo(240, 142, 370, 191, 550, 160);
  ctx.bezierCurveTo(730, 132, 900, 185, 1080, 151);
  ctx.lineTo(1080, 205);
  ctx.lineTo(0, 205);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.font = '700 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('评分材料可见性门', 36, 34);

  drawAgent(ctx, 152, 91);
  const isBefore = model.timing === 'before';
  drawFolder(ctx, 780, 43, !isBefore, isBefore ? COLORS.red : COLORS.purple);

  if (isBefore) {
    drawArrow(ctx, 242, 99, 774, 99, COLORS.red, true);
    ctx.fillStyle = COLORS.red;
    ctx.font = '700 17px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('可能泄漏答案', 520, 81);
  } else {
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(242, 99);
    ctx.lineTo(774, 99);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('执行期间保持关闭', 520, 81);
    drawArrow(ctx, 706, 208, 858, 159, COLORS.green, false);
  }

  const startX = 90;
  const endX = 990;
  const timelineY = 218;
  const exitX = 700;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, timelineY);
  ctx.lineTo(endX, timelineY);
  ctx.stroke();

  ctx.strokeStyle = isBefore ? COLORS.red : COLORS.blue;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(startX, timelineY);
  ctx.lineTo(isBefore ? exitX : endX, timelineY);
  ctx.stroke();

  const pulse = 5 + 2 * Math.sin(time / 260);
  ctx.fillStyle = COLORS.green;
  ctx.beginPath();
  ctx.arc(exitX, timelineY, pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('任务开始', startX, 248);
  ctx.fillText('智能体退出', exitX, 248);
  ctx.fillText('评分器验收', endX, 248);

  ctx.fillStyle = isBefore ? COLORS.red : COLORS.green;
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.fillText(isBefore ? '执行前已经暴露' : '退出后才挂载', 865, 189);
}

export const LeakageGate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [model, setModel] = useState<GateModel>({ timing: 'after' });
  const modelRef = useRef(model);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = (time: number) => {
      drawScene(ctx, modelRef.current, time);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (timing: Timing) => setModel({ timing });

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="评分材料在智能体执行前后挂载的时间线"
      />
      <div className="ctrl" role="group" aria-label="评分材料挂载时机">
        <button
          className={'tiny ' + (model.timing === 'before' ? '' : 'ghost')}
          type="button"
          aria-pressed={model.timing === 'before'}
          onClick={() => choose('before')}
        >
          执行前挂载
        </button>
        <button
          className={'tiny ' + (model.timing === 'after' ? '' : 'ghost')}
          type="button"
          aria-pressed={model.timing === 'after'}
          onClick={() => choose('after')}
        >
          退出后挂载
        </button>
      </div>
      <div className={'feedback ' + (model.timing === 'after' ? 'good' : 'bad')}>
        {model.timing === 'after'
          ? '退出后挂载：评分材料只服务验收。'
          : '执行前挂载：智能体可能看到本不该看到的评分信息。'}
      </div>
    </div>
  );
};

export default LeakageGate;
