import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawLegend,
  drawRegisterKnob,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import { cellMeans, fabricCanvas, fuseGrids } from './fabricKit';
import type { CellGrid } from './fabricKit';
import type { WidgetProps } from './registry';

// §3.1 对齐偏差吃掉收益
//
// 复用 §1.2 的机制，但把"错位量"换成"对齐误差"：
//   真实位移固定 0.5 格（最优）；方法**估计**的位移 = 0.5 + err。
//   帧 1 的格子不动，帧 2 按估计位移摆好，两帧一起喂给 fuseGrids。
//
// 论断（实测得出，不是想当然）：
//   偏 ±0.1 格以内几乎无损；偏到接近 ±0.5 格时，两帧的采样**几乎重合**，
//   多帧的收益归零 —— 白拼。实测（320×250 窗口、格子 5px、真实位移半格）：
//   偏差 0 → 相对单帧收益 17.7%；偏差 ±0.5 → 收益 0.0%。
//
// 注意：**不要写成"错一点就重影"**。早期版本用过这个说法，实测站不住 ——
// 本模块的重建是"把两帧的采样点并起来插值"，它天然对小幅错位不敏感，
// 根本不会产生重影。真正的失效模式是"采样点重合"，不是"边缘拖双影"。
//
// 显示尺度的说明：一格 = 20 显示像素，细网格 = 10 显示像素（与规范一致）。
// 布纹在这块画布里被放大 6 倍取样：一格只覆盖 3.33×3.33 个布纹像素（约三分之一个线宽）。
// 这个放大倍数是必需的 —— 若按 1:1 取样，一格横跨 2 根织线，格子的平均值几乎没有起伏，
// 重建出来会是一片平灰（实测纹理标准差只有 2.7 灰阶），"清晰 vs 重影"根本看不出来。
// 放大 6 倍后重建结果既有真实织纹（标准差 25 灰阶），重影也最明显（最大 10 灰阶的错位）。
//
// 采样区高取 240 而不是 250：fuseGrids 要求细网格的行数正好是粗格的整数倍
// （240 = 12 个粗格行 = 24 个细格行），否则竖直方向会出现成对的重复行。
// 融合只在 err 变化时重算一次；rAF 的每一帧只是把缓存好的网格画出来。

const W = 1080;
const H_WIDE = 400;
const H_NARROW = 640;

const CELL = 20;                    // 一格 = 20 显示像素（与 §1.2 一致）
const FINE = 10;                    // 细网格 = 10 显示像素
const TRUE_SHIFT = 0.5;             // 真实位移固定 0.5 格（最优）
const ZOOM = 6;                     // 布纹的取样放大倍数
const REG_W = 640;                  // 采样区宽（显示像素，正好填满 B 区）
const REG_H = 240;                  // 采样区高（显示像素，= 12 个整格）
const FAB_OX = 320;                 // 采样区在布纹里的左上角
const FAB_OY = 160;
const FAB_W = REG_W / ZOOM;         // 采样区在布纹坐标里的宽
const FAB_H = REG_H / ZOOM;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export type Band = 'crisp' | 'ghost' | 'blur';

export function bandOf(err: number): Band {
  const a = Math.abs(err);
  // 分档按实测：偏差在 ±0.12 格以内几乎无损；接近半格时两帧的采样几乎重合，
  // 多帧的收益归零（实测 320×250 窗口下，偏差 0 → 收益 18%，偏差 ±0.5 → 收益 0%）。
  if (a < 0.12) return 'crisp';
  if (a < 0.32) return 'ghost';
  return 'blur';
}

export interface Recon {
  estPx: number;   // 方法估计的位移（显示像素）
  rowPx: number;   // 一格的高度（显示像素）
  fused: CellGrid; // 两帧拼出来的细网格（布纹坐标）
}

/** 两帧采样 + 融合。只有 err 变了才需要重算。 */
export function computeRecon(err: number): Recon {
  const cellFab = CELL / ZOOM;
  const gA = cellMeans(FAB_OX, FAB_OY, FAB_W, FAB_H, cellFab, 0);
  // 帧 2 的数据是按真实位移采下来的 …
  const rawB = cellMeans(FAB_OX, FAB_OY, FAB_W, FAB_H, cellFab, TRUE_SHIFT * cellFab);
  // … 但方法"以为"它错开了 estimate 格
  const gB: CellGrid = { ...rawB, shiftX: (TRUE_SHIFT + err) * cellFab };
  const target = cellMeans(FAB_OX, FAB_OY, FAB_W, FAB_H, FINE / ZOOM, 0);
  const fused = fuseGrids(gA, gB, target);
  return { estPx: (TRUE_SHIFT + err) * CELL, rowPx: REG_H / Math.max(1, gA.rows), fused };
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  a: Box;
  b: Box;
  labelA: { x: number; y: number };
  labelB: { x: number; y: number };
  legend: { x: number; y: number };
  read1: { x: number; y: number };
  read2: { x: number; y: number };
  font: number;
}

export function layoutFor(narrow: boolean): Layout {
  if (narrow) {
    return {
      a: { x: 220, y: 60, w: REG_W, h: REG_H },
      b: { x: 220, y: 346, w: REG_W, h: REG_H },
      labelA: { x: 220, y: 52 },
      labelB: { x: 220, y: 338 },
      legend: { x: 220, y: 612 },
      read1: { x: 860, y: 604 },
      read2: { x: 860, y: 628 },
      font: 16,
    };
  }
  return {
    a: { x: 30, y: 56, w: 330, h: REG_H },
    b: { x: 390, y: 56, w: REG_W, h: REG_H },
    labelA: { x: 30, y: 48 },
    labelB: { x: 390, y: 48 },
    legend: { x: 30, y: 326 },
    read1: { x: 1030, y: 322 },
    read2: { x: 1030, y: 346 },
    font: 17,
  };
}

/** A 区：布纹 + 两张印样的格子。帧 1 实线，帧 2 虚线（按估计位移摆放）。 */
function drawSampling(ctx: CanvasRenderingContext2D, box: Box, recon: Recon, err: number): void {
  // 布纹：与取样同一个放大倍数，看到的就是被采样的那一块
  ctx.drawImage(
    fabricCanvas(),
    FAB_OX, FAB_OY, box.w / ZOOM, box.h / ZOOM,
    box.x, box.y, box.w, box.h
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();

  // 帧 1：实线，位移 0
  ctx.strokeStyle = PAPER.blue;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([]);
  ctx.beginPath();
  for (let x = 0; x <= box.w + 0.5; x += CELL) {
    ctx.moveTo(box.x + x + 0.5, box.y);
    ctx.lineTo(box.x + x + 0.5, box.y + box.h);
  }
  for (let y = 0; y <= box.h + 0.5; y += recon.rowPx) {
    ctx.moveTo(box.x, box.y + y + 0.5);
    ctx.lineTo(box.x + box.w, box.y + y + 0.5);
  }
  ctx.stroke();

  // 帧 2：虚线，按**估计**位移摆放
  ctx.strokeStyle = PAPER.orange;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  for (let x = recon.estPx % CELL; x <= box.w + CELL; x += CELL) {
    ctx.moveTo(box.x + x + 0.5, box.y);
    ctx.lineTo(box.x + x + 0.5, box.y + box.h);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  ctx.restore();

  // 套准旋钮：指针角度随对齐误差走
  const angle = clamp(err / 0.5, -1, 1) * 0.9;
  const band = bandOf(err);
  const knobColor =
    band === 'crisp' ? PAPER.green : band === 'ghost' ? PAPER.orange : PAPER.red;
  drawRegisterKnob(ctx, box.x + 46, box.y + box.h - 46, 27, angle, knobColor);
}

/** B 区：把融合出来的细网格放大 ZOOM 倍画出来（细网格 = 10 显示像素）。 */
function drawFusedScaled(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  g: CellGrid
): void {
  const dw = g.cw * ZOOM; // 一格在显示上的宽度 = FINE
  const dh = g.ch * ZOOM;
  ctx.save();
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const v = Math.round(clamp(g.vals[r * g.cols + c], 0, 255));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(dx + c * dw, dy + r * dh, dw + 1, dh + 1);
    }
  }
  ctx.restore();
}

export function renderSim(
  ctx: CanvasRenderingContext2D,
  H: number,
  recon: Recon,
  err: number
): void {
  const narrow = H > H_WIDE;
  const L = layoutFor(narrow);

  clearScene(ctx, W, H);

  drawSampling(ctx, L.a, recon, err);

  // B 区：fuseGrids 的重建结果
  const g = recon.fused;
  const bw = g.cols * g.cw * ZOOM;
  const bh = g.rows * g.ch * ZOOM;
  drawFusedScaled(ctx, L.b.x, L.b.y, g);
  ctx.save();
  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(L.b.x + 0.5, L.b.y + 0.5, bw - 1, bh - 1);
  ctx.restore();

  drawSceneLabel(ctx, L.labelA.x, L.labelA.y, '采样位置', PAPER.screenLine);
  drawSceneLabel(ctx, L.labelB.x, L.labelB.y, '拼出来的细网格', PAPER.screenLine);
  drawLegend(ctx, L.legend.x, L.legend.y, [
    { color: PAPER.blue, label: '帧 1' },
    { color: PAPER.orange, label: '帧 2' },
  ]);

  // 读数：裸数字
  ctx.save();
  ctx.fillStyle = PAPER.ink;
  ctx.font = `600 ${L.font}px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`真实位移 0.50 格`, L.read1.x, L.read1.y);
  ctx.fillStyle = PAPER.muted;
  ctx.font = `${L.font - 2}px ${FONT}`;
  ctx.fillText(`方法估计 ${(0.5 + err).toFixed(2)} 格`, L.read2.x, L.read2.y);
  ctx.restore();
}

function feedbackFor(err: number, band: Band): { text: string; cls: string } {
  if (band === 'crisp') {
    return {
      cls: 'good',
      text: '位移估得准，两帧的采样错开得正好，拼出来的细节比单帧多。',
    };
  }
  if (band === 'ghost') {
    return {
      cls: 'warn',
      text: `估计偏了 ${Math.abs(err).toFixed(2)} 格，两帧的采样开始往一起靠，多帧的收益在缩水。`,
    };
  }
  return {
    cls: 'bad',
    text: `估计偏了 ${Math.abs(err).toFixed(2)} 格——两帧的采样几乎重合，多帧等于白拼，结果和只有一帧差不多。`,
  };
}

export const M3_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reconRef = useRef<Recon | null>(null);
  const errRef = useRef(0);

  const [err, setErr] = useState(0);

  // 融合只在 err 变化时重算一次
  useEffect(() => {
    reconRef.current = computeRecon(err);
    errRef.current = err;
  }, [err]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let H = H_WIDE;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf = 0;
    let running = false;
    let ready = false;

    const frame = () => {
      const shown = canvas.getBoundingClientRect().width;
      const wantH = shown > 0 && shown < 720 ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        try {
          ctx = setupCanvas(canvas, W, H);
        } catch {
          /* 保持上一次尺寸继续画 */
        }
      }

      const recon = reconRef.current;
      if (recon) renderSim(ctx, H, recon, errRef.current);

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    errRef.current = v;
    setErr(v);
  };

  const band = bandOf(err);
  const feedback = feedbackFor(err, band);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="对齐误差的代价"
      />
      <div className="ctrl">
        <label htmlFor={`err-${chapterId}-${moduleId}`}>对齐误差</label>
        <input
          id={`err-${chapterId}-${moduleId}`}
          type="range"
          min={-0.5}
          max={0.5}
          step={0.01}
          value={err}
          onChange={onChange}
        />
        <span className="val">{err.toFixed(2)} 格</span>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default M3_1;
