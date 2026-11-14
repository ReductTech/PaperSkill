import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import { SC, clearStudio, wallPrint, slip, label, legend, barH, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 1.1 Task queue stress test. Verified data: Table 2 (Seq LoRA per-task
// best vs final) and Table 1 (FID 52.13 -> 56.12). One step per accepted order.
const W = 1080;
const H = 280;

const TASKS = [
  { name: 'ScienceQA', best: 72.43, final: 33.96 },
  { name: 'TextVQA', best: 39.34, final: 16.84 },
  { name: 'ImageNet', best: 89.41, final: 13.68 },
  { name: 'GQA', best: 37.93, final: 33.2 },
  { name: 'VizWiz', best: 44.38, final: 44.38 },
];
const FID_START = 52.13;
const FID_END = 56.12;

const FEEDBACK = [
  { text: '开店（零样本）：出图 FID 52.13，答题平均 22.48——还没接单的底子。', cls: '' },
  { text: '接下 ScienceQA：最好 72.43，学完全部订单后只剩 33.96——被后面的订单挤掉了 38.47 分。', cls: 'bad' },
  { text: '接下 TextVQA：最好 39.34，最终只剩 16.84——新订单又一次踩过旧订单。', cls: 'bad' },
  { text: '接下 ImageNet：最好 89.41，最终只剩 13.68——分类订单落差最大。', cls: 'bad' },
  { text: '接下 GQA：最好 37.93，最终 33.20——掉分还在继续。', cls: 'bad' },
  { text: '五单接完：出图 FID 从 52.13 恶化到 56.12（表1）。学答题，连画画也带坏了——这就是模态间遗忘。', cls: 'bad' },
];

export const M11Queue: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

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
    const t0 = performance.now();

    const draw = (prog: number) => {
      clearStudio(ctx, W, H, 0.88);
      const grow = easeOutCubic(prog);
      // left: wall print degrades with each accepted order
      wallPrint(ctx, 36, 36, 128, 120, (step / 5) * 0.8);
      label(ctx, step === 0 ? '零样本' : '出图水准', 100, 172, step === 0 ? SC.muted : mix(SC.green, SC.red, step / 5), 12, 'center');
      // order slips stack up on the counter
      for (let i = 0; i < step; i++) {
        slip(ctx, 214 + i * 50, 96 - i * 3, 42, 78);
      }
      label(ctx, '已接订单', 336, 196, SC.muted, 11, 'center');
      // right: metric bars for the current task
      const bx = 640;
      if (step > 0) {
        const cur = TASKS[step - 1];
        label(ctx, '最好', bx, 62, SC.muted, 12);
        barH(ctx, bx + 40, 48, 300, (cur.best / 100) * grow, 22, SC.green);
        label(ctx, cur.best.toFixed(2), bx + 348, 65, SC.ink, 13);
        label(ctx, '最终', bx, 106, SC.muted, 12);
        barH(ctx, bx + 40, 92, 300, (cur.final / 100) * grow, 22, SC.red);
        label(ctx, cur.final.toFixed(2), bx + 348, 109, SC.ink, 13);
        const gap = (cur.best - cur.final).toFixed(2);
        label(ctx, `落差 ${gap}`, bx + 40, 138, mix(SC.ink, SC.red, Math.min(1, Number(gap) / 60)), 12);
      } else {
        label(ctx, '接下第一单，看两条指标的落差', bx + 10, 70, SC.muted, 13);
        label(ctx, 'ACC 22.48（零样本）', bx + 10, 100, SC.muted, 13);
      }
      // FID meter along the bottom
      const fy = 224;
      const fw = 300;
      const fx = bx + 40;
      ctx.fillStyle = SC.ground;
      ctx.fillRect(fx, fy, fw, 14);
      const fid = FID_START + (FID_END - FID_START) * (step >= 5 ? grow : 0);
      const frac = (fid - 50) / 10;
      ctx.fillStyle = fid > 54 ? SC.red : SC.green;
      ctx.fillRect(fx, fy, frac * fw, 14);
      const tickX = fx + ((FID_START - 50) / 10) * fw;
      ctx.strokeStyle = SC.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tickX, fy - 6);
      ctx.lineTo(tickX, fy + 20);
      ctx.stroke();
      label(ctx, '零样本', tickX, fy + 34, SC.muted, 10, 'center');
      label(ctx, fid.toFixed(2), fx + fw + 12, fy + 12, fid > 54 ? SC.red : SC.green, 13);
      label(ctx, 'FID', bx, fy + 12, SC.muted, 12);
    };

    const tick = () => {
      const prog = Math.min(1, (performance.now() - t0) / 800);
      draw(prog);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (prog < 1) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [step]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => setStep(Math.min(5, step + 1))} disabled={step >= 5}>
          {step >= 5 ? '已接满' : '接下一单'}
        </button>
        <button className="chip" onClick={() => setStep(0)} disabled={step === 0}>
          重新开店
        </button>
        <label>
          进度 <span className="val">{step} / 5</span>
        </label>
      </div>
      <div className={`feedback ${FEEDBACK[step].cls}`}>{FEEDBACK[step].text}</div>
    </div>
  );
};
export default M11Queue;
