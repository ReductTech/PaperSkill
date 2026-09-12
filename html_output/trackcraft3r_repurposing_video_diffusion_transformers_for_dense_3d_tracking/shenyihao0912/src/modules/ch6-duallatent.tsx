import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawFilmStrip, drawSceneLabel, drawLegend, drawTracker } from './dogKit';
import type { WidgetProps } from './registry';

// 拼接与复印（P2 step）：step through 4 stages of the dual-latent assembly on a
// film-strip of 4 frame columns t₀…t₃. ① one blue z^rgb tile per column
// ② the purple pointmap tile slides in and merges channel-wise into a wider g tile
// (c→2c, token count unchanged) ③ g₀ clones fly to every column as green-outline
// r_j tiles ④ all g/r tiles feed a purple-bordered DiT block with a cross-link
// attention fan. Blue = RGB latent, purple = pointmap latent, green = track latent.

const W = 1080;
const H = 280;
const SUB = ['₀', '₁', '₂', '₃'];

const FB_INIT = '下一步：把点图潜变量拼进来。';
const FB_STEP = [
  '每帧先有 RGB 潜变量：认出『是谁』的线索。',
  '点图潜变量按通道拼接：宽度翻倍（c→2c），每帧 token 数不变。',
  '第一帧的 g₀ 复印到所有时刻：rⱼ 就是『追谁』的稠密查询。',
  'g 与 r 沿 token 维拼接进 DiT，全 3D 注意力跨帧跨位置自由匹配。',
];

/** Center x of film-strip column i (strip drawn at translate(70,88) scale 2.2). */
const colX = (i: number) => 70 + 2.2 * (54 * i + 23);

/** A single 40×48 latent half-tile (blue = RGB, purple = pointmap). */
const drawHalfTile = (ctx: CanvasRenderingContext2D, x: number, color: string) => {
  ctx.fillStyle = color;
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(x - 20, 78, 40, 48, 5);
  ctx.fill();
  ctx.stroke();
};

/** Merged g tile: blue and purple halves side by side in one wider 84×48 tile. */
const drawGTile = (ctx: CanvasRenderingContext2D, cx: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - 42, 78, 84, 48, 5);
  ctx.clip();
  ctx.fillStyle = C.blue;
  ctx.fillRect(cx - 42, 78, 42, 48);
  ctx.fillStyle = C.purple;
  ctx.fillRect(cx, 78, 42, 48);
  ctx.restore();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 42, 78, 84, 48, 5);
  ctx.stroke();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 79);
  ctx.lineTo(cx, 125);
  ctx.stroke();
};

/** Green-outline track-latent replica tile (84×34) with the mark motif. */
const drawRTile = (ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) => {
  ctx.save();
  ctx.globalAlpha = alpha * 0.12;
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(x - 42, y - 17, 84, 34, 5);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 42, y - 17, 84, 34, 5);
  ctx.stroke();
  ctx.restore();
  drawTracker(ctx, x, y, 4);
};

/** Curved arrow into the DiT block. */
const drawArrow = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  a: number
) => {
  ctx.save();
  ctx.globalAlpha = 0.55 * a;
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 16, x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 0.8 * a;
  ctx.fillStyle = C.purple;
  ctx.beginPath();
  ctx.moveTo(x2 + 7, y2);
  ctx.lineTo(x2 - 3, y2 - 4.5);
  ctx.lineTo(x2 - 3, y2 + 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const Ch6DualLatent: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const [fb, setFb] = useState({ text: FB_INIT, cls: '' });
  const stepRef = useRef(1);
  const stepStartRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (now: number) => {
      const step = stepRef.current;
      const stepStart = stepStartRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // film strip: 4 frame columns t₀…t₃; column 0 highlighted as the g₀ anchor on step 3
      ctx.save();
      ctx.translate(70, 88);
      ctx.scale(2.2, 2.2);
      drawFilmStrip(ctx, 0, 0, 4, step === 3 ? 0 : undefined);
      ctx.restore();

      // channel-concat merge animation (plays when entering step 2)
      const mergeP = step === 1 ? 0 : step === 2 ? clamp((now - stepStart) / 450, 0, 1) : 1;
      const e2 = easeOutCubic(mergeP);

      for (let i = 0; i < 4; i++) {
        const cx = colX(i);
        drawSceneLabel(ctx, `t${SUB[i]}`, cx, 206, { align: 'center', color: C.muted });

        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - 50, 62, 100, 114);
        ctx.clip();
        if (step === 1) {
          drawHalfTile(ctx, cx, C.blue);
        } else if (mergeP < 1) {
          drawHalfTile(ctx, lerp(cx, cx - 21, e2), C.blue);
          ctx.globalAlpha = Math.max(e2, 0.05);
          drawHalfTile(ctx, lerp(cx + 115, cx + 21, e2), C.purple);
          ctx.globalAlpha = 1;
        } else {
          drawGTile(ctx, cx);
        }
        ctx.restore();

        // step 3: g₀ clones fly to every column as green-outline r tiles
        if (step >= 3) {
          const fi = step === 3 ? clamp((now - stepStart) / 500 - i * 0.1, 0, 1) : 1;
          const e3 = easeOutCubic(fi);
          drawRTile(ctx, lerp(colX(0), cx, e3), lerp(102, 149, e3), 0.25 + 0.75 * fi);
        }
      }

      // DiT block at the right edge (dimmed until step 4)
      ctx.save();
      ctx.globalAlpha = step === 4 ? 1 : 0.25;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(850, 78, 185, 92, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.purple;
      ctx.font = '700 20px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DiT', 942, 110);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('全 3D 注意力', 942, 138);
      ctx.restore();

      // step 4: arrows from all g/r tiles + cross-link attention fan
      if (step === 4) {
        const a = clamp((now - stepStart) / 400, 0, 1);
        for (let i = 0; i < 4; i++) {
          const cx = colX(i);
          drawArrow(ctx, cx + 42, 102, 850, 92 + i * 8, a); // g_j in
          drawArrow(ctx, cx + 42, 149, 850, 132 + i * 8, a); // r_j in
        }
        ctx.save();
        ctx.globalAlpha = 0.22 * a;
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 4; i++) {
          for (let j = i + 1; j < 4; j++) {
            ctx.beginPath();
            ctx.moveTo(colX(i), 58);
            ctx.quadraticCurveTo((colX(i) + colX(j)) / 2, 30, colX(j), 58);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // dims readout row (active once the concat has happened)
      const dimsOn = step >= 2;
      const chip = (x: number, w: number, text: string) => {
        ctx.save();
        ctx.globalAlpha = dimsOn ? 1 : 0.3;
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(x, 226, w, 26, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = dimsOn ? C.blue : C.muted;
        ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, 240);
        ctx.restore();
      };
      chip(390, 150, '通道 c→2c');
      chip(566, 160, 'token 数不变');

      drawLegend(
        ctx,
        [
          ['RGB 潜变量', C.blue],
          ['点图潜变量', C.purple],
          ['查询 rⱼ', C.green],
        ],
        60,
        239
      );
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (s: number) => {
    stepRef.current = s;
    stepStartRef.current = performance.now();
    setStep(s);
    setFb({ text: FB_STEP[s - 1], cls: s === 4 ? 'good' : '' });
  };

  const reset = () => {
    stepRef.current = 1;
    stepStartRef.current = performance.now();
    setStep(1);
    setFb({ text: FB_INIT, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 1}>
          上一步
        </button>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === 4}>
          {step === 4 ? '完成' : '下一步'}
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
        <span className="step-label">
          步骤 <b>{step}</b> / 4
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch6DualLatent;
