import React, { useEffect, useRef, useState } from 'react';
import { clamp, dist, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import './sailing-kit';

const W = 560;
const H = 250;
const COLORS = {
  sea: '#f5f8f0',
  coast: '#76906a',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

type Point = { x: number; y: number };
type Phase = 'matched' | 'conflict' | 'geometry' | 'association' | 'hmsg' | 'temporal' | 'invalid';
type Model = {
  objectPos: Point;
  committedPos: Point;
  memoryPos: Point;
  phase: Phase;
  isDragging: boolean;
  dragOrigin: Point | null;
};

const START: Point = { x: 96, y: 132 };
const INITIAL: Model = {
  objectPos: START,
  committedPos: START,
  memoryPos: START,
  phase: 'matched',
  isDragging: false,
  dragOrigin: null,
};

const PHASE_LABELS: Record<Phase, string> = {
  matched: '一致',
  conflict: '发现冲突',
  geometry: '局部几何刷新',
  association: '实例关联',
  hmsg: 'HMSG 局部刷新',
  temporal: '时序追加',
  invalid: '位置无效',
};

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCup(ctx: CanvasRenderingContext2D, point: Point, color: string, selected = false) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.fillStyle = selected ? '#fff7ed' : '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 3 : 2;
  roundedRect(ctx, -14, -13, 25, 27, 5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(12, -2, 8, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('杯子', -1, 28);
  ctx.restore();
}

function drawCross(ctx: CanvasRenderingContext2D, point: Point) {
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(point.x - 8, point.y - 8);
  ctx.lineTo(point.x + 8, point.y + 8);
  ctx.moveTo(point.x + 8, point.y - 8);
  ctx.lineTo(point.x - 8, point.y + 8);
  ctx.stroke();
}

function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, tone: 'neutral' | 'active' | 'updated') {
  const color = tone === 'updated' ? COLORS.green : tone === 'active' ? COLORS.blue : COLORS.line;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = tone === 'neutral' ? 1.2 : 2.4;
  roundedRect(ctx, x, y, 66, 24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tone === 'neutral' ? COLORS.muted : COLORS.ink;
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + 33, y + 16);
}

function drawScene(ctx: CanvasRenderingContext2D, model: Model) {
  const phaseIndex = ['matched', 'conflict', 'geometry', 'association', 'hmsg', 'temporal'].indexOf(model.phase);
  const isConflict = model.phase === 'conflict' || model.phase === 'invalid';
  const isUpdated = phaseIndex >= 2;
  const graphUpdated = phaseIndex >= 4;
  const traceUpdated = phaseIndex >= 5;
  const mapPos = { x: model.memoryPos.x + 180, y: model.memoryPos.y };
  const old = model.dragOrigin ? { x: model.dragOrigin.x + 180, y: model.dragOrigin.y } : mapPos;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.sea;
  ctx.fillRect(0, 0, W, H);

  const regions: Array<[number, number, number, number, string]> = [
    [16, 18, 164, 214, '当前观察'],
    [194, 18, 174, 214, '局部地图'],
    [382, 18, 162, 132, 'HMSG 子图'],
    [382, 164, 162, 68, '时序痕迹'],
  ];
  regions.forEach(([x, y, w, h, label]) => {
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    roundedRect(ctx, x, y, w, h, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 10, y + 17);
  });

  ctx.fillStyle = '#eef7eb';
  ctx.strokeStyle = COLORS.coast;
  ctx.setLineDash([5, 4]);
  roundedRect(ctx, 72, 88, 84, 92, 8);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.coast;
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('可观察区', 82, 102);
  drawCup(ctx, model.objectPos, model.isDragging ? COLORS.orange : COLORS.blue, model.isDragging);

  ctx.strokeStyle = COLORS.coast;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(210, 68);
  ctx.lineTo(350, 68);
  ctx.moveTo(214, 184);
  ctx.quadraticCurveTo(280, 154, 350, 190);
  ctx.stroke();
  ctx.fillStyle = COLORS.muted;
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('其他地图内容保持不变', 214, 216);

  if (model.dragOrigin && isUpdated) {
    ctx.strokeStyle = COLORS.red;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(old.x, old.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawCross(ctx, old);
  }
  if (isConflict) {
    drawCup(ctx, mapPos, COLORS.red);
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(model.objectPos.x + 18, model.objectPos.y);
    ctx.lineTo(mapPos.x - 18, mapPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    drawCup(ctx, mapPos, isUpdated ? COLORS.green : COLORS.blue);
  }
  if (isUpdated) {
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mapPos.x, mapPos.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.green;
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('局部刷新', mapPos.x, mapPos.y - 31);
  }

  const graphTone = graphUpdated ? 'updated' : isConflict ? 'active' : 'neutral';
  ctx.strokeStyle = graphUpdated ? COLORS.green : COLORS.line;
  ctx.lineWidth = graphUpdated ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(417, 57);
  ctx.lineTo(449, 81);
  ctx.lineTo(482, 105);
  ctx.stroke();
  drawNode(ctx, 390, 44, '房间 A', graphTone);
  drawNode(ctx, 423, 73, '视图 2', graphTone);
  drawNode(ctx, 456, 102, '杯子 cup-17', graphTone);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(417, 57);
  ctx.lineTo(510, 53);
  ctx.stroke();
  drawNode(ctx, 474, 41, '视图 1 / 椅子', 'neutral');
  ctx.fillStyle = COLORS.muted;
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('保持不变', 480, 78);

  ctx.fillStyle = traceUpdated ? COLORS.blue : COLORS.muted;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  if (traceUpdated) {
    ctx.fillText('观察冲突', 393, 192);
    ctx.fillText('刷新 cup-17', 393, 207);
    ctx.fillText('记录恢复证据', 393, 222);
  } else {
    ctx.fillText('尚无新的更新记录', 393, 198);
  }

  ctx.fillStyle = model.phase === 'temporal' ? COLORS.green : model.phase === 'conflict' || model.phase === 'invalid' ? COLORS.red : COLORS.blue;
  ctx.font = '800 10px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(PHASE_LABELS[model.phase], 542, 244);
}

function insideObservation(point: Point) {
  return point.x >= 72 && point.x <= 156 && point.y >= 88 && point.y <= 180;
}

function isBusy(phase: Phase) {
  return phase === 'geometry' || phase === 'association' || phase === 'hmsg';
}

export const Ch9MemoryUpdateLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const visibleRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const stateRef = useRef<Model>(INITIAL);
  const [model, setModelState] = useState<Model>(INITIAL);
  const [feedback, setFeedback] = useState({
    text: '当前观察与记忆一致。拖动杯子，制造一次可观察的位置变化。',
    cls: 'good',
  });

  const updateModel = (updater: (previous: Model) => Model) => {
    setModelState((previous) => {
      const next = updater(previous);
      stateRef.current = next;
      return next;
    });
  };

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

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
    const render = () => drawScene(ctx, stateRef.current);
    renderRef.current = render;
    const start = () => {
      visibleRef.current = true;
      render();
      canvas.classList.add('is-ready');
    };
    const stop = () => { visibleRef.current = false; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      clearTimers();
      renderRef.current = null;
      disconnect();
    };
  }, []);

  useEffect(() => {
    stateRef.current = model;
    if (visibleRef.current) renderRef.current?.();
  }, [model]);

  const reset = () => {
    clearTimers();
    stateRef.current = INITIAL;
    setModelState(INITIAL);
    setFeedback({ text: '场景已恢复到观察与记忆一致的初始状态；这不会产生新的论文指标。', cls: '' });
  };

  const cancelMove = (message = '这个位置不在当前可观察区域内，不能据此刷新记忆；物体已回到上一次确认位置。') => {
    const current = stateRef.current;
    const settledPhase: Phase = current.committedPos.x === START.x && current.committedPos.y === START.y ? 'matched' : 'temporal';
    updateModel((previous) => ({
      ...previous,
      objectPos: previous.committedPos,
      memoryPos: previous.committedPos,
      phase: settledPhase,
      isDragging: false,
      dragOrigin: null,
    }));
    setFeedback({ text: message, cls: message.startsWith('这个位置') ? 'bad' : '' });
  };

  const startUpdate = (point: Point) => {
    clearTimers();
    const origin = stateRef.current.committedPos;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 50 : 450;
    updateModel((previous) => ({
      ...previous,
      objectPos: point,
      committedPos: point,
      memoryPos: point,
      phase: 'geometry',
      isDragging: false,
      dragOrigin: origin,
    }));
    setFeedback({ text: '第 1 步：先在已有几何记忆中对齐当前观察，只刷新冲突位置附近的点和体素。', cls: '' });

    timersRef.current.push(window.setTimeout(() => {
      updateModel((previous) => ({ ...previous, phase: 'association' }));
      setFeedback({ text: '第 2 步：新观察与持久实例 cup-17 进行关联；这里演示的是机制，不是身份稳定率。', cls: '' });
    }, delay));
    timersRef.current.push(window.setTimeout(() => {
      updateModel((previous) => ({ ...previous, phase: 'hmsg' }));
      setFeedback({ text: '第 3 步：只刷新杯子、父房间、可见视图和局部关系，未受影响的 HMSG 分支保持不变。', cls: '' });
    }, delay * 2));
    timersRef.current.push(window.setTimeout(() => {
      updateModel((previous) => ({ ...previous, phase: 'temporal' }));
      setFeedback({ text: '第 4 步：空间记录已经局部更新，时序记忆同时追加观察、状态、验证与恢复决定。', cls: 'good' });
    }, delay * 3));
  };

  const commitCurrent = () => {
    const current = stateRef.current;
    if (isBusy(current.phase)) {
      setFeedback({ text: '本轮局部更新尚未完成，请先看清空间刷新与时序追加的对应关系。', cls: '' });
      return;
    }
    const moved = dist(current.objectPos.x, current.objectPos.y, current.committedPos.x, current.committedPos.y);
    if (moved < 18) {
      cancelMove('位移太小，尚不足以形成一次明确的场景变化；记忆保持原样。');
      return;
    }
    if (!insideObservation(current.objectPos)) {
      cancelMove();
      return;
    }
    startUpdate(current.objectPos);
  };

  const moveBy = (dx: number, dy: number) => {
    const current = stateRef.current;
    if (isBusy(current.phase)) {
      setFeedback({ text: '本轮局部更新尚未完成，请先看清空间刷新与时序追加的对应关系。', cls: '' });
      return;
    }
    updateModel((previous) => ({
      ...previous,
      objectPos: {
        x: clamp(previous.objectPos.x + dx, 58, 164),
        y: clamp(previous.objectPos.y + dy, 78, 190),
      },
      phase: 'conflict',
      isDragging: false,
      dragOrigin: previous.dragOrigin ?? previous.committedPos,
    }));
    setFeedback({ text: '现实位置已经变化，旧记忆仍指向原处；这是一条需要处理的冲突观察。', cls: 'bad' });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 16 : 8;
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveBy(-step, 0); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveBy(step, 0); }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveBy(0, -step); }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveBy(0, step); }
    if (event.key === 'Enter') { event.preventDefault(); commitCurrent(); }
    if (event.key === 'Escape') { event.preventDefault(); cancelMove('未提交的移动已取消，记忆保持在上一次确认位置。'); }
  };

  const pointerPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * W / rect.width,
      y: (event.clientY - rect.top) * H / rect.height,
    };
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        role="application"
        aria-label={`记忆更新画布。当前阶段：${PHASE_LABELS[model.phase]}。杯子位置 ${Math.round(model.objectPos.x)}, ${Math.round(model.objectPos.y)}。可用方向键移动，Enter 提交，Escape 取消。`}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          if (isBusy(stateRef.current.phase)) {
            setFeedback({ text: '本轮局部更新尚未完成，请先看清空间刷新与时序追加的对应关系。', cls: '' });
            return;
          }
          const point = pointerPoint(event);
          const cup = stateRef.current.objectPos;
          if (dist(point.x, point.y, cup.x, cup.y) > 25) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateModel((previous) => ({ ...previous, isDragging: true, dragOrigin: previous.committedPos }));
        }}
        onPointerMove={(event) => {
          if (!stateRef.current.isDragging) return;
          const raw = pointerPoint(event);
          const point = { x: clamp(raw.x, 58, 164), y: clamp(raw.y, 78, 190) };
          const wasConflict = stateRef.current.phase === 'conflict';
          updateModel((previous) => ({ ...previous, objectPos: point, phase: 'conflict' }));
          if (!wasConflict) {
            setFeedback({ text: '现实位置已经变化，旧记忆仍指向原处；这是一条需要处理的冲突观察。', cls: 'bad' });
          }
        }}
        onPointerUp={(event) => {
          if (!stateRef.current.isDragging) return;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          updateModel((previous) => ({ ...previous, isDragging: false }));
          window.setTimeout(commitCurrent, 0);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          cancelMove('未提交的移动已取消，记忆保持在上一次确认位置。');
        }}
      />
      <div className="step-ctrl" role="group" aria-label="移动杯子的键盘等价控件">
        <span className="step-label"><b>移动杯子</b></span>
        <button type="button" className="tiny ghost" onClick={() => moveBy(-8, 0)} aria-label="向左移动杯子">←</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(0, -8)} aria-label="向上移动杯子">↑</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(0, 8)} aria-label="向下移动杯子">↓</button>
        <button type="button" className="tiny ghost" onClick={() => moveBy(8, 0)} aria-label="向右移动杯子">→</button>
        <button type="button" className="tiny" onClick={commitCurrent} disabled={isBusy(model.phase)}>提交位置</button>
        <button type="button" className="tiny ghost" onClick={() => cancelMove('未提交的移动已取消，记忆保持在上一次确认位置。')} disabled={isBusy(model.phase)}>取消移动</button>
        <button type="button" className="tiny ghost" onClick={reset}>恢复初始场景</button>
      </div>
      <div className="chip-row" aria-label="局部更新阶段">
        {(['matched', 'conflict', 'geometry', 'association', 'hmsg', 'temporal'] as Phase[]).map((phase) => (
          <span key={phase} className={`chip ${model.phase === phase ? 'selected' : ''}`} aria-current={model.phase === phase ? 'step' : undefined}>
            {PHASE_LABELS[phase]}
          </span>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} role="status" aria-live="polite">{feedback.text}</div>
      <p className="step-desc">论文展示了局部更新与实例关联机制，但没有单独报告更新速度或身份稳定性的标量指标。教学动画时长不代表论文报告的更新耗时。</p>
    </div>
  );
};

export default Ch9MemoryUpdateLab;
