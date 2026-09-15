import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawSceneLabel, PAPER } from './halftoneKit';
import {
  THREAD,
  cellMeans,
  drawCellGrid,
  drawCellGridSmooth,
  drawFabricPatch,
  type CellGrid,
} from './fabricKit';
import type { WidgetProps } from './registry';

// 像素格吃掉了布纹（§1.1，🟢 可由采样原理精确计算）
// 左边是真实世界的布纹，右边是相机按格子记下的东西 —— 每个格子只剩一个平均数。
// 右边那排裸数字就是这件事的证据：格子比织线粗时，它们几乎一模一样。
// 所有数值都由 fabricKit 对布纹画布做真实面积平均得到，没有任何衰减曲线近似。

const W = 1080;
const H = 400;
const H_TALL = 640;

/** 一根织线的宽度（显示像素）—— 判断"格子横跨几根线"就用它。 */
const THREAD_W = THREAD;

/** 格线只在格子不至于糊成一片时才画。 */
const GRID_LINE_MIN_CELL = 7;

const SANS = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

/** 数值条上显示的格子个数（中间那一格两侧各留 6 格）。 */
const STRIP_COUNT = 13;
const STRIP_HALF = 6;
const STRIP_STEP = 30;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  h: number;
  A: Box; // 真实世界（放大看）
  B: Box; // 相机记下的
  stripCaptionY: number;
  stripY: number;
  readoutY: number;
}

function makeLayout(narrow: boolean): Layout {
  if (narrow) {
    return {
      h: H_TALL,
      A: { x: 30, y: 56, w: 1020, h: 190 },
      B: { x: 30, y: 314, w: 1020, h: 190 },
      stripCaptionY: 530,
      stripY: 558,
      readoutY: 276,
    };
  }
  return {
    h: H,
    A: { x: 30, y: 56, w: 500, h: 250 },
    B: { x: 560, y: 56, w: 490, h: 250 },
    stripCaptionY: 332,
    stripY: 358,
    readoutY: 336,
  };
}

/** 反馈分档（文案逐字照抄规范）。 */
function feedbackFor(cell: number, zoomed: boolean): { text: string; cls: string } {
  const ratio = cell / THREAD_W;
  let text: string;
  let cls: string;
  if (ratio < 0.8) {
    text = '一个格子还不到一根线宽，织纹被完整记下来了——右边每个格子的数明显不一样。';
    cls = 'good';
  } else if (ratio < 1.6) {
    text = '一个格子差不多正好一根线宽，织纹正在被抹平——右边格子的数值开始变得接近。';
    cls = 'warn';
  } else {
    text = `一个格子横跨 ${ratio.toFixed(1)} 根线，每个格子只剩一个几乎相同的平均数——布纹已经不在这些数里了。再怎么放大也变不回来。`;
    cls = 'bad';
  }
  if (zoomed) {
    text += '（右边是"把这些数放大回去"的结果：平滑，但没有织纹。）';
    cls = 'bad';
  }
  return { text, cls };
}

function frame(ctx: CanvasRenderingContext2D, b: Box): void {
  ctx.save();
  ctx.strokeStyle = PAPER.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  ctx.restore();
}

function render(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  cell: number,
  zoomed: boolean,
  g: CellGrid
): void {
  clearScene(ctx, W, L.h);

  const A = L.A;
  const B = L.B;
  const hc = Math.floor(g.cols / 2);
  const hr = Math.floor(g.rows / 2);

  // ---- A 区：真实布纹 + 采样格 ----
  ctx.save();
  ctx.beginPath();
  ctx.rect(A.x, A.y, A.w, A.h);
  ctx.clip();
  drawFabricPatch(ctx, A.x, A.y, A.w, A.h, 0, 0);

  if (cell >= GRID_LINE_MIN_CELL) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = PAPER.blue;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= g.cols; c++) {
      const x = A.x + c * g.cw;
      ctx.moveTo(x, A.y);
      ctx.lineTo(x, A.y + A.h);
    }
    for (let r = 0; r <= g.rows; r++) {
      const y = A.y + r * g.ch;
      ctx.moveTo(A.x, y);
      ctx.lineTo(A.x + A.w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 中间那一格：数值条上高亮的正是它
  ctx.strokeStyle = PAPER.orange;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(A.x + hc * g.cw, A.y + hr * g.ch, g.cw, g.ch);
  ctx.restore();
  frame(ctx, A);

  // ---- B 区：相机记下的 ----
  ctx.save();
  ctx.beginPath();
  ctx.rect(B.x, B.y, B.w, B.h);
  ctx.clip();
  if (zoomed) {
    drawCellGridSmooth(ctx, B.x, B.y, B.w, B.h, g);
  } else {
    drawCellGrid(ctx, B.x, B.y, g);
  }
  ctx.restore();
  frame(ctx, B);

  // ---- 画布内短标签 ----
  drawSceneLabel(ctx, A.x, A.y - 14, '真实世界（放大看）', PAPER.ink);
  drawSceneLabel(ctx, B.x, B.y - 14, '相机记下的', PAPER.muted);

  // ---- 数值条：中间那一行格子的实际数值（裸整数） ----
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `13px ${SANS}`;
  ctx.fillStyle = PAPER.muted;
  ctx.fillText('中间一行', B.x, L.stripCaptionY);

  ctx.font = `600 15px ${MONO}`;
  const startC = Math.max(0, hc - STRIP_HALF);
  let nx = B.x;
  for (let i = 0; i < STRIP_COUNT; i++) {
    const c = startC + i;
    if (c >= g.cols) break;
    const v = Math.round(g.vals[hr * g.cols + c]);
    ctx.fillStyle = c === hc ? PAPER.orange : PAPER.ink;
    ctx.fillText(String(v).padStart(3, ' '), nx, L.stripY);
    nx += STRIP_STEP;
  }
  ctx.restore();

  // ---- 左下角读数：一个格子横跨几根线 ----
  const ratio = cell / THREAD_W;
  const ratioColor = ratio < 0.8 ? PAPER.green : ratio < 1.6 ? PAPER.orange : PAPER.red;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `13px ${SANS}`;
  ctx.fillStyle = PAPER.muted;
  ctx.fillText('一个格子横跨', A.x, L.readoutY);
  const headW = ctx.measureText('一个格子横跨').width;
  const valText = ratio.toFixed(1);
  ctx.font = `600 20px ${MONO}`;
  ctx.fillStyle = ratioColor;
  ctx.fillText(valText, A.x + headW + 8, L.readoutY + 2);
  const valW = ctx.measureText(valText).width;
  ctx.font = `13px ${SANS}`;
  ctx.fillStyle = PAPER.muted;
  ctx.fillText('根线', A.x + headW + 8 + valW + 8, L.readoutY);
  ctx.restore();
}

export const M1_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ cell: number; zoomed: boolean }>({ cell: 12, zoomed: false });
  // 格子平均值只在 cell / 布局真正变化时重算一次，rAF 只负责把缓存画出来。
  const gridRef = useRef<CellGrid | null>(null);
  const gridKeyRef = useRef<string>('');

  const [cell, setCell] = useState(12);
  const [zoomed, setZoomed] = useState(false);
  const [feedback, setFeedback] = useState(() => feedbackFor(12, false));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let layoutH = H;

    const gridFor = (cellV: number, narrow: boolean, w: number, h: number): CellGrid => {
      const key = `${narrow ? 'n' : 'd'}:${cellV}:${w}x${h}`;
      const cached = gridRef.current;
      if (cached !== null && gridKeyRef.current === key) return cached;
      const fresh = cellMeans(0, 0, w, h, cellV);
      gridRef.current = fresh;
      gridKeyRef.current = key;
      return fresh;
    };

    const tick = (): void => {
      const width = canvas.getBoundingClientRect().width || canvas.clientWidth || W;
      const narrow = width > 0 && width < 720;
      const L = makeLayout(narrow);
      if (L.h !== layoutH) {
        try {
          ctx = setupCanvas(canvas, W, L.h);
          layoutH = L.h;
        } catch {
          /* 保持上一次的尺寸继续画 */
        }
      }
      const s = stateRef.current;
      const g = gridFor(s.cell, narrow, L.A.w, L.A.h);
      render(ctx, L, s.cell, s.zoomed, g);
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

  const onCell = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = Number(e.target.value);
    stateRef.current.cell = v;
    setCell(v);
    setFeedback(feedbackFor(v, stateRef.current.zoomed));
  };

  const toggleZoom = (): void => {
    const z = !stateRef.current.zoomed;
    stateRef.current.zoomed = z;
    setZoomed(z);
    setFeedback(feedbackFor(stateRef.current.cell, z));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="像素格与布纹"
      />
      <div className="ctrl">
        <label>
          像素格大小 <span className="val">{cell} px</span>
        </label>
        <input
          type="range"
          min={3}
          max={48}
          step={1}
          value={cell}
          onChange={onCell}
          aria-label="像素格大小"
        />
        <button type="button" className={`tiny${zoomed ? '' : ' ghost'}`} onClick={toggleZoom}>
          {zoomed ? '看格子数值' : '把这些数放大回去'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M1_1;
