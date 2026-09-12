import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawSofa, drawTimeCard, drawSceneLabel, drawLegend } from './dogKit';
import type { WidgetProps } from './registry';

// Module 3.2 两种点图 — step t₀→t₃. Top: top-view life timeline (dog walks right,
// cat enters at t₂, dog hides behind the sofa at t₃). Bottom-left: reconstruction
// pointmap Pⱼ(tⱼ) gains new (blue) dots. Bottom-right: tracking pointmap P₀(tⱼ)
// keeps only the frame-0 (green) dots; the occluded one dims with a 0 badge.
const W = 1080;
const H = 280;

const DOG_CLUSTER: [number, number][] = [
  [0, 0],
  [11, -6],
  [-11, -6],
  [8, 7],
  [-8, 7],
  [0, -13],
];
const CAT_CLUSTER: [number, number][] = [
  [0, 0],
  [8, -4],
  [-8, -4],
  [0, 7],
];
const TSUB = ['₀', '₁', '₂', '₃'];
const STEP_FB = [
  '按『下一步』推进时间。',
  '两幅图还一样——没有新内容。',
  '重建点图多了猫的点（蓝）；跟踪点图仍然只有第一帧那批（绿）。',
  '狗的点被沙发挡住：跟踪点图里它仍在，只是可见性 o=0。',
];

export const Ch3Pointmaps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEP_FB[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawCat = (x: number, y: number) => {
      ctx.fillStyle = C.muted;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.25;
      [
        [-5, -3, -7, -10, -1, -6],
        [5, -3, 7, -10, 1, -6],
      ].forEach(([x1, y1, x2, y2, x3, y3]) => {
        ctx.beginPath();
        ctx.moveTo(x + x1, y + y1);
        ctx.lineTo(x + x2, y + y2);
        ctx.lineTo(x + x3, y + y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    const dots = (cx: number, cy: number, offs: [number, number][], color: string, r: number, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      offs.forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    };

    const sofaMark = (cx: number, cy: number) => {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.roundRect(cx - 26, cy - 24, 52, 40, 6);
      ctx.stroke();
      ctx.restore();
    };

    const panel = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
    };

    const render = (s: { step: number }) => {
      const st = s.step;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // ---- top strip: life timeline ----
      panel(6, 6, 1068, 80);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 44);
      ctx.lineTo(1014, 44);
      ctx.stroke();
      const ticks = [140, 380, 620, 860];
      ticks.forEach((tx, i) => {
        ctx.strokeStyle = i === st ? C.orange : C.border;
        ctx.lineWidth = i === st ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(tx, 36);
        ctx.lineTo(tx, 52);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`t${TSUB[i]}`, tx, 26);
      });
      drawTimeCard(ctx, ticks[st], 64, `t${TSUB[st]}`);
      // dog walks right; behind the sofa at t₃
      const dogX = [140, 380, 620, 878][st];
      if (st === 3) {
        drawDog(ctx, dogX, 76, 0.55, { mood: 'hide' });
        drawSofa(ctx, 906, 78, 0.55);
      } else {
        drawSofa(ctx, 906, 78, 0.55);
        drawDog(ctx, dogX, 76, 0.55, { mood: 'walk', t: st });
      }
      if (st >= 2) drawCat(1006, 58);
      // ---- bottom-left: reconstruction pointmap ----
      panel(6, 94, 524, 180);
      drawSceneLabel(ctx, '重建', 20, 112, { color: C.blue });
      const rcx = 96 + st * 82;
      dots(rcx, 190, DOG_CLUSTER, C.blue, 4.5, st === 3 ? 0.5 : 1);
      if (st >= 2) dots(440, 170, CAT_CLUSTER, C.blue, 4.5);
      if (st === 3) sofaMark(rcx, 190);
      // ---- bottom-right: tracking pointmap ----
      panel(550, 94, 524, 180);
      drawSceneLabel(ctx, '跟踪', 564, 112, { color: C.green });
      const tcx = 640 + st * 82;
      dots(tcx, 190, DOG_CLUSTER, C.green, 4.5, st === 3 ? 0.45 : 1);
      if (st === 3) {
        sofaMark(tcx, 190);
        // occluded identity: still tracked, visibility o=0
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(tcx, 190, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('0', tcx, 190.5);
      }
      drawLegend(
        ctx,
        [
          ['当前内容', C.blue],
          ['第一帧的点', C.green],
        ],
        566,
        258
      );
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const st = Math.max(0, Math.min(3, next));
    stateRef.current.step = st;
    setStep(st);
    setFeedback({ text: STEP_FB[st], cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button type="button" className="tiny" onClick={() => go(step + 1)} disabled={step === 3}>
          {step === 3 ? '完成' : '下一步'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
        <span className="val">t{TSUB[step]}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Pointmaps;
