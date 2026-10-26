import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5.1 —— 拖动 λ：橙点沿旧–新前沿滑动，两只小杯的液面此消彼长。
// 前沿锚点是按 Fig.7(a) 读出的示意值；λ=1 的 (50.6, 70.2) 取自 Table 1(a) Places365→VOC。

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  porcelain: '#ece6d9',
  tea: '#a9713a',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
  axis: '#d7deea',
  ink: '#21324a',
  mute: '#7d8ea3',
};

// 锚点按 Fig.7(a) 读出（蓝 × 的实际落点：旧 49.9–51.0、新 69.6–70.4）；
// λ=1 的 (50.6, 70.2) 与 Table 1(a) 一致。λ 越大越偏旧任务。
const LAMS = [0.1, 0.35, 1, 3, 10];
const OLD = [49.9, 50.3, 50.6, 50.9, 51.0];
const NEW = [70.4, 70.3, 70.2, 69.9, 69.6];

const PX0 = 150;
const PX1 = 690;
const PY0 = 54;
const PY1 = 232;
const OLD_MIN = 49.3;
const OLD_SPAN = 2.4;
const NEW_MIN = 69.2;
const NEW_SPAN = 1.6;

function frontier(lam: number) {
  const p = Math.log10(clamp(lam, LAMS[0], LAMS[LAMS.length - 1]));
  let i = 0;
  while (i < LAMS.length - 2 && p > Math.log10(LAMS[i + 1])) i += 1;
  const a = Math.log10(LAMS[i]);
  const b = Math.log10(LAMS[i + 1]);
  const t = clamp((p - a) / (b - a), 0, 1);
  return {
    old: OLD[i] + (OLD[i + 1] - OLD[i]) * t,
    new: NEW[i] + (NEW[i + 1] - NEW[i]) * t,
  };
}

const xOf = (v: number) => PX0 + ((v - OLD_MIN) / OLD_SPAN) * (PX1 - PX0);
const yOf = (v: number) => PY1 - ((v - NEW_MIN) / NEW_SPAN) * (PY1 - PY0);

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * 9 - dy * 4, y - dy * 9 + dx * 4);
  ctx.lineTo(x - dx * 9 + dy * 4, y - dy * 9 - dx * 4);
  ctx.closePath();
  ctx.fill();
}

function cup(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  s: number,
  level: number,
  rim: string
) {
  const w = 30 * s;
  const h = 34 * s;
  const top = base - h;
  ctx.fillStyle = C.porcelain;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top);
  ctx.lineTo(x + w / 2, top);
  ctx.lineTo(x + w * 0.36, base);
  ctx.lineTo(x - w * 0.36, base);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const inset = 4;
  const lh = (h - 10) * clamp(level, 0, 1);
  const wTop = (w - 6) * (1 - 0.12 * (inset / h));
  const wBottom = (w - 6) * (1 - 0.12 * ((inset + lh) / h));
  ctx.fillStyle = C.tea;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - wTop / 2, top + inset);
  ctx.lineTo(x + wTop / 2, top + inset);
  ctx.lineTo(x + wBottom / 2, top + inset + lh);
  ctx.lineTo(x - wBottom / 2, top + inset + lh);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = rim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2, 3.6 * s * 0.9, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function feedbackFor(lam: number) {
  const f = frontier(lam);
  const val = `旧 ${f.old.toFixed(1)}、新 ${f.new.toFixed(1)}`;
  if (lam < 0.4) {
    return {
      text: `λ=${lam.toFixed(2)}：${val} —— λ 太小，新任务被顶到最高，旧任务掉到最低。`,
      cls: 'bad',
    };
  }
  if (lam <= 2.5) {
    return {
      text: `λ=${lam.toFixed(2)}：${val} —— 这一带是新旧两边的折中区，论文取 λ=1（50.6 / 70.2）。`,
      cls: 'good',
    };
  }
  return {
    text: `λ=${lam.toFixed(2)}：${val} —— λ 太大，旧任务守住了，新任务却学不动。`,
    cls: '',
  };
}

function render(ctx: CanvasRenderingContext2D, lam: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // 坐标轴（刻度不写数字）
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PX0, PY1);
  ctx.lineTo(PX0, PY0 - 10);
  ctx.moveTo(PX0, PY1);
  ctx.lineTo(PX1 + 18, PY1);
  ctx.stroke();
  ctx.fillStyle = C.axis;
  arrowHead(ctx, PX1 + 18, PY1, 1, 0);
  arrowHead(ctx, PX0, PY0 - 10, 0, -1);

  for (let v = 49.5; v <= 51.5; v += 0.5) {
    ctx.beginPath();
    ctx.moveTo(xOf(v), PY1);
    ctx.lineTo(xOf(v), PY1 + 4);
    ctx.stroke();
  }
  for (let v = 69.4; v <= 70.6; v += 0.4) {
    const ty = yOf(v);
    ctx.beginPath();
    ctx.moveTo(PX0 - 4, ty);
    ctx.lineTo(PX0, ty);
    ctx.stroke();
  }

  // 旧–新前沿
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k <= 80; k += 1) {
    const p = k / 80;
    const f = frontier(Math.pow(10, -1 + 2 * p));
    const px = xOf(f.old);
    const py = yOf(f.new);
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const f = frontier(lam);
  const px = xOf(f.old);
  const py = yOf(f.new);

  // 当前点的辅助线
  ctx.strokeStyle = 'rgba(39,68,110,0.22)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, PY1);
  ctx.moveTo(px, py);
  ctx.lineTo(PX0, py);
  ctx.stroke();
  ctx.setLineDash([]);

  // λ=1 的参考圈
  const ref = frontier(1);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(xOf(ref.old), yOf(ref.new), 12, 0, Math.PI * 2);
  ctx.stroke();

  // 移动点
  ctx.fillStyle = C.orange;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 两只小杯：左=旧任务，右=新任务
  ctx.fillStyle = C.table;
  ctx.fillRect(760, 208, 300, 12);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(760, 208);
  ctx.lineTo(1060, 208);
  ctx.stroke();

  const oldLvl = clamp((f.old - 49.4) / 2.0, 0.06, 1);
  const newLvl = clamp((f.new - 69.2) / 1.6, 0.06, 1);
  cup(ctx, 832, 208, 2, oldLvl, C.deep);
  cup(ctx, 986, 208, 2, newLvl, C.green);

  // 本帧只有两处文字
  ctx.fillStyle = C.mute;
  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('示意', 156, 36);
  ctx.fillStyle = C.ink;
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('旧任务', 600, 258);
}

export const M5Lambda: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef({ from: 1, to: 1, t0: 0 });
  const [lambda, setLambda] = useState(1);
  const [feedback, setFeedback] = useState({
    text: '论文的默认值：λ=1，旧 50.6、新 70.2，两边都还像样。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    animRef.current.t0 = performance.now() - 400;
    let raf: number | null = null;

    const tick = (now: number) => {
      const a = animRef.current;
      const p = clamp((now - a.t0) / 320, 0, 1);
      const lam = a.from + (a.to - a.from) * easeOutCubic(p);
      render(ctx, lam);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = Number(e.target.value) / 1000;
    const next = Number(Math.pow(10, -1 + 2 * pos).toFixed(2));
    const a = animRef.current;
    const p = clamp((performance.now() - a.t0) / 320, 0, 1);
    a.from = a.from + (a.to - a.from) * easeOutCubic(p);
    a.to = next;
    a.t0 = performance.now();
    setLambda(next);
    setFeedback(feedbackFor(next));
  };

  const cur = frontier(lambda);
  const sliderValue = Math.round(((Math.log10(lambda) + 1) / 2) * 1000);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          λ 平衡权重 <span className="val">{lambda.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sliderValue}
          onChange={onChange}
          aria-label="平衡权重 λ"
        />
        <span className="val">旧 {cur.old.toFixed(1)} · 新 {cur.new.toFixed(1)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M5Lambda;
