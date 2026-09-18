import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.1（P4 模式 chips，1080×280）。
// 左区：PSNR / SSIM / LPIPS / R-Bench 四组横条；右区：同一张照片的三张小图
// （纹理 / 颜色 / 边缘）＋一条图例。切换 chip 时所有条以 300 ms 过渡到目标值。

const W = 1080;
const H = 280;

type Mode = 'none' | 'pix' | 'sem' | 'dual';
type Fb = { text: string; cls: '' | 'good' | 'bad' };

interface Row {
  psnr: number;
  ssim: number;
  lpips: number;
  rbench: number;
}

interface Group {
  name: string;
  value: number;
  min: number;
  max: number;
  higher: boolean;
  dp: number;
}

// 精确数值：Table 5（PSNR/SSIM/LPIPS）与 Table 11（R-Bench）。
const DATA: Record<Mode, Row> = {
  none: { psnr: 14.37, ssim: 0.4722, lpips: 0.5092, rbench: 0.577 },
  pix: { psnr: 21.45, ssim: 0.6311, lpips: 0.3299, rbench: 0.7236 },
  sem: { psnr: 21.33, ssim: 0.6285, lpips: 0.3233, rbench: 0.7257 },
  dual: { psnr: 21.49, ssim: 0.6314, lpips: 0.3223, rbench: 0.7398 },
};

const CHIPS: { key: Mode; label: string }[] = [
  { key: 'none', label: '无 RL' },
  { key: 'pix', label: '仅像素奖励' },
  { key: 'sem', label: '仅语义奖励' },
  { key: 'dual', label: '双奖励' },
];

const FEEDBACK: Record<Mode, Fb> = {
  none: { text: '无 RL：PSNR 14.37，恢复尚可但推理收益最小（R-Bench 0.5770）', cls: '' },
  pix: { text: '仅像素奖励：结构指标最好（PSNR 21.45），但语义可能漂移', cls: '' },
  sem: { text: '仅语义奖励：LPIPS 0.3233 最好，像素指标略降', cls: '' },
  dual: { text: '双奖励：质量与推理全面最佳（R-Bench 0.7398）', cls: 'good' },
};

const BAR_X0 = 60;
const BAR_X1 = 462;
const BAR_H = 22;
const ROW_TOP = 60;
const ROW_GAP = 50;
const TRANSITION_MS = 300;

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

function mixHex(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(pa[0], pb[0], k))},${Math.round(lerp(pa[1], pb[1], k))},${Math.round(
    lerp(pa[2], pb[2], k)
  )})`;
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

  const rndSp = prng(4409);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + 4 + rndSp() * (w - 10);
    const sy = y + 4 + rndSp() * (h - 10);
    const s = 1 + rndSp() * 2;
    ctx.fillStyle = rndSp() > 0.5 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }

  const rndCr = prng(811);
  const cracks = Math.round(4 * d);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  for (let c = 0; c < cracks; c++) {
    let cx = x + 8 + rndCr() * (w - 16);
    let cy = y + 8 + rndCr() * (h - 16);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let k = 0; k < 3; k++) {
      cx = clamp(cx + (rndCr() - 0.5) * 22, x + 5, x + w - 5);
      cy = clamp(cy + (rndCr() - 0.5) * 22, y + 5, y + h - 5);
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
  ctx.arc(cx - r * 0.35, cy - r * 0.2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.2, 2.2, 0, Math.PI * 2);
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

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; text: string }[],
  x: number,
  y: number
) {
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 12, 12);
    ctx.fillStyle = '#68778f';
    ctx.fillText(it.text, cx + 17, y);
    cx += 17 + ctx.measureText(it.text).width + 20;
  });
}

function drawBars(ctx: CanvasRenderingContext2D, r: Row) {
  const groups: Group[] = [
    { name: 'PSNR', value: r.psnr, min: 10, max: 22, higher: true, dp: 2 },
    { name: 'SSIM', value: r.ssim, min: 0.4, max: 0.7, higher: true, dp: 4 },
    { name: 'LPIPS', value: r.lpips, min: 0.2, max: 0.6, higher: false, dp: 4 },
    { name: 'R-Bench', value: r.rbench, min: 0.4, max: 0.8, higher: true, dp: 4 },
  ];
  ctx.textBaseline = 'middle';
  groups.forEach((g, i) => {
    const cy = ROW_TOP + i * ROW_GAP;
    const q = clamp((g.value - g.min) / (g.max - g.min), 0, 1);

    roundRectPath(ctx, BAR_X0, cy - BAR_H / 2, BAR_X1 - BAR_X0, BAR_H, 6);
    ctx.fillStyle = '#d7deea';
    ctx.fill();

    const bw = (BAR_X1 - BAR_X0) * q;
    if (bw > 3) {
      roundRectPath(ctx, BAR_X0, cy - BAR_H / 2, bw, BAR_H, 6);
      ctx.fillStyle = g.higher ? mixHex('#b8c9a7', '#228d5c', q) : mixHex('#228d5c', '#c43f52', q);
      ctx.fill();
    }

    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#21324a';
    ctx.textAlign = 'left';
    ctx.fillText(g.value.toFixed(g.dp), BAR_X1 + 14, cy);
  });
  ctx.textBaseline = 'alphabetic';
}

function drawSketch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  badge: string,
  q: number,
  kind: 0 | 1 | 2
) {
  const border = q >= 0.7 ? '#228d5c' : q >= 0.45 ? '#d7deea' : '#c43f52';
  drawPhoto(ctx, x, y, w, h, clamp(1 - q, 0, 1), border);
  drawFace(ctx, x + w / 2, y + h * 0.42, 20, q);

  ctx.save();
  if (kind === 0) {
    // 纹理：局部细节的斜向细纹
    ctx.strokeStyle = '#76906a';
    ctx.globalAlpha = 0.25 + 0.75 * q;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const ly = y + h - 26 + i * 4;
      ctx.beginPath();
      ctx.moveTo(x + 10, ly);
      ctx.lineTo(x + 44, ly - 6);
      ctx.stroke();
    }
  } else if (kind === 1) {
    // 颜色：两个小色块是否还分得开
    ctx.globalAlpha = 0.25 + 0.75 * q;
    ctx.fillStyle = '#c43f52';
    roundRectPath(ctx, x + 10, y + h - 30, 18, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#228d5c';
    roundRectPath(ctx, x + 34, y + h - 30, 18, 18, 4);
    ctx.fill();
  } else {
    // 边缘：一条对角线是否还锐利
    ctx.strokeStyle = '#21324a';
    ctx.globalAlpha = 0.2 + 0.8 * q;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + h - 12);
    ctx.lineTo(x + 46, y + h - 34);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = badge;
  ctx.fillRect(x + 8, y + 8, 12, 12);
}

function drawSketches(ctx: CanvasRenderingContext2D, r: Row) {
  const items: { color: string; q: number; kind: 0 | 1 | 2 }[] = [
    { color: '#27446e', q: clamp((r.psnr - 10) / 12, 0, 1), kind: 0 },
    { color: '#f07e47', q: 1 - clamp((r.lpips - 0.2) / 0.4, 0, 1), kind: 1 },
    { color: '#7c3aed', q: clamp((r.ssim - 0.4) / 0.3, 0, 1), kind: 2 },
  ];
  const sw = 128;
  const sh = 96;
  const sy = 64;
  const startX = 572;
  items.forEach((it, i) => {
    drawSketch(ctx, startX + i * 144, sy, sw, sh, it.color, it.q, it.kind);
  });

  drawLegend(
    ctx,
    [
      { color: '#27446e', text: '纹理' },
      { color: '#f07e47', text: '颜色' },
      { color: '#7c3aed', text: '边缘' },
    ],
    690,
    212
  );
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const shownRef = useRef<Row>({ ...DATA.dual });
  const fromRef = useRef<Row>({ ...DATA.dual });
  const toRef = useRef<Row>({ ...DATA.dual });
  const startRef = useRef(-1);
  const [mode, setMode] = useState<Mode>('dual');
  const [feedback, setFeedback] = useState<Fb>({
    text: '双奖励：PSNR 21.49、LPIPS 0.3223、R-Bench 0.7398，全面最佳',
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
        const p = clamp((now - startRef.current) / TRANSITION_MS, 0, 1);
        const e = easeInOutQuad(p);
        const f = fromRef.current;
        const to = toRef.current;
        shownRef.current = {
          psnr: lerp(f.psnr, to.psnr, e),
          ssim: lerp(f.ssim, to.ssim, e),
          lpips: lerp(f.lpips, to.lpips, e),
          rbench: lerp(f.rbench, to.rbench, e),
        };
        if (p >= 1) startRef.current = -1;
      }
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawBars(ctx, shownRef.current);
      drawSketches(ctx, shownRef.current);
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

  const pick = (key: Mode) => {
    setMode(key);
    fromRef.current = { ...shownRef.current };
    toRef.current = { ...DATA[key] };
    startRef.current = performance.now();
    setFeedback(FEEDBACK[key]);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 18,
          padding: '2px 0 4px',
          fontSize: 12,
          color: '#68778f',
          flexWrap: 'wrap',
        }}
        aria-hidden="true"
      >
        <span>PSNR ↑</span>
        <span>SSIM ↑</span>
        <span>LPIPS ↓</span>
        <span>R-Bench ↑</span>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>训练配置</label>
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip${mode === c.key ? ' selected' : ''}`}
            aria-pressed={mode === c.key}
            onClick={() => pick(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
