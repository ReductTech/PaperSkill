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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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
  ctx.setLineDash(dashed ? [7, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - Math.PI / 6), y2 - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 9 * Math.cos(angle + Math.PI / 6), y2 - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, gradientLevel: number) {
  const constraintError = 0.24;
  const epsilon = 0.04;
  const gradientEnergy = gradientLevel * gradientLevel;
  const denominator = gradientEnergy + epsilon;
  const lambda = -constraintError / denominator;
  const weak = gradientLevel < 0.18;
  const strong = gradientLevel >= 0.72;
  const correctionLength = clamp(18 + Math.abs(lambda) * 10, 26, 88);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(360, 20);
  ctx.lineTo(360, 220);
  ctx.stroke();

  const cx = 170;
  const cy = 105;
  ctx.strokeStyle = COLORS.line;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  const neighbors = [
    [105, 78],
    [128, 137],
    [180, 43],
    [226, 68],
    [234, 135],
    [171, 164],
  ];
  neighbors.forEach(([x, y]) => {
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.25, '#bfeeff');
    gradient.addColorStop(1, COLORS.waterDeep);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = COLORS.waterDeep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const scale = (12 + gradientLevel * 22) / len;
    drawArrow(ctx, cx, cy, cx + dx * scale, cy + dy * scale, COLORS.blue);
  });
  ctx.fillStyle = COLORS.orange;
  ctx.strokeStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawArrow(
    ctx,
    cx,
    cy,
    cx + correctionLength,
    cy,
    weak ? COLORS.red : strong ? COLORS.green : COLORS.blue,
    weak,
  );

  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.fillText('邻域梯度', 26, 25);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('修正箭头随 λ 联动', 26, 190);

  const trackX = 385;
  const trackY = 46;
  const trackW = 145;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(trackX, trackY);
  ctx.lineTo(trackX + trackW, trackY);
  ctx.stroke();
  ctx.strokeStyle = COLORS.blue;
  ctx.beginPath();
  ctx.moveTo(trackX, trackY);
  ctx.lineTo(trackX + trackW * gradientLevel, trackY);
  ctx.stroke();
  ctx.fillStyle = COLORS.orange;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(trackX + trackW * gradientLevel, trackY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.fillText('梯度响应（归一化）', 378, 24);
  ctx.fillStyle = COLORS.line;
  ctx.fillRect(385, 91, 150, 20);
  const energyShare = gradientEnergy / denominator;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(385, 91, 150 * energyShare, 20);
  ctx.fillStyle = COLORS.purple;
  ctx.fillRect(385 + 150 * energyShare, 91, 150 * (1 - energyShare), 20);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(385, 91, 150, 20);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('Σ‖∇C‖²', 385, 128);
  ctx.fillStyle = COLORS.purple;
  ctx.fillText('ε', 520, 128);
  ctx.fillStyle = weak ? COLORS.red : strong ? COLORS.green : COLORS.blue;
  ctx.font = '700 21px "Cascadia Code", monospace';
  ctx.fillText('λ = ' + lambda.toFixed(2), 385, 164);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('Cᵢ = 0.24｜ε = 0.04', 385, 188);
  ctx.fillText('当前交互状态', 385, 208);

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(42, 220);
  ctx.lineTo(338, 220);
  ctx.stroke();
  ctx.fillStyle = COLORS.orange;
  ctx.beginPath();
  ctx.arc(42 + 296 * gradientLevel, 220, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'butt';
}

export const PbfLambda: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gradientLevel, setGradientLevel] = useState(0.38);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);

  const epsilon = 0.04;
  const constraintError = 0.24;
  const denominator = gradientLevel * gradientLevel + epsilon;
  const lambda = -constraintError / denominator;
  const feedback =
    gradientLevel < 0.18
      ? '邻域梯度接近消失：epsilon 托住分母，避免 lambda 数值失控。'
      : gradientLevel < 0.72
        ? 'lambda 正在按邻域梯度强度归一化这份密度误差。'
        : '局部梯度响应更强：相同误差对应更小幅的 lambda。';
  const feedbackClass = gradientLevel < 0.18 ? 'bad' : gradientLevel >= 0.72 ? 'good' : '';

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
    drawScene(ctx, gradientLevel);
    canvas.classList.add('is-ready');
  }, [gradientLevel, visible]);

  const setFromPointer = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const logicalX = ((clientX - rect.left) * WIDTH) / rect.width;
    const next = clamp((logicalX - 42) / 296, 0, 1);
    setGradientLevel(Math.round(next * 100) / 100);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={
          '邻域梯度强度为 ' +
          gradientLevel.toFixed(2) +
          '，分母为 ' +
          denominator.toFixed(2) +
          '，lambda 为 ' +
          lambda.toFixed(2)
        }
        style={{ width: '100%', maxWidth: WIDTH, height: 'auto', touchAction: 'none' }}
        onPointerDown={(event) => {
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging) setFromPointer(event.clientX);
        }}
        onPointerUp={(event) => {
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => setDragging(false)}
      />
      <div className="ctrl">
        <label htmlFor="pbf-lambda-gradient">邻域梯度强度</label>
        <input
          id="pbf-lambda-gradient"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={gradientLevel}
          aria-valuetext={'归一化梯度强度 ' + gradientLevel.toFixed(2)}
          onChange={(event) => setGradientLevel(Number(event.target.value))}
        />
        <span className="val">{gradientLevel.toFixed(2)}</span>
      </div>
      <div className="metrics" aria-label="lambda 当前计算值">
        <div className="metric">
          <div className="l">梯度平方和</div>
          <div className="v">{(gradientLevel * gradientLevel).toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">分母（含 ε）</div>
          <div className="v">{denominator.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">lambda</div>
          <div className="v">{lambda.toFixed(2)}</div>
        </div>
      </div>
      <div className={'feedback ' + feedbackClass} aria-live="polite">
        {feedback}
      </div>
      <p style={{ fontSize: 13, color: COLORS.muted }}>
        梯度响应已归一化；ε 用于避免分母在梯度退化时接近零。
      </p>
    </div>
  );
};
