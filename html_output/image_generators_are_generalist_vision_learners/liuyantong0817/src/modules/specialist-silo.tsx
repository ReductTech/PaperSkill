import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Task = 'semantic' | 'depth' | 'normal';

interface SpecialistState {
  requestedTask: Task;
  selectedSpecialist: Task;
  attempted: boolean;
  startedAt: number;
  reducedMotion: boolean;
  isReady: boolean;
}

const TASK_NAMES: Record<Task, string> = {
  semantic: '语义分割',
  depth: '度量深度估计',
  normal: '表面法线估计',
};

const MODEL_NAMES: Record<Task, string> = {
  semantic: '分割专用',
  depth: '深度专用',
  normal: '法线专用',
};

const COLORS = {
  desk: '#f5f8f0',
  paper: '#ffffff',
  shadow: '#b8c9a7',
  contour: '#76906a',
  current: '#27446e',
  success: '#228d5c',
  failure: '#c43f52',
  emphasis: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, angle = -0.35) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = COLORS.current;
  roundedRect(ctx, -22, -4, 36, 8, 3);
  ctx.fill();
  ctx.fillStyle = '#f0c58d';
  ctx.beginPath();
  ctx.moveTo(14, -4);
  ctx.lineTo(23, 0);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.moveTo(20, -1.5);
  ctx.lineTo(24, 0);
  ctx.lineTo(20, 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCompact(ctx: CanvasRenderingContext2D, now: number, hero: boolean, reduced: boolean) {
  const W = 244;
  const H = 130;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.shadow;
  roundedRect(ctx, 16, 20, 160, 92, 9);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  roundedRect(ctx, 12, 16, 160, 92, 9);
  ctx.fill();

  ctx.strokeStyle = COLORS.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 80);
  ctx.bezierCurveTo(62, 42, 112, 102, 154, 50);
  ctx.stroke();

  ctx.strokeStyle = COLORS.failure;
  ctx.lineWidth = 4;
  ctx.setLineDash([5, 4]);
  roundedRect(ctx, 30, 35, 104, 52, 6);
  ctx.stroke();
  ctx.setLineDash([]);

  const duration = hero ? 3200 : 3000;
  const raw = reduced ? 0.92 : (now % duration) / duration;
  const move = clamp(raw / 0.6, 0, 1);
  const px = lerp(34, 142, easeInOutQuad(move));
  const py = 72 - Math.sin(move * Math.PI) * 24;
  drawPencil(ctx, px, py);

  if (raw > 0.5) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText('请求变了', 180, 34);
    ctx.fillText('模板没变', 180, 52);
    ctx.strokeStyle = COLORS.failure;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(196, 78);
    ctx.lineTo(218, 100);
    ctx.moveTo(218, 78);
    ctx.lineTo(196, 100);
    ctx.stroke();
    if (hero) {
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillText('接口不匹配', 166, 118);
    }
  }
}

function drawOutputTexture(ctx: CanvasRenderingContext2D, task: Task, x: number, y: number) {
  ctx.save();
  roundedRect(ctx, x, y, 104, 88, 8);
  ctx.clip();
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, y, 104, 88);
  if (task === 'semantic') {
    ctx.fillStyle = '#b9e4ce';
    ctx.fillRect(x, y + 40, 104, 48);
    ctx.fillStyle = '#cbd8ee';
    ctx.fillRect(x + 8, y + 10, 44, 30);
    ctx.fillStyle = '#f3c988';
    ctx.fillRect(x + 58, y + 18, 38, 22);
  } else if (task === 'depth') {
    const bands = ['#1f2937', '#27446e', '#228d5c', '#d97706', '#f5e86b'];
    bands.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(x + index * 21, y, 22, 88);
    });
  } else {
    ctx.fillStyle = '#dfe9f6';
    ctx.fillRect(x, y, 104, 88);
    ctx.strokeStyle = COLORS.aux;
    ctx.lineWidth = 2;
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const sx = x + 16 + col * 24;
        const sy = y + 18 + row * 25;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 8);
        ctx.lineTo(sx + 9, sy);
        ctx.lineTo(sx + 7, sy + 5);
        ctx.moveTo(sx + 9, sy);
        ctx.lineTo(sx + 4, sy + 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, 104, 88, 8);
  ctx.stroke();
}

function drawMain(ctx: CanvasRenderingContext2D, state: SpecialistState, now: number) {
  const W = 560;
  const H = 250;
  const match = state.requestedTask === state.selectedSpecialist;
  const elapsed = state.startedAt ? now - state.startedAt : 1000;
  const progress = state.reducedMotion ? 1 : clamp(elapsed / 640, 0, 1);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.paper;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, 18, 58, 124, 116, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('当前请求', 34, 82);
  ctx.fillStyle = COLORS.current;
  ctx.font = '700 14px system-ui, sans-serif';
  const requestLines = state.requestedTask === 'semantic' ? ['语义', '分割'] : state.requestedTask === 'depth' ? ['度量', '深度'] : ['表面', '法线'];
  ctx.fillText(requestLines[0], 46, 116);
  ctx.fillText(requestLines[1], 46, 137);

  const tasks: Task[] = ['semantic', 'depth', 'normal'];
  const islandY: Record<Task, number> = { semantic: 38, depth: 104, normal: 170 };
  tasks.forEach((task) => {
    const y = islandY[task];
    const selected = task === state.selectedSpecialist;
    ctx.fillStyle = selected ? '#eef4fb' : '#ffffff';
    ctx.strokeStyle = selected ? COLORS.current : COLORS.border;
    ctx.lineWidth = selected ? 3 : 1.5;
    roundedRect(ctx, 180, y, 196, 46, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = selected ? COLORS.current : COLORS.muted;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(MODEL_NAMES[task], 214, y + 28);
    ctx.strokeStyle = selected ? COLORS.current : COLORS.muted;
    ctx.beginPath();
    if (task === 'semantic') {
      ctx.rect(192, y + 13, 8, 8);
      ctx.rect(201, y + 22, 8, 8);
    } else if (task === 'depth') {
      ctx.moveTo(191, y + 30);
      ctx.lineTo(209, y + 16);
      ctx.moveTo(191, y + 34);
      ctx.lineTo(209, y + 20);
    } else {
      ctx.moveTo(194, y + 32);
      ctx.lineTo(207, y + 16);
      ctx.lineTo(203, y + 19);
      ctx.moveTo(207, y + 16);
      ctx.lineTo(206, y + 22);
    }
    ctx.stroke();
    if (selected) {
      ctx.fillStyle = COLORS.failure;
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillText('仅此任务', 316, y + 17);
    }
  });

  tasks.forEach((task) => {
    const y = islandY[task] + 23;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(142, 116);
    ctx.bezierCurveTo(154, 116, 164, y, 180, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const selectedY = islandY[state.selectedSpecialist] + 23;
  ctx.strokeStyle = match ? COLORS.success : COLORS.failure;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -progress * 28;
  ctx.beginPath();
  ctx.moveTo(142, 116);
  ctx.bezierCurveTo(156, 116, 164, selectedY, 180, selectedY);
  ctx.moveTo(376, selectedY);
  if (match) ctx.bezierCurveTo(396, selectedY, 402, 116, 414, 116);
  else ctx.lineTo(397, selectedY);
  ctx.stroke();
  ctx.setLineDash([]);

  drawPencil(ctx, lerp(152, 390, progress), lerp(116, selectedY, Math.min(progress * 1.4, 1)), -0.18);

  if (match) {
    drawOutputTexture(ctx, state.requestedTask, 428, 70);
    ctx.fillStyle = COLORS.success;
    ctx.beginPath();
    ctx.arc(516, 64, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(510, 64);
    ctx.lineTo(515, 69);
    ctx.lineTo(523, 59);
    ctx.stroke();
  } else {
    ctx.strokeStyle = COLORS.failure;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(394, selectedY - 10);
    ctx.lineTo(410, selectedY + 10);
    ctx.moveTo(410, selectedY - 10);
    ctx.lineTo(394, selectedY + 10);
    ctx.stroke();
    ctx.fillStyle = COLORS.failure;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText('接口中断', 438, 120);
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('块状区域＝语义', 22, 229);
  ctx.fillText('等距带＝深度', 205, 229);
  ctx.fillText('方向箭头＝法线', 390, 229);
}

function feedbackFor(state: SpecialistState) {
  const match = state.requestedTask === state.selectedSpecialist;
  if (!state.attempted) return '已回到示例：一项任务连接一台专用模型。';
  if (!match) {
    return `接口不匹配：当前请求是“${TASK_NAMES[state.requestedTask]}”，已连接的却是“${MODEL_NAMES[state.selectedSpecialist]}”。旧范式需要重新换模型。`;
  }
  if (state.requestedTask === 'semantic') return '已接通：语义分割请求由分割专用模型完成；这台模型仍只服务这一类任务。';
  if (state.requestedTask === 'depth') return '已接通：度量深度请求由深度专用模型完成；若改做分割，还要换模型。';
  return '已接通：表面法线请求由法线专用模型完成；模型权重和输出接口都没有共享。';
}

export const SpecialistSilo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = moduleId === 'ana' || chapterId === 'hero';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<SpecialistState>({
    requestedTask: 'semantic',
    selectedSpecialist: 'semantic',
    attempted: false,
    startedAt: 0,
    reducedMotion: false,
    isReady: false,
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setState((current) => ({ ...current, reducedMotion: media.matches }));
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = compact ? 244 : 560;
    const H = compact ? 130 : 250;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${W}px`;

    const tick = (now: number) => {
      if (compact) drawCompact(ctx, now, chapterId === 'hero', stateRef.current.reducedMotion);
      else drawMain(ctx, stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) {
        canvas.classList.add('is-ready');
        if (!stateRef.current.isReady) {
          stateRef.current = { ...stateRef.current, isReady: true };
        }
      }
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
  }, [chapterId, compact]);

  if (compact) {
    return (
      <canvas
        ref={canvasRef}
        width={244}
        height={130}
        role="img"
        aria-label="请求改变后，固定专用模板无法交付新的地图图层"
      />
    );
  }

  const feedback = feedbackFor(state);
  const match = state.requestedTask === state.selectedSpecialist;

  const chooseRequest = (task: Task) => setState((current) => ({
    ...current,
    requestedTask: task,
    attempted: true,
    startedAt: performance.now(),
  }));
  const chooseModel = (task: Task) => setState((current) => ({
    ...current,
    selectedSpecialist: task,
    attempted: true,
    startedAt: performance.now(),
  }));

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="paper-control-block">
        <div>
          <span className="paper-control-label">选择任务</span>
          <div className="paper-choice-group" role="group" aria-label="选择请求图层">
          {(['semantic', 'depth', 'normal'] as Task[]).map((task) => (
            <button
              key={task}
              type="button"
              aria-pressed={state.requestedTask === task}
              onClick={() => chooseRequest(task)}
            >
              {TASK_NAMES[task]}
            </button>
          ))}
          </div>
        </div>
        <div>
          <span className="paper-control-label">选择模型类型</span>
          <div className="paper-choice-group" role="group" aria-label="选择专用模型">
          {(['semantic', 'depth', 'normal'] as Task[]).map((task) => (
            <button
              key={task}
              type="button"
              aria-pressed={state.selectedSpecialist === task}
              onClick={() => chooseModel(task)}
            >
              {MODEL_NAMES[task]}
            </button>
          ))}
          </div>
        </div>
        <div className="paper-action-group" aria-label="路线操作">
          <button
            type="button"
            className="paper-reset-button"
            onClick={() => setState((current) => ({
              ...current,
              requestedTask: 'semantic',
              selectedSpecialist: 'semantic',
              attempted: false,
              startedAt: performance.now(),
            }))}
          >
            重置路线
          </button>
        </div>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={560}
        height={250}
        role="img"
        aria-label="三台专用模型彼此独立，只有任务与模型同类时路线连通。"
      />

      <div className={`feedback ${match ? 'good' : state.attempted ? 'bad' : ''}`} role="status" aria-live="polite">
        {feedback}
      </div>

      <p style={{ margin: 0, color: COLORS.muted, fontSize: 14 }}>
        Figure 1 只说明研究设置与任务覆盖，不单独证明性能；这里也不把专用模型描述成无效。
      </p>
    </div>
  );
};

export default SpecialistSilo;
