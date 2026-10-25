import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearCrag,
  drawSceneLabel,
  OK,
  BAD,
  EMPH,
  MUTED,
  LINE,
  INK,
} from './climbkit';
import type { WidgetProps } from './registry';

// m62 — twohot：把回归变成“落在哪两个桶”。
// 左「直接回归」梯度条随目标变大、变红；右「symexp twohot」两个相邻桶被点亮，梯度条恒长。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const TARGETS = [0.7, 50, -200];
const LABELS = ['目标 0.7', '目标 50', '目标 −200'];

const symexp = (x: number): number => {
  const a = Math.abs(x);
  return Math.sign(x) * (Math.exp(a) - 1);
};

const NB = 19;
const GRID: number[] = [];
for (let j = 0; j < NB; j++) GRID.push(symexp(lerp(-7, 7, j / (NB - 1))));

const bracket = (target: number): number => {
  for (let j = 0; j < NB - 1; j++) {
    if (target >= GRID[j] && target <= GRID[j + 1]) return j;
  }
  return NB - 2;
};

const weights = (target: number): { j: number; w1: number; w2: number } => {
  const j = bracket(target);
  const lo = GRID[j];
  const hi = GRID[j + 1];
  const w1 = clamp((hi - target) / (hi - lo), 0, 1);
  return { j, w1, w2: 1 - w1 };
};

const FB = [
  { text: '小目标下两种方式都不吃力；注意左边梯度条还短。', cls: '' },
  {
    text: '目标变大：直接回归的梯度条被拉长变红；twohot 只关心两个桶的概率，梯度长度没变。',
    cls: 'good',
  },
  {
    text: '更大的负目标：左边继续膨胀，右边的图钉仍只在两个相邻桶上——符号与位置都被记录，梯度依旧稳定。',
    cls: 'good',
  },
];

export const M62: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ target: 0, ratio: TARGETS[0] / 200 });
  const rafRef = useRef<number | null>(null);
  const [target, setTarget] = useState(0);
  const [feedback, setFeedback] = useState(FB[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { target: number; ratio: number }): void => {
      clearCrag(ctx, W, H);
      // 左侧面板：随目标缓动到新的比例
      s.ratio += (Math.abs(TARGETS[s.target]) / 200 - s.ratio) * 0.12;
      const tgt = TARGETS[s.target];
      const { j, w1, w2 } = weights(tgt);

      // 两个面板框
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 48, 470, 202);
      ctx.strokeRect(570, 48, 470, 202);
      ctx.restore();

      // 左：数值输出节点
      ctx.save();
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(210, 92, 130, 46);
      ctx.fillStyle = INK;
      ctx.font = '16px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(String(tgt), 275, 121);
      ctx.restore();

      // 左：直接回归梯度条（长度 ∝ |目标|，变红）
      const leftLen = 30 + clamp(s.ratio, 0, 1) * 330;
      ctx.fillStyle = LINE;
      ctx.fillRect(70, 206, 380, 16);
      ctx.fillStyle = clamp(s.ratio, 0, 1) > 0.15 ? BAD : MUTED;
      ctx.fillRect(70, 206, leftLen, 16);

      // 右：指数分桶带
      const bx0 = 600;
      const bx1 = 1010;
      const binW = (bx1 - bx0) / NB;
      const by = 110;
      const bh = 55;
      for (let b = 0; b < NB; b++) {
        const x = bx0 + b * binW;
        ctx.fillStyle = b === j || b === j + 1 ? EMPH : LINE;
        ctx.fillRect(x + 1, by, binW - 2, bh);
      }

      // 右：目标图钉
      const frac = clamp((tgt - GRID[j]) / (GRID[j + 1] - GRID[j]), 0, 1);
      const markerX = bx0 + (j + frac) * binW;
      ctx.save();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(markerX, by - 4);
      ctx.lineTo(markerX - 6, by - 16);
      ctx.lineTo(markerX + 6, by - 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(markerX, by - 4);
      ctx.lineTo(markerX, by + bh + 4);
      ctx.stroke();
      ctx.restore();

      // 右：两桶权重（裸数字）
      ctx.save();
      ctx.fillStyle = INK;
      ctx.font = '14px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(w1.toFixed(2), bx0 + (j + 0.5) * binW, by - 22);
      ctx.fillText(w2.toFixed(2), bx0 + (j + 1.5) * binW, by - 22);
      ctx.restore();

      // 右：twohot 梯度条（恒长，绿色）
      const rightLen = 140;
      ctx.fillStyle = LINE;
      ctx.fillRect(600, 206, 380, 16);
      ctx.fillStyle = OK;
      ctx.fillRect(600, 206, rightLen, 16);

      drawSceneLabel(ctx, '直接回归', 60, 40, MUTED);
      drawSceneLabel(ctx, 'twohot', 590, 40, OK);
    };

    const tick = (): void => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number): void => {
    stateRef.current.target = i;
    setTarget(i);
    setFeedback(FB[i]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {LABELS.map((label, i) => (
          <button
            key={label}
            className={'chip' + (target === i ? ' on selected' : '')}
            onClick={() => select(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M62;
