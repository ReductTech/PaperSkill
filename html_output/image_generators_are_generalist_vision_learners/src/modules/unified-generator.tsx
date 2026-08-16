import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Task = 'semantic' | 'instance' | 'depth' | 'normal';
type Phase = 'prompt' | 'model' | 'output';

interface UnifiedState {
  task: Task;
  phase: Phase;
  isPlaying: boolean;
  startedAt: number;
  reducedMotion: boolean;
  isReady: boolean;
}

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

const TASK_NAMES: Record<Task, string> = {
  semantic: '语义分割',
  instance: '实例分割',
  depth: '度量深度',
  normal: '表面法线',
};

const TASK_FEEDBACK: Record<Task, string> = {
  semantic: '模型没有换：新提示要求它输出按类别着色的 RGB 图层。',
  instance: '模型没有换：新提示要求同类中的不同个体使用不同颜色。',
  depth: '模型没有换：新提示要求颜色遵守可反解为距离的约定。',
  normal: '模型没有换：新提示要求 RGB 通道承载表面朝向。',
};

const PROMPT_TEXT: Record<Task, string> = {
  semantic: '请按给定颜色图例生成语义分割可视化',
  instance: '请为同类中的不同实例生成不同颜色的可视化',
  depth: '请生成可反解为米制距离的深度 RGB 可视化',
  normal: '请生成按通道承载表面朝向的 RGB 可视化',
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

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.24);
  ctx.fillStyle = COLORS.current;
  roundedRect(ctx, -18, -4, 32, 8, 3);
  ctx.fill();
  ctx.fillStyle = '#efc58f';
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

function drawTaskLayer(ctx: CanvasRenderingContext2D, task: Task, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, y, w, h);
  if (task === 'semantic') {
    ctx.fillStyle = '#c7ead6';
    ctx.fillRect(x, y + h * 0.5, w, h * 0.5);
    ctx.fillStyle = '#cad8ef';
    ctx.fillRect(x + 8, y + 10, w * 0.38, h * 0.35);
    ctx.fillStyle = '#f4c77f';
    ctx.fillRect(x + w * 0.56, y + 17, w * 0.32, h * 0.28);
  } else if (task === 'instance') {
    const xs = [0.1, 0.38, 0.68];
    const fills = ['#8fb3df', '#b59ae7', '#f0b56f'];
    xs.forEach((ratio, index) => {
      ctx.fillStyle = fills[index];
      roundedRect(ctx, x + w * ratio, y + 18 + index * 6, w * 0.2, h * 0.55, 5);
      ctx.fill();
      ctx.fillStyle = COLORS.text;
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillText(String(index + 1), x + w * ratio + 7, y + 34 + index * 6);
    });
  } else if (task === 'depth') {
    const gradient = ctx.createLinearGradient(x, y, x + w, y);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(0.28, '#27446e');
    gradient.addColorStop(0.52, '#228d5c');
    gradient.addColorStop(0.76, '#d97706');
    gradient.addColorStop(1, '#f9ef9d');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + (w / 5) * i, y);
      ctx.lineTo(x + (w / 5) * i, y + h);
      ctx.stroke();
    }
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, '#ef9aa8');
    gradient.addColorStop(0.5, '#8ed8ad');
    gradient.addColorStop(1, '#9bb9ee');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const sx = x + 16 + col * (w - 30) / 3;
        const sy = y + 23 + row * 35;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 8);
        ctx.lineTo(sx + 9, sy);
        ctx.lineTo(sx + 6, sy + 5);
        ctx.moveTo(sx + 9, sy);
        ctx.lineTo(sx + 4, sy + 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 8);
  ctx.stroke();
}

function drawHero(ctx: CanvasRenderingContext2D, now: number, reduced: boolean) {
  const W = 244;
  const H = 130;
  const raw = reduced ? 0.88 : (now % 3200) / 3200;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.paper;
  ctx.strokeStyle = COLORS.border;
  roundedRect(ctx, 8, 18, 56, 80, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.aux;
  roundedRect(ctx, 74, 26, 54, 32, 7);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText(raw < 0.35 ? '语义' : '深度', 89, 46);

  ctx.fillStyle = '#eef4fb';
  ctx.strokeStyle = COLORS.current;
  ctx.lineWidth = 3;
  roundedRect(ctx, 139, 24, 62, 42, 13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.current;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('同一模型', 150, 49);

  const task: Task = raw < 0.35 ? 'semantic' : 'depth';
  drawTaskLayer(ctx, task, 156, 78, 76, 42);

  ctx.strokeStyle = COLORS.current;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 62);
  ctx.lineTo(139, 45);
  ctx.lineTo(194, 78);
  ctx.stroke();
  const travel = clamp((raw - 0.22) / 0.38, 0, 1);
  const px = travel < 0.6 ? lerp(66, 144, travel / 0.6) : lerp(144, 198, (travel - 0.6) / 0.4);
  const py = travel < 0.6 ? lerp(62, 45, travel / 0.6) : lerp(45, 78, (travel - 0.6) / 0.4);
  drawPencil(ctx, px, py);

  if (raw > 0.58) {
    ctx.fillStyle = 'rgba(34, 141, 92, 0.10)';
    ctx.strokeStyle = COLORS.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(220, 22, 19, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COLORS.success;
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('可解码', 220, 25);
    ctx.textAlign = 'left';
  }
}

function drawInputMap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#fbfdf8';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = COLORS.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + h - 18);
  ctx.bezierCurveTo(x + 30, y + 30, x + w - 42, y + h - 10, x + w - 12, y + 18);
  ctx.stroke();
  ctx.fillStyle = '#d8e8d1';
  roundedRect(ctx, x + 12, y + 15, 34, 24, 5);
  ctx.fill();
}

function drawMain(ctx: CanvasRenderingContext2D, state: UnifiedState, now: number) {
  const W = 560;
  const H = 250;
  const elapsed = state.startedAt ? now - state.startedAt : 900;
  const overall = state.reducedMotion ? 1 : clamp(elapsed / 880, 0, 1);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);

  drawInputMap(ctx, 18, 65, 114, 104);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('输入', 60, 58);

  ctx.fillStyle = '#f3efff';
  ctx.strokeStyle = COLORS.aux;
  ctx.lineWidth = 2;
  roundedRect(ctx, 146, 72, 100, 88, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.aux;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('任务提示', 169, 94);
  ctx.fillStyle = COLORS.text;
  ctx.font = '11px system-ui, sans-serif';
  const taskLine = state.task === 'semantic' ? '按类别着色' : state.task === 'instance' ? '给实例分色' : state.task === 'depth' ? '编码米制距离' : '编码表面朝向';
  ctx.fillText(taskLine, 162, 124);

  ctx.fillStyle = '#edf3fa';
  ctx.strokeStyle = COLORS.current;
  ctx.lineWidth = 3;
  roundedRect(ctx, 264, 64, 126, 104, 24);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = COLORS.current;
  ctx.lineWidth = 2;
  roundedRect(ctx, 273, 73, 108, 86, 18);
  ctx.stroke();
  ctx.fillStyle = COLORS.current;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText('Vision Banana', 281, 112);
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('🔒 共享权重', 290, 137);

  drawTaskLayer(ctx, state.task, 420, 67, 122, 98);
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('可解码 RGB 图层', 429, 58);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(132, 116);
  ctx.lineTo(146, 116);
  ctx.moveTo(246, 116);
  ctx.lineTo(264, 116);
  ctx.moveTo(390, 116);
  ctx.lineTo(420, 116);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = COLORS.current;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const routeEnd = lerp(132, 420, overall);
  ctx.moveTo(132, 116);
  ctx.lineTo(routeEnd, 116);
  ctx.stroke();
  drawPencil(ctx, routeEnd, 116);

  if (overall > 0.72) {
    ctx.fillStyle = 'rgba(34, 141, 92, 0.10)';
    ctx.strokeStyle = COLORS.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(524, 184, 24, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COLORS.success;
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('可解码', 524, 188);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('输入 → 提示 → 同一模型 → RGB 输出', 166, 226);
}

export const UnifiedGenerator: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const hero = chapterId === 'hero';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<UnifiedState>({
    task: 'semantic',
    phase: 'output',
    isPlaying: false,
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
    if (!state.isPlaying) return;
    if (state.reducedMotion) {
      setState((current) => ({ ...current, phase: 'output', isPlaying: false }));
      return;
    }
    const modelTimer = window.setTimeout(() => setState((current) => ({ ...current, phase: 'model' })), 180);
    const outputTimer = window.setTimeout(() => setState((current) => ({ ...current, phase: 'output' })), 640);
    const finishTimer = window.setTimeout(() => setState((current) => ({ ...current, phase: 'output', isPlaying: false })), 880);
    return () => {
      window.clearTimeout(modelTimer);
      window.clearTimeout(outputTimer);
      window.clearTimeout(finishTimer);
    };
  }, [state.isPlaying, state.startedAt, state.reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = hero ? 244 : 560;
    const H = hero ? 130 : 250;
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
      if (hero) drawHero(ctx, now, stateRef.current.reducedMotion);
      else drawMain(ctx, stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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
  }, [hero]);

  if (hero) {
    return (
      <canvas
        ref={canvasRef}
        width={244}
        height={130}
        role="img"
        aria-label="同一个 Vision Banana 根据任务提示生成不同的可解码 RGB 图层"
      />
    );
  }

  const play = (task: Task) => setState((current) => ({
    ...current,
    task,
    phase: current.reducedMotion ? 'output' : 'prompt',
    isPlaying: !current.reducedMotion,
    startedAt: performance.now(),
  }));
  const finalFeedback = `${TASK_FEEDBACK[state.task]} 变化的是任务说明与输出约定，不是为每项任务重建一台模型。`;
  const tasks: Task[] = ['semantic', 'instance', 'depth', 'normal'];
  const moveTaskFocus = (event: React.KeyboardEvent<HTMLButtonElement>, task: Task) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tasks.indexOf(task);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tasks.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tasks.length) % tasks.length;
    play(tasks[nextIndex]);
    const group = event.currentTarget.parentElement;
    window.requestAnimationFrame(() => (group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex])?.focus());
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="paper-paradigm-grid" aria-label="LLM 与 Vision Banana 的训练范式对照">
        <div>
          <span className="paper-paradigm-label">大语言模型</span>
          <div className="paper-paradigm-stage">
            <strong>文本生成预训练</strong>
            <span>形成通用语言能力</span>
          </div>
          <b aria-hidden="true">→</b>
          <div className="paper-paradigm-stage">
            <strong>指令微调</strong>
            <span>学习任务遵循与文本格式</span>
          </div>
        </div>
        <div className="paper-paradigm-current">
          <span className="paper-paradigm-label">Vision Banana</span>
          <div className="paper-paradigm-stage">
            <strong>图像生成预训练</strong>
            <span>形成可迁移视觉表征</span>
          </div>
          <b aria-hidden="true">→</b>
          <div className="paper-paradigm-stage">
            <strong>轻量指令微调</strong>
            <span>学习任务提示与 RGB 格式</span>
          </div>
        </div>
      </div>
      <p className="note">论文类比的是“生成式预训练打基础、指令微调教交付”的角色分工，不是声称语言模型与图像生成器具有相同内部架构。</p>
      <div className="paper-control-block">
        <span className="paper-control-label">选择视觉任务，观察同一模型如何改变交付格式</span>
        <div className="paper-choice-group" role="radiogroup" aria-label="选择任务">
          {tasks.map((task) => (
            <button
              key={task}
              type="button"
              role="radio"
              aria-checked={state.task === task}
              tabIndex={state.task === task ? 0 : -1}
              onKeyDown={(event) => moveTaskFocus(event, task)}
              onClick={() => play(task)}
            >
              {TASK_NAMES[task]}
            </button>
          ))}
        </div>
        <div className="paper-action-group" aria-label="演示操作">
          <button type="button" onClick={() => play(state.task)}>
            演示这一任务
          </button>
        </div>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={560}
        height={250}
        role="img"
        aria-label={`当前任务为${TASK_NAMES[state.task]}；输入、提示、同一模型与 RGB 输出依次连接。`}
      />

      <p style={{ margin: 0, color: COLORS.text }}><strong>当前提示：</strong>{PROMPT_TEXT[state.task]}</p>

      <div className="feedback good" role="status" aria-live="polite">
        {finalFeedback}
      </div>

      <p style={{ margin: 0, color: COLORS.muted, fontSize: 14 }}>
        论文没有披露视觉任务数据的精确混合比例，也没有公开 Nano Banana Pro 的完整内部架构。
      </p>
    </div>
  );
};

export default UnifiedGenerator;
