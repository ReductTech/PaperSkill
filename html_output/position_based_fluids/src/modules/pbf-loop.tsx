import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const WIDTH = 560;
const HEIGHT = 240;
const COLORS = {
  bg: '#f4f9ff',
  water: '#35c6f4',
  waterDeep: '#0754a6',
  blue: '#0b4f9f',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

const STAGES = [
  {
    label: '预测位置',
    feedback: '先预测位置：约束将在这些候选位置上求解。',
  },
  {
    label: '搜索邻居',
    feedback: '本时间步搜索一次邻域，得到后续迭代使用的邻居集合。',
  },
  {
    label: '约束迭代与碰撞',
    feedback: '迭代中反复计算 lambda、位置修正与碰撞；距离和约束会重新评估。',
  },
  {
    label: '更新速度',
    feedback: '用修正后的位移更新速度，本时间步的主体求解完成。',
  },
  {
    label: '可选速度后处理',
    feedback: '可选：再做涡量约束与 XSPH 黏性等速度后处理。',
  },
] as const;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fill: string,
  outline = COLORS.waterDeep,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawScene(ctx: CanvasRenderingContext2D, step: number) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const cx = 128;
  const cy = 116;
  const radius = 76;
  ctx.lineCap = 'round';
  for (let index = 0; index < STAGES.length; index += 1) {
    const start = -Math.PI / 2 + (index * Math.PI * 2) / STAGES.length + 0.04;
    const end = -Math.PI / 2 + ((index + 1) * Math.PI * 2) / STAGES.length - 0.04;
    ctx.strokeStyle = index < step ? COLORS.green : index === step ? COLORS.blue : COLORS.line;
    ctx.lineWidth = index === step ? 11 : 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';

  const markerAngle = -Math.PI / 2 + ((step + 0.5) * Math.PI * 2) / STAGES.length;
  const mx = cx + Math.cos(markerAngle) * radius;
  const my = cy + Math.sin(markerAngle) * radius;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(markerAngle);
  ctx.fillStyle = COLORS.orange;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(9, 0);
  ctx.lineTo(0, 9);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (step === 2) {
    ctx.strokeStyle = COLORS.purple;
    ctx.lineWidth = 2;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, 31 + index * 10, 0.2, Math.PI * 1.55);
      ctx.stroke();
    }
  }

  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('一个时间步', cx, cy - 4);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText(step === 2 ? '重复若干次' : '按阶段推进', cx, cy + 18);
  ctx.textAlign = 'left';

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(258, 20);
  ctx.lineTo(258, 220);
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 14px "Segoe UI", sans-serif';
  ctx.fillText(STAGES[step].label, 282, 30);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath();
  ctx.roundRect(282, 45, 250, 132, 14);
  ctx.fill();
  ctx.stroke();

  const oldPositions = [
    [325, 95],
    [372, 77],
    [414, 111],
    [464, 85],
  ];
  const predictedPositions = oldPositions.map(([x, y], index) => [x + 14, y + (index % 2 === 0 ? -7 : 8)]);
  const correctedPositions = predictedPositions.map(([x, y], index) => [x - 7, y + (index % 2 === 0 ? 4 : -4)]);

  if (step === 0) {
    oldPositions.forEach(([x, y], index) => {
      drawParticle(ctx, x, y, '#ffffff', COLORS.muted);
      const [px, py] = predictedPositions[index];
      drawArrow(ctx, x, y, px, py, COLORS.blue, true);
      drawParticle(ctx, px, py, COLORS.water, COLORS.blue);
    });
  } else if (step === 1) {
    predictedPositions.forEach(([x, y]) => drawParticle(ctx, x, y, COLORS.water, COLORS.blue));
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 2;
    for (let index = 0; index < predictedPositions.length - 1; index += 1) {
      const [x1, y1] = predictedPositions[index];
      const [x2, y2] = predictedPositions[index + 1];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (step === 2) {
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    for (let index = 0; index < predictedPositions.length - 1; index += 1) {
      const [x1, y1] = predictedPositions[index];
      const [x2, y2] = predictedPositions[index + 1];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    predictedPositions.forEach(([x, y], index) => {
      const [nx, ny] = correctedPositions[index];
      drawParticle(ctx, x, y, '#ffffff', COLORS.muted);
      drawArrow(ctx, x, y, nx, ny, COLORS.green);
      drawParticle(ctx, nx, ny, COLORS.water, COLORS.green);
    });
    ctx.fillStyle = COLORS.purple;
    ctx.font = '700 12px "Cascadia Code", monospace';
    ctx.fillText('λ → Δp → 碰撞', 330, 153);
  } else if (step === 3) {
    correctedPositions.forEach(([x, y], index) => {
      drawParticle(ctx, x, y, COLORS.water, COLORS.green);
      drawArrow(ctx, x, y, x + 18 + index * 2, y - 10, COLORS.green);
    });
  } else {
    correctedPositions.forEach(([x, y]) => drawParticle(ctx, x, y, COLORS.water, COLORS.waterDeep));
    ctx.strokeStyle = COLORS.purple;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(400, 105, 44, -0.8, Math.PI * 1.3);
    ctx.stroke();
    drawArrow(ctx, 421, 66, 439, 79, COLORS.purple);
    ctx.fillStyle = COLORS.purple;
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText('可选速度收尾', 350, 154);
  }

  ctx.fillStyle = step >= 1 ? COLORS.blue : COLORS.muted;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.fillText('邻居搜索计数：' + (step >= 1 ? '1' : '0'), 282, 199);
  ctx.fillStyle = step === 2 ? COLORS.purple : COLORS.muted;
  ctx.fillText(step === 2 ? '约束：迭代重估' : '约束：等待/已完成', 282, 219);
}

export const PbfLoop: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return observeCanvas(canvas, () => setVisible(true), () => setVisible(false));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = setupCanvas(canvas, WIDTH, HEIGHT);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    drawScene(ctx, step);
    canvas.classList.add('is-ready');
  }, [step, visible]);

  const nextLabel = step === STAGES.length - 1 ? '开始下一帧' : '下一步';
  const nextStep = () => setStep((current) => (current + 1) % STAGES.length);
  const feedbackClass = step === 3 ? 'good' : '';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="PBF 时间步阶段">
        {STAGES.map((stage, index) => {
          const selected = index === step;
          return (
            <button
              key={stage.label}
              type="button"
              className="chip"
              aria-current={selected ? 'step' : undefined}
              style={
                selected
                  ? {
                      borderColor: COLORS.orange,
                      background: '#fff7ed',
                      color: COLORS.waterDeep,
                      boxShadow: 'inset 0 0 0 1px ' + COLORS.orange,
                    }
                  : undefined
              }
              onClick={() => setStep(index)}
            >
              {index + 1}. {stage.label}
            </button>
          );
        })}
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={
          '当前阶段：' +
          STAGES[step].label +
          '；邻居搜索计数：' +
          (step >= 1 ? '1' : '0') +
          (step === 2 ? '；约束正在迭代重估' : '')
        }
        style={{ width: '100%', maxWidth: WIDTH, height: 'auto' }}
      />
      <div className="step-ctrl">
        <span className="step-label">
          当前：<b>{STAGES[step].label}</b>
        </span>
        <button
          type="button"
          className="tiny"
          aria-label={
            step === STAGES.length - 1
              ? '开始下一帧并回到预测位置'
              : '前往下一阶段：' + STAGES[step + 1].label
          }
          onClick={nextStep}
        >
          {nextLabel}
        </button>
      </div>
      <div className={'feedback ' + feedbackClass} aria-live="polite">
        {STAGES[step].feedback}
      </div>
      {step === 2 && (
        <p style={{ fontSize: 13, color: COLORS.muted }}>
          三枚回环刻度只表示“重复若干次”，不是论文固定迭代数。
        </p>
      )}
      {step === 4 && (
        <p
          style={{
            fontSize: 13,
            color: COLORS.purple,
            borderLeft: '4px solid ' + COLORS.purple,
            paddingLeft: 9,
          }}
        >
          紫色表示辅助速度机制，不属于密度投影本身。
        </p>
      )}
    </div>
  );
};
