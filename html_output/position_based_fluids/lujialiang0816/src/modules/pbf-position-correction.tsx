import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

type Point = { x: number; y: number };
type Status = 'ready' | 'moved' | 'stepping' | 'near' | 'limit' | 'paused' | 'clamped';

const CENTER = { x: 270, y: 120 };
const RX = 110;
const RY = 68;
const START = { x: 402, y: 91 };

function clampPoint(point: Point): Point {
  return { x: Math.max(100, Math.min(460, point.x)), y: Math.max(48, Math.min(192, point.y)) };
}

function evaluate(point: Point) {
  const dx = point.x - CENTER.x;
  const dy = point.y - CENTER.y;
  const q = Math.max(0.0001, Math.sqrt((dx * dx) / (RX * RX) + (dy * dy) / (RY * RY)));
  const constraint = q - 1;
  const gradient = q < 0.001
    ? { x: 1 / RX, y: 0 }
    : { x: dx / (RX * RX * q), y: dy / (RY * RY * q) };
  const normSq = Math.max(0.000001, gradient.x * gradient.x + gradient.y * gradient.y);
  const scale = -0.72 * constraint / normSq;
  const rawDelta = { x: gradient.x * scale, y: gradient.y * scale };
  const length = Math.hypot(rawDelta.x, rawDelta.y);
  const cap = length > 46 ? 46 / length : 1;
  return { constraint, gradient, delta: { x: rawDelta.x * cap, y: rawDelta.y * cap } };
}

function arrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, dashed = false) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash(dashed ? [7, 5] : []);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - Math.cos(angle - 0.55) * 10, to.y - Math.sin(angle - 0.55) * 10);
  ctx.lineTo(to.x - Math.cos(angle + 0.55) * 10, to.y - Math.sin(angle + 0.55) * 10);
  ctx.closePath();
  ctx.fill();
}

export const PbfPositionCorrection: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef(true);
  const [position, setPosition] = useState<Point>(START);
  const [iteration, setIteration] = useState(0);
  const [auto, setAuto] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>('ready');
  const [history, setHistory] = useState<Point[]>([]);
  const state = useMemo(() => evaluate(position), [position]);

  const performStep = useCallback(() => {
    const current = evaluate(position);
    if (Math.abs(current.constraint) <= 0.04) {
      setStatus('near');
      setAuto(false);
      return;
    }
    if (iteration >= 4) {
      setStatus('limit');
      setAuto(false);
      return;
    }
    const next = clampPoint({ x: position.x + current.delta.x, y: position.y + current.delta.y });
    const nextIteration = iteration + 1;
    setHistory((items) => [...items.slice(-3), position]);
    setPosition(next);
    setIteration(nextIteration);
    const nextConstraint = Math.abs(evaluate(next).constraint);
    if (nextConstraint <= 0.04) {
      setStatus('near');
      setAuto(false);
    } else if (nextIteration >= 4) {
      setStatus('limit');
      setAuto(false);
    } else {
      setStatus('stepping');
    }
  }, [iteration, position]);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => {
      if (visibleRef.current) performStep();
    }, 520);
    return () => window.clearInterval(timer);
  }, [auto, performStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 240);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const draw = () => {
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = '#f4f9ff';
      ctx.fillRect(0, 0, 560, 240);
      ctx.fillStyle = 'rgba(184,201,167,0.22)';
      ctx.beginPath();
      ctx.ellipse(CENTER.x, CENTER.y, RX + 26, RY + 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(CENTER.x, CENTER.y, RX, RY, 0, 0, Math.PI * 2);
      ctx.stroke();

      const gradLength = Math.max(0.0001, Math.hypot(state.gradient.x, state.gradient.y));
      const unit = { x: state.gradient.x / gradLength, y: state.gradient.y / gradLength };
      const tangent = { x: -unit.y, y: unit.x };
      ctx.strokeStyle = '#9fb0c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(position.x - tangent.x * 52, position.y - tangent.y * 52);
      ctx.lineTo(position.x + tangent.x * 52, position.y + tangent.y * 52);
      ctx.stroke();

      arrow(ctx, position, { x: position.x + unit.x * 48, y: position.y + unit.y * 48 }, '#7c3aed');
      arrow(ctx, position, { x: position.x + state.delta.x, y: position.y + state.delta.y }, '#228d5c', true);
      history.forEach((point, index) => {
        ctx.fillStyle = `rgba(34,141,92,${0.22 + index * 0.16})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(478, 44);
      ctx.lineTo(478, 194);
      ctx.stroke();
      const residual = Math.min(1, Math.abs(state.constraint));
      ctx.fillStyle = residual <= 0.04 ? '#228d5c' : iteration >= 4 ? '#c43f52' : '#27446e';
      ctx.fillRect(466, 194 - residual * 140, 24, residual * 140);
      ctx.font = '13px Segoe UI';
      ctx.fillStyle = '#7c3aed';
      ctx.fillText('∇C', Math.min(410, position.x + unit.x * 51), Math.max(18, position.y + unit.y * 51));
      ctx.fillStyle = '#228d5c';
      ctx.fillText('Δpᵢ', Math.min(410, position.x + state.delta.x + 8), Math.max(18, position.y + state.delta.y));
      ctx.fillStyle = '#68778f';
      ctx.fillText('残余示意', 445, 28);
      ctx.fillText(`第 ${iteration} 步`, 447, 221);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    draw();
    return observeCanvas(canvas, () => { visibleRef.current = true; draw(); }, () => { visibleRef.current = false; });
  }, [history, iteration, position, state]);

  const resetMoved = (point: Point, nextStatus: Status = 'moved') => {
    setPosition(clampPoint(point));
    setIteration(0);
    setHistory([]);
    setAuto(false);
    setStatus(nextStatus);
  };
  const moveBy = (dx: number, dy: number) => resetMoved({ x: position.x + dx, y: position.y + dy });
  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const raw = { x: (event.clientX - rect.left) * 560 / rect.width, y: (event.clientY - rect.top) * 240 / rect.height };
    const next = clampPoint(raw);
    resetMoved(next, next.x !== raw.x || next.y !== raw.y ? 'clamped' : 'moved');
  };

  const feedback = status === 'ready'
    ? '当前位置偏离约束；沿 ∇C 的反方向可得到一次局部近似修正。'
    : status === 'moved'
      ? '已设置新的预测位置，请执行一次局部线性化修正。'
      : status === 'clamped'
        ? '已限制在示意区域内；该边界不是论文碰撞模型。'
        : status === 'near'
          ? '位置已接近示意约束；真实求解仍取决于邻域与重复迭代。'
          : status === 'limit'
            ? '教学步数已到上限：局部线性化不保证一步消除非线性误差。'
            : status === 'paused'
              ? '连续演示已暂停，可单步检查下一次 Δpᵢ。'
              : `第 ${iteration} 个教学步：已沿约束梯度更新位置，残余继续重新估计。`;
  const disabled = Math.abs(state.constraint) <= 0.04 || iteration >= 4;

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`第 ${chapterId} 章模块 ${moduleId}：已执行 ${iteration} 个教学步，约束残余绝对值为 ${Math.abs(state.constraint).toFixed(3)}。`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => { if (dragging) updateFromPointer(event); }}
        onPointerUp={(event) => {
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny" disabled={disabled} onClick={performStep}>迭代一步</button>
        <button
          type="button"
          className="tiny ghost"
          disabled={disabled && !auto}
          onClick={() => {
            if (auto) {
              setAuto(false);
              setStatus('paused');
            } else {
              setAuto(true);
              setStatus('stepping');
            }
          }}
        >
          {auto ? '暂停' : '连续演示'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => resetMoved(START, 'ready')}>重置偏差</button>
      </div>
      <div className="step-ctrl" aria-label="预测位置方向操作">
        <button type="button" className="tiny ghost" onClick={() => moveBy(-8, 0)}>左移</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(8, 0)}>右移</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(0, -8)}>上移</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(0, 8)}>下移</button>
      </div>
      <div className="metrics">
        <div className="metric"><div className="l">教学步</div><div className="v">{iteration}/4</div></div>
        <div className="metric"><div className="l">|C| 残余</div><div className="v">{Math.abs(state.constraint).toFixed(3)}</div></div>
        <div className="metric"><div className="l">|Δpᵢ|</div><div className="v">{Math.hypot(state.delta.x, state.delta.y).toFixed(1)}</div></div>
      </div>
      <p className="step-desc">α=0.72、四步上限与 |C|≤0.04 都只服务于动效，不是论文参数或收敛标准。</p>
      <p className={`feedback ${status === 'near' ? 'good' : status === 'limit' ? 'bad' : ''}`} aria-live="polite">{feedback}</p>
    </div>
  );
};
