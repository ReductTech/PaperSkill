import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#fbfcfd', ink: '#17263b', muted: '#66788b', line: '#cad5df',
  blue: '#245d87', purple: '#6756a3', cyan: '#118a95', green: '#27815f',
  red: '#bd4051', amber: '#c47719',
};

type Ctx = CanvasRenderingContext2D;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smooth(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function label(ctx: Ctx, text: string, x: number, y: number, color = C.ink, size = 10, weight = 700, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function rounded(ctx: Ctx, x: number, y: number, width: number, height: number, radius = 5) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function wave(ctx: Ctx, x: number, y: number, width: number, amplitude: number, phase: number, color = C.blue) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  for (let index = 0; index <= width; index += 2) {
    const yy = y + Math.sin(index * .18 + phase) * amplitude * .62 + Math.sin(index * .061 + phase * .7) * amplitude * .38;
    if (index === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x + index, yy);
  }
  ctx.stroke();
}

function base(ctx: Ctx, title: string, status: string, tone: string) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 244, 130);
  label(ctx, title, 12, 17, C.ink, 10, 800);
  label(ctx, status, 232, 17, tone, 9, 800, 'right');
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  rounded(ctx, 11.5, 25.5, 221, 93, 5);
  ctx.stroke();
}

function drawCalibration(ctx: Ctx, time: number) {
  const cycle = (time % 6200) / 6200;
  const aligned = smooth((cycle - .22) / .5);
  base(ctx, '三套结果先校准刻度', aligned > .86 ? '共同坐标' : aligned < .12 ? '口径错位' : '统一重测', aligned > .86 ? C.green : aligned < .12 ? C.red : C.amber);
  const starts = [22, 35, 27];
  const widths = [194, 168, 183];
  const reported = [.68, .55, .78];
  const rerun = [.73, .64, .56];
  const colors = [C.blue, C.purple, C.cyan];

  ['A', 'B', 'C'].forEach((name, row) => {
    const y = 48 + row * 27;
    const start = mix(starts[row], 28, aligned);
    const width = mix(widths[row], 181, aligned);
    label(ctx, name, 18, y + 3, colors[row], 9, 800, 'center');
    ctx.strokeStyle = aligned > .82 ? '#9ebdac' : C.line;
    ctx.lineWidth = aligned > .82 ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(start, y); ctx.lineTo(start + width, y); ctx.stroke();
    for (let tick = 0; tick <= 4; tick += 1) {
      const x = start + width * tick / 4;
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    }
    ctx.fillStyle = colors[row];
    ctx.beginPath(); ctx.arc(start + width * mix(reported[row], rerun[row], aligned), y, 5, 0, Math.PI * 2); ctx.fill();
  });
  label(ctx, aligned > .82 ? '任务卡与评测协议均固定' : '轴长与起点不同，圆点不可直接排位', 122, 113, aligned > .82 ? C.green : C.muted, 8.5, 700, 'center');
}

const MODELS = [
  { name: 'BrainOmni', adapter: '坐标对齐 + 重采样', color: C.blue },
  { name: 'CBraMod', adapter: '保留通道 + 时间分块', color: C.purple },
  { name: 'BIOT', adapter: '成对作差 + 导联重组', color: C.amber },
];

function drawInterface(ctx: Ctx, time: number) {
  const stepTime = 2600;
  const model = MODELS[Math.floor(time / stepTime) % MODELS.length];
  const local = (time % stepTime) / stepTime;
  const travel = smooth((local - .12) / .68);
  base(ctx, '固定 W，轮换模型专属槽位', model.name, model.color);

  ctx.strokeStyle = '#9eb0c0';
  ctx.lineWidth = 1.2;
  rounded(ctx, 58, 35, 164, 66, 5); ctx.stroke();
  label(ctx, '共同接口 W', 68, 49, C.muted, 8.5, 800);
  wave(ctx, 17, 69, 35, 4, time / 520, C.blue);
  label(ctx, 'x', 34, 91, C.blue, 9, 800, 'center');

  ctx.fillStyle = '#f1f5f8'; rounded(ctx, 70, 58, 55, 26, 4); ctx.fill();
  ctx.strokeStyle = model.color; ctx.lineWidth = 1.3; rounded(ctx, 70, 58, 55, 26, 4); ctx.stroke();
  label(ctx, 'Aᵢ', 97.5, 74.5, model.color, 9, 900, 'center');
  ctx.fillStyle = '#f1f5f8'; rounded(ctx, 143, 58, 58, 26, 4); ctx.fill();
  ctx.strokeStyle = model.color; rounded(ctx, 143, 58, 58, 26, 4); ctx.stroke();
  label(ctx, 'fθᵢ', 172, 74.5, model.color, 9, 900, 'center');
  label(ctx, 'zᵢ', 216, 75, model.color, 9, 900, 'center');

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(52, 71); ctx.lineTo(70, 71); ctx.moveTo(125, 71); ctx.lineTo(143, 71); ctx.moveTo(201, 71); ctx.lineTo(209, 71); ctx.stroke();
  ctx.fillStyle = model.color;
  ctx.beginPath(); ctx.arc(mix(52, 208, travel), 71, 3.5, 0, Math.PI * 2); ctx.fill();
  label(ctx, 'Sample 与输出位置保持不变', 136, 96, C.green, 8.2, 700, 'center');
  label(ctx, model.adapter, 136, 112, model.color, 8.5, 750, 'center');
}

function drawMasking(ctx: Ctx, time: number) {
  const stageDuration = 1250;
  const stage = Math.floor(time / stageDuration) % 5;
  base(ctx, '按协议逐级置零通道', `p = ${stage * 20}%`, stage >= 3 ? C.red : stage > 0 ? C.amber : C.green);

  for (let row = 0; row < 5; row += 1) {
    const y = 44 + row * 15;
    const fade = row < stage ? 1 : 0;
    wave(ctx, 30, y, 184, mix(4.2, 0, fade), time / 650 + row * .7, fade > .6 ? C.amber : C.blue);
    label(ctx, `C${row + 1}`, 21, y + 3, fade > .6 ? C.amber : C.muted, 8, 700, 'center');
    if (fade > .65) {
      ctx.fillStyle = '#fff1d8'; rounded(ctx, 202, y - 5, 19, 10, 3); ctx.fill();
      label(ctx, '0', 211.5, y + 3, C.amber, 7.5, 800, 'center');
    }
  }
  label(ctx, stage < 3 ? '每一级都保留同一标签预算' : '60%–80% 时多数模型接近机会水平', 122, 113, stage < 3 ? C.green : C.red, 8.4, 700, 'center');
}

function drawScene(ctx: Ctx, chapter: number, time: number) {
  if (chapter === 1) drawCalibration(ctx, time);
  else if (chapter === 3) drawInterface(ctx, time);
  else if (chapter === 6) drawMasking(ctx, time);
  else {
    base(ctx, '本章动态预览', '观察关键变化', C.blue);
    wave(ctx, 26, 70, 192, 5, time / 600, C.blue);
  }
}

const ariaLabels: Record<number, string> = {
  1: '三套错位测量刻度收拢到共同评测坐标',
  3: '共同接口保持固定，模型专属输入适配器与骨干依次轮换',
  6: 'EEG 通道按照百分之二十到百分之八十逐级置零',
};

export const OmniAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chapter = Math.max(1, Number(chapterId.split('-')[1] || 1));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reducedTime = chapter === 1 ? 4800 : chapter === 3 ? 3600 : chapter === 6 ? 2500 : 3600;
    const ctx = setupCanvas(canvas, 244, 130);
    let animation = 0;
    let running = true;
    const render = (time: number) => {
      ctx.clearRect(0, 0, 244, 130);
      drawScene(ctx, chapter, reduced ? reducedTime : time);
      canvas.classList.add('is-ready');
      if (running && !reduced) animation = window.requestAnimationFrame(render);
    };
    const start = () => {
      running = true;
      window.cancelAnimationFrame(animation);
      render(performance.now());
    };
    const stop = () => {
      running = false;
      window.cancelAnimationFrame(animation);
    };
    render(reduced ? reducedTime : performance.now());
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapter]);

  return <canvas ref={ref} width={244} height={130} aria-label={ariaLabels[chapter] ?? '章节关键机制动态预览'} />;
};
