import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 300;
const C = {
  paper: '#f5f8f0',
  ink: '#243128',
  muted: '#647068',
  blue: '#27446e',
  blueSoft: '#dce8f4',
  green: '#228d5c',
  greenSoft: '#dff3e9',
  orange: '#d97706',
  orangeSoft: '#fff0d6',
  red: '#c43f52',
  redSoft: '#f9e1e5',
  line: '#cbd6c6',
  white: '#ffffff',
};

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 7) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.ink,
  size = 12,
  weight = 600,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  ctx.fillText(value, x, y);
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  color: string,
  progress = 1,
) {
  const end = x1 + (x2 - x1) * progress;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(end, y);
  ctx.stroke();
  if (progress > 0.96) {
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 5, y - 3);
    ctx.lineTo(x2 - 5, y + 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTraditional(ctx: CanvasRenderingContext2D, ms: number) {
  const rows = [
    {
      source: '真实机器人轨迹',
      gain: '真实交互分布',
      issue: '高成本；失败 / 纠错难安全覆盖',
      color: C.red,
      soft: C.redSoft,
    },
    {
      source: '物理模拟器',
      gain: '可控、可扩展',
      issue: '重资产标定；Sim→Real gap',
      color: C.orange,
      soft: C.orangeSoft,
    },
    {
      source: '通用视频模型',
      gain: '强视觉先验',
      issue: '无精细动作接口；时间未逐帧对齐',
      color: C.blue,
      soft: C.blueSoft,
    },
  ];
  const active = Math.floor(ms / 2400) % rows.length;
  const progress = Math.min(1, (ms % 2400) / 1000);

  ctx.fillStyle = '#f8faf7';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '传统训练数据：优势与结构性缺口', 18, 25, C.ink, 15, 800);
  text(ctx, '概念对照 · 非定量比较', 365, 25, C.muted, 10, 600);
  text(ctx, '数据来源', 24, 52, C.muted, 10, 700);
  text(ctx, '可获得优势', 202, 52, C.muted, 10, 700);
  text(ctx, '关键限制', 334, 52, C.muted, 10, 700);

  rows.forEach((row, i) => {
    const y = 64 + i * 63;
    const on = i === active;
    ctx.fillStyle = on ? row.soft : C.white;
    ctx.strokeStyle = on ? row.color : C.line;
    ctx.lineWidth = on ? 1.8 : 1;
    box(ctx, 18, y, 154, 47);
    ctx.fillStyle = row.color;
    ctx.fillRect(18, y, 4, 47);
    text(ctx, row.source, 31, y + 28, C.ink, 12, 750);
    arrow(ctx, 177, y + 23, 194, on ? row.color : C.line, on ? progress : 1);

    ctx.fillStyle = C.white;
    ctx.strokeStyle = on ? row.color : C.line;
    box(ctx, 199, y, 116, 47);
    text(ctx, row.gain, 211, y + 28, on ? row.color : C.ink, 11, 700);
    arrow(ctx, 320, y + 23, 329, on ? row.color : C.line, on ? progress : 1);

    ctx.fillStyle = on ? row.soft : C.white;
    ctx.strokeStyle = on ? row.color : C.line;
    box(ctx, 334, y, 168, 47);
    text(ctx, row.issue, 345, y + 28, on ? row.color : C.muted, 10, on ? 700 : 550);
  });

  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  box(ctx, 18, 262, 484, 26, 6);
  text(ctx, '结论', 30, 280, C.red, 10, 800);
  text(ctx, '单项优势 ≠ 低成本、高保真且可精细动作控制的世界模拟器', 68, 280, C.ink, 10, 650);
}

function drawBwm(ctx: CanvasRenderingContext2D, ms: number) {
  const cycleMs = 6500;
  const cycle = Math.floor(ms / cycleMs);
  const local = (ms % cycleMs) / cycleMs;
  const phase = Math.min(4, Math.floor(local * 5));
  const progress = local * 5 - phase;
  const smooth = progress * progress * (3 - 2 * progress);
  const stages = ['条件装载', '动作编码', '双路注入', '未来预测', '历史回填'];

  const pathArrow = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    on: boolean,
  ) => {
    ctx.strokeStyle = on ? color : C.line;
    ctx.fillStyle = on ? color : C.line;
    ctx.lineWidth = on ? 2 : 1.1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 6 * Math.cos(angle - Math.PI / 6), y2 - 6 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 6 * Math.cos(angle + Math.PI / 6), y2 - 6 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    if (on) {
      const px = x1 + (x2 - x1) * smooth;
      const py = y1 + (y2 - y1) * smooth;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  };

  ctx.fillStyle = '#f8faf7';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'BWM：动作条件的有状态自回归模拟', 18, 25, C.ink, 15, 800);
  stages.forEach((name, i) => {
    const x = 18 + i * 98;
    ctx.fillStyle = i === phase ? (i < 3 ? C.orangeSoft : C.greenSoft) : C.white;
    ctx.strokeStyle = i === phase ? (i < 3 ? C.orange : C.green) : C.line;
    ctx.lineWidth = i === phase ? 1.5 : 1;
    box(ctx, x, 36, 88, 20, 10);
    text(ctx, `${i + 1} ${name}`, x + 10, 50, i === phase ? C.ink : C.muted, 9, i === phase ? 750 : 550);
  });

  const conditionOn = phase === 0;
  ctx.fillStyle = conditionOn ? C.blueSoft : C.white;
  ctx.strokeStyle = conditionOn ? C.blue : C.line;
  ctx.lineWidth = conditionOn ? 1.7 : 1;
  box(ctx, 18, 70, 92, 48);
  text(ctx, '初始环境引导', 29, 84, C.blue, 10, 750);
  text(ctx, 'x₀', 59, 106, C.ink, 18, 800);

  ctx.fillStyle = conditionOn || phase === 4 ? C.blueSoft : C.white;
  ctx.strokeStyle = conditionOn || phase === 4 ? C.blue : C.line;
  ctx.lineWidth = conditionOn || phase === 4 ? 1.7 : 1;
  box(ctx, 18, 130, 164, 53);
  text(ctx, '动态视觉历史  hₜ', 29, 147, C.blue, 10, 750);
  for (let i = 0; i < 4; i += 1) {
    const filled = phase !== 4 || i < 3 || progress > 0.7;
    ctx.fillStyle = filled ? C.blueSoft : C.white;
    ctx.strokeStyle = i === 3 && phase === 4 ? C.green : C.blue;
    ctx.fillRect(29 + i * 35, 158, 27, 16);
    ctx.strokeRect(29 + i * 35, 158, 27, 16);
    const label = i < 3 ? `x${i - 3}` : phase === 4 && progress > 0.7 ? 'x̂' : 'xₜ';
    text(ctx, label, 36 + i * 35, 170, C.ink, 8, 650);
  }

  ctx.fillStyle = phase === 1 ? C.orangeSoft : C.white;
  ctx.strokeStyle = phase === 1 ? C.orange : C.line;
  ctx.lineWidth = phase === 1 ? 1.7 : 1;
  box(ctx, 18, 197, 164, 48);
  text(ctx, '时间对齐动作块  aₜ₊₁:ₜ₊K', 29, 213, C.orange, 10, 750);
  for (let i = 0; i < 5; i += 1) {
    const on = phase === 1 && Math.floor(progress * 5) === i;
    ctx.fillStyle = on ? C.orange : C.orangeSoft;
    ctx.strokeStyle = C.orange;
    ctx.fillRect(30 + i * 27, 222, 19, 13);
    ctx.strokeRect(30 + i * 27, 222, 19, 13);
  }

  ctx.fillStyle = phase === 1 ? C.orangeSoft : C.white;
  ctx.strokeStyle = phase === 1 ? C.orange : C.line;
  ctx.lineWidth = phase === 1 ? 1.7 : 1;
  box(ctx, 205, 75, 137, 50);
  text(ctx, 'Action Encoder', 221, 95, C.orange, 11, 800);
  text(ctx, '逐帧动作 → token', 221, 113, C.muted, 9, 600);

  ctx.fillStyle = phase === 2 ? C.orangeSoft : C.white;
  ctx.strokeStyle = phase === 2 ? C.orange : C.line;
  ctx.lineWidth = phase === 2 ? 1.7 : 1;
  box(ctx, 205, 143, 137, 76);
  text(ctx, '双路径动作注入', 221, 160, C.ink, 10, 800);
  ctx.fillStyle = phase === 2 && progress >= 0.3 ? C.blueSoft : C.white;
  ctx.strokeStyle = C.blue;
  box(ctx, 218, 169, 110, 18, 5);
  text(ctx, 'Cross-Attention', 230, 182, C.blue, 9, 700);
  ctx.fillStyle = phase === 2 && progress >= 0.55 ? C.orangeSoft : C.white;
  ctx.strokeStyle = C.orange;
  box(ctx, 218, 193, 110, 18, 5);
  text(ctx, 'AdaLN（G=4）', 232, 206, C.orange, 9, 700);

  ctx.fillStyle = phase === 3 ? C.greenSoft : C.white;
  ctx.strokeStyle = phase === 3 ? C.green : C.line;
  ctx.lineWidth = phase === 3 ? 1.7 : 1;
  box(ctx, 372, 75, 128, 144);
  text(ctx, '未来预测', 399, 95, C.green, 11, 800);
  text(ctx, '生成 K 帧', 407, 112, C.muted, 9, 650);
  for (let i = 0; i < 4; i += 1) {
    const generated = phase > 3 || (phase === 3 && progress * 4 > i);
    ctx.fillStyle = generated ? C.greenSoft : C.white;
    ctx.strokeStyle = C.green;
    ctx.fillRect(388 + i * 23, 127 + i * 8, 29, 39);
    ctx.strokeRect(388 + i * 23, 127 + i * 8, 29, 39);
  }
  text(ctx, '仅追加新帧', 406, 205, C.green, 9, 700);

  pathArrow(182, 221, 205, 100, C.orange, phase === 1);
  pathArrow(273, 125, 273, 143, C.orange, phase === 2 && progress < 0.35);
  pathArrow(342, 174, 372, 132, C.blue, phase === 2 && progress >= 0.3);
  pathArrow(342, 194, 372, 183, C.orange, phase === 2 && progress >= 0.3);
  pathArrow(110, 82, 190, 65, C.blue, phase === 0 && progress > 0.15 && progress < 0.62);
  pathArrow(182, 143, 190, 65, C.blue, phase === 0 && progress > 0.3 && progress < 0.72);
  pathArrow(190, 65, 372, 80, C.blue, phase === 0 && progress > 0.55);

  ctx.strokeStyle = phase === 4 ? C.green : C.line;
  ctx.lineWidth = phase === 4 ? 2 : 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(480, 219);
  ctx.bezierCurveTo(480, 282, 104, 282, 104, 183);
  ctx.stroke();
  ctx.setLineDash([]);
  if (phase === 4) {
    const u = smooth;
    const one = 1 - u;
    const px = one ** 3 * 480 + 3 * one ** 2 * u * 480 + 3 * one * u ** 2 * 104 + u ** 3 * 104;
    const py = one ** 3 * 219 + 3 * one ** 2 * u * 282 + 3 * one * u ** 2 * 282 + u ** 3 * 183;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.roundRect(px - 8, py - 5, 16, 10, 3);
    ctx.fill();
  }

  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  box(ctx, 176, 267, 168, 21, 10);
  text(ctx, `rollout block ${cycle + 1} · 严格按时序推进`, 193, 281, C.muted, 9, 650);
}

export const BwmHeroRestored: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return undefined;
    }
    const modern = moduleId.includes('new') || moduleId.includes('right');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = false;
    let raf = 0;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      if (modern) drawBwm(ctx, reduceMotion ? 3900 : now);
      else drawTraditional(ctx, reduceMotion ? 600 : now);
      canvas.classList.add('is-ready');
      if (running && !reduceMotion) raf = requestAnimationFrame(draw);
    };
    const start = () => {
      if (running) return;
      running = true;
      if (reduceMotion) draw(0);
      else raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-label={moduleId.includes('new') ? 'BWM 五阶段时序动画' : '传统训练数据来源对照动画'}
    />
  );
};

export default BwmHeroRestored;
