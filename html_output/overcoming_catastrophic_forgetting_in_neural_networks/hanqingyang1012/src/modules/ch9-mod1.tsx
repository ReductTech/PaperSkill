import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 9.1 Fisher 重叠度 vs 层深：相似任务（8×8 置换）高平台缓降（浅灰），
// 不同任务（26×26 置换）浅层低、输出层高（深色）。切换时 1.2 s 交叉淡入，
// 未选中曲线变淡。画布内仅坐标轴 2 个标签 + 输入层/输出层两个裸数字。

const W = 1080;
const H = 280;
const PLOT = { left: 90, right: 1000, top: 46, bottom: 218 };
const Y_MIN = 0.3;
const Y_MAX = 1.0;

const GRAY = '#68778f';
const DARK = '#21324a';
const AXIS = '#d7deea';
const MUTED = '#68778f';

const yOf = (v: number): number =>
  PLOT.bottom - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (PLOT.bottom - PLOT.top);
const xOf = (u: number): number => PLOT.left + u * (PLOT.right - PLOT.left);

// 曲线形状（方向性示意，与论文 Figure 2C 的描述一致）
const simCurve = (u: number): number => 0.92 - 0.07 * u; // 高平台约 0.9 缓降
const difCurve = (u: number): number => 0.4 + 0.4 * (u * u * (3 - 2 * u)); // 0.4 → 0.8 smoothstep

type Mode = 'similar' | 'different';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ mode: 'similar' as Mode, switchAt: -1 });
  const [mode, setMode] = useState<Mode>('similar');
  const [feedback, setFeedback] = useState({
    text: '任务很像时，两个任务几乎共用全部权重。',
    cls: '',
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

    const drawCurve = (
      fn: (u: number) => number,
      color: string,
      alpha: number,
      width: number
    ): void => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const x = xOf(u);
        const y = yOf(fn(u));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    const numberBadge = (
      x: number,
      y: number,
      v: number,
      color: string,
      alpha: number
    ): void => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(v.toFixed(2), x, y - 8);
      ctx.restore();
    };

    const render = (s: typeof stateRef.current, now: number): void => {
      const e = s.switchAt < 0 ? 1 : clamp((now - s.switchAt) / 1200, 0, 1);
      const ease = 1 - Math.pow(1 - e, 3);
      const aSim = s.mode === 'similar' ? 0.35 + 0.65 * ease : 1 - 0.65 * ease;
      const aDif = s.mode === 'different' ? 0.35 + 0.65 * ease : 1 - 0.65 * ease;
      const wSim = s.mode === 'similar' ? lerp(2.2, 3.4, ease) : lerp(3.4, 2.2, ease);
      const wDif = s.mode === 'different' ? lerp(2.2, 3.4, ease) : lerp(3.4, 2.2, ease);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 网格 + 坐标轴
      ctx.strokeStyle = 'rgba(215,222,234,0.55)';
      ctx.lineWidth = 1;
      [0.4, 0.6, 0.8, 1.0].forEach((v) => {
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(PLOT.left, y);
        ctx.lineTo(PLOT.right, y);
        ctx.stroke();
      });
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLOT.left, PLOT.bottom);
      ctx.lineTo(PLOT.right, PLOT.bottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PLOT.left, PLOT.top);
      ctx.lineTo(PLOT.left, PLOT.bottom);
      ctx.stroke();

      // y 轴刻度（裸数字）
      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      [0.4, 0.6, 0.8, 1.0].forEach((v) => {
        ctx.fillText(v.toFixed(1), PLOT.left - 8, yOf(v));
      });

      // 曲线：非活动 → 活动
      drawCurve(simCurve, GRAY, aSim, wSim);
      drawCurve(difCurve, DARK, aDif, wDif);

      // 输入层 / 输出层两个裸数字（跟随活动曲线两端）
      const activeFn = s.mode === 'similar' ? simCurve : difCurve;
      const activeColor = s.mode === 'similar' ? GRAY : DARK;
      const activeAlpha = s.mode === 'similar' ? aSim : aDif;
      numberBadge(xOf(0), yOf(activeFn(0)), activeFn(0), activeColor, activeAlpha);
      numberBadge(xOf(1), yOf(activeFn(1)), activeFn(1), activeColor, activeAlpha);

      // 轴标签（2 个，≤8 字）
      ctx.fillStyle = DARK;
      ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('层深', (PLOT.left + PLOT.right) / 2, PLOT.bottom + 12);
      ctx.save();
      ctx.translate(26, (PLOT.top + PLOT.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('重叠度', 0, 0);
      ctx.restore();

      // 图例（2 项）
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '13px "Segoe UI", sans-serif';
      const legend = [
        { label: '相似任务', color: GRAY },
        { label: '不同任务', color: DARK },
      ];
      legend.forEach((item, i) => {
        const lx = 830 + i * 110;
        const ly = 24;
        ctx.fillStyle = item.color;
        roundRectPath(ctx, lx, ly - 7, 16, 10, 3);
        ctx.fill();
        ctx.fillStyle = DARK;
        ctx.fillText(item.label, lx + 22, ly - 2);
      });
    };

    const tick = (): void => {
      render(stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (m: Mode): void => {
    if (m === stateRef.current.mode) return;
    stateRef.current.mode = m;
    stateRef.current.switchAt = performance.now();
    setMode(m);
    setFeedback(
      m === 'similar'
        ? { text: '任务相似：两个任务几乎共用同一批权重，EWC 基本无需割地。', cls: '' }
        : { text: '任务差异大：浅层权重各自为政（重叠低），输出层因类别共享仍然共用。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button
            className={`chip ${mode === 'similar' ? 'selected' : ''}`}
            onClick={() => choose('similar')}
          >
            相似任务(8×8置换)
          </button>
          <button
            className={`chip ${mode === 'different' ? 'selected' : ''}`}
            onClick={() => choose('different')}
          >
            不同任务(26×26置换)
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
