import React, { useCallback, useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.1（1080×280）：拖动「损坏强度」滑块，左区照片的噪声即时变化，
// 右区参考趋势曲线上的橙色圆点同步移动 —— 损坏越重，正确率跌得越快。

const W = 1080;
const H = 280;

// 参考趋势（证据启发式）：acc = 0.82 − 0.19·(c/100)²
function accRef(c: number): number {
  return 0.82 - 0.19 * Math.pow(c / 100, 2);
}

const PHOTO = { x: 90, y: 50, w: 260, h: 180 };
const PANEL = { x: 562, y: 34, w: 448, h: 206 };
const PLOT = { x0: 600, x1: 980, yTop: 70, yBottom: 215 };

// ---------- drawing kit (local helpers, fixed signatures) ----------
type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Deterministic PRNG: 斑点位置每帧一致，只有数量随 damage 变化。
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawPhoto(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
) {
  const d = clamp(damage, 0, 1);
  const rng = makeRng(90210);
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w;
    const sy = y + rng() * h;
    const s = 1 + rng() * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }
  const nc = Math.round(2 + 2 * d);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < nc; i++) {
    let px = x + rng() * w;
    let py = y + rng() * h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 0; k < 3; k++) {
      px += (rng() - 0.5) * 30;
      py += (rng() - 0.5) * 30;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = stateColor ?? '#d7deea';
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx: Ctx, cx: number, cy: number, r: number, clarity: number) {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.85 * c;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.36, cy - r * 0.18, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.18, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.restore();

  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 14, 9, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSceneLabel(ctx: Ctx, text: string, x: number, y: number) {
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#21324a';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef({ corruption: 25 });
  const [corruption, setCorruption] = useState(25);
  const [feedback, setFeedback] = useState({
    text: '损坏强度 25%：模型基本还能看懂',
    cls: '',
  });

  const draw = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const c = stateRef.current.corruption;

    clearScene(ctx, W, H);

    // 左区：照片噪声与裂痕随损坏强度变化
    drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, c / 100);
    drawFace(
      ctx,
      PHOTO.x + PHOTO.w / 2,
      PHOTO.y + 70,
      44,
      clamp(1 - 0.85 * (c / 100), 0.15, 0.94)
    );

    // 右区：白色内衬中的参考趋势曲线
    ctx.save();
    roundRect(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d7deea';
    ctx.stroke();
    ctx.restore();

    const cxOf = (v: number) => lerp(PLOT.x0, PLOT.x1, v / 100);
    const cyOf = (v: number) => lerp(PLOT.yBottom, PLOT.yTop, clamp(v, 0, 1));

    ctx.save();
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) {
      const x = cxOf(i * 25);
      ctx.beginPath();
      ctx.moveTo(x, PLOT.yBottom);
      ctx.lineTo(x, PLOT.yBottom + 6);
      ctx.stroke();
    }
    for (let i = 0; i <= 2; i++) {
      const y = cyOf(i * 0.5);
      ctx.beginPath();
      ctx.moveTo(PLOT.x0 - 6, y);
      ctx.lineTo(PLOT.x0, y);
      ctx.stroke();
    }
    ctx.restore();

    // 曲线颜色：c < 50 蓝（稳得住），c ≥ 50 红（开始猜）
    ctx.save();
    ctx.strokeStyle = c < 50 ? '#27446e' : '#c43f52';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = cxOf(i);
      const y = cyOf(accRef(i));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 当前损坏强度对应的点
    ctx.save();
    ctx.beginPath();
    ctx.arc(cxOf(c), cyOf(accRef(c)), 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    drawSceneLabel(ctx, '参考趋势', PLOT.x0, 58);
    drawSceneLabel(ctx, '正确率 ' + accRef(c).toFixed(2), 720, 58);

    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    ctxRef.current = ctx;
    draw();
    const disconnect = observeCanvas(canvas, draw, () => {});
    return () => {
      disconnect();
      ctxRef.current = null;
    };
  }, [draw]);

  useEffect(() => {
    draw();
  }, [corruption, draw]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const c = Number(e.target.value);
    stateRef.current.corruption = c;
    setCorruption(c);
    setFeedback(
      c < 30
        ? { text: '损坏较轻：线索还在，模型稳得住', cls: '' }
        : c < 70
        ? { text: '损坏加重：细节开始丢失，模型频繁出错', cls: '' }
        : { text: '严重损坏：模型基本在猜答案', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          损坏强度 <span className="val">{corruption}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={corruption}
          onChange={onChange}
          aria-label="损坏强度"
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
