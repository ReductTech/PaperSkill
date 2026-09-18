import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 320;
const C = {
  bg: '#f5f8f0', ink: '#21324a', muted: '#68778f', line: '#d7deea',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
};

type GapKey = 'artifact' | 'sandbox' | 'api';

const GAPS: Record<GapKey, { label: string; old: string; paper: string; feedback: string }> = {
  artifact: {
    label: '只看产物',
    old: '文件存在就判定完成，错误收件人、残留文件和权限变化仍可能被忽略。',
    paper: '联合检查最终产物、环境副作用与开放输出的语义质量。',
    feedback: '补足的证据：过程结果、环境状态与语义质量。',
  },
  sandbox: {
    label: '合成沙箱',
    old: '封闭脚本把环境简化成预设状态，真实软件中的登录、格式和状态差异不会出现。',
    paper: '隔离容器保证可复现，同时允许原生 CLI 与真实工具按实际方式运行。',
    feedback: '补足的难度：真实软件状态、命令行为与可审计副作用。',
  },
  api: {
    label: '少量模拟 API',
    old: '少数固定调用只能测试局部操作，难以覆盖跨应用规划、格式转换和工具衔接。',
    paper: '让智能体组合浏览器、终端、文件、邮件等真实工具完成长链任务。',
    feedback: '补足的能力：多工具选择、组合、纠错与持续执行。',
  },
};

function roundedCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();
}

function drawFile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, 92, 112, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 4;
  [30, 52, 74].forEach((dy) => {
    ctx.beginPath();
    ctx.moveTo(x + 18, y + dy);
    ctx.lineTo(x + 70, y + dy);
    ctx.stroke();
  });
}

function drawTool(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = 24) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawScene(ctx: CanvasRenderingContext2D, gap: GapKey) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  roundedCard(ctx, 42, 42, 445, 232, '#fff6f6', '#e8a8b2');
  roundedCard(ctx, 593, 42, 445, 232, '#f2faf6', '#9bcdb5');
  ctx.fillStyle = C.red;
  ctx.font = '700 21px "Segoe UI", sans-serif';
  ctx.fillText('传统简化', 68, 78);
  ctx.fillStyle = C.green;
  ctx.fillText('论文方案', 619, 78);

  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(507, 158);
  ctx.lineTo(568, 158);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.moveTo(568, 158);
  ctx.lineTo(551, 148);
  ctx.lineTo(551, 168);
  ctx.closePath();
  ctx.fill();

  if (gap === 'artifact') {
    drawFile(ctx, 125, 105, C.green);
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(320, 158, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(303, 141);
    ctx.lineTo(337, 175);
    ctx.moveTo(337, 141);
    ctx.lineTo(303, 175);
    ctx.stroke();

    drawFile(ctx, 646, 105, C.green);
    [790, 870, 950].forEach((x, index) => drawTool(ctx, x, 160, [C.blue, C.orange, C.purple][index], 25));
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(738, 160);
    ctx.lineTo(765, 160);
    ctx.moveTo(815, 160);
    ctx.lineTo(845, 160);
    ctx.moveTo(895, 160);
    ctx.lineTo(925, 160);
    ctx.stroke();
  } else if (gap === 'sandbox') {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(112, 105, 270, 112);
    ctx.setLineDash([]);
    drawTool(ctx, 180, 161, C.red);
    drawTool(ctx, 314, 161, C.red);

    ctx.strokeStyle = C.green;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(645, 105, 338, 112, 12);
    ctx.stroke();
    [704, 814, 924].forEach((x, index) => drawTool(ctx, x, 161, [C.blue, C.orange, C.purple][index]));
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(729, 161);
    ctx.lineTo(789, 161);
    ctx.moveTo(839, 161);
    ctx.lineTo(899, 161);
    ctx.stroke();
  } else {
    drawTool(ctx, 170, 158, C.red, 30);
    drawTool(ctx, 318, 158, C.red, 30);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 158);
    ctx.lineTo(288, 158);
    ctx.stroke();

    const points = [[672, 158], [744, 112], [816, 158], [888, 112], [960, 158]] as const;
    points.forEach(([x, y], index) => drawTool(ctx, x, y, [C.blue, C.orange, C.purple, C.blue, C.green][index], 22));
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
  }
}

export const LegacyLimitations: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gap, setGap] = useState<GapKey>('artifact');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      drawScene(ctx, gap);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => {});
    return () => disconnect();
  }, [gap]);

  const item = GAPS[gap];
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={`${item.label}与 WildClawBench 方案的对比`}
      />
      <div className="chip-row" role="group" aria-label="选择传统评测的简化方式">
        {(Object.keys(GAPS) as GapKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${gap === key ? 'active' : ''}`}
            aria-pressed={gap === key}
            onClick={() => setGap(key)}
          >
            {GAPS[key].label}
          </button>
        ))}
      </div>
      <div className="legacy-copy-grid">
        <p><b>原有不足：</b>{item.old}</p>
        <p><b>论文补足：</b>{item.paper}</p>
      </div>
      <div className="feedback good">{item.feedback}</div>
    </div>
  );
};

export default LegacyLimitations;
