import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet, drawVerdictBadge } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const STEPS = [
  {
    label: '原样公开',
    verdict: '仍归 Hughes',
    note: '对照组：未改写的原文，classify() 正确归属 Hughes。论文的距离表没有列出对照组，它只作为参照。',
    color: COLORS.red,
  },
  {
    label: '非注入改写',
    verdict: '仍归 Hughes',
    note: '7 种不含注入的组合（翻译 / 混淆 / 模仿）：全文距离 0.30–1.48，全部仍被正确归属为 Hughes。',
    color: COLORS.red,
  },
  {
    label: '注入改写',
    verdict: '改判为 May',
    note: '8 种含注入的组合：全文距离 3.63–4.66，Hughes 的文本被改判为 May——只有注入翻转了归属。',
    color: COLORS.green,
  },
];

export const Ch3Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: STEPS[0].note, cls: 'bad' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (active: number) => {
      clearScene(ctx, W, H);
      for (let i = 0; i < STEPS.length; i++) {
        const y = 34 + i * 76;
        const isActive = i === active;
        drawPaperSheet(ctx, 50, y, 700, 62);
        ctx.strokeStyle = isActive ? STEPS[i].color : COLORS.ink;
        ctx.lineWidth = isActive ? 4 : 3;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(90, y + 18 + k * 14);
          ctx.lineTo(700, y + 18 + k * 14);
          ctx.stroke();
        }
        if (i === 2) {
          ctx.fillStyle = COLORS.purple;
          for (let x = 120; x < 700; x += 26) {
            ctx.beginPath();
            ctx.arc(x, y + 31, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = isActive ? COLORS.ink : COLORS.muted;
        ctx.font = '24px "PingFang SC", sans-serif';
        ctx.fillText(String(i + 1), 62, y + 40);
        if (i <= active) drawVerdictBadge(ctx, 1030, y + 31, STEPS[i].color, STEPS[i].verdict, 22);
      }
    };

    const tick = () => {
      render(step);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [step]);

  const go = (next: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, next));
    setStep(n);
    setFb({ text: STEPS[n].note, cls: n === 2 ? 'good' : 'bad' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => go(0)}>重置</button>
        <button className="chip" onClick={() => go(step - 1)} disabled={step === 0}>上一步</button>
        <button className="chip" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>下一步</button>
        <span className="val">{step + 1} / {STEPS.length}</span>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default Ch3Mod1;
