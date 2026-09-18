import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 330;

const COLORS = {
  bg: '#f5f8f0',
  rock: '#e3eadc',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
};

const STEP_LABELS = ['任务注入', '执行框架', '真实工具', '产物与日志', '退出后评分'] as const;
const NODE_SUBTITLES = ['Task', 'Harness', 'Tools / Workspace', 'Artifacts / Logs', 'Graders'];
const DETAILS = [
  '智能体可见：结构化任务说明、初始工作区与配置的资源约束。',
  '智能体可见：原生 CLI 执行框架提供的命令、提示与上下文。',
  '智能体可见：真实工具与工作区；每次动作都在环境中留下可审计变化。',
  '智能体可见：自己生成的产物与执行日志；此时评分材料仍未挂载。',
  '智能体已退出：评分器读取此时才挂载的评分材料、产物与日志。',
] as const;

type RuntimeModel = {
  step: number;
};

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
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string,
  progress?: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 8, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 9, y - 6);
  ctx.lineTo(x2 - 9, y + 6);
  ctx.closePath();
  ctx.fill();
  if (progress !== undefined) {
    const x = x1 + (x2 - x1 - 10) * progress;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScene(ctx: CanvasRenderingContext2D, model: RuntimeModel, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.rock;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.bezierCurveTo(130, 125, 220, 161, 350, 139);
  ctx.bezierCurveTo(570, 103, 780, 166, 1080, 122);
  ctx.lineTo(1080, 155);
  ctx.lineTo(0, 155);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.font = '700 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Task → Harness → Tools / Workspace → Artifacts / Logs → Graders', 30, 31);

  const nodeWidth = 150;
  const nodeHeight = 72;
  const nodeY = 60;
  const nodeXs = [30, 242, 454, 666, 878];
  const pulse = ((time / 1100) % 1 + 1) % 1;

  nodeXs.forEach((x, index) => {
    if (index < nodeXs.length - 1) {
      const edgeColor =
        index < model.step ? COLORS.green : index === model.step ? COLORS.blue : COLORS.border;
      drawArrow(
        ctx,
        x + nodeWidth + 7,
        nodeXs[index + 1] - 7,
        nodeY + nodeHeight / 2,
        edgeColor,
        index === model.step ? pulse : undefined
      );
    }
  });

  nodeXs.forEach((x, index) => {
    const isDone = index < model.step;
    const isCurrent = index === model.step;
    const fill = isDone ? COLORS.green : isCurrent ? COLORS.blue : '#ffffff';
    const stroke = isDone ? COLORS.green : isCurrent ? COLORS.blue : COLORS.border;
    roundedRect(ctx, x, nodeY, nodeWidth, nodeHeight, 13);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isDone || isCurrent ? '#ffffff' : COLORS.text;
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_LABELS[index], x + nodeWidth / 2, nodeY + 29);
    ctx.fillStyle = isDone || isCurrent ? 'rgba(255,255,255,0.82)' : COLORS.muted;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(NODE_SUBTITLES[index], x + nodeWidth / 2, nodeY + 53);
  });

  roundedRect(ctx, 44, 174, 992, 122, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = model.step === 4 ? COLORS.green : COLORS.blue;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = model.step === 4 ? COLORS.green : COLORS.blue;
  ctx.font = '700 17px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('第 ' + (model.step + 1) + ' 步 · ' + STEP_LABELS[model.step], 70, 207);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.fillText(DETAILS[model.step], 70, 242);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText(
    model.step < 4
      ? '蓝色表示当前环节，绿色表示已经经过且被日志记录的环节。'
      : '评分发生在智能体退出之后；评分专用材料不属于执行期可见资源。',
    70,
    274
  );
}

export const RuntimeWalkthrough: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [model, setModel] = useState<RuntimeModel>({ step: 0 });
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

  const selectStep = (step: number) => {
    setModel({ step: Math.round(clamp(step, 0, STEP_LABELS.length - 1)) });
  };

  const onStepKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      selectStep(model.step + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectStep(model.step - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectStep(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectStep(STEP_LABELS.length - 1);
    }
  };

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="真实执行链架构图"
      />
      <div className="ctrl" role="group" aria-label="执行链步骤">
        {STEP_LABELS.map((label, index) => (
          <button
            key={label}
            className={'tiny ' + (model.step === index ? '' : 'ghost')}
            type="button"
            aria-pressed={model.step === index}
            onClick={() => selectStep(index)}
            onKeyDown={onStepKeyDown}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={'feedback ' + (model.step === 4 ? 'good' : '')}>
        {model.step === 4
          ? '评分材料在退出后才进入容器视野，执行链可审计。'
          : DETAILS[model.step]}
      </div>
    </div>
  );
};

export default RuntimeWalkthrough;
