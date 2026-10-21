import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 Module 1.1 (P1 slider): how hard task B is trained drives the old-task
// collapse. Left 560px = life scene (wall + crux hold + climber; hand slip,
// hold fade and red outline grow with intensity; rope slackness ∝ 1−intensity).
// Right 440px = technical inset: task-A error curve vs training time (red,
// rises with intensity, 方向性示意) + bare number at the curve end.

const W = 1080;
const H = 280;
const LEFT_W = 560;

const BG = '#f5f8f0';
const ROCK_LIGHT = '#b8c9a7';
const ROCK_DARK = '#76906a';
const ROPE = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const PANEL = '#ffffff';

interface M1State {
  intensity: number;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
  redW = 0
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  rr(ctx, x - r, y - r * 0.72, r * 2, r * 1.44, 4);
  ctx.fill();
  if (redW > 0) {
    ctx.strokeStyle = RED;
    ctx.lineWidth = redW;
    rr(ctx, x - r, y - r * 0.72, r * 2, r * 1.44, 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  lw: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAnchor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(4.5, 4);
  ctx.lineTo(-4.5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawRing(ctx, x, y, 13, GREEN, 2.5);
}

function drawRope(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag: number
) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  ctx.strokeStyle = ROPE;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
}

function drawClimber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  color: string,
  hx: number,
  hy: number
) {
  const bob = Math.sin(t * Math.PI * 2) * 1.5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y - 36 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 29 + bob);
  ctx.lineTo(x, y - 10 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 10 + bob);
  ctx.lineTo(x - 10, y + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 10 + bob);
  ctx.lineTo(x + 10, y + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 25 + bob);
  ctx.lineTo(x + 14, y - 12 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 24 + bob);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 20
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.font = '16px "Segoe UI", sans-serif';
  let yy = y;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(x, yy - 11, 12, 12);
    ctx.fillStyle = MUTED;
    ctx.fillText(item.label, x + 18, yy);
    yy += 24;
  }
}

function renderLife(ctx: CanvasRenderingContext2D, s: M1State, t: number) {
  const inten = clamp(s.intensity, 0, 1);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ROCK_LIGHT;
  ctx.fillRect(0, 170, LEFT_W, H - 170);
  ctx.strokeStyle = ROCK_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.lineTo(LEFT_W, 170);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 196);
  ctx.lineTo(LEFT_W, 196);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const cx = 310;
  const cy = 218 + inten * 10;
  // anchor piton above the crux hold; rope slackness ∝ 1−intensity
  drawAnchor(ctx, 250, 148, INK);
  drawRope(ctx, 250, 148, cx, cy, 40 * (1 - inten));

  // crux hold: fades and gains a red outline as intensity grows
  drawHold(ctx, 250, 190, 16, BLUE, 1 - 0.6 * inten, 1 + 3 * inten);

  // climber: hand slip offset ∝ intensity (0..36px)
  const slip = inten * 36;
  const hx = 244 + slip + Math.sin(t * Math.PI * 2) * 2;
  const hy = 176 + inten * 8;
  const color = inten > 0.7 ? RED : BLUE;
  drawClimber(ctx, cx, cy, t, color, hx, hy);
  drawRing(ctx, 250, 190, 21, GREEN, 2.5);
}

function renderTech(ctx: CanvasRenderingContext2D, s: M1State) {
  const inten = clamp(s.intensity, 0, 1);
  const PX = 600;
  const PY = 20;
  const PW = 440;
  const PH = 260;
  ctx.fillStyle = PANEL;
  ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(PX, PY, PW, PH);

  const ax0 = PX + 48;
  const ay0 = PY + PH - 50;
  const aw = PW - 92;
  const ah = PH - 96;
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax0, ay0);
  ctx.lineTo(ax0 + aw, ay0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax0, ay0);
  ctx.lineTo(ax0, ay0 - ah);
  ctx.stroke();

  // task-A error curve vs training time: flat while task A is trained, then it
  // rises toward a level set by the training intensity (方向性示意)
  const errEnd = 0.05 + 0.9 * Math.pow(inten, 1.5);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    let err = 0.05;
    if (x > 0.35) {
      const k = (x - 0.35) / 0.65;
      err = 0.05 + (errEnd - 0.05) * (1 - Math.pow(1 - k, 2));
    }
    const px = ax0 + x * aw;
    const py = ay0 - err * ah;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  const ex = ax0 + aw;
  const ey = ay0 - errEnd * ah;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(ex, ey, 4, 0, Math.PI * 2);
  ctx.fill();
  drawSceneLabel(ctx, errEnd.toFixed(2), ex - 34, ey - 12, RED, 20);
  drawLegend(ctx, [{ label: '任务A错误率', color: RED }], PX + 22, PY + 34);
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M1State>({ intensity: 0.2 });
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(20);
  const [feedback, setFeedback] = useState({
    text: '任务 B 还没怎么训练，旧技能暂时完好。',
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
    const tick = () => {
      const now = performance.now();
      const t = (now / 1000) % 1;
      renderLife(ctx, stateRef.current, t);
      renderTech(ctx, stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    const inten = v / 100;
    stateRef.current.intensity = inten;
    setValue(v);
    if (inten < 0.4) {
      setFeedback({ text: '训练还不算多，旧任务表现基本稳定。', cls: '' });
    } else if (inten <= 0.7) {
      setFeedback({ text: '训练量加大，旧任务错误率开始抬头——遗忘正在发生。', cls: '' });
    } else {
      setFeedback({ text: '旧任务错误率大幅上升：顺序学任务 B 时，网络已经把旧任务依赖的权重改掉了。', cls: 'bad' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          新任务训练强度 <span className="val">{value}</span>
        </label>
        <input type="range" min={0} max={100} step={1} value={value} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
