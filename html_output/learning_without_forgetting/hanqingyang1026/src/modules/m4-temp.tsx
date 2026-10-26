import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 温度：拖动 T，两排 12 条概率实时重算。
// 上排「记录」= 旧网络对新任务图片的旧类概率 y_o；下排「当前」= 按 1/T 次方再归一化的 y′_o。
// KD 损失按 L_old = −Σ y′_o log ŷ′_o 现场算，量级是示意，要看的是它随 T 变大的趋势。

const W = 1080;
const H = 280;

const BASE = [0.9, 0.05, 0.02, 0.01, 0.006, 0.004, 0.003, 0.002, 0.002, 0.001, 0.001, 0.001];
const CURRENT = [0.88, 0.06, 0.025, 0.012, 0.008, 0.005, 0.004, 0.002, 0.002, 0.001, 0.001, 0.0005];

const C = {
  bg: '#f5f8f0',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
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

function normalize(p: number[]): number[] {
  const s = p.reduce((a, b) => a + b, 0);
  return p.map((v) => v / s);
}

function temperatureNorm(p: number[], T: number): number[] {
  const q = p.map((v) => Math.pow(Math.max(v, 1e-9), 1 / T));
  const s = q.reduce((a, b) => a + b, 0);
  return q.map((v) => v / s);
}

function kdLoss(teacher: number[], student: number[]): number {
  let s = 0;
  for (let i = 0; i < teacher.length; i++) {
    s -= teacher[i] * Math.log(Math.max(student[i], 1e-9));
  }
  return s;
}

function feedbackFor(T: number): { text: string; cls: string } {
  if (T < 1.4) {
    return { text: 'T=1：原样比较，小的概率几乎看不见，损失只盯最大的类。', cls: '' };
  }
  if (T < 2.6) {
    return {
      text: 'T≈2：0.001 这类小概率被抬起来，类与类的相似关系也进了损失 —— 论文就取 2。',
      cls: 'good',
    };
  }
  return { text: '再调大，分布被压平，所有类都差不多，区分度反而下降。', cls: 'bad' };
}

function draw(ctx: CanvasRenderingContext2D, T: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const rec = normalize(BASE);
  const cur = temperatureNorm(BASE, T);

  // 两条基线
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  [150, 258].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(1004, y);
    ctx.stroke();
  });

  // 两排各一个标签
  ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.blue;
  ctx.fillText('记录', 40, 106);
  ctx.fillStyle = C.orange;
  ctx.fillText('当前', 40, 214);

  // 12 类，上下两排：上排记录、下排温度重归一化
  const x0 = 80;
  const step = 80;
  const bw = 32;
  for (let i = 0; i < rec.length; i++) {
    const x = x0 + i * step;
    const hu = 10 + 84 * Math.sqrt(clamp(rec[i], 0, 1));
    ctx.fillStyle = C.blue;
    roundRect(ctx, x, 150 - hu, bw, hu, 4);
    ctx.fill();
    const hl = 10 + 84 * Math.sqrt(clamp(cur[i], 0, 1));
    ctx.fillStyle = C.orange;
    roundRect(ctx, x, 258 - hl, bw, hl, 4);
    ctx.fill();
  }
}

export const M4Temp: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ T: 1, shown: 1, from: 1, start: 0, moving: false });
  const [T, setT] = useState(1);
  const [shown, setShown] = useState(1);
  const [feedback, setFeedback] = useState(feedbackFor(1));

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
      if (state.moving) {
        const p = clamp((now - state.start) / 260, 0, 1);
        state.shown = state.from + (state.T - state.from) * easeOutCubic(p);
        if (p >= 1) {
          state.shown = state.T;
          state.moving = false;
        }
        setShown(state.shown);
      }
      draw(ctx, state.shown);
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

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = clamp(Number(event.target.value) / 10, 1, 4);
    const state = stateRef.current;
    state.from = state.shown;
    state.T = next;
    state.start = performance.now();
    state.moving = true;
    setT(next);
    setFeedback(feedbackFor(next));
  };

  const cur = temperatureNorm(BASE, shown);
  const student = temperatureNorm(CURRENT, shown);
  const kd = kdLoss(cur, student);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          温度 T <span className="val">{T.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={10}
          max={40}
          step={1}
          value={Math.round(T * 10)}
          onChange={onChange}
          aria-label="温度 T"
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">KD 损失</div>
          <div className="v">{kd.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">最大类概率</div>
          <div className="v">{cur[0].toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">最小类概率</div>
          <div className="v">{cur[11].toFixed(3)}</div>
        </div>
      </div>
      <div className={"feedback " + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M4Temp;
