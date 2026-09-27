import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCheckMark,
  drawCrossMark,
  drawLegend,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// Module 5.1 — the four-step mixing machine (P2 step widget):
// ①倾倒 OXE 全量 → ②过滤 单臂+第三人称 → ③配比 Octo 权重 → ④试错 DROID 10% 撤出.
// 1080x280 canvas + prev/next/reset controls + per-step feedback.
const W = 1080;
const H = 280;
const LEFT_W = 506; // left scene is clipped to this width

// Funnel geometry.
const MOUTH_L = 120;
const MOUTH_R = 360;
const MOUTH_Y = 84;
const NECK_Y = 170;
const NECK_CX = 250;
const NECK_HALF = 18;
const MESH_Y = 142;
const SPOUT_Y = 188;

// Mixing vat.
const VAT = { x: 150, y: 202, w: 220, h: 64 };
const BAR = { x: 166, y: 224, w: 188, h: 30 };
const SEG_FRACS = [0.28, 0.22, 0.18, 0.14, 0.1];
const SEG_COLORS = [C.blue, C.purple, C.green, C.orange, '#94a7bd'];

const STEP_TITLES = ['倾倒', '过滤', '配比', '试错'];
const STEP_CAPS = ['OXE 全量进料', '只留单臂', 'Octo 权重', '敢加敢撤'];
const STEP_MARKS = ['①', '②', '③', '④'];

const FEEDBACK: { text: string; cls: string }[] = [
  {
    text: '① 倾倒：Open X-Embodiment 大会全量进料——70+ 数据集、200 万+ 条轨迹，本体与场景五花八门。',
    cls: '',
  },
  {
    text: '② 过滤：只留「单臂操作 + 第三人称相机」的操作数据集——形态不符的，整批退回。',
    cls: '',
  },
  {
    text: '③ 配比：沿用 Octo 混合权重——数据多样的上调、单调的下调，200 万+ 筛剩 970k。',
    cls: '',
  },
  {
    text: '保守试加也要敢撤：DROID 的动作词准确率上不去，最终段果断剔除——<b>数据质量优先于数量</b>。',
    cls: '',
  },
];
const DONE_FEEDBACK = {
  text: '<b>970k 轨迹、多本体多场景</b>——这正是它能开箱控多种机器人的底料。',
  cls: 'good',
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Width-aware value chip (drawValueChip is fixed 44px wide; too narrow for 200万+). */
function chip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  scale = 1
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.font = 'bold 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 8, -12, tw + 16, 24, 6);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

function caption(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.save();
  ctx.fillStyle = C.muted;
  ctx.font = '10px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - 8 * Math.cos(ang), y2 - 8 * Math.sin(ang));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(ang - 0.45), y2 - 10 * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(ang + 0.45), y2 - 10 * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function funnelHalfAt(y: number): number {
  const t = clamp((y - MOUTH_Y) / (NECK_Y - MOUTH_Y), 0, 1);
  return lerp((MOUTH_R - MOUTH_L) / 2, NECK_HALF, t);
}

function drawFunnel(ctx: CanvasRenderingContext2D, dim: boolean): void {
  ctx.save();
  ctx.globalAlpha = dim ? 0.3 : 1;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(MOUTH_L, MOUTH_Y);
  ctx.lineTo(NECK_CX - NECK_HALF, NECK_Y);
  ctx.lineTo(NECK_CX - NECK_HALF - 2, SPOUT_Y);
  ctx.lineTo(NECK_CX + NECK_HALF + 2, SPOUT_Y);
  ctx.lineTo(NECK_CX + NECK_HALF, NECK_Y);
  ctx.lineTo(MOUTH_R, MOUTH_Y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(MOUTH_L - 5, MOUTH_Y);
  ctx.lineTo(MOUTH_R + 5, MOUTH_Y);
  ctx.stroke();
  // filter mesh
  const cx = (MOUTH_L + MOUTH_R) / 2;
  const hw = funnelHalfAt(MESH_Y);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const seg = 10;
  for (let i = 0; i <= seg; i++) {
    const x = cx - hw + (2 * hw * i) / seg;
    const y = MESH_Y + (i % 2 === 0 ? -4 : 4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

interface VatOpts {
  barFrac: number; // Octo ratio bar fill 0..1
  droidFrac: number; // DROID slice fraction 0..1 (of 10%)
  dotCount: number; // loose parts accumulated at the vat bottom
  now: number;
}

function drawVat(ctx: CanvasRenderingContext2D, opts: VatOpts): void {
  const { barFrac, droidFrac, dotCount, now } = opts;
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(VAT.x, VAT.y, VAT.w, VAT.h, 8);
  ctx.fill();
  ctx.stroke();
  if (dotCount > 0) {
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < dotCount; i++) {
      const row = Math.floor(i / 6);
      const col = i % 6;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.roundRect(VAT.x + 14 + col * 18, VAT.y + VAT.h - 16 - row * 13, 10, 10, 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (barFrac > 0) {
    // mixed ratio bar (Octo recipe) with optional DROID slice
    const total = BAR.w * 0.92 * barFrac;
    const droidW = total * 0.1 * droidFrac;
    const baseW = total - droidW;
    const fracsSum = SEG_FRACS.reduce((a, b) => a + b, 0);
    let bx = BAR.x + (BAR.w - total) / 2;
    SEG_FRACS.forEach((f, i) => {
      const w = (baseW * f) / fracsSum;
      ctx.fillStyle = SEG_COLORS[i];
      ctx.beginPath();
      ctx.roundRect(bx, BAR.y, Math.max(w - 2, 1), BAR.h, 3);
      ctx.fill();
      bx += w;
    });
    if (droidW > 1) {
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(bx + 1, BAR.y, Math.max(droidW - 2, 1), BAR.h, 3);
      ctx.fill();
    }
    // stirrer
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const a = now / 420;
    const sx = VAT.x + VAT.w / 2;
    const sy = VAT.y - 6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 16 * Math.cos(a), sy + 12 + 4 * Math.sin(a));
    ctx.stroke();
  }
  ctx.restore();
}

/** Falling part stream for steps ①②; off-spec parts are ejected at the mesh. */
function drawStream(
  ctx: CanvasRenderingContext2D,
  now: number,
  stepStart: number,
  filtering: boolean
): void {
  const DUR = 2600;
  const N = 10;
  const eMesh = (MESH_Y - MOUTH_Y) / (SPOUT_Y - MOUTH_Y);
  const qMesh = 0.22 + 0.36 * eMesh;
  for (let i = 0; i < N; i++) {
    const xi = 140 + (i * 200) / (N - 1);
    const bad = filtering && i % 3 === 2;
    const q = (((now - stepStart) / DUR + i / N) % 1 + 1) % 1;
    const xMesh = lerp(xi, NECK_CX, eMesh);
    let x = 0;
    let y = 0;
    let drawIt = true;
    if (q < 0.22) {
      y = lerp(8, MOUTH_Y - 4, q / 0.22);
      x = xi;
    } else if (bad && q >= qMesh) {
      const e = clamp((q - qMesh) / 0.2, 0, 1);
      if (e >= 1) {
        drawIt = false; // landed in the pile
      } else {
        const pileX = 52 + Math.floor(i / 3) * 18;
        x = lerp(xMesh, pileX, e);
        y = MESH_Y - Math.sin(Math.PI * e) * 26 + e * (252 - MESH_Y);
      }
    } else if (q < 0.58) {
      const e = (q - 0.22) / 0.36;
      y = lerp(MOUTH_Y, SPOUT_Y - 4, e);
      x = lerp(xi, NECK_CX, e);
    } else if (q < 0.74) {
      const e = (q - 0.58) / 0.16;
      y = lerp(SPOUT_Y, VAT.y + 10, e);
      x = NECK_CX;
    } else {
      drawIt = false; // arrived in the vat
    }
    if (!drawIt) continue;
    const ejected = bad && q >= qMesh;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ejected ? 0.4 : 0);
    ctx.fillStyle = bad ? C.red : filtering ? C.green : C.blue;
    ctx.strokeStyle = bad ? C.red : C.deep;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-5, -5, 10, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (ejected) drawCrossMark(ctx, x, y, 5);
  }
  // static reject pile
  if (filtering) {
    [52, 70, 88].forEach((px, j) => {
      ctx.save();
      ctx.fillStyle = C.red;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(px - 5, 247 - (j % 2) * 6, 10, 10, 2);
      ctx.fill();
      ctx.restore();
      drawCrossMark(ctx, px, 252 - (j % 2) * 6, 5);
    });
  }
}

function drawCards(ctx: CanvasRenderingContext2D, step: number): void {
  const x = 520;
  const w = 544;
  const h = 56;
  for (let i = 0; i < 4; i++) {
    const y = 10 + i * 68;
    const done = i < step;
    const active = i === step;
    const cy = y + h / 2;
    ctx.save();
    if (active) {
      ctx.shadowColor = 'rgba(39, 68, 110, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = -2;
    }
    ctx.fillStyle = active ? C.white : done ? '#eef6f1' : '#f6f8f3';
    ctx.strokeStyle = active ? C.blue : done ? C.green : C.border;
    ctx.lineWidth = active ? 2.5 : done ? 1.5 : 1.25;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 9);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (active) {
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(x, y + 8, 4, h - 16, 2);
      ctx.fill();
    }
    // numbered disc
    ctx.fillStyle = active ? C.blue : done ? C.green : C.muted;
    ctx.beginPath();
    ctx.arc(x + 34, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(STEP_MARKS[i], x + 34, cy + 1);
    // title + caption
    ctx.fillStyle = active ? C.text : C.muted;
    ctx.font = 'bold 15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(STEP_TITLES[i], x + 60, cy);
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(STEP_CAPS[i], x + w - (done ? 40 : 18), cy);
    if (done) drawCheckMark(ctx, x + w - 22, cy, 8);
  }
}

export const Ch5Mixer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '按「下一步」开始混料：从 OXE 全量倾倒讲起。', cls: '' });
  const stepRef = useRef(0);
  const stepStartRef = useRef(0);
  const doneTimerRef = useRef<number | null>(null);

  const clearDoneTimer = (): void => {
    if (doneTimerRef.current !== null) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  };

  const enterStep = (s: number): void => {
    clearDoneTimer();
    stepStartRef.current = performance.now();
    stepRef.current = s;
    setStep(s);
    setFb(FEEDBACK[s]);
    if (s === 3) {
      doneTimerRef.current = window.setTimeout(() => {
        setFb(DONE_FEEDBACK);
        doneTimerRef.current = null;
      }, 2600);
    }
  };

  useEffect(() => {
    stepStartRef.current = performance.now();
    return () => clearDoneTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let raf = 0;

    const render = (ms: number) => {
      const stepNow = stepRef.current;
      const stepStart = stepStartRef.current;
      const now = ms;
      const el = now - stepStart;
      const a = clamp(el / 900, 0, 1);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // count chips row (bare numbers)
      chip(ctx, 70, 44, '70+', C.blue);
      caption(ctx, 70, 62, '数据集');
      chip(ctx, 172, 44, '200万+', C.blue);
      caption(ctx, 172, 62, '轨迹');
      if (stepNow >= 2) {
        arrow(ctx, 216, 44, 306, 44, C.muted);
        const pop = stepNow === 2 ? 0.6 + 0.4 * easeOutCubic(a) : 1;
        const pulse = stepNow === 3 && el > 2600 ? 1 + 0.06 * Math.sin(now / 160) : 1;
        chip(ctx, 352, 44, '970k', C.green, pop * pulse);
        caption(ctx, 352, 62, '装箱');
      }

      // left scene, clipped
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, LEFT_W, H);
      ctx.clip();
      drawFunnel(ctx, stepNow >= 2);
      if (stepNow === 0 || stepNow === 1) {
        drawStream(ctx, now, stepStart, stepNow === 1);
        const dots = clamp(Math.floor(el / 320), 0, stepNow === 0 ? 6 : 8);
        drawVat(ctx, { barFrac: 0, droidFrac: 0, dotCount: dots, now });
      } else {
        drawVat(ctx, { barFrac: easeOutCubic(a), droidFrac: 0, dotCount: 0, now });
      }
      if (stepNow === 3) {
        // DROID trial: enter at 10%, sit, then withdraw
        if (el < 800) {
          const e = easeOutCubic(clamp(el / 800, 0, 1));
          drawDroidCard(ctx, lerp(500, 306, e), lerp(128, 158, e), 0.85 + 0.15 * e, false);
          drawVatOverlay(ctx, clamp((el - 400) / 600, 0, 1) * 0.1);
        } else if (el < 1900) {
          drawDroidCard(ctx, 306, 158, 1, false);
          drawVatOverlay(ctx, 0.1);
        } else if (el < 2600) {
          const e = easeOutCubic(clamp((el - 1900) / 700, 0, 1));
          drawDroidCard(ctx, lerp(306, 540, e), lerp(158, 128, e), 1 - 0.15 * e, true);
          arrow(ctx, 386, 158, 470, 150, C.red);
          drawVatOverlay(ctx, 0.1 * (1 - e));
          // 撤出 tag
          ctx.save();
          ctx.fillStyle = C.red;
          ctx.beginPath();
          ctx.roundRect(408, 118, 48, 22, 5);
          ctx.fill();
          ctx.fillStyle = C.white;
          ctx.font = 'bold 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('撤出', 432, 130);
          ctx.restore();
        } else {
          drawCheckMark(ctx, 396, 214, 10);
        }
      }
      drawSceneLabel(ctx, 'OXE 混料机', 16, 18, { color: C.blue });
      drawLegend(
        ctx,
        [
          ['入库', C.green],
          ['筛掉', C.red],
        ],
        130,
        272
      );
      ctx.restore();

      drawCards(ctx, stepNow);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const prev = (): void => {
    if (stepRef.current > 0) enterStep(stepRef.current - 1);
  };
  const next = (): void => {
    if (stepRef.current < 3) enterStep(stepRef.current + 1);
  };
  const reset = (): void => enterStep(0);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny ghost" onClick={prev} disabled={step === 0}>
          上一步
        </button>
        <button className="tiny" onClick={next} disabled={step === 3}>
          {step === 3 ? '完成' : '下一步'}
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
        <label>
          步骤 <span className="val">{step + 1} / 4</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

/** The DROID trial card. */
function drawDroidCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  exiting: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#fff4ea';
  ctx.strokeStyle = exiting ? C.red : C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-52, -18, 104, 36, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = exiting ? C.red : C.orange;
  ctx.font = 'bold 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DROID · 10%', 0, 1);
  ctx.restore();
}

/** Thin DROID slice on top of the vat while it is mixed in. */
function drawVatOverlay(ctx: CanvasRenderingContext2D, frac: number): void {
  if (frac <= 0.001) return;
  ctx.save();
  ctx.fillStyle = C.orange;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.roundRect(VAT.x + 6, VAT.y + 4, (VAT.w - 12) * frac, 8, 3);
  ctx.fill();
  ctx.restore();
}

export default Ch5Mixer;
