import React, { useEffect, useRef, useState } from 'react';
import { easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearDesk, drawSceneLabel } from './poster-kit';

const W = 800;
const H_TRAIN = 350;
const H_SAMPLE = 380;
const SAMPLE_STEPS = 6;
const C = {
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  field: '#f5f8f0',
  paper: '#ffffff',
};

type Point = { x: number; y: number };

const NOISE_POINTS: Point[] = [
  { x: .10, y: .16 }, { x: .74, y: .09 }, { x: .42, y: .19 }, { x: .91, y: .27 }, { x: .24, y: .31 },
  { x: .61, y: .30 }, { x: .05, y: .44 }, { x: .82, y: .46 }, { x: .36, y: .49 }, { x: .56, y: .57 },
  { x: .16, y: .62 }, { x: .94, y: .65 }, { x: .45, y: .70 }, { x: .70, y: .73 }, { x: .28, y: .78 },
  { x: .08, y: .88 }, { x: .87, y: .87 }, { x: .54, y: .92 }, { x: .33, y: .05 }, { x: .67, y: .18 },
  { x: .18, y: .47 }, { x: .77, y: .58 }, { x: .39, y: .86 }, { x: .58, y: .42 }, { x: .96, y: .10 },
];

const TARGET_POINTS: Point[] = Array.from({ length: 25 }, (_, index) => ({
  x: .13 + (index % 5) * .185,
  y: .12 + Math.floor(index / 5) * .19,
}));

function tileColor(index: number) {
  const row = Math.floor(index / 5);
  if (index === 4) return C.orange;
  if (row <= 1) return C.blue;
  if (row === 2 && index % 5 >= 1 && index % 5 <= 3) return C.purple;
  if (row >= 3) return C.green;
  return C.blue;
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, color: string) {
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  ctx.fillStyle = color;
  ctx.font = '700 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 23);
  ctx.textAlign = 'left';
}

function mapPoint(point: Point, x: number, y: number, w: number, h: number) {
  return { x: x + point.x * w, y: y + point.y * h };
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - .48) * 8, y2 - Math.sin(angle - .48) * 8);
  ctx.lineTo(x2 - Math.cos(angle + .48) * 8, y2 - Math.sin(angle + .48) * 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTiles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  mode: 'noise' | 'target' | 'mixed',
) {
  const innerX = x + 14;
  const innerY = y + 39;
  const innerW = w - 28;
  const innerH = h - 53;
  NOISE_POINTS.forEach((noise, index) => {
    const target = TARGET_POINTS[index];
    const amount = mode === 'noise' ? 0 : mode === 'target' ? 1 : progress;
    const current = { x: lerp(noise.x, target.x, amount), y: lerp(noise.y, target.y, amount) };
    const position = mapPoint(current, innerX, innerY, innerW, innerH);
    const size = 6 + amount * 3;
    ctx.save();
    ctx.globalAlpha = .42 + amount * .58;
    ctx.fillStyle = mode === 'noise' ? C.muted : tileColor(index);
    ctx.fillRect(position.x - size / 2, position.y - size / 2, size, size);
    ctx.restore();
  });
}

export const Ch8FlowTrainingWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState(.35);
  const stateRef = useRef(time);
  stateRef.current = time;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H_TRAIN); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const draw = () => {
      const t = stateRef.current;
      clearDesk(ctx, W, H_TRAIN);
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = C.line;
      ctx.fillRect(14, 14, 772, 321);
      ctx.strokeRect(14.5, 14.5, 771, 320);
      drawSceneLabel(ctx, '训练时：随机抽一个时刻 t，让 DiT 预测此处的速度', 30, 30, C.ink);

      panel(ctx, 30, 56, 218, 210, '起点：噪声 ε', C.muted);
      panel(ctx, 291, 56, 218, 210, `中间状态 zₜ · t=${t.toFixed(2)}`, C.blue);
      panel(ctx, 552, 56, 218, 210, '终点：图像潜变量 z', C.green);
      drawTiles(ctx, 30, 56, 218, 210, 0, 'noise');
      drawTiles(ctx, 291, 56, 218, 210, t, 'mixed');
      drawTiles(ctx, 552, 56, 218, 210, 1, 'target');

      drawArrow(ctx, 256, 158, 282, 158, C.line, 2);
      drawArrow(ctx, 517, 158, 543, 158, C.line, 2);

      const focus = 12;
      const currentPoint = {
        x: lerp(NOISE_POINTS[focus].x, TARGET_POINTS[focus].x, t),
        y: lerp(NOISE_POINTS[focus].y, TARGET_POINTS[focus].y, t),
      };
      const current = mapPoint(currentPoint, 305, 95, 190, 157);
      const target = mapPoint(TARGET_POINTS[focus], 305, 95, 190, 157);
      ctx.beginPath();
      ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = C.green;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrow(ctx, current.x, current.y, lerp(current.x, target.x, .58), lerp(current.y, target.y, .58), C.orange, 3);
      ctx.fillStyle = C.orange;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText('目标速度 uₜ', current.x + 10, current.y - 10);

      ctx.fillStyle = '#f4f7fb';
      ctx.strokeStyle = C.line;
      ctx.fillRect(30, 282, 740, 37);
      ctx.strokeRect(30.5, 282.5, 739, 36);
      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('线性路径示例：zₜ = (1−t)ε + tz', 48, 306);
      ctx.fillStyle = C.orange;
      ctx.fillText('监督信号：uₜ = ∂zₜ/∂t = z−ε', 335, 306);
      ctx.fillStyle = C.green;
      ctx.fillText('DiT 学习 vθ(zₜ,t,c) ≈ uₜ', 590, 306);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    draw();
    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, [time]);

  const stage = time < .18 ? '起点仍近似纯噪声' : time > .82 ? '中间态已经接近图像潜变量' : '当前同时含有噪声结构与图像结构';

  return <div className="flow-widget">
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H_TRAIN} aria-label={`Flow Matching 训练路径，当前时间 t=${time.toFixed(2)}`} />
    <div className="ctrl flow-time-control">
      <label htmlFor={`flow-time-${moduleId}`}>沿训练路径选择时刻 <span className="val">t = {time.toFixed(2)}</span></label>
      <input id={`flow-time-${moduleId}`} type="range" min="0" max="1" step="0.01" value={time} onChange={(event) => setTime(Number(event.target.value))} />
    </div>
    <div className="feedback good" aria-live="polite">{stage}。模型看到 zₜ、时间 t 和文本条件 c，任务始终是预测橙色箭头表示的目标速度。</div>
  </div>;
};

export const Ch8FlowSamplingWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const previousProgressRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    if (step >= SAMPLE_STEPS) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep((current) => Math.min(SAMPLE_STEPS, current + 1)), 720);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H_SAMPLE); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const from = previousProgressRef.current;
    const to = step / SAMPLE_STEPS;
    previousProgressRef.current = to;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const draw = (progress: number) => {
      clearDesk(ctx, W, H_SAMPLE);
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = C.line;
      ctx.fillRect(14, 14, 772, 351);
      ctx.strokeRect(14.5, 14.5, 771, 350);
      drawSceneLabel(ctx, '生成时：每次调用 DiT 得到当前位置的速度，再由 ODE 求解器前进一步', 30, 30, C.ink);

      panel(ctx, 30, 58, 548, 228, step === 0 ? '随机噪声潜变量' : step === SAMPLE_STEPS ? '生成得到的图像潜变量' : '沿学到的速度场移动', step === SAMPLE_STEPS ? C.green : C.blue);
      const eased = easeInOutQuad(progress);
      drawTiles(ctx, 30, 58, 548, 228, eased, 'mixed');

      [2, 7, 12, 17, 22].forEach((index) => {
        if (progress >= .98) return;
        const currentPoint = {
          x: lerp(NOISE_POINTS[index].x, TARGET_POINTS[index].x, progress),
          y: lerp(NOISE_POINTS[index].y, TARGET_POINTS[index].y, progress),
        };
        const nextPoint = {
          x: lerp(NOISE_POINTS[index].x, TARGET_POINTS[index].x, Math.min(1, progress + .075)),
          y: lerp(NOISE_POINTS[index].y, TARGET_POINTS[index].y, Math.min(1, progress + .075)),
        };
        const current = mapPoint(currentPoint, 48, 101, 512, 166);
        const next = mapPoint(nextPoint, 48, 101, 512, 166);
        drawArrow(ctx, current.x, current.y, next.x, next.y, C.orange, 2);
      });

      ctx.fillStyle = step === SAMPLE_STEPS ? '#ecfdf5' : '#f4f7fb';
      ctx.strokeStyle = step === SAMPLE_STEPS ? C.green : C.line;
      ctx.fillRect(602, 58, 168, 228);
      ctx.strokeRect(602.5, 58.5, 167, 227);
      ctx.fillStyle = step === SAMPLE_STEPS ? C.green : C.blue;
      ctx.font = '800 31px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${step}`, 686, 116);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('次速度场调用', 686, 140);
      ctx.fillStyle = C.ink;
      ctx.font = '700 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(`t = ${(step / SAMPLE_STEPS).toFixed(3)}`, 686, 183);
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText(step === 0 ? '尚未移动' : step === SAMPLE_STEPS ? '到达终点' : '更新当前位置', 686, 211);
      ctx.fillText(step === SAMPLE_STEPS ? '随后交给 VAE 解码' : 'vθ → ODE 步进', 686, 237);
      ctx.textAlign = 'left';

      const lineStart = 56;
      const lineEnd = 744;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineStart, 324);
      ctx.lineTo(lineEnd, 324);
      ctx.stroke();
      for (let index = 0; index <= SAMPLE_STEPS; index += 1) {
        const x = lerp(lineStart, lineEnd, index / SAMPLE_STEPS);
        const active = index <= step;
        ctx.beginPath();
        ctx.arc(x, 324, active ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = index === step ? C.orange : active ? C.blue : C.line;
        ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(index), x, 347);
      }
      ctx.textAlign = 'left';
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reducedMotion || from === to) { draw(to); return; }
      const startedAt = performance.now();
      const tick = (now: number) => {
        const amount = Math.min(1, (now - startedAt) / 520);
        draw(lerp(from, to, easeInOutQuad(amount)));
        if (amount < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    draw(reducedMotion ? to : from);
    const disconnect = observeCanvas(canvas, start, () => cancelAnimationFrame(raf));
    return () => { cancelAnimationFrame(raf); disconnect(); };
  }, [step]);

  const feedback = step === 0
    ? '从随机噪声潜变量出发。此时还没有图像结构。'
    : step === SAMPLE_STEPS
      ? 'ODE 积分到路径终点，得到结构化图像潜变量；VAE 解码后才得到可见图片。'
      : `第 ${step} 次调用 DiT：模型给出当前位置的速度，ODE 求解器据此更新一次潜变量。`;

  const startPlayback = () => {
    if (step >= SAMPLE_STEPS) { previousProgressRef.current = 0; setStep(0); }
    setPlaying(true);
  };

  return <div className="flow-widget">
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H_SAMPLE} aria-label={`Flow Matching ODE 生成过程，已进行 ${step} 次速度场调用`} />
    <div className="flow-sampling-controls">
      <button className="tiny ghost" disabled={step === 0 || playing} onClick={() => setStep((current) => Math.max(0, current - 1))}>上一步</button>
      <span className="step-label">速度场调用 <b>{step}</b> / {SAMPLE_STEPS}</span>
      <button className="tiny" disabled={step === SAMPLE_STEPS || playing} onClick={() => setStep((current) => Math.min(SAMPLE_STEPS, current + 1))}>调用一次 DiT</button>
      {playing
        ? <button className="tiny ghost" onClick={() => setPlaying(false)}>暂停</button>
        : <button className="tiny ghost" onClick={startPlayback}>连续演示</button>}
      <button className="tiny ghost" onClick={() => { setPlaying(false); previousProgressRef.current = 0; setStep(0); }}>重置</button>
    </div>
    <div className={`feedback ${step === SAMPLE_STEPS ? 'good' : ''}`} aria-live="polite">{feedback}</div>
  </div>;
};
