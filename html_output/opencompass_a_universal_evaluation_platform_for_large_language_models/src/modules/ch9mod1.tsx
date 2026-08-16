import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch9 M9.1 — "级联评测器：级联模式 vs 并行模式" (P4 chips, technical view).
// Compare the two operating modes of the Cascade evaluator.
const W = 560;
const H = 230;
type Mode = 'cascade' | 'parallel';

export const Ch9Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'cascade' });
  const [mode, setMode] = useState<Mode>('cascade');
  const [feedback, setFeedback] = useState({
    text: '级联模式：规则先筛出确定正确的样本，只有判错的才交给 LLM 裁判复核，省时省钱。',
    cls: 'good',
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
    const render = (s: { mode: Mode }) => {
      clear(ctx, W, H);
      const drawBox = (x: number, y: number, w: number, h: number, text: string, color: string) => {
        ctx.fillStyle = color;
        rr(ctx, x, y, w, h, 6);
        ctx.fill();
        label(ctx, text, x + w / 2, y + h / 2, 11, '#fff', 'center', 700);
      };
      if (s.mode === 'cascade') {
        drawBox(30, 40, 100, 34, '全部样本', C.blue);
        drawBox(170, 40, 110, 34, '规则预筛', C.green);
        drawBox(320, 20, 120, 30, '判对 → 直接通过', C.green);
        drawBox(320, 60, 120, 30, '判错 → LLM 裁判', C.purple);
        drawBox(460, 40, 80, 34, '最终分', C.orange);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        [[130, 57, 170, 57], [280, 57, 320, 35], [280, 57, 320, 75], [440, 35, 460, 57], [440, 75, 460, 57]].forEach(([a, b, c, d]) => {
          ctx.beginPath();
          ctx.moveTo(a, b);
          ctx.lineTo(c, d);
          ctx.stroke();
        });
        ctx.lineWidth = 1;
        label(ctx, '只用 LLM 复核“判错”的少量样本 → 成本低', W / 2, 150, 13, C.green, 'center', 700);
        label(ctx, '输出：规则准确率 + LLM 准确率 + 合并准确率', W / 2, 178, 12, C.muted, 'center');
      } else {
        drawBox(30, 60, 100, 34, '全部样本', C.blue);
        drawBox(170, 20, 110, 34, '规则评测', C.green);
        drawBox(170, 76, 110, 34, 'LLM 裁判', C.purple);
        drawBox(330, 48, 130, 34, '任一判对即对', C.orange);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        [[130, 77, 170, 37], [130, 77, 170, 93], [280, 37, 330, 62], [280, 93, 330, 68]].forEach(([a, b, c, d]) => {
          ctx.beginPath();
          ctx.moveTo(a, b);
          ctx.lineTo(c, d);
          ctx.stroke();
        });
        ctx.lineWidth = 1;
        label(ctx, '规则与裁判同时评全部样本 → 容错高但成本高', W / 2, 150, 13, C.orange, 'center', 700);
        label(ctx, '任一评测器判对即视为正确', W / 2, 178, 12, C.muted, 'center');
      }
      label(ctx, '两种模式都要求评测指标具有客观正确性', W / 2, 208, 11, C.ink, 'center');
    };
    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(
      m === 'cascade'
        ? { text: '级联模式：规则先筛，判错才交 LLM 裁判——在保持精度的同时降低评测成本与耗时。', cls: 'good' }
        : { text: '并行模式：规则与裁判同时评全部样本，任一判对即对——容错更高，但成本也更高。', cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'cascade' ? 'selected' : ''}`} onClick={() => choose('cascade')}>
          级联模式
        </button>
        <button className={`chip ${mode === 'parallel' ? 'selected' : ''}`} onClick={() => choose('parallel')}>
          并行模式
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
