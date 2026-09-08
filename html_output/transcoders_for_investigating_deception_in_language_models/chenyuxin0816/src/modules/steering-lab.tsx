import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { isPresentationMode } from '../lib/presentation';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

type SteeringMode = 'none' | 'positive' | 'negative';

const MODES: Array<{ id: SteeringMode; label: string }> = [
  { id: 'none', label: '无干预' },
  { id: 'positive', label: '正向 Steering（α=5）' },
  { id: 'negative', label: '负向 Steering（α=5）' },
];

const MODE_VIEW = {
  none: {
    color: '#27446e',
    soft: '#eaf0f8',
    formula: 'x',
    height: 78,
    direction: 'D / ND 取决于原回答',
    premise: '保留原始特征激活',
  },
  positive: {
    color: '#d97706',
    soft: '#fff4df',
    formula: 'x + α(x)   α = 5',
    height: 132,
    direction: 'ND  →  D',
    premise: '从原本 ND 的回答开始测试',
  },
  negative: {
    color: '#228d5c',
    soft: '#e6f5ed',
    formula: 'x - α(x)   α = 5',
    height: 38,
    direction: 'D  →  ND',
    premise: '从原本 D 的回答开始测试',
  },
} as const;

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

function fillCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = '#ffffff',
  stroke = '#d7deea'
) {
  roundedRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 9, y - 6);
  ctx.lineTo(x2 - 9, y + 6);
  ctx.closePath();
  ctx.fill();
}

function renderSteeringLab(ctx: CanvasRenderingContext2D, mode: SteeringMode) {
  const view = MODE_VIEW[mode];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);

  fillCard(ctx, 18, 18, 214, 204, '#fffef9');
  ctx.fillStyle = '#21324a';
  ctx.font = '700 14px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('同一个候选 Feature', 34, 42);
  ctx.fillStyle = '#68778f';
  ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('示例：L23 / Feature #119106', 34, 61);
  ctx.fillText('柱高只表示信号方向，不是实测值', 34, 78);

  const barX = 72;
  const baseY = 195;
  const barW = 72;
  ctx.strokeStyle = '#9fb0c8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(44, baseY);
  ctx.lineTo(200, baseY);
  ctx.stroke();

  ctx.fillStyle = '#d7deea';
  ctx.fillRect(barX, baseY - 78, barW, 78);
  roundedRect(ctx, barX, baseY - view.height, barW, view.height, 7);
  ctx.fillStyle = view.color;
  ctx.fill();
  ctx.strokeStyle = view.color;
  ctx.lineWidth = 3;
  ctx.stroke();

  roundedRect(ctx, 154, 92, 54, 34, 7);
  ctx.fillStyle = view.soft;
  ctx.fill();
  ctx.strokeStyle = view.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = view.color;
  ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mode === 'none' ? '原状态' : mode === 'positive' ? '增强' : '抑制', 181, 114);

  ctx.fillStyle = '#68778f';
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('解释标签：Obscuring information', 125, 216);

  fillCard(ctx, 248, 18, 296, 76, view.soft, view.color);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#68778f';
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('论文中的离散操作', 264, 40);
  ctx.fillStyle = view.color;
  ctx.font = '700 22px "Cambria Math", Georgia, serif';
  ctx.fillText(view.formula, 264, 72);

  fillCard(ctx, 248, 108, 296, 114, '#ffffff', '#d7deea');
  ctx.fillStyle = '#68778f';
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText('预期标签方向', 264, 132);

  if (mode === 'none') {
    ctx.fillStyle = '#27446e';
    ctx.font = '700 18px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('先记录原始 D / ND 标签', 396, 170);
  } else {
    const from = mode === 'positive' ? 'ND' : 'D';
    const to = mode === 'positive' ? 'D' : 'ND';
    ctx.fillStyle = '#21324a';
    ctx.font = '800 23px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(from, 318, 174);
    drawArrow(ctx, 347, 167, 436, view.color);
    ctx.fillStyle = view.color;
    ctx.fillText(to, 474, 174);
  }

  ctx.fillStyle = '#68778f';
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(view.premise, 396, 204);
}

export const SteeringLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(mode: SteeringMode) => void>(() => undefined);
  const visibleRef = useRef(false);
  const initialMode: SteeringMode = isPresentationMode() ? 'negative' : 'none';
  const stateRef = useRef<{ mode: SteeringMode }>({ mode: initialMode });
  const [mode, setMode] = useState<SteeringMode>(initialMode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${W}px`;
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = '7 / 3';

    drawRef.current = (nextMode) => {
      renderSteeringLab(ctx, nextMode);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const start = () => {
      visibleRef.current = true;
      drawRef.current(stateRef.current.mode);
    };
    const stop = () => {
      visibleRef.current = false;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => disconnect();
  }, []);

  const selectMode = (nextMode: SteeringMode) => {
    stateRef.current = { mode: nextMode };
    setMode(nextMode);
    if (visibleRef.current) drawRef.current(nextMode);
  };

  const feedback =
    mode === 'none'
      ? { text: '无干预：保留原始特征激活 x。', className: '', color: '#27446e' }
      : mode === 'positive'
        ? {
            text: '正向 Steering（α=5）：测试原本 ND 的回答是否转为 D。',
            className: '',
            color: '#d97706',
          }
        : {
            text: '负向 Steering（α=5）：测试原本 D 的回答是否转为 ND。',
            className: 'good',
            color: '#228d5c',
          };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择特征干预状态">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${mode === item.id ? 'selected' : ''}`}
            aria-pressed={mode === item.id}
            onClick={() => selectMode(item.id)}
            style={
              mode === item.id
                ? { background: MODE_VIEW[item.id].color, borderColor: MODE_VIEW[item.id].color }
                : undefined
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="三种离散特征激活状态及其预期标签方向"
      />
      <div
        className={`feedback ${feedback.className}`}
        aria-live="polite"
        style={
          feedback.className
            ? undefined
            : { borderLeftColor: feedback.color, color: feedback.color, fontStyle: 'normal' }
        }
      >
        {feedback.text}
      </div>
      <div className="steering-result-strip" aria-label="论文报告的 Top-10 Steering 结果">
        <div>
          <span>负向预期</span>
          <strong>100%</strong>
          <small>D → ND</small>
        </div>
        <div>
          <span>负向反方向</span>
          <strong>0%</strong>
          <small>ND → D</small>
        </div>
        <div>
          <span>正向预期</span>
          <strong>21%</strong>
          <small>ND → D</small>
        </div>
        <div>
          <span>正向反方向</span>
          <strong>50%</strong>
          <small>D → ND</small>
        </div>
      </div>
      <p className="steering-result-note">Top-10、α=5；四个比例分别按对应的初始标签子集计算。</p>
      <div
        className="feedback"
        style={{
          borderLeftColor: '#d97706',
          color: '#92400e',
          background: '#fff4df',
          fontStyle: 'normal',
        }}
      >
        论文没有比较其他 α，也没有证明 5 是最优值。
      </div>
    </div>
  );
};

export default SteeringLab;
