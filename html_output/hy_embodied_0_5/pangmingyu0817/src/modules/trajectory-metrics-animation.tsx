import React, { useEffect, useRef } from 'react';
import { clamp, dist, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Point = { x: number; y: number };

const W = 1040;
const H = 430;
const C = {
  bg: '#f7f3ea', card: '#fffdf8', ink: '#172033', muted: '#68778f',
  line: '#d8d0c2', blue: '#2f5f8f', green: '#2b8a6e', orange: '#d8922b',
  softBlue: '#dbe8f3', softGreen: '#dcefe7', leash: '#c43f52',
};

const dtwA: Point[] = [
  { x: 54, y: 162 }, { x: 98, y: 128 }, { x: 142, y: 138 },
  { x: 186, y: 98 }, { x: 230, y: 112 }, { x: 274, y: 154 },
  { x: 318, y: 146 }, { x: 362, y: 105 }, { x: 406, y: 122 },
];
const dtwB: Point[] = [
  { x: 54, y: 255 }, { x: 124, y: 220 }, { x: 194, y: 191 },
  { x: 264, y: 246 }, { x: 334, y: 200 }, { x: 406, y: 216 },
];
const dtwPath: Array<[number, number]> = [
  [0, 0], [1, 0], [2, 1], [3, 2], [4, 2],
  [5, 3], [6, 3], [7, 4], [8, 5],
];

const frechetA: Point[] = [
  { x: 560, y: 265 }, { x: 625, y: 218 }, { x: 685, y: 232 },
  { x: 750, y: 150 }, { x: 820, y: 178 }, { x: 885, y: 112 }, { x: 958, y: 132 },
];
const frechetB: Point[] = [
  { x: 560, y: 292 }, { x: 630, y: 274 }, { x: 700, y: 185 },
  { x: 770, y: 214 }, { x: 838, y: 140 }, { x: 900, y: 170 }, { x: 958, y: 104 },
];

function roundedPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = C.card;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[], color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
  ctx.stroke();
  points.forEach(point => {
    ctx.fillStyle = C.card;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function pointOnPolyline(points: Point[], t: number): Point {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const length = dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    lengths.push(length);
    total += length;
  }
  let target = clamp(t, 0, 1) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i]) {
      const local = lengths[i] === 0 ? 0 : target / lengths[i];
      return { x: lerp(points[i].x, points[i + 1].x, local), y: lerp(points[i].y, points[i + 1].y, local) };
    }
    target -= lengths[i];
  }
  return points[points.length - 1];
}

function pairedTime(t: number) {
  return t < 0.42 ? t * 0.68 : 0.2856 + (t - 0.42) * (0.7144 / 0.58);
}

function draw(ctx: CanvasRenderingContext2D, progress: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  roundedPanel(ctx, 20, 20, 480, 390);
  roundedPanel(ctx, 520, 20, 500, 390);

  ctx.fillStyle = C.ink;
  ctx.font = '800 21px system-ui, sans-serif';
  ctx.fillText('DTW：动作一样，快慢不同也能对齐', 42, 56);
  ctx.fillText('Fréchet：整条路线最远偏了多少', 542, 56);
  ctx.fillStyle = C.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('把执行速度不同的动作阶段重新配对', 42, 80);
  ctx.fillText('像人牵狗走两条路，记录全程最长的绳子', 542, 80);

  drawPath(ctx, dtwA, C.blue);
  drawPath(ctx, dtwB, C.green);
  const activeCount = Math.max(1, Math.ceil(progress * dtwPath.length));
  dtwPath.slice(0, activeCount).forEach(([ai, bi], index) => {
    const a = dtwA[ai];
    const b = dtwB[bi];
    const active = index === activeCount - 1;
    ctx.strokeStyle = active ? C.orange : '#b9c5d2';
    ctx.lineWidth = active ? 4 : 2;
    ctx.globalAlpha = active ? 1 : 0.62;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = C.blue;
  ctx.fillRect(44, 306, 18, 5);
  ctx.fillStyle = C.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('参考轨迹：9 个时刻', 70, 313);
  ctx.fillStyle = C.green;
  ctx.fillRect(228, 306, 18, 5);
  ctx.fillStyle = C.muted;
  ctx.fillText('预测轨迹：6 个时刻', 254, 313);
  ctx.fillStyle = C.ink;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('一个点可以对应多个点，但匹配顺序不能倒退', 44, 350);
  ctx.fillStyle = C.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('论文用它衡量轨迹步骤的时序匹配', 44, 377);

  drawPath(ctx, frechetA, C.blue);
  drawPath(ctx, frechetB, C.green);
  const pA = pointOnPolyline(frechetA, progress);
  const pB = pointOnPolyline(frechetB, pairedTime(progress));
  let maxDistance = 0;
  for (let i = 0; i <= 80 * progress; i++) {
    const t = i / 80;
    const a = pointOnPolyline(frechetA, t);
    const b = pointOnPolyline(frechetB, pairedTime(t));
    maxDistance = Math.max(maxDistance, dist(a.x, a.y, b.x, b.y));
  }
  const currentDistance = dist(pA.x, pA.y, pB.x, pB.y);
  ctx.strokeStyle = C.leash;
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(pA.x, pA.y);
  ctx.lineTo(pB.x, pB.y);
  ctx.stroke();
  ctx.setLineDash([]);
  [[pA, C.blue, 'A'], [pB, C.green, 'B']].forEach(([point, color, label]) => {
    const p = point as Point;
    ctx.fillStyle = color as string;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label as string, p.x, p.y + 4);
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = C.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('当前距离', 548, 323);
  ctx.fillText('截至当前的最大距离', 548, 354);
  ctx.fillStyle = C.softBlue;
  ctx.fillRect(690, 313, 250, 10);
  ctx.fillStyle = C.orange;
  ctx.fillRect(690, 313, Math.min(250, currentDistance * 2.15), 10);
  ctx.fillStyle = C.softGreen;
  ctx.fillRect(690, 344, 250, 10);
  ctx.fillStyle = C.leash;
  ctx.fillRect(690, 344, Math.min(250, maxDistance * 2.15), 10);
  ctx.fillStyle = C.ink;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('论文用它衡量整条轨迹的最坏几何偏离', 548, 387);
}

export const TrajectoryMetricsAnimation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let startedAt = performance.now();
    const frame = (now: number) => {
      const raw = reduced ? 0.72 : ((now - startedAt) % 6500) / 6500;
      const progress = clamp((raw - 0.07) / 0.86, 0, 1);
      draw(ctx, progress);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduced) { frame(performance.now()); return; }
      if (!raf) {
        startedAt = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div className="trajectory-metrics-animation">
      <canvas
        ref={ref}
        id={`cv-${chapterId}-${moduleId}`}
        width={W}
        height={H}
        role="img"
        aria-label="DTW 依次建立参考轨迹与预测轨迹之间的单调点对；Fréchet 动画让两个点沿曲线单调前进，以全程最大连线长度衡量曲线偏离。"
      />
      <div className="metric-explainers">
        <p><b>DTW 对齐动作步骤：</b>两次执行可以一快一慢，只要动作顺序相近，就能把对应阶段配在一起。</p>
        <p><b>Fréchet 检查整条路线：</b>像人牵狗各走一条路，用所需的最短“最长绳子”表示两条路线最坏偏离。</p>
      </div>
      <p className="metric-combination"><b>论文中的用法：</b>把 DTW、Fréchet Distance 与终点一致性组合成轨迹奖励，让强化学习获得“偏了多少”的连续反馈，而不是只有成功或失败。</p>
    </div>
  );
};

export default TrajectoryMetricsAnimation;
