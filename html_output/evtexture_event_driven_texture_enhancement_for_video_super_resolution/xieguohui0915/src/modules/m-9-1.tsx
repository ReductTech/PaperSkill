import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawAxes,
  drawLegend,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import type { WidgetProps } from './registry';

// §9.1 一次训练迭代里发生了什么（制版台主题）
//
// 画布 1080×400。一条从左到右的训练回路，四个圆角方框：
//   取一批样本 → 前向：输出 I^SR → 算损失 L → 反向：更新参数
// 方框之间用箭头相连；最后一格用一条虚线绕回第一格（标「下一批」）。
// 主操作：步进 上一步 / 下一步 / 重置，共 4 步。当前步的方框用 PAPER.green
// 双线描边并以 1.5s 周期脉动，已经走过的方框描蓝边，还没到的方框描浅边。
// 损失那一格下方是一条很小的损失曲线，横轴 = 迭代，纵轴 = 损失。
//
// 诚实边界：这条损失曲线是**原理示意，不是真实训练曲线**——它只是说明
// 「迭代越往后，损失越低」这个方向，纵轴没有刻度、也没有对应的真实数值。
// 画布下方另有一句同样的说明（原理示意，非真实训练曲线）。

const W = 1080;
const H_WIDE = 400;
const H_NARROW = 600;
const STEPS = 4;
const PULSE_MS = 1500;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

/** 方框内的名称（图表内容）。 */
const NODE_LABEL = [
  '取一批样本',
  '前向：输出 I^SR',
  '算损失 L',
  '反向：更新参数',
];

/** DOM 步进标签上的短名。 */
const STEP_NAME = ['取一批样本', '前向', '算损失', '反向更新'];

/** 逐步提示（逐字照抄规范）。 */
const STEP_DESC: { text: string; cls: string }[] = [
  { text: '一次取 8 个训练样本（batch size 8）。', cls: 'info' },
  { text: '网络前向，输出这一批的超分结果 I^SR。', cls: 'info' },
  {
    text: '和真值 I^HR 比，算出 Charbonnier 损失。它对大误差更像绝对值，比 L2 更不容易被离群点带偏。',
    cls: 'info',
  },
  {
    text: '反向传播，更新参数——更新的范围由训练模式决定（见下一节）。然后回到第一步。整个过程重复 30 万次（独立模式）或 20 万次（插件模式）。',
    cls: 'good',
  },
];

// 损失曲线的示意采样点（12 个点，横轴 = 迭代，纵轴 = 损失，归一化、无刻度）。
// 数组下标 = 步进下标。每一档都单调不增，且尾端随步进下降：示意「这一次迭代
// 走完，损失比上一档更低」。**不是真实训练曲线**。
const LOSS_CURVES: number[][] = [
  [0.97, 0.95, 0.93, 0.91, 0.9, 0.89, 0.88, 0.87, 0.86, 0.85, 0.84, 0.83],
  [0.97, 0.94, 0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54],
  [0.97, 0.93, 0.87, 0.8, 0.73, 0.66, 0.59, 0.52, 0.45, 0.39, 0.33, 0.28],
  [0.97, 0.91, 0.84, 0.75, 0.66, 0.57, 0.48, 0.4, 0.32, 0.25, 0.19, 0.14],
];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  /** 纵向堆叠（窄屏）时为 true；否则横向一排。 */
  column: boolean;
  nodes: Rect[];
  curve: Rect;
  curveLabel: { x: number; y: number };
  loopLabel: { x: number; y: number };
  legend: { x: number; y: number };
}

function layoutFor(narrow: boolean): Layout {
  if (narrow) {
    // 窄屏：四个方框纵向堆叠，回路从最后一格沿左侧绕回第一格
    const x = 180;
    const w = 760;
    const h = 62;
    return {
      column: true,
      nodes: [
        { x, y: 24, w, h },
        { x, y: 106, w, h },
        { x, y: 188, w, h },
        { x, y: 270, w, h },
      ],
      curve: { x: 180, y: 416, w: 420, h: 144 },
      curveLabel: { x: 180, y: 406 },
      loopLabel: { x: 310, y: 366 },
      legend: { x: 640, y: 500 },
    };
  }
  // 宽屏：一排四个方框，回路从最后一格下方绕回第一格下方
  return {
    column: false,
    nodes: [
      { x: 30, y: 40, w: 228, h: 84 },
      { x: 294, y: 40, w: 228, h: 84 },
      { x: 558, y: 40, w: 228, h: 84 },
      { x: 822, y: 40, w: 228, h: 84 },
    ],
    curve: { x: 558, y: 214, w: 228, h: 126 },
    curveLabel: { x: 558, y: 204 },
    loopLabel: { x: 515, y: 172 },
    legend: { x: 30, y: 372 },
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 实心三角箭头。dir 是箭头指向。 */
function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 'up' | 'down' | 'left' | 'right',
  size: number
): void {
  const s = size;
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(x, y);
    ctx.lineTo(x - s, y - s * 0.6);
    ctx.lineTo(x - s, y + s * 0.6);
  } else if (dir === 'left') {
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y - s * 0.6);
    ctx.lineTo(x + s, y + s * 0.6);
  } else if (dir === 'down') {
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * 0.6, y - s);
    ctx.lineTo(x + s * 0.6, y - s);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * 0.6, y + s);
    ctx.lineTo(x + s * 0.6, y + s);
  }
  ctx.closePath();
  ctx.fill();
}

type NodeState = 'done' | 'current' | 'future';

/** 圆角方框：白底 + 描边 + PAPER.ink 文字。当前步 = 绿双线 + 脉动内圈。 */
function drawNode(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  text: string,
  state: NodeState,
  pulse: number
): void {
  ctx.save();
  ctx.fillStyle = PAPER.print;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();

  if (state === 'current') {
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 2.6;
    roundRect(ctx, r.x + 1.3, r.y + 1.3, r.w - 2.6, r.h - 2.6, 9);
    ctx.stroke();

    ctx.globalAlpha = 0.3 + 0.7 * pulse;
    ctx.lineWidth = 1.4;
    roundRect(ctx, r.x + 5.5, r.y + 5.5, r.w - 11, r.h - 11, 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = state === 'done' ? PAPER.blue : PAPER.printEdge;
    ctx.lineWidth = state === 'done' ? 1.8 : 1.4;
    roundRect(ctx, r.x + 0.7, r.y + 0.7, r.w - 1.4, r.h - 1.4, 9);
    ctx.stroke();
  }

  ctx.fillStyle = PAPER.ink;
  ctx.globalAlpha = state === 'future' ? 0.5 : 1;
  ctx.font = `17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.restore();
}

interface CurveGeo {
  x0: number;
  y0: number;
  plotW: number;
  plotH: number;
}

function strokeCurve(
  ctx: CanvasRenderingContext2D,
  values: number[],
  g: CurveGeo,
  color: string,
  lineWidth: number,
  dash: number[],
  alpha: number
): void {
  const n = values.length;
  if (n < 2) return;
  const span = Math.max(1, n - 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const px = g.x0 + (i / span) * g.plotW;
    const py = g.y0 - values[i] * g.plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/** 很小的损失曲线：横轴 = 迭代，纵轴 = 损失。示意，纵轴无刻度。 */
function drawLossCurve(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  step: number
): void {
  drawAxes(ctx, r.x, r.y, r.w, r.h);

  const padL = 30;
  const padR = 16;
  const padT = 16;
  const padB = 26;
  const plotW = Math.max(10, r.w - padL - padR);
  const plotH = Math.max(10, r.h - padT - padB);
  const g: CurveGeo = {
    x0: r.x + padL,
    y0: r.y + r.h - padB,
    plotW,
    plotH: plotH * 0.9,
  };

  // 两根轴：横轴 = 迭代方向，纵轴 = 损失大小
  ctx.save();
  ctx.strokeStyle = PAPER.muted;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(g.x0, g.y0);
  ctx.lineTo(g.x0 + plotW + 8, g.y0);
  ctx.moveTo(g.x0, g.y0);
  ctx.lineTo(g.x0, g.y0 - plotH);
  ctx.stroke();
  ctx.fillStyle = PAPER.muted;
  arrowHead(ctx, g.x0 + plotW + 10, g.y0, 'right', 6);
  ctx.restore();

  // 上一步的曲线（淡虚线，用来看出这次更新后的下降）
  const s = clamp(step, 0, STEPS - 1);
  if (s > 0) {
    strokeCurve(ctx, LOSS_CURVES[s - 1], g, PAPER.axis, 1.4, [5, 4], 1);
  }
  strokeCurve(ctx, LOSS_CURVES[s], g, PAPER.orange, 2.2, [], 1);

  // 当前曲线的末端点
  const cur = LOSS_CURVES[s];
  const lastX = g.x0 + g.plotW;
  const lastY = g.y0 - cur[cur.length - 1] * g.plotH;
  ctx.save();
  ctx.fillStyle = PAPER.orange;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 横轴名（图表内容，10px）
  ctx.save();
  ctx.fillStyle = PAPER.muted;
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('迭代', r.x + r.w - 10, r.y + r.h - 8);
  ctx.restore();
}

export const M9_1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(() => STEP_DESC[0]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

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

    const frame = (now: number) => {
      const shownW = canvas.getBoundingClientRect().width;
      const narrow = shownW > 0 && shownW < 720;
      const wantH = narrow ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        ctx = setupCanvas(canvas, W, H);
      }

      const s = clamp(stepRef.current, 0, STEPS - 1);
      const L = layoutFor(narrow);
      const pulse = 0.5 + 0.5 * Math.sin((now / PULSE_MS) * Math.PI * 2);

      clearScene(ctx, W, H);

      // ---- 方框之间的箭头 ----
      ctx.save();
      ctx.strokeStyle = PAPER.muted;
      ctx.fillStyle = PAPER.muted;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]);
      for (let i = 0; i < STEPS - 1; i++) {
        const a = L.nodes[i];
        const b = L.nodes[i + 1];
        ctx.beginPath();
        if (L.column) {
          const cx = a.x + a.w / 2;
          ctx.moveTo(cx, a.y + a.h + 3);
          ctx.lineTo(cx, b.y - 11);
          ctx.stroke();
          arrowHead(ctx, cx, b.y - 2, 'down', 9);
        } else {
          const cy = a.y + a.h / 2;
          ctx.moveTo(a.x + a.w + 3, cy);
          ctx.lineTo(b.x - 11, cy);
          ctx.stroke();
          arrowHead(ctx, b.x - 2, cy, 'right', 9);
        }
      }
      ctx.restore();

      // ---- 回路虚线：最后一格 → 第一格 ----
      const first = L.nodes[0];
      const last = L.nodes[STEPS - 1];
      ctx.save();
      const loopHot = s === STEPS - 1;
      ctx.strokeStyle = loopHot ? PAPER.green : PAPER.muted;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = loopHot ? 0.45 + 0.55 * pulse : 1;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      if (L.column) {
        const cx = last.x + last.w / 2;
        const cy = first.y + first.h / 2;
        ctx.moveTo(cx, last.y + last.h);
        ctx.lineTo(cx, 372);
        ctx.lineTo(110, 372);
        ctx.lineTo(110, cy);
        ctx.lineTo(first.x - 11, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        arrowHead(ctx, first.x - 2, cy, 'right', 9);
      } else {
        const cx = first.x + first.w / 2;
        const lx = last.x + last.w / 2;
        ctx.moveTo(lx, last.y + last.h);
        ctx.lineTo(lx, 178);
        ctx.lineTo(cx, 178);
        ctx.lineTo(cx, first.y + first.h + 11);
        ctx.stroke();
        ctx.setLineDash([]);
        arrowHead(ctx, cx, first.y + first.h + 2, 'up', 9);
      }
      ctx.restore();

      // ---- 四个方框 ----
      for (let i = 0; i < STEPS; i++) {
        const state: NodeState = i < s ? 'done' : i === s ? 'current' : 'future';
        drawNode(ctx, L.nodes[i], NODE_LABEL[i], state, pulse);
      }

      // ---- 损失那一格旁边的损失曲线（示意）----
      drawLossCurve(ctx, L.curve, s);

      // ---- 短标签（2 个）+ 图例 ----
      drawSceneLabel(ctx, L.curveLabel.x, L.curveLabel.y, '损失曲线（示意）');
      drawSceneLabel(ctx, L.loopLabel.x, L.loopLabel.y, '下一批', PAPER.muted);
      drawLegend(ctx, L.legend.x, L.legend.y, [
        { color: PAPER.green, label: '当前步' },
        { color: PAPER.orange, label: '损失' },
      ]);

      if (!ready) {
        canvas.classList.add('is-ready');
        ready = true;
      }
      if (running) raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const v = clamp(Math.round(next), 0, STEPS - 1);
    stepRef.current = v;
    setStep(v);
    setFeedback(STEP_DESC[v]);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="一次训练迭代里发生了什么"
      />
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => go(step - 1)}
          disabled={step === 0}
        >
          上一步
        </button>
        <span className="step-label">
          <b>{STEP_NAME[step]}</b> · 第 {step + 1} / {STEPS} 步
        </span>
        <button
          type="button"
          className="tiny"
          onClick={() => go(step + 1)}
          disabled={step >= STEPS - 1}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <p className="note" style={{ fontSize: 12, margin: '6px 2px 0' }}>
        原理示意，非真实训练曲线
      </p>
    </div>
  );
};

export default M9_1;
