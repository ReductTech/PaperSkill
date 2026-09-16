import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 analogy — k 次试运行取平均：单次结果在 0/1 间跳动，运行均值逐步收敛到稳定的通过率。
// 560x140, autoplay, 3s loop.

const W = 560;
const H = 140;
const LOOP = 3000;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
};

// 14 轮，每轮 k=2 次试运行的确定性 0/1 结果序列
const PAIRS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, 1],
  [0, 1],
  [1, 1],
  [1, 1],
];
const ROUNDS = PAIRS.length;
const MEANS: number[] = (() => {
  let p = 0;
  let n = 0;
  return PAIRS.map(([a, b]) => {
    p += a + b;
    n += 2;
    return p / n;
  });
})();

// 均值曲线区域
const CH = { x0: 176, x1: 396, yBase: 114, yTop: 30 };
// 右侧通过率柱
const BAR = { x: 446, w: 52, base: 116, maxH: 88 };

function yOf(m: number) {
  return CH.yBase - m * (CH.yBase - CH.yTop);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const AnaBalanceWheel: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const t = ((now % LOOP) + LOOP) % LOOP / LOOP;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 进度：前 78% 逐轮揭示，其后保持并闪绿
      const reveal = easeInOutQuad(clamp(t / 0.78, 0, 1));
      const shown = reveal * ROUNDS; // 浮点轮数
      const cur = Math.min(Math.floor(shown), ROUNDS - 1);
      const meanNow = MEANS[cur];
      const settled = t > 0.82;
      const flashP = settled ? clamp((t - 0.82) / 0.18, 0, 1) : 0;

      // ---- 左：任务卡片 + 当前轮两个试运行圆点 ----
      ctx.fillStyle = C.panel;
      roundRect(ctx, 16, 16, 132, 100, 8);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText('k=2 试运行', 28, 36);
      ctx.fillStyle = C.steel;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(`第 ${cur + 1}/${ROUNDS} 轮`, 96, 36);

      const pair = PAIRS[cur];
      const pulse = 1 + 0.15 * Math.sin(now / 120);
      pair.forEach((outcome, j) => {
        const dy = 62 + j * 30;
        // 行标签
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(`试${j + 1}`, 30, dy + 4);
        // 结果圆点（通过=绿 / 失败=红）
        ctx.beginPath();
        ctx.arc(96, dy, 10 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = outcome === 1 ? C.green : C.red;
        ctx.fill();
        // 内部符号
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (outcome === 1) {
          ctx.moveTo(96 - 4, dy + 0.5);
          ctx.lineTo(96 - 1, dy + 4);
          ctx.lineTo(96 + 4.5, dy - 4);
        } else {
          ctx.moveTo(96 - 3.5, dy - 3.5);
          ctx.lineTo(96 + 3.5, dy + 3.5);
          ctx.moveTo(96 + 3.5, dy - 3.5);
          ctx.lineTo(96 - 3.5, dy + 3.5);
        }
        ctx.stroke();
      });

      // ---- 中：运行均值折线 ----
      // 网格线 0 / 0.5 / 1
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      [0, 0.5, 1].forEach((m) => {
        ctx.beginPath();
        ctx.moveTo(CH.x0, yOf(m));
        ctx.lineTo(CH.x1, yOf(m));
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText('1.0', CH.x0 - 20, yOf(1) + 3);
      ctx.fillText('0', CH.x0 - 12, yOf(0) + 3);

      const stepX = (CH.x1 - CH.x0) / (ROUNDS - 1);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= cur; i++) {
        const px = CH.x0 + i * stepX;
        const py = yOf(MEANS[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // 已揭示的均值点
      for (let i = 0; i <= cur; i++) {
        ctx.beginPath();
        ctx.arc(CH.x0 + i * stepX, yOf(MEANS[i]), 2.5, 0, Math.PI * 2);
        ctx.fillStyle = C.blue;
        ctx.fill();
      }
      // 线头强调点
      ctx.beginPath();
      ctx.arc(CH.x0 + cur * stepX, yOf(meanNow), 5, 0, Math.PI * 2);
      ctx.fillStyle = settled ? C.green : C.blue;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ---- 右：通过率柱 ----
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('平均通过率', BAR.x - 8, 24);
      const bh = meanNow * BAR.maxH;
      ctx.fillStyle = settled ? C.green : C.blue;
      ctx.fillRect(BAR.x, BAR.base - bh, BAR.w, bh);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BAR.x - 10, BAR.base);
      ctx.lineTo(BAR.x + BAR.w + 10, BAR.base);
      ctx.stroke();
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = settled ? C.green : C.text;
      ctx.fillText(Math.round(meanNow * 100) + '%', BAR.x + 8, BAR.base - bh - 8);
      // 收敛后的绿色脉冲环
      if (settled) {
        ctx.globalAlpha = 1 - flashP;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        roundRect(ctx, BAR.x - 6 - flashP * 8, BAR.base - BAR.maxH - 24 - flashP * 6, BAR.w + 12 + flashP * 16, BAR.maxH + 30 + flashP * 12, 8);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ---- 图例（3 项） ----
      const ly = 132;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.beginPath();
      ctx.arc(180, ly - 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.fillStyle = C.muted;
      ctx.fillText('通过', 190, ly);
      ctx.beginPath();
      ctx.arc(236, ly - 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.red;
      ctx.fill();
      ctx.fillStyle = C.muted;
      ctx.fillText('失败', 246, ly);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(292, ly - 3);
      ctx.lineTo(312, ly - 3);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText('平均', 318, ly);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaBalanceWheel;
