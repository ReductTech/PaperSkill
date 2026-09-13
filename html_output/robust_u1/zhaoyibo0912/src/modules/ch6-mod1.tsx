import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 6.1（P2 步进可视化，1080×280）。
// 左区：照片噪声 = 1 − step/50、人脸清晰度 = step/50；右区：噪声-步数曲线
// 与当前步的橙色圆点。三个按钮：重置 / 上一步 / 下一步（第 50 步时变为「完成」）。

const W = 1080;
const H = 280;

const STEP_MIN = 1;
const STEP_MAX = 50;
const STEP_MS = 280;

type Fb = { text: string; cls: '' | 'good' | 'bad' };

function feedbackFor(s: number): Fb {
  if (s >= STEP_MAX) return { text: '第 50 步：恢复完成，等待解码为图像', cls: 'good' };
  if (s >= 40) return { text: `第 ${s} 步：接近完成，纹理归位`, cls: '' };
  if (s >= 15) return { text: `第 ${s} 步：细节逐渐清晰`, cls: '' };
  if (s > 1) return { text: `第 ${s} 步：轮廓开始浮现，噪声仍重`, cls: '' };
  return { text: '第 1 步：只有噪声，什么都看不清', cls: '' };
}

function roundRectPath(
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
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** 固定种子的伪随机数：保证斑点在每帧重绘时位置稳定。 */
function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = h - 26;
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, top, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 3);
  ctx.lineTo(w, top + 3);
  ctx.stroke();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor = '#d7deea'
) {
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  const d = clamp(damage, 0, 1);
  ctx.save();
  roundRectPath(ctx, x + 3, y + 3, w - 6, h - 6, 4);
  ctx.clip();

  const rndSp = prng(2027);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + 4 + rndSp() * (w - 10);
    const sy = y + 4 + rndSp() * (h - 10);
    const s = 1 + rndSp() * 2;
    ctx.fillStyle = rndSp() > 0.5 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }

  const rndCr = prng(577);
  const cracks = Math.round(4 * d);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  for (let c = 0; c < cracks; c++) {
    let cx = x + 8 + rndCr() * (w - 16);
    let cy = y + 8 + rndCr() * (h - 16);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let k = 0; k < 3; k++) {
      cx = clamp(cx + (rndCr() - 0.5) * 30, x + 5, x + w - 5);
      cy = clamp(cy + (rndCr() - 0.5) * 30, y + 5, y + h - 5);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  clarity: number
) {
  const a = 0.15 + 0.85 * clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.2, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.2, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.15, r * 0.55, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();

  if (clarity >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 8, r * 0.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawStage(ctx: CanvasRenderingContext2D, s: number) {
  const noise = clamp(1 - s / STEP_MAX, 0, 1);
  const clarity = clamp(s / STEP_MAX, 0, 1);
  drawPhoto(ctx, 90, 30, 260, 180, noise);
  drawFace(ctx, 220, 112, 46, clarity);
}

function drawCurve(ctx: CanvasRenderingContext2D, s: number) {
  // 白色内衬
  roundRectPath(ctx, 536, 36, 484, 204, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 3;
  ctx.stroke();

  const px0 = 600;
  const px1 = 980;
  const py0 = 80;
  const py1 = 212;
  const sx = (st: number) => px0 + ((st - STEP_MIN) / (STEP_MAX - STEP_MIN)) * (px1 - px0);
  const ny = (nv: number) => py0 + nv * (py1 - py0);

  // 坐标轴
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px0, py0 - 12);
  ctx.lineTo(px0, py1 + 8);
  ctx.lineTo(px1 + 8, py1 + 8);
  ctx.stroke();

  // 参考曲线：噪声随步数单调下降
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx(STEP_MIN), ny(1 - STEP_MIN / STEP_MAX));
  ctx.lineTo(sx(STEP_MAX), ny(0));
  ctx.stroke();

  // 当前步
  const cx = sx(s);
  const cy = ny(clamp(1 - s / STEP_MAX, 0, 1));
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px0, cy);
  ctx.lineTo(cx, cy);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, py1);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 当前噪声值（裸数字）
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillStyle = '#21324a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText((1 - s / STEP_MAX).toFixed(2), Math.min(cx + 12, 936), Math.max(cy - 12, 68));

  // 两个短轴标签
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillStyle = '#68778f';
  ctx.textAlign = 'right';
  ctx.fillText('噪声', px0 - 10, py0 - 6);
  ctx.fillText('步数', px1 + 8, py1 + 24);
}

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const shownStepRef = useRef(STEP_MIN);
  const fromStepRef = useRef(STEP_MIN);
  const toStepRef = useRef(STEP_MIN);
  const startRef = useRef(-1);
  const [step, setStep] = useState(STEP_MIN);
  const [feedback, setFeedback] = useState<Fb>({
    text: '第 1 步：只有噪声，什么都看不清',
    cls: '',
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

    const tick = (now: number) => {
      if (startRef.current >= 0) {
        const p = clamp((now - startRef.current) / STEP_MS, 0, 1);
        const e = easeInOutQuad(p);
        shownStepRef.current = lerp(fromStepRef.current, toStepRef.current, e);
        if (p >= 1) {
          shownStepRef.current = toStepRef.current;
          startRef.current = -1;
        }
      }
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawStage(ctx, shownStepRef.current);
      drawCurve(ctx, shownStepRef.current);
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

  const go = (next: number) => {
    const v = clamp(Math.round(next), STEP_MIN, STEP_MAX);
    setStep(v);
    fromStepRef.current = shownStepRef.current;
    toStepRef.current = v;
    startRef.current = performance.now();
    setFeedback(feedbackFor(v));
  };

  const done = step >= STEP_MAX;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          去噪步数 <span className="val">{step}</span>
        </label>
        <button type="button" className="tiny ghost" onClick={() => go(STEP_MIN)}>
          重置
        </button>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => go(step - 1)}
          disabled={step <= STEP_MIN}
        >
          上一步
        </button>
        <button type="button" className="tiny" onClick={() => go(step + 1)} disabled={done}>
          {done ? '完成' : '下一步'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
