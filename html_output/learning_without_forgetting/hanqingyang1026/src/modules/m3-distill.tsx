import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 同步对比：点一次「开始训练」，左右两栏在 2.4s 内一起推进。
// 左栏只有新任务损失（只微调），右栏多一项旧输出的蒸馏（LwF）。
// 0.92→0.55 / 0.92→0.88 是演示用的示意值；新任务 57.0 / 57.7 是 Table 1(a) 的真实值。

const W = 1080;
const H = 280;
const DURATION = 2400;

const BASE_TOP = 0.92;
const LEFT_END = 0.55;
const RIGHT_END = 0.88;
const ACC_START = 30.0;
const LEFT_ACC = 57.0;
const RIGHT_ACC = 57.7;

const IDLE_TEXT = '同一起点：两栏旧类最高概率都是 0.92，新任务准确率都从 30.0 出发（示意）。';
const RUNNING_TEXT = '共享层在动 —— 看左边那根最长的条。';
const DONE_TEXT =
  '示意：左栏 0.92→0.55、右栏稳在 0.88 都是演示数值；真实值看新任务 —— Table 1(a) 里 57.0 对 57.7。';

type Phase = 'idle' | 'running' | 'done';

const C = {
  bg: '#f5f8f0',
  panel: 'rgba(255,255,255,0.6)',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  ink: '#21324a',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function mixColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const k = clamp(t, 0, 1);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
}

function barWidth(p: number): number {
  return 22 + 338 * Math.sqrt(clamp(p, 0, 1));
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  label: string,
  labelColor: string,
  top: number,
  others: number[],
  color: string,
  accent: string,
  prog: number
) {
  const e = easeOutCubic(clamp(prog, 0, 1));

  // 栏底板
  ctx.fillStyle = C.panel;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, 24, 480, 232, 10);
  ctx.fill();
  ctx.stroke();

  // 唯一的栏标题
  ctx.fillStyle = labelColor;
  ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + 24, 62);

  // 5 条旧类概率条，顶条是最高概率，随训练变化
  const x0 = x + 24;
  const probs = [top, others[0], others[1], others[2], others[3]];
  for (let i = 0; i < probs.length; i++) {
    const y = 84 + i * 30;
    const w = barWidth(probs[i]);
    ctx.fillStyle = i === 0 ? color : 'rgba(39,68,110,0.26)';
    roundRect(ctx, x0, y, w, 16, 4);
    ctx.fill();
  }

  // 训练进度：一条细线从 0 长到满
  ctx.fillStyle = 'rgba(39,68,110,0.12)';
  roundRect(ctx, x0, 240, 432, 3, 1.5);
  ctx.fill();
  if (e > 0) {
    ctx.fillStyle = accent;
    roundRect(ctx, x0, 240, Math.max(2, 432 * e), 3, 1.5);
    ctx.fill();
  }
}

function draw(ctx: CanvasRenderingContext2D, prog: number) {
  const p = clamp(prog, 0, 1);
  const e = easeOutCubic(p);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // 中线：两栏共享同一个起点和时间轴
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(540, 40);
  ctx.lineTo(540, 240);
  ctx.stroke();

  const leftTop = BASE_TOP + (LEFT_END - BASE_TOP) * e;
  const rightTop = BASE_TOP + (RIGHT_END - BASE_TOP) * e;

  drawColumn(ctx, 40, '只微调', C.blue, leftTop, [0.05, 0.02, 0.01, 0.006], mixColor(C.blue, C.red, e), C.red, p);
  drawColumn(ctx, 560, 'LwF', C.green, rightTop, [0.04, 0.02, 0.01, 0.006], C.green, C.green, p);
}

export const M3Distill: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ phase: 'idle' as Phase, prog: 0, startAt: 0 });
  const [phase, setPhase] = useState<Phase>('idle');
  const [prog, setProg] = useState(0);
  const [feedback, setFeedback] = useState({ text: IDLE_TEXT, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const state = stateRef.current;
    const tick = (now: number) => {
      if (state.phase === 'running') {
        const raw = clamp((now - state.startAt) / DURATION, 0, 1);
        state.prog = raw;
        setProg(easeOutCubic(raw));
        if (raw >= 1) {
          state.phase = 'done';
          state.prog = 1;
          setPhase('done');
          setProg(1);
          setFeedback({ text: DONE_TEXT, cls: 'good' });
        }
      }
      draw(ctx, state.prog);
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

  const onPrimary = () => {
    const state = stateRef.current;
    if (state.phase === 'running') return;
    if (state.phase === 'done') {
      state.phase = 'idle';
      state.prog = 0;
      state.startAt = 0;
      setPhase('idle');
      setProg(0);
      setFeedback({ text: IDLE_TEXT, cls: '' });
      return;
    }
    state.phase = 'running';
    state.prog = 0;
    state.startAt = performance.now();
    setPhase('running');
    setProg(0);
    setFeedback({ text: RUNNING_TEXT, cls: '' });
  };

  const e = clamp(prog, 0, 1);
  const leftTop = BASE_TOP + (LEFT_END - BASE_TOP) * e;
  const rightTop = BASE_TOP + (RIGHT_END - BASE_TOP) * e;
  const leftAcc = ACC_START + (LEFT_ACC - ACC_START) * e;
  const rightAcc = ACC_START + (RIGHT_ACC - ACC_START) * e;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button type="button" className="chip" onClick={onPrimary} disabled={phase === 'running'}>
          {phase === 'idle' ? '开始训练' : phase === 'running' ? '训练中…' : '重置'}
        </button>
      </div>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className="metric">
          <div className="l">微调 · 旧类</div>
          <div className="v">{leftTop.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">LwF · 旧类</div>
          <div className="v">{rightTop.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">微调 · 新任务</div>
          <div className="v">{leftAcc.toFixed(1)}</div>
        </div>
        <div className="metric">
          <div className="l">LwF · 新任务</div>
          <div className="v">{rightAcc.toFixed(1)}</div>
        </div>
      </div>
      <div className={"feedback " + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M3Distill;
