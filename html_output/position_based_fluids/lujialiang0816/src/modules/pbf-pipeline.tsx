import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

type Stage = 'predict' | 'neighbors' | 'project' | 'velocity' | 'finish';

interface StageInfo {
  key: Stage;
  short: string;
  input: string;
  operation: string;
  output: string;
  feedback: string;
}

const STAGES: StageInfo[] = [
  {
    key: 'predict',
    short: '预测位置',
    input: '旧位置与当前运动',
    operation: '得到待修正的位置',
    output: '预测位置',
    feedback: '预测位置：先根据当前运动得到待修正的位置。',
  },
  {
    key: 'neighbors',
    short: '邻居搜索',
    input: '本步预测位置',
    operation: '每时间步搜索一次',
    output: '邻居集合',
    feedback: '邻居搜索：每个时间步执行一次；迭代内重新评估距离与约束。',
  },
  {
    key: 'project',
    short: 'Jacobi 投影',
    input: '上一轮位置与邻域',
    operation: '并行求 λ 与 Δp，处理碰撞',
    output: '下一轮位置',
    feedback: 'Jacobi 投影：各粒子独立读取上一轮状态，计算 lambda 与位移后统一写回，并处理碰撞。',
  },
  {
    key: 'velocity',
    short: '更新速度',
    input: '修正前后位置',
    operation: '由位置变化恢复速度',
    output: '新速度',
    feedback: '速度更新：由修正后的位置变化得到新速度。',
  },
  {
    key: 'finish',
    short: '可选收尾',
    input: '新速度',
    operation: '涡量约束 / XSPH',
    output: '收尾后的速度',
    feedback: '可选收尾：随后施加涡量约束与 XSPH 黏性。',
  },
];

const C = {
  bg: '#f4f9ff',
  guide: '#0b4f9f',
  good: '#228d5c',
  user: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  panel: '#ffffff',
};

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(a - Math.PI / 6), y2 - 7 * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(a + Math.PI / 6), y2 - 7 * Math.sin(a + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string, fill: string, double = false) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  if (double) ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
}

export const PbfPipeline: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = STAGES[activeIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 240);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let running = false;
    let frame = 0;

    const draw = (time = 0) => {
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, 560, 240);

      STAGES.forEach((stage, index) => {
        const x = 16 + index * 108;
        const selected = index === activeIndex;
        box(ctx, x, 18, 96, 46, selected ? C.guide : C.line, selected ? '#eaf0f8' : C.panel);
        if (selected) {
          ctx.strokeStyle = C.user;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + 8, 61);
          ctx.lineTo(x + 88, 61);
          ctx.stroke();
        }
        ctx.fillStyle = selected ? C.guide : C.muted;
        ctx.font = `${selected ? '700 ' : ''}12px Segoe UI`;
        ctx.textAlign = 'center';
        ctx.fillText(stage.short, x + 48, 46);
        if (index < STAGES.length - 1) drawArrow(ctx, x + 96, 41, x + 106, 41, C.line, 1.5);
      });

      ctx.textAlign = 'start';
      if (active.key === 'project') {
        const phase = reduced ? 2 : Math.floor((time / 933) % 3);
        const phaseLabels = ['① 并行读取', '② 独立计算', '③ 统一写回'];
        phaseLabels.forEach((label, index) => {
          ctx.fillStyle = index === phase ? (index === 2 ? C.good : C.guide) : C.muted;
          ctx.font = `${index === phase ? '700 ' : ''}13px Segoe UI`;
          ctx.fillText(label, 34 + index * 176, 88);
        });

        for (let lane = 0; lane < 4; lane += 1) {
          const y = 112 + lane * 25;
          ctx.strokeStyle = '#dfe5ee';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(34, y);
          ctx.lineTo(526, y);
          ctx.stroke();

          box(ctx, 48, y - 9, 78, 18, phase === 0 ? C.guide : C.line, C.panel);
          ctx.fillStyle = phase === 0 ? C.guide : C.muted;
          ctx.font = '11px Segoe UI';
          ctx.fillText(`p${lane + 1}ᵏ`, 78, y + 4);
          drawArrow(ctx, 126, y, 204, y, phase === 0 ? C.guide : C.line, phase === 0 ? 3 : 1.5);

          box(ctx, 204, y - 10, 132, 20, phase === 1 ? C.aux : C.line, phase === 1 ? '#f5f0ff' : C.panel);
          ctx.fillStyle = phase === 1 ? C.aux : C.muted;
          ctx.fillText(`线程 ${lane + 1}：λᵢ 与 Δpᵢ`, 217, y + 4);
          drawArrow(ctx, 336, y, 414, y, phase === 2 ? C.good : C.line, phase === 2 ? 3 : 1.5);

          box(ctx, 414, y - 9, 92, 18, phase === 2 ? C.good : C.line, C.panel, true);
          ctx.fillStyle = phase === 2 ? C.good : C.muted;
          ctx.fillText(`p${lane + 1}ᵏ⁺¹`, 446, y + 4);
        }

        ctx.strokeStyle = phase === 2 ? C.good : C.aux;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(374, 101);
        ctx.lineTo(374, 198);
        ctx.stroke();
        ctx.fillStyle = phase === 2 ? C.good : C.aux;
        ctx.font = '700 12px Segoe UI';
        ctx.fillText('同步挡板', 344, 216);
      } else {
        const accent = active.key === 'finish' ? C.aux : C.guide;
        const outputColor = active.key === 'finish' ? C.aux : C.good;
        box(ctx, 38, 105, 132, 68, C.guide, C.panel);
        box(ctx, 214, 96, 132, 86, accent, active.key === 'finish' ? '#f5f0ff' : '#eaf0f8');
        box(ctx, 390, 105, 132, 68, outputColor, C.panel, true);
        drawArrow(ctx, 170, 139, 214, 139, C.guide, 3);
        drawArrow(ctx, 346, 139, 390, 139, outputColor, 3);
        ctx.fillStyle = C.muted;
        ctx.font = '12px Segoe UI';
        ctx.fillText('输入', 48, 126);
        ctx.fillText('输出', 400, 126);
        ctx.fillStyle = C.text;
        ctx.font = '700 13px Segoe UI';
        ctx.fillText(active.input, 48, 151);
        ctx.fillStyle = accent;
        ctx.fillText(active.operation, 225, 141);
        ctx.fillStyle = outputColor;
        ctx.fillText(active.output, 400, 151);
        ctx.fillStyle = C.muted;
        ctx.font = '12px Segoe UI';
        ctx.fillText(active.key === 'neighbors' ? '集合本步保持；迭代内重评距离' : '当前阶段的数据依赖', 190, 211);
      }

      ctx.textAlign = 'start';
      canvas.classList.add('is-ready');
    };

    const loop = (time: number) => {
      if (!running) return;
      draw(time);
      frame = window.requestAnimationFrame(loop);
    };
    const start = () => {
      running = true;
      if (active.key === 'project' && !reduced) frame = window.requestAnimationFrame(loop);
      else draw(reduced ? 1866 : 0);
    };
    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [active.key, activeIndex]);

  const selectStage = (index: number) => setActiveIndex(Math.min(STAGES.length - 1, Math.max(0, index)));

  const handleCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 560;
    const y = ((event.clientY - rect.top) / rect.height) * 240;
    if (y <= 76) selectStage(Math.floor((x - 8) / 108));
  };

  const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectStage(activeIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectStage(activeIndex - 1);
    }
  };

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="PBF 时间步技术阶段" onKeyDown={handleKeys}>
        {STAGES.map((stage, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-current={index === activeIndex ? 'step' : undefined}
            className={`chip ${index === activeIndex ? 'selected' : ''}`}
            key={stage.key}
            onClick={() => selectStage(index)}
          >
            {index + 1}. {stage.short}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label={`当前技术阶段：${active.short}。输入：${active.input}；操作：${active.operation}；输出：${active.output}。`}
        onPointerDown={handleCanvasPointer}
        style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer' }}
      />
      <div className="metrics" aria-label="当前阶段的数据路径">
        <div className="metric"><div className="l">输入状态</div><div className="v" style={{ fontSize: 16 }}>{active.input}</div></div>
        <div className="metric"><div className="l">当前工作</div><div className="v" style={{ fontSize: 16 }}>{active.operation}</div></div>
        <div className="metric"><div className="l">输出状态</div><div className="v" style={{ fontSize: 16 }}>{active.output}</div></div>
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={activeIndex === 0} onClick={() => selectStage(activeIndex - 1)}>上一步</button>
        <span className="step-label">当前：<b>{active.short}</b></span>
        <button type="button" className="tiny" disabled={activeIndex === STAGES.length - 1} onClick={() => selectStage(activeIndex + 1)}>下一步</button>
      </div>
      <div className={`feedback ${active.key === 'velocity' ? 'good' : ''}`} aria-live="polite">
        {active.feedback}
      </div>
      <p className="step-desc">这是算法结构图，不是 CUDA kernel、线程块、内存布局或性能基准。Jacobi 在规模增大时可能因局部传播而变慢。</p>
    </div>
  );
};
