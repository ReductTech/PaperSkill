import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWheel,
  drawClay,
  drawCheckMark,
  drawSceneLabel,
  drawValueChip,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Module 5.1 (P2 step): each press of 下一步 advances ONE Euler step
// (A ← A + δ·vθ, δ=0.1). Top 60%: spinning wheel + clay morphing at τ=k/10 with
// a ten-cell progress strip (orange current / green done). Bottom 40%: the KV
// cache — the observation prefix (订单+图像) turns grey+locked after the first
// step, while the purple action suffix (50 tokens as 12 cells) pulses because
// it is the only part recomputed on every step.
const W = 1080;
const H = 280;
const DIV = 172; // studio scene above, KV-cache diagram below
const STEPS = 10;
const PREFIX_BLOCKS: string[] = ['订单', '图像', '图像'];
const SUFFIX_CELLS = 12;
const GREY = '#98a4b6';
const FONT_SM = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const FB_IDLE = 'τ=0 纯噪声起步：每按一次「下一步」，沿速度场推进 δ=0.1。';
const FB_DONE = '十步欧拉出一段动作；前缀只算一次——高频控制的账就是这么省出来的。';

/** Small padlock glyph (body + shackle). */
function drawLock(ctx: CanvasRenderingContext2D, x: number, y: number, col: string) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y - 1.5, 3, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 4.5, y - 1.5, 9, 7, 1.5);
  ctx.fill();
  ctx.restore();
}

export const Ch5Sample: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, lastTs: -1 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: FB_IDLE, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const { step: k, lastTs } = stateRef.current;
      const flash = lastTs > 0 ? clamp(1 - (ms - lastTs) / 500, 0, 1) : 0;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- top 60%: wheel + clay at τ = k/10 + ten-cell progress strip ----
      drawWheel(ctx, 185, 126, 48, { spin: (ms / 230) % (Math.PI * 2) });
      drawClay(ctx, 185, 92, k / STEPS, { size: 1.5, t: ms / 800 });

      const sx0 = 340;
      const sx1 = 1030;
      const span = sx1 - sx0;
      const cw = span / STEPS - 5;
      for (let i = 0; i < STEPS; i++) {
        const cx = sx0 + (i * span) / STEPS;
        ctx.beginPath();
        ctx.roundRect(cx, 104, cw, 24, 4);
        ctx.fillStyle = i < k ? C.green : i === k ? C.orange : '#e3e9f2';
        ctx.fill();
        ctx.fillStyle = i <= k ? C.white : C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx + cw / 2, 116);
      }
      drawValueChip(ctx, 372, 62, 'δ=0.1', C.orange);
      drawValueChip(ctx, 1000, 62, `τ=${(k / STEPS).toFixed(1)}`, C.orange);
      if (k >= STEPS) drawCheckMark(ctx, 258, 60, 11);

      // divider between studio and KV diagram
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, DIV);
      ctx.lineTo(W, DIV);
      ctx.stroke();

      // ---- bottom 40%: KV cache (prefix locked once, suffix recomputed) ----
      drawSceneLabel(ctx, '前缀', 24, 199);
      drawSceneLabel(ctx, '后缀', 24, 241);

      PREFIX_BLOCKS.forEach((name, i) => {
        const bx = 76 + i * 100;
        ctx.beginPath();
        ctx.roundRect(bx, 186, 90, 26, 4);
        ctx.fillStyle = k >= 1 ? GREY : C.blue;
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = FONT_SM;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, bx + 38, 199);
        if (k >= 1) drawLock(ctx, bx + 72, 200, C.white);
      });
      if (k >= 1) drawCheckMark(ctx, 392, 199, 8);

      // suffix: 动作×50 tag + 12 compressed cells, purple and pulsing
      ctx.beginPath();
      ctx.roundRect(76, 228, 64, 26, 4);
      ctx.fillStyle = C.purple;
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = FONT_SM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('动作50', 108, 241);

      const alpha = 0.55 + 0.3 * Math.sin(ms / 160);
      for (let i = 0; i < SUFFIX_CELLS; i++) {
        const bx = 148 + i * 70;
        ctx.beginPath();
        ctx.roundRect(bx, 228, 66, 26, 3);
        if (k >= 1) {
          ctx.fillStyle = C.purple;
          ctx.globalAlpha = alpha;
          ctx.fill();
          if (flash > 0) {
            ctx.fillStyle = C.white;
            ctx.globalAlpha = 0.5 * flash;
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // rotating "recompute" glyph next to the suffix row
      if (k >= 1) {
        ctx.save();
        ctx.translate(1016, 241);
        ctx.rotate(ms / 500);
        ctx.strokeStyle = C.purple;
        ctx.fillStyle = C.purple;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0.3, Math.PI * 1.7);
        ctx.stroke();
        const hx = Math.cos(Math.PI * 1.7) * 9;
        const hy = Math.sin(Math.PI * 1.7) * 9;
        ctx.beginPath();
        ctx.moveTo(hx + 5, hy);
        ctx.lineTo(hx - 2, hy - 4);
        ctx.lineTo(hx - 2, hy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onNext = () => {
    const k = Math.min(STEPS, stateRef.current.step + 1);
    if (k === stateRef.current.step) return;
    stateRef.current = { step: k, lastTs: performance.now() };
    setStep(k);
    setFeedback(
      k >= STEPS
        ? { text: FB_DONE, cls: 'good' }
        : { text: `第 ${k} 步：沿速度场再推 0.1。`, cls: '' }
    );
  };

  const onReset = () => {
    stateRef.current = { step: 0, lastTs: -1 };
    setStep(0);
    setFeedback({ text: FB_IDLE, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="step-ctrl">
          <button className="tiny" onClick={onNext} disabled={step >= STEPS}>
            下一步
          </button>
          <button className="tiny ghost" onClick={onReset}>
            复位
          </button>
          <span className="step-label">
            步数 <b>{step}/{STEPS}</b>
          </span>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Sample;
