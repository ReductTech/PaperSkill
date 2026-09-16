import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// hero-loops — 封面双闭环流程图：传统人工循环 vs AHE 自动闭环
// 静态图：仅一次性入场淡入（约 1s），播完即静止，无循环动画。
// AHE 行上方标注三层可观测性：经验可观测（轨迹→证据）、组件可观测（修改）、
// 决策可观测（预测→验证→保留/回滚），对应论文三大支柱。

const W = 940;
const H = 360;
const DURATION = 1100; // 入场动画总时长（ms），播完静止

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
  purple: '#7c3aed',
};

const ROW1_Y = 84;
const ROW2_Y = 250;
const BOX_H = 42;
const ROW1_W = 118;
const ROW2_W = 90;

const PILL_Y = 186;
const PILL_H = 24;

interface FlowBox {
  label: string;
  cx: number;
  accent: string;
}

// 传统人工循环：运行 → 轨迹 → 人工分析 → 人工修改 → 重测 ↺（橙色 = 人工瓶颈）
const ROW1: FlowBox[] = [
  { label: '运行', cx: 137, accent: C.steel },
  { label: '轨迹', cx: 321, accent: C.steel },
  { label: '人工分析', cx: 505, accent: C.orange },
  { label: '人工修改', cx: 689, accent: C.orange },
  { label: '重测', cx: 873, accent: C.steel },
];

// AHE 自动闭环：运行 → 轨迹 → Agent 分析 → 证据 → Agent 修改 → 预测 → 验证 → 保留/回滚 ↺
const ROW2: FlowBox[] = [
  { label: '运行', cx: 123, accent: C.steel },
  { label: '轨迹', cx: 232, accent: C.steel },
  { label: 'Agent 分析', cx: 341, accent: C.blue },
  { label: '证据', cx: 451, accent: C.green },
  { label: 'Agent 修改', cx: 560, accent: C.blue },
  { label: '预测', cx: 669, accent: C.blue },
  { label: '验证', cx: 778, accent: C.blue },
  { label: '保留/回滚', cx: 887, accent: C.green },
];

interface Pillar {
  text: string;
  cx: number;
  targets: number[]; // 覆盖的 AHE 框中心 x
}

// 三层可观测性标注（挂在 AHE 行对应位置上方）
const PILLARS: Pillar[] = [
  { text: '经验可观测', cx: 396, targets: [341, 451] },
  { text: '组件可观测', cx: 560, targets: [560] },
  { text: '决策可观测', cx: 778, targets: [669, 778, 887] },
];

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - 0.42), y - size * Math.sin(angle - 0.42));
  ctx.lineTo(x - size * Math.cos(angle + 0.42), y - size * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  yRow: number,
  text: string,
  fill: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = 52;
  const h = 26;
  const x = 12;
  ctx.beginPath();
  ctx.roundRect(x, yRow - h / 2, w, h, 13);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, yRow + 4);
  ctx.restore();
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  b: FlowBox,
  y: number,
  w: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(b.cx - w / 2, y - BOX_H / 2, w, BOX_H, 8);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = b.accent;
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(b.label, b.cx, y + 4.5);
  ctx.restore();
}

function drawLink(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 2, y);
  ctx.stroke();
  drawArrowHead(ctx, x2, y, 0, 6, color);
  ctx.restore();
}

// 回环箭头：从末端框底部垂直下落，圆角横移，再垂直向上指回起始框（↺ 语义）
function drawLoopBack(
  ctx: CanvasRenderingContext2D,
  xRight: number,
  xLeft: number,
  yBot: number,
  dropY: number,
  color: string,
  label: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const r = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(xRight, yBot + 1);
  ctx.lineTo(xRight, dropY - r);
  ctx.quadraticCurveTo(xRight, dropY, xRight - r, dropY);
  ctx.lineTo(xLeft + r, dropY);
  ctx.quadraticCurveTo(xLeft, dropY, xLeft, dropY - r);
  ctx.lineTo(xLeft, yBot + 5);
  ctx.stroke();
  drawArrowHead(ctx, xLeft, yBot + 3, -Math.PI / 2, 6, color);
  // 弧上小字（底色遮罩在横线上留出缺口）
  const midX = (xRight + xLeft) / 2;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = C.bg;
  ctx.fillRect(midX - tw / 2 - 6, dropY - 8, tw + 12, 16);
  ctx.fillStyle = C.muted;
  ctx.fillText(label, midX, dropY + 4);
  ctx.restore();
}

// 可观测性 pill：紫色圆角标签 + 竖向虚线连接到覆盖的 AHE 框
function drawPillar(ctx: CanvasRenderingContext2D, p: Pillar, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const yLine = PILL_Y + PILL_H / 2;
  const yBoxTop = ROW2_Y - BOX_H / 2;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  if (p.targets.length > 1) {
    ctx.beginPath();
    ctx.moveTo(p.targets[0], yLine);
    ctx.lineTo(p.targets[p.targets.length - 1], yLine);
    ctx.stroke();
  }
  for (const tx of p.targets) {
    ctx.beginPath();
    ctx.moveTo(tx, yLine);
    ctx.lineTo(tx, yBoxTop);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  const tw = ctx.measureText(p.text).width;
  const pw = tw + 22;
  ctx.beginPath();
  ctx.roundRect(p.cx - pw / 2, PILL_Y - PILL_H / 2, pw, PILL_H, 12);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.purple;
  ctx.stroke();
  ctx.fillStyle = C.purple;
  ctx.textAlign = 'center';
  ctx.fillText(p.text, p.cx, PILL_Y + 4);
  ctx.restore();
}

export const HeroLoops: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let startTs = 0;
    let done = false;

    const render = (elapsed: number) => {
      // 逐元素错峰淡入：order 越小越早出现，播完即静止
      const a = (order: number) => clamp((elapsed - order * 28) / 200, 0, 1);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 第一行：传统人工循环
      drawChip(ctx, ROW1_Y, '传统', C.steel, a(0));
      ROW1.forEach((b, i) => drawBox(ctx, b, ROW1_Y, ROW1_W, a(1 + i)));
      for (let i = 0; i < ROW1.length - 1; i++) {
        drawLink(ctx, ROW1[i].cx + ROW1_W / 2 + 2, ROW1[i + 1].cx - ROW1_W / 2 - 2, ROW1_Y, C.steel, a(6 + i));
      }
      drawLoopBack(ctx, ROW1[4].cx, ROW1[0].cx, ROW1_Y + BOX_H / 2, 150, C.steel, '人工重复，节奏受限于人', a(10));

      // 第二行：AHE 自动闭环
      drawChip(ctx, ROW2_Y, 'AHE', C.blue, a(11));
      ROW2.forEach((b, i) => drawBox(ctx, b, ROW2_Y, ROW2_W, a(12 + i)));
      for (let i = 0; i < ROW2.length - 1; i++) {
        drawLink(ctx, ROW2[i].cx + ROW2_W / 2 + 1, ROW2[i + 1].cx - ROW2_W / 2 - 1, ROW2_Y, C.blue, a(20 + i));
      }
      drawLoopBack(ctx, ROW2[7].cx, ROW2[0].cx, ROW2_Y + BOX_H / 2, 318, C.blue, '自动迭代，无需人工介入', a(27));

      // 三层可观测性标注
      PILLARS.forEach((p, i) => drawPillar(ctx, p, a(28 + i)));
    };

    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const elapsed = now - startTs;
      render(Math.min(elapsed, DURATION));
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        done = true;
        rafRef.current = null;
      }
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (done) {
        render(DURATION); // 动画已播完：离屏回屏只重绘终态，不重播
        return;
      }
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

export default HeroLoops;
