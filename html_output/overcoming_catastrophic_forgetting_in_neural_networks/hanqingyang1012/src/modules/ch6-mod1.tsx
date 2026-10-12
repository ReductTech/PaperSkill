import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6.1（P2 步骤器，technical，1080×280）：一行 5 个流程节点（圆角矩形），当前节点
// 蓝色填充+脉冲、已完成绿色、连接线 #d7deea→激活段蓝色；右侧 440px 内嵌图：6×6
// 权重网格随步骤变化（步骤 2 显示采样点收敛示意、步骤 4 高 F 格子变绿锁定+惩罚
// 箭头），裸数字「保护权重占比」。stepIndex 0..5。
const W = 1080;
const H = 280;
const NODES = ['训练任务A', '估算Fisher', '保存锚点', '训练任务B', '进入任务C'];
const STEPS: { text: string; cls: string }[] = [
  { text: '准备开始：顺序学习任务 A → B。', cls: '' },
  { text: '任务 A 训练完成，得到旧解 θ*_A。', cls: '' },
  { text: '任务切换（任务分段明确）：用采样数据估算对角 Fisher，重要权重浮出水面。', cls: '' },
  { text: '保存 θ*_A 与 F——每个任务的锚点和刚度，之后不再需要任务 A 的数据。', cls: 'good' },
  { text: '训练任务 B：损失 + 弹性惩罚一起最小化，重要权重被拉住。', cls: 'good' },
  { text: '完成后可对任务 C 重复：再加一根弹簧即可。', cls: '' },
];

const C = {
  bg: '#f5f8f0',
  rockL: '#b8c9a7',
  rockD: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  mute: '#68778f',
  border: '#d7deea',
};

const highF = (r: number, c: number): boolean => r === c || r === c + 1;

// 确定性的“采样点散布”偏移（步骤 2 的收敛示意用，与随机种子无关、每帧稳定）
const DOT_OFFS: { dx: number; dy: number }[][] = [];
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 6; c++) {
    const arr: { dx: number; dy: number }[] = [];
    const n = highF(r, c) ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const s1 = Math.sin((r * 7 + c * 13 + i * 29) * 12.9898) * 43758.5453;
      const s2 = Math.sin((r * 3 + c * 17 + i * 11) * 78.233) * 12543.216;
      arr.push({ dx: (s1 - Math.floor(s1)) * 0.9 - 0.45, dy: (s2 - Math.floor(s2)) * 0.9 - 0.45 });
    }
    DOT_OFFS.push(arr);
  }
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left',
  baseline: CanvasTextBaseline = 'alphabetic'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(s, x, y);
}

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const stepStartRef = useRef(0);
  const [step, setStepState] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>({
    text: STEPS[0].text,
    cls: STEPS[0].cls,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();

    const drawArrow = (fx: number, fy: number, tx: number, ty: number): void => {
      const ang = Math.atan2(ty - fy, tx - fx);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ang - 0.5) * 6, ty - Math.sin(ang - 0.5) * 6);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ang + 0.5) * 6, ty - Math.sin(ang + 0.5) * 6);
      ctx.stroke();
    };

    const fillCell = (x: number, y: number, size: number, color: string): void => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    };

    const drawLock = (x: number, y: number, size: number): void => {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 3.5, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      rr(ctx, cx - 5, cy - 2, 10, 8, 2);
      ctx.fill();
    };

    const drawMiniAnchor = (x: number, y: number, size: number): void => {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx + 4.5, cy + 3);
      ctx.lineTo(cx - 4.5, cy + 3);
      ctx.closePath();
      ctx.fill();
    };

    const drawGrid = (s: number, now: number): void => {
      const cell = 34;
      const gap = 5;
      const gx = 600;
      const gy = 26;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          const x = gx + c * (cell + gap);
          const y = gy + r * (cell + gap);
          const isHigh = highF(r, c);
          if (s === 1) {
            // 任务 A 训练过全部权重：整片变蓝
            fillCell(x, y, cell, C.blue);
          } else if (s === 4 || s === 5) {
            if (isHigh) {
              // 高 F 权重：绿色锁定 + 向内惩罚箭头；空闲权重在步骤 4 变蓝（学任务 B）
              fillCell(x, y, cell, C.green);
              drawLock(x, y, cell);
              ctx.strokeStyle = C.orange;
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              drawArrow(x + 7, y + 7, x + cell / 2 - 2, y + cell / 2 - 2);
              drawArrow(x + cell - 7, y + cell - 7, x + cell / 2 + 2, y + cell / 2 + 2);
            } else {
              fillCell(x, y, cell, s === 4 ? C.blue : C.rockL);
            }
          } else {
            fillCell(x, y, cell, C.rockL);
            if (s === 3 && isHigh) {
              // 保存锚点：高 F 格子挂上绿色岩钉标记
              drawMiniAnchor(x, y, cell);
            }
          }
        }
      }
      if (s === 2) {
        // 采样点从散布到收敛的示意
        const elapsed = now - stepStartRef.current;
        const decay = clamp(1 - elapsed / 1600, 0.12, 1);
        const off = 11 * decay;
        ctx.fillStyle = C.blue;
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 6; c++) {
            const cx = gx + c * (cell + gap) + cell / 2;
            const cy = gy + r * (cell + gap) + cell / 2;
            const dots = DOT_OFFS[r * 6 + c];
            for (const d of dots) {
              ctx.beginPath();
              ctx.arc(cx + d.dx * off, cy + d.dy * off, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
      if (s === 5) {
        // 下一个任务的弹簧将加在这个空闲权重上（示意）
        const x = gx + 3 * (cell + gap) - 3;
        const y = gy + 1 * (cell + gap) - 3;
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        rr(ctx, x, y, cell + 6, cell + 6, 5);
        ctx.stroke();
      }
    };

    const drawNodes = (s: number, time: number): void => {
      const nw = 92;
      const nh = 38;
      const gap = 12;
      const nx0 = 28;
      const ny = 56;
      for (let i = 0; i < NODES.length; i++) {
        const x = nx0 + i * (nw + gap);
        const active = s >= 1 && i === s - 1;
        const done = i < s - 1;
        if (active) {
          ctx.fillStyle = C.blue;
          rr(ctx, x, ny, nw, nh, 8);
          ctx.fill();
          const glow = 0.2 + 0.18 * Math.sin(time / 220);
          ctx.strokeStyle = `rgba(39,68,110,${glow.toFixed(3)})`;
          ctx.lineWidth = 3;
          rr(ctx, x - 3, ny - 3, nw + 6, nh + 6, 10);
          ctx.stroke();
          text(ctx, NODES[i], x + nw / 2, ny + nh / 2, '#ffffff', 14, 'center', 'middle');
        } else if (done) {
          ctx.fillStyle = C.green;
          rr(ctx, x, ny, nw, nh, 8);
          ctx.fill();
          text(ctx, NODES[i], x + nw / 2, ny + nh / 2, '#ffffff', 14, 'center', 'middle');
        } else {
          ctx.fillStyle = C.bg;
          rr(ctx, x, ny, nw, nh, 8);
          ctx.fill();
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          rr(ctx, x, ny, nw, nh, 8);
          ctx.stroke();
          text(ctx, NODES[i], x + nw / 2, ny + nh / 2, C.mute, 14, 'center', 'middle');
        }
      }
      // connectors: default #d7deea, the segment feeding the active node blue, completed ones green
      for (let i = 0; i < NODES.length - 1; i++) {
        const x1 = nx0 + i * (nw + gap) + nw;
        const x2 = x1 + gap;
        const cy = ny + nh / 2;
        let color = C.border;
        if (s >= 2 && i === s - 2) color = C.blue;
        else if (s >= 3 && i <= s - 3) color = C.green;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, cy);
        ctx.lineTo(x2, cy);
        ctx.stroke();
      }
    };

    const drawInset = (s: number, now: number): void => {
      ctx.fillStyle = '#ffffff';
      rr(ctx, 580, 14, 440, 252, 10);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 580, 14, 440, 252, 10);
      ctx.stroke();
      drawGrid(s, now);
      const ratio = s >= 3 ? '0.31' : '0.00';
      text(ctx, '保护权重占比', 845, 122, C.ink, 15);
      text(ctx, ratio, 845, 152, s >= 3 ? C.green : C.mute, 20);
    };

    const render = (now: number): void => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      drawNodes(s.step, now - t0);
      drawInset(s.step, now);
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = (): void => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const setStep = (s: number): void => {
    const v = clamp(s, 0, 5);
    stateRef.current.step = v;
    stepStartRef.current = performance.now();
    setStepState(v);
    setFeedback({ text: STEPS[v].text, cls: STEPS[v].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className="tiny ghost"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          上一步
        </button>
        <button
          type="button"
          className="tiny"
          disabled={step === 5}
          onClick={() => setStep(step + 1)}
        >
          {step === 5 ? '已完成' : '下一步'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => setStep(0)}>
          重置
        </button>
        <span className="val">{step}/5</span>
      </div>
      <div className="step-desc">{STEPS[step].text}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
