import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SKIN, clearScene, drawLabel, drawLegend, drawMiniBars, drawSlide } from './viz-kit';

// Module 4.1 —— 精检多少个区域才算够
// One dominant operation: drag the handle that sets how many of the slide's real
// 1020 tissue ROIs are re-inspected at high power (40–400), and compare with the
// paper's real inspection budget (mean 194.5 ± 102.8 regions per slide).
// 画法：一张可辨认的 H&E 玻璃载玻片；沿组织上的蛇形扫描路径排布圆形镜下视野圈，
//       每个圈 = 一个真正被高倍精检的区域；橙色刻度 = 原文真实均值 194.5 ± 102.8。
//       右侧保留 drawMiniBars 的真实三档数值对照。所有原文数字写在 DOM。

const W = 1080;
const H = 280;

// Real numbers from the paper's inspection-budget report.
const TOTAL_ROI = 1020; // 20× tissue ROIs per slide
const TOTAL_SD = 783;
const MEAN_INSPECTED = 194.5; // regions actually inspected per slide
const MEAN_SD = 102.8;
const HIGH_MEAN = 156.4;
const HIGH_SD = 90.3;
const MID_MEAN = 31.1;
const MID_SD = 23.8;
const LOW_MEAN = 6.9;
const LOW_SD = 4.8;

const MIN_INSPECTED = 40;
const MAX_INSPECTED = 400;
const DEFAULT_INSPECTED = 195;

const TAU = Math.PI * 2;

// ---- 玻片几何：drawSlide 的 H&E 组织位于「磨砂标签端之外」的中央区，
//      是一个半轴 rx=W*0.3、ry=H*0.275、带 ±17% 抖动的有机形状；
//      这里取 0.76 倍作为扫描范围，保证视野圈全部落在组织上。----
const SLIDE = { x: 18, y: 26, w: 604, h: 186 };
const FROST_W = Math.max(16, SLIDE.w * 0.24);
const TISSUE = {
  x: SLIDE.x + FROST_W + (SLIDE.w - FROST_W) * 0.5,
  y: SLIDE.y + SLIDE.h * 0.5,
  rx: SLIDE.w * 0.3 * 0.76,
  ry: SLIDE.h * 0.275 * 0.76,
};

// ---- 蛇形扫描路径：在组织椭圆内往返 7 条扫描带；整条路径均分 400 个槽位
//      （= 控件的 40–400 轴：槽位 i 对应 i 个高倍精检区域）。----
const LANES = 7;
const LANE_HALF = TISSUE.ry - 6;
const LANE_STEP = (LANE_HALF * 2) / (LANES - 1);

function laneYAt(lane: number): number {
  return TISSUE.y - LANE_HALF + lane * LANE_STEP;
}

/** 第 lane 条扫描带在组织内的半长（随椭圆收窄，两端再留 7px 余量）。 */
function laneHalfAt(lane: number): number {
  const t = clamp((laneYAt(lane) - TISSUE.y) / TISSUE.ry, -0.999, 0.999);
  return Math.max(18, TISSUE.rx * Math.sqrt(1 - t * t) - 7);
}

const LANE_LENS: number[] = [];
for (let i = 0; i < LANES; i++) LANE_LENS.push(laneHalfAt(i) * 2);

const PATH_LEN =
  LANE_LENS.reduce((sum, len) => sum + len, 0) + (LANES - 1) * LANE_STEP;
const SLOTS = MAX_INSPECTED;
const SLOT_STEP = PATH_LEN / SLOTS;
const RING_R = clamp(SLOT_STEP * 0.75, 3.4, 6.5);

// ---- 底部标尺（拖动把手：40–400 个高倍精检区域）----
const RULER = { x0: 24, x1: 622, y: 244, knobY: 252, knobR: 8 };

type Feedback = { text: string; cls: '' | 'good' | 'bad' };

function judge(inspected: number): Feedback {
  if (inspected < 120) {
    return {
      text: '精检不到 120 个区域：原文正是在这种预算下漏掉了 1/150 的 Merkel 细胞癌微小灶。',
      cls: 'bad',
    };
  }
  if (inspected < 260) {
    return {
      text: '约 194 个区域、不到两成预算，与原文的实际用量一致（平均 194.5 ± 102.8）。',
      cls: 'good',
    };
  }
  return {
    text: '远超实际用量：原文报告检视区域数与诊断准确率无显著相关——看得多不等于看得准。',
    cls: '',
  };
}

/** 40–400 的检视区域数 → 标尺横坐标。 */
function axisX(v: number): number {
  const t =
    (clamp(v, MIN_INSPECTED, MAX_INSPECTED) - MIN_INSPECTED) / (MAX_INSPECTED - MIN_INSPECTED);
  return RULER.x0 + t * (RULER.x1 - RULER.x0);
}

/** 第 i 个槽位（0..SLOTS-1）在蛇形路径上的中心点。 */
function slotPoint(i: number): { x: number; y: number } {
  let s = (i + 0.5) * SLOT_STEP;
  for (let lane = 0; lane < LANES; lane++) {
    const len = LANE_LENS[lane];
    const half = len / 2;
    const y = laneYAt(lane);
    const ltr = lane % 2 === 0;
    if (s <= len) {
      const t = clamp(s / len, 0, 1);
      return { x: ltr ? TISSUE.x - half + len * t : TISSUE.x + half - len * t, y };
    }
    s -= len;
    if (lane < LANES - 1) {
      if (s <= LANE_STEP) {
        return { x: ltr ? TISSUE.x + half : TISSUE.x - half, y: y + clamp(s, 0, LANE_STEP) };
      }
      s -= LANE_STEP;
    }
  }
  const last = LANES - 1;
  return {
    x: TISSUE.x + (last % 2 === 0 ? LANE_LENS[last] / 2 : -LANE_LENS[last] / 2),
    y: laneYAt(last),
  };
}

/** 蛇形扫描路径本身（浅色折线），让扫描顺序可读。 */
function strokeScanPath(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = SKIN.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let lane = 0; lane < LANES; lane++) {
    const y = laneYAt(lane);
    const half = LANE_LENS[lane] / 2;
    const ltr = lane % 2 === 0;
    const sx = ltr ? TISSUE.x - half : TISSUE.x + half;
    const ex = ltr ? TISSUE.x + half : TISSUE.x - half;
    if (lane === 0) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
    ctx.lineTo(ex, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** 被高倍精检的区域：圆形镜下视野圈（含扫描头脉冲）。 */
function drawInspectionRings(ctx: CanvasRenderingContext2D, inspected: number, now: number): void {
  const n = clamp(Math.round(inspected), 0, SLOTS);
  if (n <= 0) return;

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p = slotPoint(i);
    ctx.moveTo(p.x + RING_R, p.y);
    ctx.arc(p.x, p.y, RING_R, 0, TAU);
  }
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = SKIN.blue;
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = SKIN.blue;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 扫描头：最后一个被检区域轻轻脉冲。
  const head = slotPoint(n - 1);
  const pulse = 0.5 + 0.5 * Math.sin(now / 320);
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.4 * pulse;
  ctx.strokeStyle = SKIN.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(head.x, head.y, RING_R + 4 + 3 * pulse, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/** 橙色刻度：原文真实均值 194.5 ± 102.8 落在扫描路径上的位置。 */
function drawMeanOnPath(ctx: CanvasRenderingContext2D): void {
  const p = slotPoint(MEAN_INSPECTED - 0.5);
  ctx.save();
  ctx.strokeStyle = SKIN.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, RING_R + 5, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x - RING_R - 12, p.y);
  ctx.lineTo(p.x - RING_R - 5, p.y);
  ctx.stroke();
  ctx.restore();
}

export const M4BudgetSplit: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ inspected: number }>({ inspected: DEFAULT_INSPECTED });
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [inspected, setInspected] = useState(DEFAULT_INSPECTED);
  const [feedback, setFeedback] = useState<Feedback>(() => judge(DEFAULT_INSPECTED));

  const commit = (v: number) => {
    const n = clamp(Math.round(v), MIN_INSPECTED, MAX_INSPECTED);
    stateRef.current = { inspected: n };
    setInspected(n);
    setFeedback(judge(n));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { inspected: number }, now: number) => {
      clearScene(ctx, W, H);

      // ---- 一张真实的玻璃载玻片 + H&E 组织切片 ----
      drawSlide(ctx, SLIDE.x, SLIDE.y, SLIDE.w, SLIDE.h, { tissue: 'section', label: 'H&E' });

      // ---- 组织上的蛇形扫描路径 + 被精检的圆形镜下视野圈 ----
      strokeScanPath(ctx);
      drawInspectionRings(ctx, s.inspected, now);
      drawMeanOnPath(ctx);

      // ---- 底部标尺：橙色刻度 = 原文真实均值 ± 1 SD ----
      const meanX = axisX(MEAN_INSPECTED);
      const loX = axisX(clamp(MEAN_INSPECTED - MEAN_SD, MIN_INSPECTED, MAX_INSPECTED));
      const hiX = axisX(clamp(MEAN_INSPECTED + MEAN_SD, MIN_INSPECTED, MAX_INSPECTED));

      ctx.save();
      ctx.strokeStyle = SKIN.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(RULER.x0, RULER.y);
      ctx.lineTo(RULER.x1, RULER.y);
      ctx.stroke();

      // 橙色胶带：原文平均检视 194.5 ± 102.8 的区间。
      ctx.strokeStyle = SKIN.orange;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(loX, RULER.y);
      ctx.lineTo(hiX, RULER.y);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(meanX, RULER.y - 10);
      ctx.lineTo(meanX, RULER.y + 10);
      ctx.stroke();
      ctx.restore();

      drawLabel(ctx, meanX + 7, RULER.y - 17, MEAN_INSPECTED.toFixed(1), SKIN.orange, 14);

      // ---- 拖动把手：高倍精检区域数 ----
      const hx = axisX(s.inspected);
      ctx.save();
      ctx.strokeStyle = SKIN.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx, 216);
      ctx.lineTo(hx, RULER.y + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, RULER.knobY, RULER.knobR, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = SKIN.blue;
      ctx.beginPath();
      ctx.arc(hx, RULER.knobY, 3, 0, TAU);
      ctx.fill();
      ctx.restore();

      drawLabel(ctx, clamp(hx - 18, 22, 556), 200, String(s.inspected), SKIN.blue, 17);

      // ---- 右：原文实测三档（technical inset，0–200 个区域）----
      drawMiniBars(
        ctx,
        660,
        62,
        390,
        132,
        [
          { value: HIGH_MEAN, color: SKIN.blue },
          { value: MID_MEAN, color: SKIN.purple },
          { value: LOW_MEAN, color: SKIN.green },
        ],
        200
      );
      drawLegend(ctx, 664, 216, [
        { label: '高倍', color: SKIN.blue },
        { label: '中倍', color: SKIN.purple },
        { label: '低倍', color: SKIN.green },
      ]);

      // 至多两个画布内标签；数值可裸写。
      drawLabel(ctx, 22, 15, '玻片扫描', SKIN.text, 15);
      drawLabel(ctx, 660, 15, '实测三档', SKIN.text, 15);
    };

    const tick = () => {
      render(stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  // CSS pixels → the 1080×280 intrinsic space.
  const pointerToInspected = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return DEFAULT_INSPECTED;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return DEFAULT_INSPECTED;
    const x = (clientX - rect.left) * (W / rect.width);
    const t = (x - RULER.x0) / (RULER.x1 - RULER.x0);
    return MIN_INSPECTED + t * (MAX_INSPECTED - MIN_INSPECTED);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture is optional */
    }
    commit(pointerToInspected(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    commit(pointerToInspected(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer capture is optional */
    }
  };

  const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!isFinite(v)) return;
    commit(v);
  };

  const sharePct = Math.round((inspected / TOTAL_ROI) * 1000) / 10;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          高倍精检区域数 <span className="val">{inspected}</span>
        </label>
        <input
          type="range"
          min={MIN_INSPECTED}
          max={MAX_INSPECTED}
          step={1}
          value={inspected}
          aria-label="高倍精检区域数"
          onChange={onRange}
        />
        <label>
          占全量 <span className="val">{sharePct}%</span>
        </label>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">高倍精检区域数（拖动把手）</div>
          <div className="v">{inspected}</div>
        </div>
        <div className="metric">
          <div className="l">占全量比例</div>
          <div className="v">{sharePct}%</div>
        </div>
        <div className="metric">
          <div className="l">原文平均检视区域</div>
          <div className="v">{MEAN_INSPECTED.toFixed(1) + ' ± ' + MEAN_SD.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="l">20× 每张切片组织 ROI</div>
          <div className="v">{TOTAL_ROI + ' ± ' + TOTAL_SD}</div>
        </div>
        <div className="metric">
          <div className="l">原文实测：高倍</div>
          <div className="v">{HIGH_MEAN.toFixed(1) + ' ± ' + HIGH_SD.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="l">原文实测：中倍</div>
          <div className="v">{MID_MEAN.toFixed(1) + ' ± ' + MID_SD.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="l">原文实测：低倍</div>
          <div className="v">{LOW_MEAN.toFixed(1) + ' ± ' + LOW_SD.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="l">原文三档均值之和</div>
          <div className="v">194.4</div>
        </div>
        <div className="metric">
          <div className="l">原文结论</div>
          <div className="v">检视区域数与准确率无显著相关</div>
        </div>
      </div>
      <div className="step-desc">
        左侧为一张 H&E 载玻片的组织切片，沿蛇形扫描路径的每个圆形视野圈 = 一个进入高倍精检的区域（当前
        {inspected} 个），橙色刻度 = 原文平均检视 194.5 ± 102.8；右侧柱条为原文实测的三档均值（高倍
        156.4、中倍 31.1、低倍 6.9；三档四舍五入之和为 194.4，原文总平均为 194.5）。
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M4BudgetSplit;
