import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawIndexCard, drawLabel, drawVote, drawBar, withAlpha, drawTag, type Ctx } from './scene';

const W = 1080;
const H = 280;

const CARDS = [
  { name: '青花缠枝瓶', votes: 2 },
  { name: '青花折枝瓶', votes: 1 },
  { name: '粉彩缠枝瓶', votes: 1 },
  { name: '素面白瓷瓶', votes: 0 },
];

const STEPS = [
  { text: '先拿到勘验笔录：三句，都是形容词。', cls: '' },
  { text: '拆成三条：窑口、底款、纹样。', cls: '' },
  { text: '把头实体盖掉，只留关系对去查。', cls: '' },
  { text: '青花缠枝瓶被命中两次，票最多。', cls: 'good' },
  { text: '把“青花缠枝瓶”写到最前面再编码，比对才落在对的档案卡上。', cls: 'good' },
];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(1);
  const [step, setStep] = useState(1);
  stepRef.current = step;
  const [feedback, setFeedback] = useState({ text: STEPS[0].text, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const s = stepRef.current;
      clearScene(ctx, W, H);

      // left: 勘验笔录
      drawIndexCard(ctx, 40, 34, 480, 196, { lines: 5, border: C.blue });
      drawLabel(ctx, 56, 54, '勘验笔录', C.muted, 12);
      if (s >= 5) {
        drawLabel(ctx, 56, 86, '青花缠枝瓶', C.green, 14);
      }
      const desc = s === 1 ? ['这是一件瓷器', '白底', '很沉'] : ['瓷器', '白底', '很沉'];
      desc.forEach((d, i) => {
        drawLabel(ctx, s >= 5 ? 150 : 56, 112 + i * 30, d, s >= 3 && i === 0 ? C.muted : C.ink, 13);
      });
      if (s >= 2) {
        for (let i = 0; i < 3; i++) {
          drawTag(ctx, 200 + i * 104, 196, 96, 24, ['窑口', '底款', '纹样'][i], s >= 3 ? C.muted : C.blue);
        }
      }
      if (s >= 3) {
        ctx.save();
        ctx.strokeStyle = withAlpha(C.muted, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(56, 126);
        ctx.lineTo(88, 126);
        ctx.stroke();
        ctx.restore();
      }

      // right: card box
      for (let i = 0; i < CARDS.length; i++) {
        const y = 44 + i * 54;
        const c = CARDS[i];
        drawIndexCard(ctx, 580, y, 300, 44, { lines: 0, border: s >= 4 ? (c.votes === 2 ? C.green : withAlpha(C.border, 0.9)) : C.border });
        drawLabel(ctx, 594, y + 22, c.name, s >= 4 && c.votes === 2 ? C.green : C.ink, 13);
        if (s >= 4) {
          drawVote(ctx, 786, y + 22, c.votes, 3, c.votes === 2 ? C.green : C.blue);
        }
      }
      if (s >= 5) {
        drawBar(ctx, 580, 262, 460, 8, 0.84, C.green);
      }
    };

    let raf = 0;
    const tick = () => {
      render();
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

  const go = (d: number) => {
    const n = Math.max(1, Math.min(5, step + d));
    setStep(n);
    setFeedback({ text: STEPS[n - 1].text, cls: STEPS[n - 1].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={() => go(-1)} disabled={step === 1}>
          上一步
        </button>
        <button className="chip" onClick={() => go(1)} disabled={step === 5}>
          下一步
        </button>
        <button
          className="chip"
          onClick={() => {
            setStep(1);
            setFeedback({ text: STEPS[0].text, cls: '' });
          }}
        >
          重来
        </button>
        <span className="chip" aria-live="polite">
          {step} / 5
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
