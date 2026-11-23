import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawVase,
  drawIndexCard,
  drawLabel,
  withAlpha,
  roundRect,
  pointerToCanvas,
  type Ctx,
} from './scene';

const W = 1080;
const H = 280;

const blocks = [
  { x: 40, title: '证物照' },
  { x: 300, title: '视觉编码' },
  { x: 560, title: '写鉴定语' },
  { x: 820, title: '比对档案' },
];

const offline = [
  '证物照只给出大类，看不出是哪一件。',
  '照片、问题、标准答案拼成一个输入。',
  '鉴定语是逐字写出来的，所以能写细节，也能写套话。',
  '鉴定语变成一个向量，才谈得上和档案卡比对。',
];

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState({ text: offline[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { stage: number }, time: number) => {
      clearScene(ctx, W, H);
      blocks.forEach((b, i) => {
        const active = i === s.stage;
        ctx.save();
        ctx.globalAlpha = active ? 1 : 0.55;
        ctx.fillStyle = C.card;
        roundRect(ctx, b.x, active ? 56 : 60, 200, 148, 8);
        ctx.fill();
        ctx.strokeStyle = active ? C.blue : C.border;
        ctx.lineWidth = active ? 2.5 : 1.4;
        roundRect(ctx, b.x, active ? 56 : 60, 200, 148, 8);
        ctx.stroke();
        ctx.restore();

        const cx = b.x + 100;
        if (i === 0) {
          drawVase(ctx, cx, 132, 1.7, C.envLight);
        }
        if (i === 1) {
          for (let k = 0; k < 6; k++) {
            ctx.save();
            ctx.fillStyle = k < 4 ? withAlpha(C.blue, 0.55) : withAlpha(C.orange, 0.75);
            roundRect(ctx, b.x + 34 + k * 22, 118, 16, 34, 3);
            ctx.fill();
            ctx.restore();
          }
          drawLabel(ctx, cx, 176, 'e ⊕ q ⊕ s', C.muted, 11, 'center');
        }
        if (i === 2) {
          for (let k = 0; k < 7; k++) {
            const on = ((time * 3) % 8) > k;
            ctx.save();
            ctx.fillStyle = on ? withAlpha(C.green, 0.5) : withAlpha(C.border, 0.5);
            roundRect(ctx, b.x + 32 + k * 20, 128, 14, 14, 2);
            ctx.fill();
            ctx.restore();
          }
          drawLabel(ctx, cx, 176, '逐 token', C.muted, 11, 'center');
        }
        if (i === 3) {
          drawIndexCard(ctx, b.x + 40, 112, 120, 46, { lines: 2, border: C.green });
          for (let k = 0; k < 4; k++) {
            ctx.save();
            ctx.fillStyle = withAlpha(C.green, 0.45);
            roundRect(ctx, b.x + 174 - k * 8, 118 + k * 9, 8, 6, 2);
            ctx.fill();
            ctx.restore();
          }
        }
        drawLabel(ctx, cx, 240, b.title, active ? C.blue : C.muted, 13, 'center');
      });
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 252);
      ctx.lineTo(1040, 252);
      ctx.stroke();
      ctx.restore();
    };

    let raf = 0;
    const tick = (now: number) => {
      render(stateRef.current, now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (i: number) => {
    stateRef.current.stage = i;
    setStage(i);
    setFeedback({ text: offline[i], cls: i === 3 ? 'good' : '' });
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = pointerToCanvas(e, canvas, W, H);
    const idx = blocks.findIndex((b) => p.x >= b.x && p.x <= b.x + 200 && p.y >= 50 && p.y <= 210);
    if (idx >= 0) pick(idx);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
      />
      <div className="chip-row">
        {blocks.map((b, i) => (
          <button key={b.title} className={`chip ${stage === i ? 'selected' : ''}`} onClick={() => pick(i)}>
            {b.title}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
