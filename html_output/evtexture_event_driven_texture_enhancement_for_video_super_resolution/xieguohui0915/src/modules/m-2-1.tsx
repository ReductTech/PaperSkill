import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { clearScene, drawAxes, drawLegend, drawSceneLabel, PAPER } from './halftoneKit';
import { cellMeans } from './fabricKit';
import type { WidgetProps } from './registry';

// §2.1 一个像素什么时候才报事件
//
// 这一块是对事件相机（DVS）工作方式的**真实模拟**，不是示意图：
//   每个像素保存一个参考值 ref；每隔 50ms（20Hz）读一次该像素当前的格子平均值 v；
//   只有 |v − ref| > C × 255 时才报一个事件，并把 ref = v。
//   参考值**只在报事件时更新** —— 这正是"只记录变化"的全部含义。
//   rAF 的每一帧只负责把缓存下来的状态画出来，绝不逐帧读像素（cellMeans 会 getImageData）。
//
// 关于取样尺度：这是一台"凑近看布纹"的相机 —— 每个像素格取的是布纹里 2.66×9.38 个像素的
// 一块（约 0.27×0.94 根线，放大 16 倍显示成 42.5×150 的一格）。这一放大倍数是必需的：
// 若按 1:1 取样，一格横跨 4.25 根线，格子平均值随时间起伏不到 10 个灰阶，
// C > 0.04 时永远不可能触发事件，整个阈值滑块会变成死的（实测验证过）。
// 放大后每格仍是真的面积平均，且事件率对 C 严格单调，整个滑块都活着。
// 布纹滑动 20 布纹像素/秒（显示上相当于 320px/秒，一条像素阵约 3.2 秒走完）。

const W = 1080;
const H_WIDE = 400;
const H_NARROW = 640;

const N = 24;                       // 像素个数
const STRIP_W = 1020;               // 像素阵总宽
const CELL_PX = STRIP_W / N;        // 每格 42.5 显示像素宽
const SCAN_H = 150;                 // 上区高度，也就是每格参与面积平均的高度
const ZOOM = 16;                    // 显示放大倍数：显示 42.5px 的格子对应布纹里 2.66px
const FAB_OY = 200;                 // 在布纹里的纵向起点
const SLIDE = 20;                   // 布纹滑动速度（布纹像素/秒）
const SIM_MS = 50;                  // 仿真步长
const WINDOW_MS = 2000;             // 事件窗口 / 反馈统计窗口
const MAX_EVENTS = 400;             // 滚动保留最近 400 条
const OX_SPAN = 2000;               // ox 回绕范围

// 反馈分档：最近 2 秒的事件数。
// 实测（C = 0.02 / 0.08 / 0.28）：400 / 约 310 / 约 3。阈值越低，窗口越会被 400 条上限灌满，
// 那本身就是"过密"；阈值越高事件越稀，高到 0.2 以上就基本触发不了。
const RATE_DENSE = 380;
const RATE_SPARSE = 60;

const DEFAULT_C = 0.08;
const WARM_STEPS = Math.round(WINDOW_MS / SIM_MS); // 入场前先跑满一个统计窗口

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export interface StampEvent {
  i: number; // 像素序号 0..23
  t: number; // 仿真时刻（ms）
  p: number; // +1 变亮 / -1 变暗
}

export interface Sim {
  ox: number;                // 布纹滑动偏移
  ref: Float32Array;         // 每个像素的参考值（只在报事件时更新）
  vals: Float32Array;        // 每个像素当前的格子平均值 0–255
  events: StampEvent[];      // 最近 2 秒、最多 400 条
  clock: number;             // 仿真时钟（ms）
  acc: number;               // 未消化的时间
  primed: boolean;           // 第一次采样只建立参考值，不报事件
}

export function createSim(): Sim {
  return {
    ox: 0,
    ref: new Float32Array(N),
    vals: new Float32Array(N),
    events: [],
    clock: 0,
    acc: 0,
    primed: false,
  };
}

/** 读一次像素：把布纹那一块的真实面积平均取出来（24 列 × 3 行，按列求平均）。 */
function samplePixels(ox: number): Float32Array {
  const g = cellMeans(ox, FAB_OY, STRIP_W / ZOOM, SCAN_H / ZOOM, CELL_PX / ZOOM);
  const out = new Float32Array(N);
  for (let c = 0; c < N; c++) {
    const cc = Math.min(c, g.cols - 1);
    let sum = 0;
    for (let r = 0; r < g.rows; r++) sum += g.vals[r * g.cols + cc];
    out[c] = g.rows > 0 ? sum / g.rows : 0;
  }
  return out;
}

/** 推进仿真。dtMs 由 rAF 给出；每个 50ms 的仿真步才读一次像素。 */
export function stepSim(sim: Sim, dtMs: number, thresholdC: number): void {
  sim.acc += clamp(dtMs, 0, 200);
  let steps = 0;
  while (sim.acc >= SIM_MS && steps < 4) {
    sim.acc -= SIM_MS;
    steps++;
    sim.clock += SIM_MS;

    sim.ox += (SLIDE * SIM_MS) / 1000;
    if (sim.ox > OX_SPAN) sim.ox -= OX_SPAN;

    const v = samplePixels(sim.ox);
    sim.vals = v;
    const th = thresholdC * 255;

    for (let i = 0; i < N; i++) {
      const val = v[i];
      if (!sim.primed) {
        sim.ref[i] = val; // 参考值初始化：不报事件
        continue;
      }
      const d = val - sim.ref[i];
      if (Math.abs(d) > th) {
        sim.events.push({ i, t: sim.clock, p: d > 0 ? 1 : -1 });
        sim.ref[i] = val; // 只有报事件时才更新参考值
      }
    }
    sim.primed = true;
  }

  // 滚动窗口：只留最近 2 秒、最多 400 条
  while (
    sim.events.length > 0 &&
    (sim.clock - sim.events[0].t > WINDOW_MS || sim.events.length > MAX_EVENTS)
  ) {
    sim.events.shift();
  }
}

/** 换阈值时清空统计窗口：参考值不动（那才是事件的真实物理状态），只重新开始计数。 */
export function resetWindow(sim: Sim): void {
  sim.events.length = 0;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Band extends Box {
  start: number; // 这一段从第几个像素开始
  count: number;
}

interface Layout {
  cells: Band[];
  slots: Band[];
  labelCells: { x: number; y: number };
  labelSlots: { x: number; y: number };
  legend: { x: number; y: number };
  readout: { x: number; y: number };
}

export function layoutFor(narrow: boolean): Layout {
  if (narrow) {
    return {
      cells: [
        { x: 30, y: 62, w: 1020, h: 120, start: 0, count: 12 },
        { x: 30, y: 300, w: 1020, h: 120, start: 12, count: 12 },
      ],
      slots: [
        { x: 30, y: 190, w: 1020, h: 100, start: 0, count: 12 },
        { x: 30, y: 428, w: 1020, h: 100, start: 12, count: 12 },
      ],
      labelCells: { x: 30, y: 54 },
      labelSlots: { x: 30, y: 182 },
      legend: { x: 30, y: 580 },
      readout: { x: 1050, y: 580 },
    };
  }
  return {
    cells: [{ x: 30, y: 70, w: 1020, h: 150, start: 0, count: 24 }],
    slots: [{ x: 30, y: 240, w: 1020, h: 110, start: 0, count: 24 }],
    labelCells: { x: 30, y: 62 },
    labelSlots: { x: 30, y: 232 },
    legend: { x: 30, y: 378 },
    readout: { x: 1050, y: 232 },
  };
}

/** 上区：一格一块平色，中央写裸整数（相机真正记下的东西）。 */
function drawCells(ctx: CanvasRenderingContext2D, box: Band, vals: Float32Array, narrow: boolean): void {
  const cw = box.w / box.count;
  const fs = narrow ? 17 : 15;
  ctx.save();
  ctx.font = `600 ${fs}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < box.count; k++) {
    const idx = box.start + k;
    const grey = Math.round(clamp(vals[idx], 0, 255));
    const x = box.x + k * cw;
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.fillRect(x, box.y, cw + 0.5, box.h);
    ctx.strokeStyle = 'rgba(33,50,74,0.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, box.y + 0.5, cw - 1, box.h - 1);
    ctx.fillStyle = grey > 140 ? PAPER.ink : '#e8eef7';
    ctx.fillText(String(grey), x + cw / 2, box.y + box.h / 2);
  }
  ctx.restore();
}

/** 下区：每个像素一条事件槽，报一个事件就从槽底往上落一个点（最新在最下面）。 */
function drawSlots(ctx: CanvasRenderingContext2D, box: Band, sim: Sim): void {
  drawAxes(ctx, box.x, box.y, box.w, box.h);
  const cw = box.w / box.count;

  const buckets: StampEvent[][] = [];
  for (let k = 0; k < box.count; k++) buckets.push([]);
  for (let e = 0; e < sim.events.length; e++) {
    const ev = sim.events[e];
    const k = ev.i - box.start;
    if (k >= 0 && k < box.count) buckets[k].push(ev);
  }

  const gap = 4.6;
  const maxDots = Math.max(1, Math.floor((box.h - 12) / gap));
  ctx.save();
  for (let k = 0; k < box.count; k++) {
    const x = box.x + k * cw;
    ctx.strokeStyle = 'rgba(33,50,74,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, box.y + 3);
    ctx.lineTo(x + 0.5, box.y + box.h - 3);
    ctx.stroke();

    const list = buckets[k];
    const shown = Math.min(list.length, maxDots);
    for (let d = 0; d < shown; d++) {
      const ev = list[list.length - 1 - d]; // d = 0 是最新的一条
      const y = box.y + box.h - 7 - d * gap;
      ctx.fillStyle = ev.p > 0 ? PAPER.evOn : PAPER.evOff;
      ctx.beginPath();
      ctx.arc(x + cw / 2, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function renderSim(ctx: CanvasRenderingContext2D, H: number, sim: Sim): void {
  const narrow = H > H_WIDE;
  const L = layoutFor(narrow);

  clearScene(ctx, W, H);

  for (const box of L.cells) drawCells(ctx, box, sim.vals, narrow);
  for (const box of L.slots) drawSlots(ctx, box, sim);

  drawSceneLabel(ctx, L.labelCells.x, L.labelCells.y, '像素格', PAPER.screenLine);
  drawSceneLabel(ctx, L.labelSlots.x, L.labelSlots.y, '事件槽', PAPER.screenLine);

  // 读数：裸数字
  ctx.save();
  ctx.fillStyle = PAPER.ink;
  ctx.font = `600 17px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${sim.events.length} 个事件 / 2 秒`, L.readout.x, L.readout.y);
  ctx.restore();

  // 凡画事件点必须配「变亮 / 变暗」两项图例
  drawLegend(ctx, L.legend.x, L.legend.y, [
    { color: PAPER.evOn, label: '变亮' },
    { color: PAPER.evOff, label: '变暗' },
  ]);
}

function feedbackFor(thresholdC: number, rate: number): { text: string; cls: string } {
  if (rate > RATE_DENSE) {
    return {
      cls: 'warn',
      text: '阈值太低，连最轻微的光照起伏也在报事件——信息里混进了噪声。',
    };
  }
  if (rate < RATE_SPARSE) {
    return {
      cls: 'bad',
      text: `阈值太高，慢一点的变化完全触发不了事件，${rate} 个事件太稀，运动轨迹会断掉。`,
    };
  }
  return {
    cls: 'good',
    text: `阈值适中：只有真正超过 ${thresholdC.toFixed(2)} 的变化才被记下来，${rate} 个事件已经足够描述这段运动。`,
  };
}

export const M2_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);
  if (simRef.current === null) {
    // 入场前先跑满一个统计窗口：否则画布一进来是空的、反馈会读到一次"0 个事件"的假象
    const s = createSim();
    for (let k = 0; k < WARM_STEPS; k++) stepSim(s, SIM_MS, DEFAULT_C);
    simRef.current = s;
  }
  const sim = simRef.current;

  const thresholdRef = useRef(DEFAULT_C);
  const lastStatRef = useRef(-1e9);
  const shownRateRef = useRef(-1);
  const [thresholdC, setThresholdC] = useState(DEFAULT_C);
  const [rate, setRate] = useState(() => sim.events.length);

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
    let last = 0;

    const frame = (now: number) => {
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

      const dt = last === 0 ? SIM_MS : now - last;
      last = now;
      stepSim(sim, dt, thresholdRef.current);

      if (
        sim.clock - lastStatRef.current >= 300 &&
        sim.events.length !== shownRateRef.current
      ) {
        lastStatRef.current = sim.clock;
        shownRateRef.current = sim.events.length;
        setRate(shownRateRef.current);
      }

      renderSim(ctx, H, sim);

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
  }, [sim]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    thresholdRef.current = v;
    setThresholdC(v);
    resetWindow(sim); // 参考值保持不动，只重新开始统计窗口
    lastStatRef.current = -1e9; // 下一帧立刻按新阈值重新读数
    shownRateRef.current = -1;
    setRate(0);
  };

  const feedback = feedbackFor(thresholdC, rate);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="一个像素什么时候才报事件"
      />
      <div className="ctrl">
        <label htmlFor={`th-${chapterId}-${moduleId}`}>变化阈值 C</label>
        <input
          id={`th-${chapterId}-${moduleId}`}
          type="range"
          min={0.02}
          max={0.3}
          step={0.01}
          value={thresholdC}
          onChange={onChange}
        />
        <span className="val">{thresholdC.toFixed(2)}</span>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default M2_1;
