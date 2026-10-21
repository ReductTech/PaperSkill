import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, SIGMAS, clamp } from './kit';

// 10 个类比卡循环动画（560×140）。统一技术视觉语言：量化桶、通道柱、奇异值谱、
// 数据流、指标 bar。每个动画只表达该章一个核心技术动态，不做生活场景。

const W = 560;
const H = 140;

function bg(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
}

function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string = C.muted, size = 12, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function makeLoop(render: (ctx: CanvasRenderingContext2D, t: number) => void) {
  return function Ana(_props: WidgetProps) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      const canvas = ref.current;
      if (!canvas) return;
      let ctx: CanvasRenderingContext2D;
      try {
        ctx = setupCanvas(canvas, W, H);
      } catch {
        return;
      }
      let raf = 0;
      let active = true;
      let t0 = performance.now();
      const draw = () => {
        if (!active) return;
        render(ctx, performance.now() - t0);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        raf = requestAnimationFrame(draw);
      };
      const stop = () => {
        active = false;
        cancelAnimationFrame(raf);
      };
      const begin = () => {
        if (!active) {
          active = true;
          t0 = performance.now();
          raf = requestAnimationFrame(draw);
        }
      };
      const disconnect = observeCanvas(canvas, begin, stop);
      raf = requestAnimationFrame(draw);
      return () => {
        stop();
        disconnect();
      };
    }, []);
    return <canvas ref={ref} width={W} height={H} />;
  };
}

// 1. 离群值拉爆刻度：红点周期性远离 0，刻度被拉大，绿色正常值挤向 0
export const Ana1 = makeLoop((ctx, t) => {
  bg(ctx);
  const k = 0.5 + 0.5 * Math.sin(t / 900); // 0..1
  const ox = 280;
  const y = 96;
  const outlier = 30 + k * 130;
  const scale = outlier / 7;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox - 200, y);
  ctx.lineTo(ox + 200, y);
  ctx.stroke();
  for (let b = -7; b <= 7; b++) {
    const bx = ox + b * scale;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, y - 5);
    ctx.lineTo(bx, y + 5);
    ctx.stroke();
  }
  const base = [0.06, -0.05, 0.12, -0.1, 0.03, 0.09, -0.08, 0.15, -0.13];
  base.forEach((d, i) => {
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(ox + d * scale, y - 16 - (i % 3) * 14, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.arc(ox + outlier, y - 18, 8, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, '离群值拉大步长 s', ox + outlier, y - 40, C.red, 12);
});

// 2. 离群值集中在少数通道：两根红色高柱固定，其余绿色低柱
export const Ana2 = makeLoop((ctx, t) => {
  bg(ctx);
  const n = 12;
  const x0 = 60;
  const cw = 28;
  const gap = 8;
  for (let i = 0; i < n; i++) {
    const outlier = i === 3 || i === 8;
    const h = outlier ? 84 : 30 + (i % 4) * 6;
    const x = x0 + i * (cw + gap);
    ctx.fillStyle = outlier ? C.red : C.green;
    ctx.beginPath();
    ctx.roundRect(x, 110 - h, cw, h, 4);
    ctx.fill();
    if (outlier && Math.sin(t / 600) > 0) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - 3, 106 - h, cw + 6, h + 6, 6);
      ctx.stroke();
    }
  }
  label(ctx, '离群值固定在少数通道', 280, 20, C.muted, 12);
});

// 3. 截断 vs 保护：奇异值谱，左半尾部周期性被红色虚线划过（截断），右半保留
export const Ana3 = makeLoop((ctx, t) => {
  bg(ctx);
  const x0 = 70;
  const bw = 16;
  const gap = 6;
  const maxS = SIGMAS[0];
  const r = 5;
  for (let i = 0; i < 16; i++) {
    const h = (SIGMAS[i] / maxS) * 80;
    const x = x0 + i * (bw + gap);
    ctx.fillStyle = i < r ? C.green : C.light;
    ctx.beginPath();
    ctx.roundRect(x, 108 - h, bw, h, 3);
    ctx.fill();
  }
  // 红色虚线在 r 处周期上下扫（截断动作）
  const cutY = 108 - 40 - Math.abs(Math.sin(t / 700)) * 40;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x0 + r * (bw + gap) - gap / 2, cutY);
  ctx.lineTo(x0 + r * (bw + gap) - gap / 2, 108);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, '压缩丢尾部 · 保护全保留', 300, 20, C.muted, 12);
});

// 4. 拖动秩：橙色分隔线左右移动，残差能量随之变化
export const Ana4 = makeLoop((ctx, t) => {
  bg(ctx);
  const x0 = 70;
  const bw = 16;
  const gap = 6;
  const maxS = SIGMAS[0];
  const r = 2 + Math.round((1 + Math.sin(t / 1100)) / 2 * 8); // 2..10
  for (let i = 0; i < 16; i++) {
    const h = (SIGMAS[i] / maxS) * 80;
    const x = x0 + i * (bw + gap);
    ctx.fillStyle = i < r ? C.green : C.light;
    ctx.beginPath();
    ctx.roundRect(x, 108 - h, bw, h, 3);
    ctx.fill();
  }
  const lx = x0 + r * (bw + gap) - gap / 2;
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(lx, 28);
  ctx.lineTo(lx, 108);
  ctx.stroke();
  label(ctx, `秩 r = ${r} · 残差能量变小`, lx, 18, C.orange, 12);
});

// 5. 平滑 α：激活侧与权重侧难度此消彼长（零和）
export const Ana5 = makeLoop((ctx, t) => {
  bg(ctx);
  const a = 0.5 + 0.5 * Math.sin(t / 1000);
  const bx = 140;
  const maxW = 260;
  label(ctx, '激活侧', bx - 60, 52, C.red, 12, 'right');
  ctx.fillStyle = C.red;
  ctx.fillRect(bx, 40, (1 - a) * maxW, 22);
  label(ctx, '权重侧', bx - 60, 92, C.orange, 12, 'right');
  ctx.fillStyle = C.orange;
  ctx.fillRect(bx, 80, a * maxW, 22);
  label(ctx, '平滑是零和迁移', 300, 122, C.muted, 12);
});

// 6. X 被读两次：X 节点周期性高亮（被反复读），两条分支固定
export const Ana6 = makeLoop((ctx, t) => {
  bg(ctx);
  const read = Math.sin(t / 800) > 0;
  // X 节点
  ctx.fillStyle = read ? C.red : C.blue;
  ctx.beginPath();
  ctx.roundRect(230, 20, 100, 30, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  label(ctx, 'X 激活', 280, 35, '#fff', 12);
  // 两条分支
  const drawBox = (x: number, s: string, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, 80, 90, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    label(ctx, s, x + 45, 94, '#fff', 11);
  };
  drawBox(90, '低秩分支', C.green);
  drawBox(380, '主分支', C.orange);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(280, 50);
  ctx.lineTo(135, 80);
  ctx.moveTo(280, 50);
  ctx.lineTo(425, 80);
  ctx.stroke();
  label(ctx, read ? 'X 被读第二次' : '读取激活 X', 280, 122, read ? C.red : C.muted, 12);
});

// 7. 迭代修正：残差柱周期性被「削平」再恢复（GPTQ 迭代）
export const Ana7 = makeLoop((ctx, t) => {
  bg(ctx);
  const p = (t % 2400) / 2400;
  const h = 80 - clamp(p, 0, 1) * 55; // 逐步削矮
  const x = 240;
  ctx.fillStyle = C.light;
  ctx.beginPath();
  ctx.roundRect(x, 108 - 80, 80, 80, 4);
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(x, 108 - h, 80, h, 4);
  ctx.fill();
  // 箭头（迭代）
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  const arrow = Math.sin(t / 300) > 0;
  if (arrow) {
    ctx.beginPath();
    ctx.moveTo(340, 108 - h + 8);
    ctx.lineTo(360, 108 - h + 8);
    ctx.moveTo(354, 108 - h + 2);
    ctx.lineTo(360, 108 - h + 8);
    ctx.lineTo(354, 108 - h + 14);
    ctx.stroke();
  }
  label(ctx, 'GPTQ 迭代压低残差', 280, 20, C.muted, 12);
});

// 8. kernel 融合：两条分支周期性合并成一条（共享读写）
export const Ana8 = makeLoop((ctx, t) => {
  bg(ctx);
  const fused = Math.sin(t / 1000) > 0;
  if (!fused) {
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(280, 24);
    ctx.lineTo(140, 90);
    ctx.moveTo(280, 24);
    ctx.lineTo(420, 90);
    ctx.stroke();
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(140, 96, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(420, 96, 14, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, '两条分支各读各的', 280, 124, C.red, 12);
  } else {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(280, 24);
    ctx.lineTo(280, 90);
    ctx.stroke();
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(280, 96, 16, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, '融合后一次读写', 280, 124, C.green, 12);
  }
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.roundRect(230, 4, 100, 20, 5);
  ctx.fill();
  label(ctx, 'X / Y 大张量', 280, 14, '#fff', 11);
});

// 9. 分组粒度：数值带的分组线周期性变密（细）变疏（粗）
export const Ana9 = makeLoop((ctx, t) => {
  bg(ctx);
  const fine = Math.sin(t / 1100) > 0;
  const bx = 80;
  const bw = 400;
  ctx.fillStyle = C.light;
  ctx.beginPath();
  ctx.roundRect(bx, 55, bw, 40, 6);
  ctx.fill();
  const groups = fine ? 8 : 2;
  for (let g = 1; g < groups; g++) {
    const x = bx + (bw * g) / groups;
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 49);
    ctx.lineTo(x, 101);
    ctx.stroke();
  }
  label(ctx, fine ? '细分组（group 小）' : '粗分组（group 大）', 280, 122, fine ? C.green : C.muted, 12);
});

// 10. 结果对比：三个指标 bar 周期性增长到目标值
export const Ana10 = makeLoop((ctx, t) => {
  bg(ctx);
  const vals = [3.6, 3.5, 3.0];
  const names = ['体积', '显存', '加速'];
  const p = (t % 3200) / 3200;
  const effP = clamp(p * 2.4, 0, 1);
  const bx = 130;
  for (let i = 0; i < 3; i++) {
    const y = 28 + i * 32;
    label(ctx, names[i], bx - 46, y + 10, C.muted, 12, 'right');
    ctx.fillStyle = C.axis;
    ctx.fillRect(bx, y, 80, 18); // 基线 1x
    ctx.fillStyle = C.green;
    ctx.fillRect(bx, y, 80 * vals[i] * effP, 18);
    if (effP > 0.2) label(ctx, vals[i].toFixed(1) + '×', bx + 80 * vals[i] * effP + 16, y + 10, C.green, 11);
  }
  label(ctx, 'SVDQuant vs 基线（越高越好）', 280, 124, C.muted, 12);
});

