import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawBackground, roundRect } from './scaleKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 320;
const ROWS = 4;
const COLS = 8;
const B = 4; // 块大小

// 对齐论文 Figure 2：连续列的块（加粗边框）按步量化，块外的剩余权重为蓝色，
// 白色中间列是当前正在量化的列，右侧是 Cholesky 下三角存储的逆 Hessian 信息。
const STEPS = [
  { txt: '初始：权重 W 全部未量化；右侧 Cholesky 下三角 L 已从 H 一次性预计算。', cls: '' },
  { txt: '第 1 块：量化第 1 列（白色高亮），块外剩余列标为蓝色。', cls: '' },
  { txt: '块内递归：第 1 列完成（绿），接着量化第 2 列（白色）。', cls: '' },
  { txt: '块内递归：量化第 3 列。', cls: '' },
  { txt: '块内递归：量化第 4 列。', cls: '' },
  { txt: '第 1 块完成；蓝色剩余列将用 Cholesky 信息一次性批量更新。', cls: 'good' },
  { txt: '第 2 块：从白色列开始同样递归。', cls: '' },
  { txt: '完成：W 全部量化，全程只用一份 Cholesky 信息，数值稳定。', cls: 'good' },
];

type CellState = 'todo' | 'current' | 'done' | 'remaining';

export const Ch8Alg: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cellState = (c: number): CellState => {
      switch (step) {
        case 0:
          return 'todo';
        case 1:
          return c === 0 ? 'current' : c < B ? 'todo' : 'remaining';
        case 2:
          return c === 0 ? 'done' : c === 1 ? 'current' : c < B ? 'todo' : 'remaining';
        case 3:
          return c < 2 ? 'done' : c === 2 ? 'current' : c < B ? 'todo' : 'remaining';
        case 4:
          return c < 3 ? 'done' : c === 3 ? 'current' : 'remaining';
        case 5:
          return c < B ? 'done' : 'remaining';
        case 6:
          return c < B ? 'done' : c === B ? 'current' : 'remaining';
        case 7:
          return 'done';
        default:
          return 'todo';
      }
    };

    const render = () => {
      drawBackground(ctx, W, H);

      // ---- 权重矩阵 W ----
      const cell = 60;
      const cellW = 50;
      const cellH = 34;
      const rowH = 42;
      const x0 = 150;
      const y0 = 72;

      // 列标签
      ctx.fillStyle = C.muted;
      ctx.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let c = 0; c < COLS; c++) {
        ctx.fillText(String(c + 1), x0 + c * cell + cellW / 2, y0 - 16);
      }
      // 行标签
      ctx.textAlign = 'right';
      for (let r = 0; r < ROWS; r++) {
        ctx.fillText(String(r + 1), x0 - 16, y0 + r * rowH + cellH / 2);
      }

      // 单元格
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = x0 + c * cell;
          const y = y0 + r * rowH;
          const st = cellState(c);
          if (st === 'current') {
            roundRect(ctx, x, y, cellW, cellH, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 3;
            roundRect(ctx, x, y, cellW, cellH, 4);
            ctx.stroke();
          } else if (st === 'done') {
            roundRect(ctx, x, y, cellW, cellH, 4);
            ctx.fillStyle = C.green;
            ctx.fill();
          } else if (st === 'remaining') {
            roundRect(ctx, x, y, cellW, cellH, 4);
            ctx.fillStyle = C.blue;
            ctx.fill();
          } else {
            roundRect(ctx, x, y, cellW, cellH, 4);
            ctx.fillStyle = '#e8eee0';
            ctx.fill();
            ctx.strokeStyle = C.axis;
            ctx.lineWidth = 1;
            roundRect(ctx, x, y, cellW, cellH, 4);
            ctx.stroke();
          }
        }
      }

      // 块边框（加粗）
      for (let b = 0; b < COLS / B; b++) {
        const bx = x0 + b * B * cell - 3;
        const bw = B * cell - cell + cellW + 6;
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 3;
        roundRect(ctx, bx, y0 - 8, bw, ROWS * rowH - 6 + 8, 6);
        ctx.stroke();
      }

      // ---- Cholesky 下三角 L（B×B）----
      const lx = 720;
      const ly = 100;
      const lcell = 56;
      const lgap = 10;
      const n = B;
      ctx.fillStyle = C.muted;
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cholesky 下三角 L', lx + (n * lcell) / 2, ly - 26);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const x = lx + c * lcell;
          const y = ly + r * (lcell - lgap);
          if (c <= r) {
            ctx.fillStyle = c === r ? C.blue : '#5b7bb0';
            ctx.fillRect(x, y, lcell - lgap, lcell - lgap);
          } else {
            ctx.strokeStyle = C.axis;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, lcell - lgap - 1, lcell - lgap - 1);
          }
        }
      }

      // ---- 图例 ----
      const legendY = 290;
      const items = [
        { color: '#ffffff', border: C.ink, label: '当前量化列' },
        { color: C.green, border: null as string | null, label: '已量化' },
        { color: C.blue, border: null as string | null, label: '剩余权重' },
      ];
      const totalW = items.length * 150;
      let lx0 = (W - totalW) / 2;
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textBaseline = 'middle';
      items.forEach((it) => {
        const sx = lx0;
        ctx.fillStyle = it.color;
        roundRect(ctx, sx, legendY - 8, 18, 18, 3);
        ctx.fill();
        if (it.border) {
          ctx.strokeStyle = it.border;
          ctx.lineWidth = 2;
          roundRect(ctx, sx, legendY - 8, 18, 18, 3);
          ctx.stroke();
        }
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'left';
        ctx.fillText(it.label, sx + 26, legendY + 2);
        lx0 += 150;
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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
  }, [step]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          上一步
        </button>
        <span className="val">
          {step + 1} / {STEPS.length}
        </span>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
          下一步
        </button>
      </div>
      <div className={`feedback ${STEPS[step].cls}`}>{STEPS[step].txt}</div>
    </div>
  );
};

export default Ch8Alg;
